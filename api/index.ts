import express from 'express';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';
import path from 'path';

const app = express();

const serverLogs: string[] = [];
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  originalLog(...args);
  serverLogs.push(`[LOG] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
  if (serverLogs.length > 100) serverLogs.shift();
};

console.error = (...args) => {
  originalError(...args);
  serverLogs.push(`[ERROR] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
  if (serverLogs.length > 100) serverLogs.shift();
};

console.warn = (...args) => {
  originalWarn(...args);
  serverLogs.push(`[WARN] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
  if (serverLogs.length > 100) serverLogs.shift();
};

app.get('/api/dev/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(serverLogs.join('\n'));
});

app.use((req, res, next) => {
  console.log(`[REQUEST PATH: ${req.method} ${req.url}]`);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Path translation middleware to ensure 100% Vercel compatibility
app.use((req, res, next) => {
  if (req.url && !req.url.startsWith('/api') && (
    req.url.startsWith('/auth') ||
    req.url.startsWith('/drive') ||
    req.url.startsWith('/sync') ||
    req.url.startsWith('/gemini') ||
    req.url.startsWith('/visitor')
  )) {
    req.url = '/api' + req.url;
  }
  next();
});

let oauth2ClientInstance: any = null;

function getOAuth2Client() {
  if (!oauth2ClientInstance) {
    oauth2ClientInstance = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
    );
  }
  return oauth2ClientInstance;
}

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Auth Endpoints
app.get('/api/auth/google/url', (req, res) => {
  const client = getOAuth2Client();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url });
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code as string);
    res.cookie('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/auth/google/status', (req, res) => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return res.json({ connected: true, method: 'service_account' });
  }
  const tokens = req.cookies.google_tokens;
  res.json({ connected: !!tokens, method: 'oauth' });
});

app.post('/api/auth/google/logout', (req, res) => {
  res.clearCookie('google_tokens');
  res.json({ success: true });
});

// Drive API Proxy
async function getDriveClient(req: any) {
  // Priority 1: Service Account (Automatic)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      const auth = new google.auth.JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: SCOPES
      });
      return google.drive({ version: 'v3', auth });
    } catch (error: any) {
      console.error('Service Account Auth Error:', error.message);
    }
  }

  // Priority 2: OAuth (Manual)
  const tokensStr = req.cookies.google_tokens;
  if (!tokensStr) throw new Error('Not authenticated');
  const tokens = JSON.parse(tokensStr);
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials(tokens);
  return google.drive({ version: 'v3', auth: client });
}

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1E2IQ30Efx8h_wFTQr50N8LmkX5JgbkcD';

app.get('/api/drive/data/:filename', async (req, res) => {
  try {
    const drive = await getDriveClient(req);
    const { filename } = req.params;

    // Find file in folder
    const response = await drive.files.list({
      q: `name = '${filename}' and '${FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    const file = response.data.files?.[0];
    if (!file) {
      return res.json({ data: null });
    }

    const fileContent = await drive.files.get({
      fileId: file.id!,
      alt: 'media'
    });

    res.json({ data: fileContent.data });
  } catch (error: any) {
    console.error('Drive read error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/drive/data/:filename', async (req, res) => {
  try {
    const drive = await getDriveClient(req);
    const { filename } = req.params;
    const { data } = req.body;

    // Check if file exists
    const listResponse = await drive.files.list({
      q: `name = '${filename}' and '${FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    const existingFile = listResponse.data.files?.[0];

    if (existingFile) {
      // Update
      await drive.files.update({
        fileId: existingFile.id!,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(data)
        }
      });
    } else {
      // Create
      await drive.files.create({
        requestBody: {
          name: filename,
          parents: [FOLDER_ID],
          mimeType: 'application/json'
        },
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(data)
        }
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Drive write error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Google Apps Script Proxy Endpoints - Syncing and backing up consultation data
app.get('/api/sync/apps-script', async (req, res) => {
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWOfV3l5HLaUPJyqgqTgw-qHOlzqXDR4DBZ-K0QdDSU4-Yv3OSmy8za6yI-DnA94rm/exec';
  try {
    const response = await fetch(APPS_SCRIPT_URL);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          "HTTP Error 404 (Halaman Tidak Ditemukan).\n\nPenyebab Utama:\n" +
          "1. Pengaturan akses Web App di Google Apps Script belum disetel ke 'Siapa saja' (Anyone), atau\n" +
          "2. ID Penerapan (Deployment ID) ada yang terlewat saat disalin.\n\n" +
          "Cara Memperbaikinya:\n" +
          "- Buka editor Google Apps Script Anda.\n" +
          "- Klik tombol biru 'Terapkan' (Deploy) di kanan atas -> Pilih 'Penerapan baru' (New deployment).\n" +
          "- Pastikan 'Jenis penerapan' disetel ke 'Aplikasi web' (Web App).\n" +
          "- Jalankan sebagai (Execute as): Saya (pitherkeristianpenikay@gmail.com)\n" +
          "- Siapa yang memiliki akses (Who has access): Siapa saja (Anyone) -> Ini bagian paling kritis agar sistem bisa mengirim data ke baris spreadsheet secara otomatis.\n" +
          "- Klik 'Terapkan', izinkan akses keamanan jika muncul jendela konon (Otorisasi Akun Google), lalu salin URL Aplikasi Web baru yang ditampilkan dan masukkan ke setelan aplikasi."
        );
      } else {
        throw new Error(`Koneksi Gagal: Google Apps Script mengembalikan HTTP status ${response.status}`);
      }
    }
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { text };
    }
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Apps Script Fetch Error:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat rekap data dari Google Sheets.' });
  }
});

// Helper function to extract tags from AI response
function extractTagValue(text: string, tag: string): string | null {
  const normalizedText = text.replace(/\r\n/g, '\n');
  const index = normalizedText.toUpperCase().indexOf(tag.toUpperCase());
  if (index === -1) return null;
  
  const startPos = index + tag.length;
  const nextSectionTags = [
    'DIAGNOSA:',
    'SARAN PENGENDALIAN:',
    'RINGKASAN MASALAH:',
    '[ACTION:'
  ];
  
  let endPos = normalizedText.length;
  for (const nextTag of nextSectionTags) {
    if (nextTag.toUpperCase() !== tag.toUpperCase()) {
      const nextIndex = normalizedText.toUpperCase().indexOf(nextTag, startPos);
      if (nextIndex !== -1 && nextIndex < endPos) {
        endPos = nextIndex;
      }
    }
  }
  
  let extracted = normalizedText.slice(startPos, endPos).trim();
  if (extracted.startsWith(':')) {
    extracted = extracted.slice(1).trim();
  }
  if (extracted.startsWith('-')) {
    extracted = extracted.slice(1).trim();
  }
  return extracted || null;
}

app.post('/api/sync/apps-script', async (req, res) => {
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWOfV3l5HLaUPJyqgqTgw-qHOlzqXDR4DBZ-K0QdDSU4-Yv3OSmy8za6yI-DnA94rm/exec';
  const { record } = req.body;

  if (!record) {
    return res.status(400).json({ error: 'Data laporan (record) tidak lengkap atau kosong.' });
  }

  try {
    const ticketIdStr = record.ticketId || '';
    
    // Detect and strip massive raw base64 image strings to keep payloads small and safe.
    let sanitizedImage = '';
    if (record.image) {
      if (record.image.startsWith('data:image')) {
        sanitizedImage = '[Foto Laporan Terlampir]';
      } else {
        sanitizedImage = record.image;
      }
    }

    // Build variables
    const phoneVal = record.phoneNumber || record.phone || '';
    const nameVal = record.farmerName || record.name || 'Umum / Tamu';
    const groupVal = record.farmerGroup || record.group || '';
    const addressVal = record.address || '';
    const ticketVal = ticketIdStr;
    const dateVal = record.timestamp || '';
    const problemVal = record.question || '(Tanpa keterangan / Hanya gambar)';
    const resultVal = record.aiResponse || '(Analisis diproses)';

    // Intelligently summarize Masalah (Issue) and Hasil (Result/Solutions)
    let summarizedProblem = problemVal;
    let summarizedResult = resultVal;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        console.log("[Apps Script Sync] Menggunakan Gemini untuk meringkas Masalah dan Hasil...");
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const prompt = `Berikut adalah data raw percakapan konsultasi pertanian. 
Keluhan Petani (Masalah):
"${problemVal}"

Jawaban/Solusi AI:
"${resultVal}"

Tolong buat ringkasan yang sangat padat, jelas, terstruktur (tanpa markdown tebal, bullet, atau tag HTML) dan human-friendly (gaya bahasa ramah dan mudah dipahami petani) untuk dimasukkan ke kolom Spreadsheet:
1. Masalah Rekap: Ringkasan singkat inti masalah tanaman padi/jagung/hortikultura yang dihadapi petani (maksimal 200 karakter). Contoh: "Daun tanaman padi menguning dan melipat akibat serangan ulat grayak"
2. Solusi Rekap: Ringkasan singkat diagnosis penyakit/hama dan solusi tindakan konkret yang sudah diberikan kepada petani (maksimal 400 karakter). Contoh: "Diagnosis: Hama Ulat Grayak. Solusi: Sanitasi lahan, rontokkan kelompok telur secara mekanis, pasang perangkap cahaya, dan aplikasi ekstrak daun mimba atau insektisida imidakloprid."

Kembalikan pesan dalam bentuk JSON dengan key "masalah_rekap" and "solusi_rekap". Jangan ada tambahan teks di luar JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
               type: Type.OBJECT,
               properties: {
                 masalah_rekap: { type: Type.STRING },
                 solusi_rekap: { type: Type.STRING }
               },
               required: ["masalah_rekap", "solusi_rekap"]
            }
          }
        });

        const resText = response.text;
        if (resText) {
          const parsed = JSON.parse(resText.trim());
          if (parsed.masalah_rekap) {
            summarizedProblem = parsed.masalah_rekap.trim();
          }
          if (parsed.solusi_rekap) {
            summarizedResult = parsed.solusi_rekap.trim();
          }
          console.log("[Apps Script Sync] Gemini sukses meringkas!");
        }
      } catch (geminiErr: any) {
        console.warn("[Apps Script Sync] Gagal meringkas dengan Gemini, menggunakan fallback parsing:", geminiErr.message || geminiErr);
        
        // Fallback Step 1: Manual parsing of tag-headers from the raw AI response (if they exist)
        const extProblem = extractTagValue(resultVal, 'RINGKASAN MASALAH:');
        const extDiagnosis = extractTagValue(resultVal, 'DIAGNOSA:');
        const extSaran = extractTagValue(resultVal, 'SARAN PENGENDALIAN:');

        if (extProblem) {
          summarizedProblem = extProblem;
        } else {
          // Truncate raw problem if we didn't find the tag, max 200 characters
          summarizedProblem = problemVal.length > 200 ? problemVal.slice(0, 197) + '...' : problemVal;
        }

        if (extDiagnosis || extSaran) {
          const diagPart = extDiagnosis ? `Diagnosis: ${extDiagnosis}. ` : '';
          const saranPart = extSaran ? `Rekomendasi: ${extSaran}` : '';
          summarizedResult = (diagPart + saranPart).trim();
        } else {
          // Truncate raw result if we didn't find the tags, max 400 characters
          summarizedResult = resultVal.length > 400 ? resultVal.slice(0, 397) + '...' : resultVal;
        }
      }
    } else {
      // No API Key, use manual parsing fallback directly
      console.log("[Apps Script Sync] Tidak ada GEMINI_API_KEY, menggunakan parsing manual...");
      const extProblem = extractTagValue(resultVal, 'RINGKASAN MASALAH:');
      const extDiagnosis = extractTagValue(resultVal, 'DIAGNOSA:');
      const extSaran = extractTagValue(resultVal, 'SARAN PENGENDALIAN:');

      if (extProblem) {
        summarizedProblem = extProblem;
      } else {
        summarizedProblem = problemVal.length > 200 ? problemVal.slice(0, 197) + '...' : problemVal;
      }

      if (extDiagnosis || extSaran) {
        const diagPart = extDiagnosis ? `Diagnosis: ${extDiagnosis}. ` : '';
        const saranPart = extSaran ? `Rekomendasi: ${extSaran}` : '';
        summarizedResult = (diagPart + saranPart).trim();
      } else {
        summarizedResult = resultVal.length > 400 ? resultVal.slice(0, 397) + '...' : resultVal;
      }
    }

    const payload: Record<string, string> = {};

    // Standard properties
    payload["id"] = record.id || '';
    payload["ticketId"] = ticketVal;
    payload["timestamp"] = dateVal;
    payload["farmerName"] = nameVal;
    payload["phoneNumber"] = phoneVal;
    payload["address"] = addressVal;
    payload["farmerGroup"] = groupVal;
    payload["question"] = summarizedProblem;
    payload["aiResponse"] = summarizedResult;
    payload["image"] = sanitizedImage;

    // NO / Index Column
    payload["NO"] = "";
    payload["NO "] = "";
    payload["No"] = "";
    payload["no"] = "";

    // "Tanggal" (Date) Casing & Space Permutations
    payload["Tanggal"] = dateVal;
    payload["Tanggal "] = dateVal;
    payload[" Tanggal"] = dateVal;
    payload[" Tanggal "] = dateVal;
    payload["tanggal"] = dateVal;
    payload["tanggal "] = dateVal;

    // "Nama" (Name) Casing & Space Permutations
    payload["Nama"] = nameVal;
    payload["Nama "] = nameVal;
    payload["nama"] = nameVal;
    payload["nama "] = nameVal;

    // "No Hp" (Phone Number) Casing, Symbol & Space Permutations (Extremely Critical)
    payload["No Hp"] = phoneVal;
    payload["No Hp "] = phoneVal;
    payload[" No Hp"] = phoneVal;
    payload[" No Hp "] = phoneVal;
    payload["No HP"] = phoneVal;
    payload["No HP "] = phoneVal;
    payload["No. HP"] = phoneVal;
    payload["No. HP "] = phoneVal;
    payload["No. Hp"] = phoneVal;
    payload["No. Hp "] = phoneVal;
    payload["no hp"] = phoneVal;
    payload["no hp "] = phoneVal;
    payload["no_hp"] = phoneVal;
    payload["No_Hp"] = phoneVal;
    payload["No_HP"] = phoneVal;
    payload["No_HP "] = phoneVal;
    payload["noHp"] = phoneVal;
    payload["nohp"] = phoneVal;
    payload["noHP"] = phoneVal;
    payload["phone_number"] = phoneVal;
    payload["phone"] = phoneVal;
    payload["hp"] = phoneVal;
    payload["hp "] = phoneVal;
    payload["whatsapp"] = phoneVal;
    payload["whatsapp "] = phoneVal;
    payload["No. HP / WA"] = phoneVal;
    payload["No. HP/WA"] = phoneVal;
    payload["No HP/WA"] = phoneVal;
    payload["No HP / WA"] = phoneVal;
    payload["No.HP/WA"] = phoneVal;
    payload["No.HP / WA"] = phoneVal;
    payload["Nomor HP"] = phoneVal;
    payload["Nomor Hp"] = phoneVal;
    payload["nomor hp"] = phoneVal;
    payload["nomor_hp"] = phoneVal;
    payload["No Telp"] = phoneVal;
    payload["no telp"] = phoneVal;
    payload["No. Telp"] = phoneVal;
    payload["telp"] = phoneVal;
    payload["wa"] = phoneVal;
    payload["WA"] = phoneVal;
    payload["no_wa"] = phoneVal;
    payload["No WA"] = phoneVal;
    payload["No. WA"] = phoneVal;

    // "Alamat" (Address) Casing & Space Permutations
    payload["Alamat"] = addressVal;
    payload["Alamat "] = addressVal;
    payload["alamat"] = addressVal;
    payload["alamat "] = addressVal;

    // "Kelompok Tani" (Farmer Group) Casing, Undertone & Space Permutations (Extremely Critical)
    payload["Kelompok Tani"] = groupVal;
    payload["Kelompok Tani "] = groupVal;
    payload[" Kelompok Tani"] = groupVal;
    payload[" Kelompok Tani "] = groupVal;
    payload["kelompok tani"] = groupVal;
    payload["kelompok tani "] = groupVal;
    payload["Kelompok tani"] = groupVal;
    payload["Kelompok tani "] = groupVal;
    payload["Kelompok_Tani"] = groupVal;
    payload["Kelompok_Tani "] = groupVal;
    payload["kelompok_tani"] = groupVal;
    payload["kelompoktani"] = groupVal;
    payload["kelompoktani "] = groupVal;
    payload["KelompokTani"] = groupVal;
    payload["farmer_group"] = groupVal;
    payload["group"] = groupVal;
    payload["kelompok"] = groupVal;
    payload["Kelompok"] = groupVal;
    payload["Poktan"] = groupVal;
    payload["poktan"] = groupVal;
    payload["POKTAN"] = groupVal;
    payload["koptan"] = groupVal;
    payload["Koptan"] = groupVal;
    payload["KOPTAN"] = groupVal;
    payload["Nama Kelompok Tani"] = groupVal;
    payload["nama_kelompok_tani"] = groupVal;
    payload["nama_poktan"] = groupVal;
    payload["Nama Poktan"] = groupVal;
    payload["Kelompok Tani / POKTAN"] = groupVal;
    payload["Kelompok Tani/POKTAN"] = groupVal;

    // "No Tiket" (Ticket Number) Casing, Multi-space & Space Permutations (Extremely Critical)
    payload["No  Tiket"] = ticketVal;
    payload["No  Tiket "] = ticketVal;
    payload["No Tiket"] = ticketVal;
    payload["No Tiket "] = ticketVal;
    payload["No. Tiket"] = ticketVal;
    payload["No. Tiket "] = ticketVal;
    payload["no tiket"] = ticketVal;
    payload["no tiket "] = ticketVal;
    payload["no  tiket"] = ticketVal;
    payload["no  tiket "] = ticketVal;
    payload["no_tiket"] = ticketVal;
    payload["No_Tiket"] = ticketVal;
    payload["No_Tiket "] = ticketVal;
    payload["Ticket"] = ticketVal;
    payload["ticket"] = ticketVal;
    payload["Tiket"] = ticketVal;
    payload["Tiket "] = ticketVal;
    payload["Nomor Tiket"] = ticketVal;
    payload["Nomor Tiket "] = ticketVal;

    // "Masalah" (Problem/Question) Casing & Space Permutations
    payload["Masalah"] = summarizedProblem;
    payload["Masalah "] = summarizedProblem;
    payload["masalah"] = summarizedProblem;
    payload["masalah "] = summarizedProblem;
    payload["problem"] = summarizedProblem;

    // "Hasil" (AI Response/Result) Casing & Space Permutations (Extremely Critical)
    payload["Hasil"] = summarizedResult;
    payload["Hasil "] = summarizedResult;
    payload[" Hasil"] = summarizedResult;
    payload[" Hasil "] = summarizedResult;
    payload["hasil"] = summarizedResult;
    payload["hasil "] = summarizedResult;
    payload["hasil_diagnosa"] = summarizedResult;
    payload["hasil_analisis"] = summarizedResult;
    payload["ai_response"] = summarizedResult;
    payload["response"] = summarizedResult;
    payload["jawaban"] = summarizedResult;
    payload["rekomendasi"] = summarizedResult;
    payload["Rekomendasi"] = summarizedResult;
    payload["diagnosa"] = summarizedResult;
    payload["Diagnosa"] = summarizedResult;
    payload["Saran"] = summarizedResult;
    payload["saran"] = summarizedResult;
    payload["Solusi"] = summarizedResult;
    payload["solusi"] = summarizedResult;
    payload["Keterangan"] = summarizedResult;
    payload["Keterangan Laporan"] = summarizedResult;
    payload["Hasil Diagnosa"] = summarizedResult;
    payload["Hasil Analisis"] = summarizedResult;

    const url = new URL(APPS_SCRIPT_URL);
    
    // Add only a minimal set of clean query parameters to satisfy very legacy query-parameter based scripts
    url.searchParams.append("No Tiket", ticketVal);
    url.searchParams.append("Nama", nameVal.slice(0, 50));
    url.searchParams.append("Tanggal", dateVal);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          "HTTP Error 404 (Halaman Tidak Ditemukan).\n\nPenyebab Utama:\n" +
          "1. Pengaturan akses Web App di Google Apps Script belum disetel ke 'Siapa saja' (Anyone), atau\n" +
          "2. ID Penerapan (Deployment ID) ada yang terlewat saat disalin.\n\n" +
          "Cara Memperbaikinya:\n" +
          "- Buka editor Google Apps Script Anda.\n" +
          "- Klik tombol biru 'Terapkan' (Deploy) di kanan atas -> Pilih 'Penerapan baru' (New deployment).\n" +
          "- Pastikan 'Jenis penerapan' disetel ke 'Aplikasi web' (Web App).\n" +
          "- Jalankan sebagai (Execute as): Saya (pitherkeristianpenikay@gmail.com)\n" +
          "- Siapa yang memiliki akses (Who has access): Siapa saja (Everyone / Anyone) -> Ini bagian paling kritis agar sistem bisa mengirim data ke baris spreadsheet secara otomatis.\n" +
          "- Klik 'Terapkan', izinkan akses keamanan jika muncul jendela konon (Otorisasi Akun Google), lalu salin URL Aplikasi Web baru yang ditampilkan dan masukkan ke setelan aplikasi."
        );
      } else {
        throw new Error(`Koneksi Gagal: Google Apps Script mengembalikan HTTP status ${response.status}`);
      }
    }

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      result = { text };
    }

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Apps Script Post Error:', error);
    res.status(500).json({ error: error.message || 'Gagal mengirim data rekap ke Google Sheets.' });
  }
});

