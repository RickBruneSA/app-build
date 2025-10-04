// /api/secret-check.ts
export default function handler(req: any, res: any) {
  const secret = process.env.MY_SECRET;
  if (!secret) {
    return res.status(500).json({ ok: false, error: 'MY_SECRET is not set' });
  }
  return res.status(200).json({ ok: true, secretLength: String(secret).length });
}
