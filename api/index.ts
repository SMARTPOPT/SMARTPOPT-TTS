import express from 'express';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// --- HELPER FUNCTIONS ---
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

async function getDriveClient(req: any) {
  const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      const auth = new google.auth.JWT({ email: key.client_email, key: key.private_key, scopes: SCOPES });
      return google.drive({ version: 'v3', auth });
    } catch (error) { console.error('Service Account Error'); }
  }
  const tokensStr = req.cookies.google_tokens;
  if (!tokensStr) throw new Error('Not authenticated');
  const client = getOAuth2Client();
  client.setCredentials(JSON.parse(tokensStr));
  return google.drive({ version: 'v3', auth: client });
}

function extractTagValue(text: string, tag: string): string | null {
  const normalizedText = text.replace(/\r\n/g, '\n');
  const index = normalizedText.toUpperCase().indexOf(tag.toUpperCase());
  if (index === -1) return null;
  const startPos = index + tag.length;
  let endPos = normalizedText.length;
  const nextSectionTags = ['DIAGNOSA:', 'SARAN PENGENDALIAN:', 'RINGKASAN MASALAH:', '[ACTION:'];
  for (const nextTag of nextSectionTags) {
    const nextIndex = normalizedText.toUpperCase().indexOf(nextTag, startPos);
    if (nextIndex !== -1 && nextIndex < endPos) endPos = nextIndex;
  }
  return normalizedText.slice(startPos, endPos).trim().replace(/^[:\-\s]+/, '');
}

// --- ENDPOINTS ---
app.get('/api/auth/google/url', (req, res) => {
  const url = getOAuth2Client().generateAuthUrl({ access_type: 'offline', scope: ['https://www.googleapis.com/auth/drive.file'], prompt: 'consent' });
  res.json({ url });
});

app.post('/api/gemini/stream', async (req, res) => {
  const { query, imageBase64, mimeType, history } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const stream = await ai.models.generateContentStream({
      model: 'gemini-1.5-flash',
      contents: [...(history || []), { role: 'user', parts: [{ text: query }] }]
    });
    for await (const chunk of stream) {
      if (chunk.text) res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
  } catch (error) { res.write(`data: ${JSON.stringify({ error: 'System error' })}\n\n`); }
  res.end();
});

// Anda bisa menambahkan endpoint lainnya (drive, sync, dll) di sini jika perlu.

export default app;
