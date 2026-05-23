import express from 'express';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// --- FUNGSI HELPER & ROUTE ---

// Endpoint untuk AI Streaming
app.post('/api/gemini/stream', async (req, res) => {
  const { query, imageBase64, mimeType, history } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    // Sesuaikan dengan model yang Anda gunakan
    const stream = await ai.models.generateContentStream({
      model: 'gemini-1.5-flash', 
      contents: [...(history || []), { role: 'user', parts: [{ text: query }] }]
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: 'Terjadi kesalahan sistem' })}\n\n`);
  }
  res.end();
});

// PENTING: Jangan gunakan app.listen() di sini!
// Vercel akan otomatis mengekspor app ini sebagai fungsi serverless.
export default app;