// Gemini AI API Streaming Proxy Route
app.post('/api/gemini/stream', async (req, res) => {
  const { query, imageBase64, mimeType, history } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY is not defined. Mohon hubungi admin untuk menyetel GEMINI_API_KEY di Settings > Secrets.');
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const contents = [...(history || [])];
    const currentParts: any[] = [{ text: query }];

    if (imageBase64 && mimeType) {
      currentParts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      });
    }

    contents.push({ role: 'user', parts: currentParts });

    const systemInstruction = `Anda adalah asisten AI Pakar SMART POPT (Pengamat Organisme Pengganggu Tumbuhan) BPP NULE. 
Tugas utama Anda adalah membantu petani mengidentifikasi hama dan penyakit tanaman padi, jagung, dan hortikultura secara akurat.

KEMAMPUAN KHUSUS (SUMBER DATA):
- Anda terhubung dengan Google Search. SELALU gunakan pencarian web jika Anda merasa informasi yang Anda miliki kurang spesifik untuk wilayah NTT atau untuk jenis varietas tertentu.
- Berikan jawaban yang mendalam dan solutif seperti ChatGPT, namun tetap praktis untuk petani di lapangan.

PROSEDUR IDENTIFIKASI:
1. Jika ada FOTO: Langsung berikan analisis visual awal. Katakan apa yang Anda lihat (misal: "Saya melihat bercak cokelat pada daun padi Bapak/Ibu...").
2. Jika belum ada FOTO: Mintalah foto bagian yang sakit untuk akurasi lebih tinggi.
3. Selalu tanyakan hal berikut secara bertahap (Satu per satu):
   - Gejala detail (warna, bentuk, penyebaran).
   - Lokasi atau bagian tanaman yang terkena.
   - Luas lahan yang terserang.
   - Pupuk atau obat yang sudah pernah digunakan.

FORMAT JAWABAN AKHIR:
Jika diagnosa sudah pasti atau Anda memberikan rekomendasi pengendalian, berikan rekapitulasi di akhir jawaban Anda (tuliskan tag-tag di bawah ini dengan huruf kapital lengkap agar mudah terbaca):
RINGKASAN MASALAH: (tuliskan ringkasan keluhan/gejala tanaman secara singkat)
DIAGNOSA: (tuliskan diagnosa nama hama/penyakit/defisiensi tanaman secara jelas)
SARAN PENGENDALIAN: (tuliskan anjuran pengendalian terperinci dan langkah konkret yang jelas baik organik/mekanis maupun kimiawi secara berurutan agar bisa ditindaklanjuti)

Di akhir, tambahkan tag [ACTION:CONTACT_OFFICER] jika masalah tergolong berat (epidemi).`;

    let stream = null;
    let lastError: any = null;

    const fallbackTiers = [
      { model: 'gemini-3.5-flash', useSearch: true, name: 'Model Utama 3.5-flash dengan Pencarian Web' },
      { model: 'gemini-3.5-flash', useSearch: false, name: 'Model Utama 3.5-flash tanpa Pencarian Web' },
      { model: 'gemini-flash-latest', useSearch: true, name: 'Model Alternatif flash-latest dengan Pencarian Web' },
      { model: 'gemini-flash-latest', useSearch: false, name: 'Model Alternatif flash-latest tanpa Pencarian Web' },
      { model: 'gemini-3.1-flash-lite', useSearch: true, name: 'Model Lite 3.1-flash-lite dengan Pencarian Web' },
      { model: 'gemini-3.1-flash-lite', useSearch: false, name: 'Model Lite 3.1-flash-lite tanpa Pencarian Web' }
    ];

    for (const tier of fallbackTiers) {
      try {
        console.log(`[Gemini Sync Stream] Mencoba inisialisasi ${tier.name}...`);
        stream = await ai.models.generateContentStream({
          model: tier.model,
          contents: contents,
          config: {
            ...(tier.useSearch ? { tools: [{ googleSearch: {} }] } : {}),
            systemInstruction,
          }
        });
        console.log(`[Gemini Sync Stream] Sukses inisialisasi dengan ${tier.name}!`);
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Sync Stream] Tier gagal (${tier.name}): ${err.message || err}`);
      }
    }

    if (!stream) {
      const errorStr = lastError ? (lastError.message || String(lastError)) : 'Tidak diketahui';
      console.error("[Gemini Sync Stream] Semua tier model fallback gagal total!", errorStr);
      throw new Error(`Semua tier layanan AI sedang padat atau kuota harian terlampaui. Detail kesalahan: ${errorStr}`);
    }

    for await (const chunk of stream) {
      if (chunk.text) {
        const payload = {
          text: chunk.text,
          sources: chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || []
        };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    }
  } catch (error: any) {
    console.error("Gemini stream error:", error);
    const errMessage = error.message || String(error);
    res.write(`data: ${JSON.stringify({ error: { message: errMessage } })}\n\n`);
    res.write(`event: error\ndata: ${JSON.stringify({ message: errMessage })}\n\n`);
  } finally {
    res.end();
  }
});

// --- Visitor Counter Logic & Endpoints ---
const VISITOR_FILE = path.join(process.cwd(), 'visitor_count.json');
const INITIAL_BASELINE = 1420;
let visitorCache: number | null = null;

function getVisitorCountFromDisk(): number {
  if (visitorCache !== null) {
    return visitorCache;
  }
  
  try {
    if (fs.existsSync(VISITOR_FILE)) {
      const raw = fs.readFileSync(VISITOR_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (typeof parsed.count === 'number') {
        visitorCache = parsed.count;
        return visitorCache;
      }
    }
  } catch (error) {
    console.error('Error reading visitor count file:', error);
  }
  
  try {
    fs.writeFileSync(VISITOR_FILE, JSON.stringify({ count: INITIAL_BASELINE }), 'utf-8');
  } catch (err) {
    console.error('Error initializing visitor count file:', err);
  }
  visitorCache = INITIAL_BASELINE;
  return visitorCache;
}

function incrementVisitorCountOnDisk(): number {
  let count = getVisitorCountFromDisk();
  count += 1;
  visitorCache = count;
  try {
    fs.writeFileSync(VISITOR_FILE, JSON.stringify({ count }), 'utf-8');
  } catch (error) {
    console.error('Error writing visitor count file:', error);
  }
  return count;
}

app.get('/api/visitor/count', (req, res) => {
  const count = getVisitorCountFromDisk();
  res.json({ count });
});

app.post('/api/visitor/increment', (req, res) => {
  const count = incrementVisitorCountOnDisk();
  res.json({ count });
});

export default app;
