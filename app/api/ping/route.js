export async function GET() {
  return Response.json({ ok: true, ping: "pong", time: new Date().toISOString() });
}
