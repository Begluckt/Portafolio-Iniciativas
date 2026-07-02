import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export const maxDuration = 60;

export async function POST(request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { problem, context, desired } = await request.json();

    if (!problem && !context && !desired) {
      return NextResponse.json({ error: 'Falta información del proyecto para estimar.' }, { status: 400 });
    }

    const systemPrompt = `Eres un Arquitecto de Soluciones de Telecomunicaciones experto en estimación de proyectos de TI.
Te daré el contexto de una iniciativa (Problema, Situación Actual y Situación Deseada).
Tu tarea es estimar el esfuerzo requerido y devolverlo ESTRICTAMENTE en formato JSON crudo, sin markdown.

Campos esperados en el JSON:
{
  "dur_time": "Estima el tiempo en meses (ej. '3 meses', '6 meses', '+12 meses')",
  "dur_cost": "Estima el costo relativo (estrictamente una de estas: 'Bajo', 'Medio', 'Alto')",
  "dur_uncertainty": "Estima la incertidumbre/riesgo (estrictamente una de estas: 'Baja', 'Media', 'Alta')"
}`;

    const userPrompt = `Problema:\n${problem}\n\nContexto Actual:\n${context}\n\nSituación Deseada:\n${desired}`;

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

    if (!response.ok) throw new Error('Error API Huawei');

    const data = await response.json();
    let text = data.choices[0].message.content.trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No se encontró un JSON válido en la respuesta");
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("AI Estimate error:", error);
    return NextResponse.json({ error: 'Error al procesar el texto. Verifica que la IA generó un JSON válido.' }, { status: 500 });
  }
}
