
import { GoogleGenAI } from "@google/genai";

export async function* askAgriExpertStream(
  query: string, 
  imageBase64?: string, 
  mimeType?: string, 
  history: { role: 'user' | 'model', parts: any[] }[] = []
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  try {
    const contents = [...history];
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

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash-preview',
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `Anda adalah asisten AI Pakar SMART POPT (Pengamat Organisme Pengganggu Tumbuhan) BPP NULE. 
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
Jika diagnosa sudah pasti, berikan rekapitulasi:
1. RINGKASAN MASALAH: (Padat dan teknis)
2. DIAGNOSA: (Nama Hama/Penyakit)
3. SARAN PENGENDALIAN: (Organis maupun kimiawi yang aman)

Di akhir, tambahkan tag [ACTION:CONTACT_OFFICER] jika masalah tergolong berat (epidemi).`,
      }
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield {
          text: chunk.text,
          sources: chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || []
        };
      }
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

