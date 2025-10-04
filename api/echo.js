export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Use POST with JSON body" });
  }
  // PowerShell sometimes sends weird encodings; but Vercel parses JSON for us
  return res.status(200).json({ ok: true, youSent: req.body ?? {} });
}
