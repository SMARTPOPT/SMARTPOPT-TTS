import express from 'express';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// --- FUNGSI HELPER ---
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

async function getDriveClient(req: any) {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: SCOPES
    });
    return google.drive({ version: 'v3', auth });
  }
  const tokensStr = req.cookies.google_tokens;
  if (!tokensStr) throw new Error('Not authenticated');
  const tokens = JSON.parse(tokensStr);
  const client = getOAuth2Client();
  client.setCredentials(tokens);
  return google.drive({ version: 'v3', auth: client });
}

function extractTagValue(text: string, tag: string): string | null {
  const normalizedText = text.replace(/\r\n/g, '\n');
  const index = normalizedText.toUpperCase().indexOf(tag.toUpperCase());
  if (index === -1) return null;
  const startPos = index + tag.length;
  const nextSectionTags = ['DIAGNOSA:', 'SARAN PENGENDALIAN:', 'RINGKASAN MASALAH:', '[ACTION:'];
  let endPos = normalizedText.length;
  for (const nextTag of nextSectionTags) {
    if (nextTag.toUpperCase() !== tag.toUpperCase()) {
      const nextIndex = normalizedText.toUpperCase().indexOf(nextTag, startPos);
      if (nextIndex !== -1 && nextIndex < endPos) endPos = nextIndex;
    }
  }
  let extracted = normalizedText.slice(startPos, endPos).trim();
  return extracted.startsWith(':') || extracted.startsWith('-') ? extracted.slice(1).trim() : extracted;
}

// --- ENDPOINTS ---
app.get('/api/auth/google/url', (req, res) => {
  const url = getOAuth2Client().generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
  res.json({ url });
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { tokens } = await getOAuth2Client().getToken(req.query.code as string);
    res.cookie('google_tokens', JSON.stringify(tokens), { httpOnly: true, secure: true, sameSite: 'none' });
    res.send('<script>window.opener.postMessage({type:"OAUTH_AUTH_SUCCESS"},"*");window.close();</script>Auth Success.');
  } catch (e) { res.status(500).send('Auth failed'); }
});

app.post('/api/gemini/stream', async (req, res) => {
  const { query, imageBase64, mimeType, history } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const contents = [...(history || []), { role: 'user', parts: [{ text: query }, ...(imageBase64 ? [{ inlineData: { data: imageBase64, mimeType } }] : [])] }];
    
    const stream = await ai.models.generateContentStream({
      model: 'gemini-3.5-flash',
      contents,
      config: { systemInstruction: "Anda adalah asisten Pakar SMART POPT..." }
    });

    for await (const chunk of stream) {
      if (chunk.text) res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
  } catch (e) { res.write(`data: ${JSON.stringify({ error: 'Failed' })}\n\n`); }
  res.end();
});

// Anda bisa menambahkan endpoint '/api/drive/data' dan '/api/sync/apps-script' lainnya di sini dengan cara yang sama.

export default app;
