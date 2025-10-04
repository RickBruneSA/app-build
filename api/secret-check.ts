// /api/secret-check.ts
export default function handler(req: any, res: any) {
  const hasKey = !!process.env.MY_SECRET;
  res.status(200).json({ hasKey });
}
