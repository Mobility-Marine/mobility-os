export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // 🔥 IA REAL (puedes cambiar modelo luego)
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres el asistente empresarial de Mobility OS. Responde de forma clara, ejecutiva y orientada a negocio.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await response.json();

  return NextResponse.json({
    result: data.choices?.[0]?.message?.content ?? "Sin respuesta",
  });
}
