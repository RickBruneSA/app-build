// /api/diagnose.ts
export default function handler(req: any, res: any) {
  const headers = req.headers || {};
  const vercelEnv = process.env.VERCEL_ENV ?? 'unknown';    // 'preview' | 'production' | 'development'
  const hasKey = !!process.env.MY_SECRET;

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    hasKey,
    keyLength: process.env.MY_SECRET ? String(process.env.MY_SECRET).length : 0,
    vercelEnv,
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    requestHost: headers['host'] ?? null,
    deploymentUrlHeader: headers['x-vercel-deployment-url'] ?? null,
    vercelId: headers['x-vercel-id'] ?? null,
    seenEnvKeys: Object.keys(process.env).filter(k => k === 'MY_SECRET' || k.startsWith('MY_')) // names only
  });
}
