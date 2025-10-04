export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

export async function POST(req) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY on server" }), { status: 500, headers });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers });
  }

  const {
    messages = [],
    model = "gpt-4o-mini",
    temperature = 0.7,
    max_tokens
  } = body || {};

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        ...(max_tokens ? { max_tokens } : {}),
        stream: false
      })
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => "");
      return new Response(JSON.stringify({ error: "Upstream error", status: resp.status, detail: err }), { status: 502, headers });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ content }), { headers });

  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500, headers });
  }
}
