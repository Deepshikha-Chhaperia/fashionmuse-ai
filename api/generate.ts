export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (!res && req && typeof req.json === 'function') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured on server' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    const body = await req.json();
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await upstream.text();
    return new Response(data, { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
      }
    );
    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
