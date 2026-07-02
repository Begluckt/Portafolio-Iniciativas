import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export async function POST(request) {
  // Solo usuarios autenticados pueden usar la API
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { promptType, initiativeName } = body;

    if (!initiativeName || initiativeName.trim() === '') {
      return NextResponse.json({ error: 'Debe ingresar un título de iniciativa primero.' }, { status: 400 });
    }

    let systemPrompt = "Eres un consultor experto en proyectos de telecomunicaciones. Tu objetivo es redactar textos ejecutivos, profesionales y concisos. Responde DIRECTAMENTE con el contenido solicitado, sin saludos, sin viñetas y sin texto introductorio.";
    let userPrompt = "";

    switch (promptType) {
      case 'problem':
        userPrompt = `Redacta en un párrafo corto (máximo 40 palabras) el "Problema u Oportunidad" que resuelve una iniciativa llamada: "${initiativeName}". Identifica un dolor típico que esto solucionaría en una empresa Telco.`;
        break;
      case 'context':
        userPrompt = `Redacta en un párrafo corto (máximo 40 palabras) el "Contexto actual (As-Is)" para una iniciativa llamada: "${initiativeName}". Describe cómo se hacen las cosas actualmente antes de implementar la mejora.`;
        break;
      case 'desired':
        userPrompt = `Redacta en un párrafo corto (máximo 40 palabras) la "Situación deseada (To-Be)" para una iniciativa llamada: "${initiativeName}". Describe el escenario ideal una vez completado el proyecto.`;
        break;
      default:
        return NextResponse.json({ error: 'Tipo de prompt inválido.' }, { status: 400 });
    }

    const response = await fetch(process.env.HUAWEI_LLM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HUAWEI_LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v3.2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      console.error("Huawei API Error:", response.status, await response.text());
      throw new Error('Error en la API de IA de Huawei');
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content.trim();

    return NextResponse.json({ text: generatedText });

  } catch (error) {
    console.error("AI Generation error:", error);
    return NextResponse.json({ error: 'Error interno del servidor al generar texto.' }, { status: 500 });
  }
}
