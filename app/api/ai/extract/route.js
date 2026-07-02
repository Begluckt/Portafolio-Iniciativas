import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export async function POST(request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { dialogue } = body;

    if (!dialogue || dialogue.trim() === '') {
      return NextResponse.json({ error: 'La descripción no puede estar vacía.' }, { status: 400 });
    }

    const systemPrompt = `Eres un asistente de IA experto en telecomunicaciones para una plataforma de Portafolio de Iniciativas.
El usuario te dará una descripción informal de su proyecto. Tu tarea es extraer la información y mapearla estrictamente en el siguiente formato JSON.
No agregues formato markdown como \`\`\`json, SOLO devuelve el objeto JSON crudo.
Si algún campo no es mencionado o no puedes inferirlo claramente, déjalo como string vacío "". En el caso de arreglos, devuelve [].

Campos esperados:
{
  "ini_name": "Nombre corto y ejecutivo del proyecto",
  "ini_problem": "El problema u oportunidad que resuelve (máximo 40 palabras)",
  "ini_context": "El contexto actual As-Is (máximo 40 palabras)",
  "ini_desired": "La situación deseada To-Be (máximo 40 palabras)",
  "ini_objective": "Objetivo estratégico (ej. Reducción de costos, Mejora de NPS, Ciberseguridad, etc)",
  "ini_segment": "Elige estrictamente una de estas opciones, o vacío: 'B2B', 'B2C', 'Ambas'",
  "ini_impacted": "Áreas o procesos secundarios impactados (ej. Call Center, Terreno)",
  "ini_benefit": "El beneficio esperado (si se menciona en la descripción)",
  "impact": ["Arreglo de strings. Opciones válidas estrictas: 'Eficiencia (ahorro)', 'Ingresos', 'Reg. / Norm.', 'Exp. Cliente', 'Obs. Tecnológica', 'Reporte', 'Ciberseguridad', 'Otro'"],
  "brand": "Elige estrictamente una o vacío: 'Claro', 'VTR', 'Claro y VTR'",
  "network": "Elige estrictamente una o vacío: 'Móvil', 'Fijo', 'Convergente'"
}`;

    const userPrompt = `Descripción del proyecto:\n\n"${dialogue}"`;

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
    let generatedText = data.choices[0].message.content.trim();
    
    // Fallback por si la IA devuelve markdown code blocks
    if (generatedText.startsWith('```json')) {
      generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (generatedText.startsWith('```')) {
      generatedText = generatedText.replace(/```/g, '').trim();
    }

    const extractedData = JSON.parse(generatedText);

    return NextResponse.json(extractedData);

  } catch (error) {
    console.error("AI Extraction error:", error);
    return NextResponse.json({ error: 'Error al procesar el texto. Verifica que la IA generó un JSON válido.' }, { status: 500 });
  }
}
