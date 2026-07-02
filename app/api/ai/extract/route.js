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
  "segment_type": "Elige estrictamente una de estas opciones, o vacío: 'B2B', 'B2C', 'Ambas'",
  "ini_impacted": "Áreas o procesos secundarios impactados (ej. Call Center, Terreno)",
  "ini_benefit": "El beneficio esperado (si se menciona en la descripción)",
  "ini_owner": "Área dueña o solicitante de la iniciativa",
  "ini_sponsor": "Mesa de trabajo, departamento o sponsor principal",
  "ini_priority": "Elige estrictamente una o vacío: 'Normal', 'Media', 'Alta', 'Crítica'",
  "ini_benefit_desc": "Descripción detallada de cómo se logrará o en qué consiste el beneficio",
  "ini_goal": "La meta cuantitativa o cualitativa esperada (ej. 100%, 50M, reducir a 0)",
  "ini_capture_date": "Cuándo se espera capturar el beneficio (ej. Q3 2024, Enero, Inmediato)",
  "ini_measurement": "Quién o qué área será responsable de medirlo",
  "val_revenue": "Ingresos anuales esperados en MM (si se menciona)",
  "val_efficiency": "Ahorros o eficiencia esperada en MM (si se menciona)",
  "dur_time": "Esfuerzo estimado en tiempo (ej. 3 meses, Alto)",
  "dur_cost": "Esfuerzo en costo o capex (ej. Bajo, Medio, $50M)",
  "dur_uncertainty": "Incertidumbre técnica (ej. Baja, Alta)",
  "dur_capacity": "Capacidad disponible. Elige estrictamente una o vacío: 'Sí', 'No', 'N/A'",
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
      const errorText = await response.text();
      console.error("Huawei API Error:", response.status, errorText);
      throw new Error(`Huawei API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let generatedText = data.choices[0].message.content.trim();
    
    // Extracción robusta: Buscar desde la primera '{' hasta la última '}'
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No se encontró JSON válido. La IA respondió: ${generatedText.substring(0, 100)}...`);
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(extractedData);

  } catch (error) {
    console.error("AI Extraction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
