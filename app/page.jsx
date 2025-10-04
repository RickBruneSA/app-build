"use client";
import { useState } from "react";

export default function Page() {
  const [out, setOut] = useState(null);
  return (
    <main style={{padding:24,fontFamily:"system-ui",lineHeight:1.5}}>
      <h1>Studio App + Vercel APIs</h1>
      <p>Root is Next.js, APIs are in /api (Node 20 serverless).</p>
      <button onClick={async () => {
        const r = await fetch("/api/ping"); setOut(await r.json());
      }}>Ping server</button>
      <pre style={{background:"#f6f6f6",padding:12,marginTop:12}}>
        {out ? JSON.stringify(out, null, 2) : "Click the button to /api/ping"}
      </pre>
    </main>
  );
}
