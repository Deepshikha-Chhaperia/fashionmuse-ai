import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;
export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
    responseLimit: '15mb',
  },
};

// Process-level crash handlers to prevent silent process termination
if (!(globalThis as any).__VERTEX_LOGGERS__) {
  (globalThis as any).__VERTEX_LOGGERS__ = true;
  process.on('unhandledRejection', (reason: any) => {
    console.error('[SERVER ERROR] Unhandled Rejection:', {
      name: reason?.name || 'UnhandledRejection',
      message: reason?.message || String(reason),
      cause: reason?.cause,
    });
  });
  process.on('uncaughtException', (err: any) => {
    console.error('[SERVER ERROR] Uncaught Exception:', {
      name: err?.name || 'UncaughtException',
      message: err?.message || String(err),
      cause: err?.cause,
    });
  });
}

const logDebug = (info: Record<string, any>) => {
  if (process.env.DEBUG_LOGS === 'true' || process.env.DEBUG_LOGS === '1') {
    console.log('[DEBUG /api/generate]', JSON.stringify(info, null, 2));
  }
};

const sendResponse = (res: any, status: number, data: any) => {
  if (res && typeof res.status === 'function') {
    return res.status(status).json(data);
  } else if (res && typeof res.writeHead === 'function') {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(data));
  } else {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export default async function handler(req: any, res: any) {
  const start = Date.now();
  const model = process.env.IMAGE_MODEL || 'gemini-2.5-flash-image';
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const baseUrl = location === 'global'
    ? 'https://aiplatform.googleapis.com'
    : `https://${location}-aiplatform.googleapis.com`;

  console.log(`[REQUEST /api/generate] model=${model} location=${location} endpoint=${baseUrl}`);

  try {
    if (req.method !== 'POST') {
      logDebug({ model, location, startTime: new Date(start).toISOString(), endTime: new Date().toISOString(), duration: `${Date.now() - start}ms`, status: 405 });
      return sendResponse(res, 405, { error: "Couldn't generate the design. Please try again." });
    }

    const apiKey = process.env.VERTEX_API_KEY;
    if (!apiKey) {
      console.error('[SERVER ERROR] VERTEX_API_KEY is not configured in environment variables');
      logDebug({ model, location, startTime: new Date(start).toISOString(), endTime: new Date().toISOString(), duration: `${Date.now() - start}ms`, status: 500, error: { name: 'ConfigError', message: 'VERTEX_API_KEY missing' } });
      return sendResponse(res, 500, { error: "Couldn't generate the design. Please try again." });
    }

    const rawBody = !res && typeof req.json === 'function' ? await req.json() : req.body;
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody || {};

    let systemInstruction = body.generationConfig?.systemInstruction || body.config?.systemInstruction || body.systemInstruction;
    const rawContents = Array.isArray(body.contents) ? body.contents : body.contents ? [body.contents] : [];

    const contents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];
    for (const c of rawContents) {
      const parts = (c.parts || []).map((p: any) =>
        p.inline_data ? { inlineData: { mimeType: p.inline_data.mime_type || p.inline_data.mimeType, data: p.inline_data.data } } : p
      );
      const role = (c.role || '').toLowerCase();
      if (role === 'system') {
        const sysText = parts.map((p: any) => p.text).filter(Boolean).join('\n');
        systemInstruction = systemInstruction ? `${systemInstruction}\n${sysText}` : sysText;
      } else {
        contents.push({ role: role === 'model' || role === 'assistant' ? 'model' : 'user', parts });
      }
    }

    const config: Record<string, any> = { ...(body.generationConfig || body.config || {}) };
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (!config.responseModalities) config.responseModalities = ['IMAGE'];

    const ai = new GoogleGenAI({
      vertexai: true,
      apiKey,
      location,
      httpOptions: { baseUrl },
    });
    const result = await ai.models.generateContent({ model, contents, config });

    const end = Date.now();
    logDebug({
      model,
      location,
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      duration: `${end - start}ms`,
      status: 200,
    });

    return sendResponse(res, 200, result);
  } catch (err: any) {
    const end = Date.now();
    const status = Number(err.status || err.statusCode || err.response?.status) || (err.message?.includes('401') ? 401 : err.message?.includes('403') ? 403 : err.message?.includes('429') ? 429 : 500);
    const safeStatus = status >= 400 && status < 600 ? status : 500;

    console.error(`[SERVER ERROR] /api/generate failed (${safeStatus}):`, err.name || 'Error', err.message || String(err));
    logDebug({
      model,
      location,
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      duration: `${end - start}ms`,
      status: safeStatus,
      error: {
        name: err.name || 'Error',
        message: err.message || String(err),
        cause: err.cause,
      },
    });

    return sendResponse(res, safeStatus, { error: "Couldn't generate the design. Please try again." });
  }
}
