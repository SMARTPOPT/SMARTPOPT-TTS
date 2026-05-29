export async function* askAgriExpertStream(
  query: string, 
  imageBase64?: string, 
  mimeType?: string, 
  history: { role: 'user' | 'model', parts: any[] }[] = []
) {
  let response;
  try {
    response = await fetch('/api/gemini/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        imageBase64,
        mimeType,
        history
      })
    });
  } catch (err) {
    console.warn("POST fetch to /api/gemini/stream failed. Trying GET fallback...", err);
    response = null;
  }

  // If POST response failed or returned method/status mismatch, try GET fallback
  if (!response || !response.ok && (response.status === 404 || response.status === 405)) {
    console.warn(`POST to /api/gemini/stream was unavailable. Executing GET connection fallback...`);
    const queryParams = new URL(window.location.origin + '/api/gemini/stream');
    queryParams.searchParams.append('query', query);
    
    // Only pass image in GET query string if it is short enough to not exceed standard URL limits (8KB)
    if (imageBase64 && imageBase64.length < 4000) {
      queryParams.searchParams.append('imageBase64', imageBase64);
      if (mimeType) queryParams.searchParams.append('mimeType', mimeType);
    }
    
    if (history && history.length > 0) {
      // Use abbreviated history if possible to save URL length space
      try {
        queryParams.searchParams.append('history', JSON.stringify(history.slice(-4)));
      } catch (e) {}
    }

    try {
      response = await fetch(queryParams.toString(), {
        method: 'GET'
      });
    } catch (getErr: any) {
      throw new Error(`Koneksi AI Gagal: ${getErr.message || 'Layanan tidak dapat dihubungi.'}`);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('ReadableStream not supported on this browser');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    let lineEndIdx;
    while ((lineEndIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, lineEndIdx).trim();
      buffer = buffer.slice(lineEndIdx + 1);

      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        try {
          const chunk = JSON.parse(dataStr);
          if (chunk && chunk.error) {
            throw new Error(chunk.error.message || 'Error dari server AI');
          }
          yield chunk;
        } catch (e: any) {
          if (dataStr.includes('"error"') || (e.message && !e.message.includes('Unexpected token') && !e.message.includes('JSON'))) {
            throw e;
          }
          console.error("Failed to parse SSE line chunk", e);
        }
      } else if (line.startsWith('event: error')) {
        // Find the next data line for the error details
        const nextLineIdx = buffer.indexOf('\n');
        if (nextLineIdx !== -1) {
          const nextLine = buffer.slice(0, nextLineIdx).trim();
          buffer = buffer.slice(nextLineIdx + 1);
          if (nextLine.startsWith('data: ')) {
            try {
              const errObj = JSON.parse(nextLine.slice(6).trim());
              const msg = errObj.message || (errObj.error && errObj.error.message) || 'Error from AI service';
              throw new Error(msg);
            } catch (errParse: any) {
              if (errParse.message && !errParse.message.includes('JSON') && !errParse.message.includes('Unexpected')) {
                throw errParse;
              }
              throw new Error('Maaf, terjadi kesalahan dari layanan AI.');
            }
          }
        } else {
          // Put the event identifier back into the buffer so it can be parsed when subsequent data arrives
          buffer = 'event: error\n' + buffer;
          break;
        }
      }
    }
  }
}
