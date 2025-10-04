export async function GET() {
  const hasKey = !!process.env.MY_SECRET;
  return Response.json({ hasKey });
}
