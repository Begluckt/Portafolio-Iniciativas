'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, MonitorPlay } from 'lucide-react';
import Link from 'next/link';

function FormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [formData, setFormData] = useState({
    ini_id: '', ini_name: '', ini_owner: '', ini_sponsor: '', ini_objective: '',
    ini_segment: '', ini_status: 'Borrador', ini_priority: 'Normal', ini_link: '',
    ini_problem: '', ini_context: '', ini_desired: '', ini_impacted: '',
    ini_benefit: '', ini_benefit_desc: '', ini_goal: '', ini_capture_date: '', ini_measurement: '',
    val_revenue: '', val_efficiency: '', val_experience: '', val_other: '',
    dur_time: '', dur_cost: '', dur_uncertainty: '', dur_capacity: 'Sí',
    impact: [], brand: '', segment_type: '', network: '', ini_evaluation_detail: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/initiatives/${id}`)
        .then(res => res.json())
        .then(data => {
          if(!data.error) setFormData(data);
          setLoading(false);
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'impact') {
      let newImpact = [...formData.impact];
      if (checked) newImpact.push(value);
      else newImpact = newImpact.filter(v => v !== value);
      setFormData({ ...formData, impact: newImpact });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = id ? `/api/initiatives/${id}` : '/api/initiatives';
    const method = id ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    alert('Iniciativa guardada correctamente.');
    if(!id) {
      router.push('/');
    }
  };

  if (loading) return <div className="p-10 text-gray-500">Cargando iniciativa...</div>;

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] overflow-y-auto">
      <header className="bg-white px-8 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{id ? 'Editar Iniciativa' : 'Nueva Iniciativa'}</h2>
            <p className="text-sm text-gray-500">{id ? `${formData.ini_id || 'ID'} — ${formData.ini_name || ''}` : 'Completa los datos del Canvas'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {id && (
            <Link href={`/preview/${id}`} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors">
              <MonitorPlay size={18} /> Presentar Canvas
            </Link>
          )}
          <button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm shadow-red-200 transition-all">
            <Save size={18} /> Guardar
          </button>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto w-full pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Información General</h3>
                <p className="text-sm text-gray-500">Identificación y datos clave de la iniciativa</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">ID Proyecto</label>
                  <input required name="ini_id" value={formData.ini_id} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" placeholder="GDI-XXXX" />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Nombre de la Iniciativa</label>
                  <input required name="ini_name" value={formData.ini_name} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" placeholder="Buscador de direcciones..." />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Owner / Área</label>
                  <input name="ini_owner" value={formData.ini_owner} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="Nombre · Área" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Sponsor / Mesa</label>
                  <input name="ini_sponsor" value={formData.ini_sponsor} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="Mesa / Depto" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Objetivo estratégico</label>
                  <input name="ini_objective" value={formData.ini_objective} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="Alineación" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Segmento</label>
                  <input name="ini_segment" value={formData.ini_segment} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="Línea de trabajo" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Estado de Iniciativa</label>
                  <select name="ini_status" value={formData.ini_status} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white">
                    <option>Borrador</option><option>En Evaluación</option><option>Aprobado</option><option>Rechazado</option><option>En Ejecución</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Prioridad</label>
                  <select name="ini_priority" value={formData.ini_priority} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white">
                    <option>Normal</option><option>Media</option><option>Alta</option><option>Crítica</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Enlace de Respaldo</label>
                  <input type="url" name="ini_link" value={formData.ini_link} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Descripción y Contexto</h3>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Problema o oportunidad</label>
                <textarea name="ini_problem" rows="3" value={formData.ini_problem} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-y" placeholder="Describe el dolor..."></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Contexto actual (As-Is)</label>
                  <textarea name="ini_context" rows="3" value={formData.ini_context} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-y" placeholder="¿Cómo se hace hoy?"></textarea>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Situación deseada (To-Be)</label>
                  <textarea name="ini_desired" rows="3" value={formData.ini_desired} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-y" placeholder="¿Qué se espera lograr?"></textarea>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Áreas o procesos impactados</label>
                <textarea name="ini_impacted" rows="2" value={formData.ini_impacted} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-y" placeholder="Fuerza comercial..."></textarea>
              </div>
            </div>
          </div>

          {/* STEP 3 & 4 Omitted for brevity in chunking, merging logic */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center shrink-0">3</div>
                <h3 className="text-lg font-bold text-gray-900">Captura de Beneficio</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-gray-700">Beneficio esperado</label><input name="ini_benefit" value={formData.ini_benefit} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-gray-700">Descripción</label><input name="ini_benefit_desc" value={formData.ini_benefit_desc} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-gray-700">Meta</label><input name="ini_goal" value={formData.ini_goal} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-gray-700">Fecha captura</label><input name="ini_capture_date" value={formData.ini_capture_date} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" /></div>
                <div className="flex flex-col gap-1.5 md:col-span-2"><label className="text-sm font-semibold text-gray-700">Responsable medición</label><input name="ini_measurement" value={formData.ini_measurement} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" /></div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center shrink-0">4</div>
                <h3 className="text-lg font-bold text-gray-900">Evaluación</h3>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-gray-700">Ingresos (MM)</label><input name="val_revenue" value={formData.val_revenue} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-gray-700">Eficiencia (MM)</label><input name="val_efficiency" value={formData.val_efficiency} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-gray-700">Esfuerzo tiempo</label><input name="dur_time" value={formData.dur_time} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-gray-700">Esfuerzo costo</label><input name="dur_cost" value={formData.dur_cost} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold text-gray-700">Incertidumbre</label><input name="dur_uncertainty" value={formData.dur_uncertainty} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm" /></div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Capacidad disp.</label>
                  <select name="dur_capacity" value={formData.dur_capacity} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm bg-white">
                    <option>Sí</option><option>No</option><option>N/A</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 5 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center shrink-0">5</div>
              <h3 className="text-lg font-bold text-gray-900">Categorización</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-bold text-gray-800 mb-3 block uppercase tracking-wide">Tipos de Impacto</label>
                <div className="flex flex-wrap gap-3">
                  {['Eficiencia (ahorro)', 'Ingresos', 'Reg. / Norm.', 'Exp. Cliente', 'Obs. Tecnológica', 'Reporte', 'Ciberseguridad', 'Otro'].map(t => (
                    <label key={t} className={`cursor-pointer px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.impact.includes(t) ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      <input type="checkbox" name="impact" value={t} checked={formData.impact.includes(t)} onChange={handleChange} className="hidden" />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-bold text-gray-800 mb-3 block uppercase tracking-wide">Marca</label>
                  <div className="flex flex-col gap-2">
                    {['Claro', 'VTR', 'Claro y VTR'].map(t => (
                      <label key={t} className={`cursor-pointer px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${formData.brand === t ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                        <input type="radio" name="brand" value={t} checked={formData.brand === t} onChange={handleChange} className="hidden" />
                        <div className={`w-3.5 h-3.5 rounded-full border ${formData.brand === t ? 'border-[4px] border-red-600' : 'border-gray-300'}`}></div>
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-800 mb-3 block uppercase tracking-wide">Segmento</label>
                  <div className="flex flex-col gap-2">
                    {['B2B', 'B2C', 'Ambas'].map(t => (
                      <label key={t} className={`cursor-pointer px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${formData.segment_type === t ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                        <input type="radio" name="segment_type" value={t} checked={formData.segment_type === t} onChange={handleChange} className="hidden" />
                        <div className={`w-3.5 h-3.5 rounded-full border ${formData.segment_type === t ? 'border-[4px] border-red-600' : 'border-gray-300'}`}></div>
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-800 mb-3 block uppercase tracking-wide">Red</label>
                  <div className="flex flex-col gap-2">
                    {['Móvil', 'Fijo', 'Convergente'].map(t => (
                      <label key={t} className={`cursor-pointer px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${formData.network === t ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                        <input type="radio" name="network" value={t} checked={formData.network === t} onChange={handleChange} className="hidden" />
                        <div className={`w-3.5 h-3.5 rounded-full border ${formData.network === t ? 'border-[4px] border-red-600' : 'border-gray-300'}`}></div>
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-4">
                <label className="text-sm font-semibold text-gray-700">Detalle adicional de evaluación</label>
                <textarea name="ini_evaluation_detail" rows="3" value={formData.ini_evaluation_detail} onChange={handleChange} className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-y" placeholder="Notas técnicas..."></textarea>
              </div>
            </div>
          </div>
          
          <button type="submit" className="hidden">Submit</button>
        </form>
      </div>
    </div>
  );
}

export default function FormPage() {
  return (
    <Suspense fallback={<div className="p-10">Cargando formulario...</div>}>
      <FormContent />
    </Suspense>
  );
}
