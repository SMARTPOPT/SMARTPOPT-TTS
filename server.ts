import express from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

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

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
