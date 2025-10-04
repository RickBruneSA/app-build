// /api/diagnose.ts
export default function handler(req: any, res: any) {
  const headers = req.headers || {};
  res.setHeader('Cache-Control', 'no-store');
  const hasKey = !!process.env.MY_SECRET;

  res.status(200).json({
    hasKey,
    keyLength: process.env.MY_SECRET ? String(process.env.MY_SECRET).length : 0,
    vercelEnv: process.env.VERCEL_ENV ?? 'unknown',        // 'preview' | 'production' | 'development'
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    vercelUrl: process.env.VERCEL_URL ?? 'unknown',
    requestHost: headers['host'] ?? null,
    deploymentHeader: headers['x-vercel-deployment-url'] ?? null,
    vercelId: headers['x-vercel-id'] ?? null,
    seenEnvKeys: Object.keys(process.env).filter(k => k.startsWith('MY_')) // names only
  });
}
