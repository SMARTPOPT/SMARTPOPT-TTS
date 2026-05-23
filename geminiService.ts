export async function* askAgriExpertStream(
  query: string, 
  imageBase64?: string, 
  mimeType?: string, 
  history: { role: 'user' | 'model', parts: any[] }[] = []
) {
  const response = await fetch('/api/gemini/stream', {
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
