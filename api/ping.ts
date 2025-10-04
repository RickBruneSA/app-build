// /api/ping.ts
export default function handler(req: any, res: any) {
  res.status(200).json({ ok: true, ping: 'pong', time: new Date().toISOString() });
}
