import express from 'express';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// 1. Pindahkan helper function (getOAuth2Client, getDriveClient, extractTagValue)
// Copy semua function helper dari server.ts lama Anda dan letakkan di sini.

// 2. Masukkan semua route yang ada di server.ts
app.get('/api/auth/google/url', (req, res) => { /* ... kode Anda ... */ });
app.get('/api/auth/google/callback', async (req, res) => { /* ... kode Anda ... */ });
app.post('/api/gemini/stream', async (req, res) => { /* ... kode stream Anda ... */ });
// Pindahkan juga app.get('/api/drive/data/:filename', ...) dan yang lainnya ke sini

// 3. JANGAN MASUKKAN app.listen atau startServer() di sini!
// Cukup ekspor saja:
export default app;
