export default function handler(req, res) {
  const hasKey = !!process.env.MY_SECRET;
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ hasKey });
}
