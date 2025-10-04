// /api/echo.ts
export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Use POST with JSON body' });
  }
  const body = req.body ?? {};
  return res.status(200).json({ ok: true, youSent: body });
}
