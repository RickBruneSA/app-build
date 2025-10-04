export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      return json({ ok: true, youSent: body });
    } catch (e) {
      return json({ ok: false, error: 'Invalid JSON' }, 400);
    }
  }

  return json({ ok: true, msg: 'echo is alive' });
}
// Minimal Node (CommonJS) serverless function
module.exports = (req, res) => {
  res.status(200).send('ok');
};
