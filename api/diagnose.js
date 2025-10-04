export default function handler(req, res) {
  const headers = req.headers || {};
  const hasKey = !!process.env.MY_SECRET;
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    hasKey,
    keyLength: process.env.MY_SECRET ? String(process.env.MY_SECRET).length : 0,
    vercelEnv: process.env.VERCEL_ENV ?? "unknown",
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    requestHost: headers["host"] ?? null,
    deploymentUrlHeader: headers["x-vercel-deployment-url"] ?? null,
    vercelId: headers["x-vercel-id"] ?? null,
    seenEnvKeys: Object.keys(process.env).filter(k => k.startsWith("MY_"))
  });
}
