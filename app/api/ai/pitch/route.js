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
    const projectData = await request.json();

    const systemPrompt = `Eres un Director de Estrategia (CSO) en una empresa de Telecomunicaciones.
Tu tarea es leer los detalles técnicos de un proyecto y redactar un "Elevator Pitch" persuasivo y contundente dirigido al CEO o al directorio ejecutivo.
Reglas:
- Máximo 3 o 4 líneas de longitud.
- Enfócate exclusivamente en el Retorno de Inversión (ROI), la eficiencia operativa y los beneficios estratégicos.
- Evita el lenguaje excesivamente técnico; tradúcelo a valor de negocio.
- Devuelve ÚNICAMENTE el texto del Elevator Pitch. No uses JSON, ni comillas, ni introducciones como "Aquí tienes".`;

    const userPrompt = `Nombre: ${projectData.ini_name || 'Desconocido'}
Objetivo Estratégico: ${projectData.ini_objective || 'No definido'}
Problema: ${projectData.ini_problem || 'No definido'}
Situación Deseada: ${projectData.ini_desired || 'No definido'}
Impactos: ${projectData.impact ? projectData.impact.join(', ') : 'Ninguno'}`;

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
    return NextResponse.json({ pitch: data.choices[0].message.content.trim() });
  } catch (error) {
    console.error("AI Pitch error:", error);
    return NextResponse.json({ error: 'Error al generar el pitch.' }, { status: 500 });
  }
}
