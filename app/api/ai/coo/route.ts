export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, companyId } = await req.json();

    if (!prompt || !companyId) {
      return NextResponse.json(
        { error: "prompt and companyId required" },
        { status: 400 }
      );
    }

    // 🔹 Obtener estado corporativo actual
    const stateRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/ai/company-state?companyId=${companyId}`,
      { cache: "no-store" }
    );

    const companyState = await stateRes.json();

    // 🔹 Construir prompt ejecutivo
    const systemPrompt = `
Eres el COO (Chief Operating Officer) de la empresa.

Analiza el estado corporativo y responde como un director ejecutivo:

- Sé claro y accionable
- Prioriza riesgos
- Sugiere acciones concretas
- Piensa en crecimiento y operación
- Usa tono profesional
- No inventes datos

Estado actual:
${JSON.stringify(companyState, null, 2)}

Pregunta del usuario:
${prompt}
`;

    // 🔹 Llamada a OpenAI (o proveedor IA)
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.3",
        messages: [
          { role: "system", content: systemPrompt }
        ],
        temperature: 0.4,
      }),
    });

    const aiData = await aiRes.json();

    const text =
      aiData.choices?.[0]?.message?.content ||
      "No se pudo generar respuesta.";

    return NextResponse.json({ result: text });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "COO AI error" },
      { status: 500 }
    );
  }
}
