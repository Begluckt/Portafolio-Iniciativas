'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Printer, DownloadCloud, MonitorPlay } from 'lucide-react';
import { exportToPPTX } from '../../../lib/exportPptx'; // We'll create this

export default function ReadView({ params }) {
  const router = useRouter();
  const [ini, setIni] = useState(null);
  const [loading, setLoading] = useState(true);
  const resolvedParams = use(params);
  const uuid = resolvedParams.uuid;

  useEffect(() => {
    fetch(`/api/initiatives/${uuid}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setIni(data);
        setLoading(false);
      });
  }, [uuid]);

  if (loading) return <div className="p-10 text-gray-500">Cargando documento...</div>;
  if (!ini) return <div className="p-10 text-red-500">Iniciativa no encontrada</div>;

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] overflow-y-auto print:overflow-visible print:bg-white">
      
      {/* Topbar: Hidden when printing */}
      <header className="bg-white px-8 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vista de Detalle</h2>
            <p className="text-sm text-gray-500">Documento para lectura y exportación</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/preview/${uuid}`} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors">
            <MonitorPlay size={18} /> Presentar
          </Link>
          <button onClick={() => exportToPPTX(ini)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors">
            <DownloadCloud size={18} /> PPTX
          </button>
          <button onClick={() => window.print()} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors">
            <Printer size={18} /> PDF
          </button>
          <Link href={`/form?id=${uuid}`} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm shadow-red-200 transition-all">
            <Edit2 size={18} /> Editar
          </Link>
        </div>
      </header>

      {/* Document Content */}
      <div className="p-8 max-w-4xl mx-auto w-full pb-20 print:p-0 print:max-w-full">
        <div className="bg-white border border-[#E5E5E5] p-12 print:border-none print:shadow-none print:p-0">
          
          <div className="flex justify-between items-start border-b-4 border-[#DA1222] pb-6 mb-8">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-500 mb-1">{ini.ini_id || 'SIN-ID'}</span>
              <h1 className="text-3xl font-black text-[#333333] leading-tight">{ini.ini_name || 'Iniciativa sin título'}</h1>
            </div>
            <div className="flex flex-col items-end gap-2 text-sm font-bold">
              {ini.ini_status && <span className="bg-gray-100 text-gray-600 px-3 py-1 border border-gray-200">{ini.ini_status}</span>}
              {ini.ini_priority && <span className="bg-red-50 text-[#DA1222] px-3 py-1 border border-red-100">Prioridad: {ini.ini_priority}</span>}
            </div>
          </div>

          <div className="space-y-8 text-[#333333]">
            
            <section className="break-inside-avoid">
              <h4 className="text-sm font-black text-[#DA1222] uppercase tracking-widest mb-4 bg-gray-50 p-2 border-l-4 border-[#DA1222]">Información Estratégica</h4>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div className="border-b border-gray-100 pb-2"><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Owner / Área</div><div className="font-medium text-[15px]">{ini.ini_owner || '—'}</div></div>
                <div className="border-b border-gray-100 pb-2"><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Sponsor / Mesa</div><div className="font-medium text-[15px]">{ini.ini_sponsor || '—'}</div></div>
                <div className="border-b border-gray-100 pb-2"><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Objetivo Estratégico</div><div className="font-medium text-[15px]">{ini.ini_objective || '—'}</div></div>
                <div className="border-b border-gray-100 pb-2"><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Segmento Negocio</div><div className="font-medium text-[15px]">{ini.ini_segment || '—'}</div></div>
              </div>
            </section>

            <section className="break-inside-avoid">
              <h4 className="text-sm font-black text-[#DA1222] uppercase tracking-widest mb-4 bg-gray-50 p-2 border-l-4 border-[#DA1222]">Contexto y Definición</h4>
              <div className="space-y-6">
                <div><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Problema u Oportunidad</div><div className="font-medium text-[14px] bg-[#FDFDFD] border border-[#E5E5E5] p-4 whitespace-pre-wrap">{ini.ini_problem || '—'}</div></div>
                <div className="grid grid-cols-2 gap-6">
                  <div><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Situación Actual (As-Is)</div><div className="font-medium text-[14px] bg-[#FDFDFD] border border-[#E5E5E5] p-4 whitespace-pre-wrap">{ini.ini_context || '—'}</div></div>
                  <div><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Situación Deseada (To-Be)</div><div className="font-medium text-[14px] bg-[#FDFDFD] border border-[#E5E5E5] p-4 whitespace-pre-wrap">{ini.ini_desired || '—'}</div></div>
                </div>
                <div><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Áreas Impactadas</div><div className="font-medium text-[14px] bg-[#FDFDFD] border border-[#E5E5E5] p-4 whitespace-pre-wrap">{ini.ini_impacted || '—'}</div></div>
              </div>
            </section>

            <section className="break-inside-avoid">
              <h4 className="text-sm font-black text-[#DA1222] uppercase tracking-widest mb-4 bg-gray-50 p-2 border-l-4 border-[#DA1222]">Captura de Valor</h4>
              <table className="w-full text-left text-[13px] border-collapse border border-[#E5E5E5]">
                <tbody>
                  <tr className="border-b border-[#E5E5E5]"><td className="p-3 bg-gray-50 font-bold w-1/4 border-r border-[#E5E5E5]">Beneficio Esperado</td><td className="p-3 font-medium">{ini.ini_benefit || '—'}</td></tr>
                  <tr className="border-b border-[#E5E5E5]"><td className="p-3 bg-gray-50 font-bold border-r border-[#E5E5E5]">Descripción</td><td className="p-3 font-medium">{ini.ini_benefit_desc || '—'}</td></tr>
                  <tr className="border-b border-[#E5E5E5]"><td className="p-3 bg-gray-50 font-bold border-r border-[#E5E5E5]">Meta</td><td className="p-3 font-medium">{ini.ini_goal || '—'}</td></tr>
                  <tr className="border-b border-[#E5E5E5]"><td className="p-3 bg-gray-50 font-bold border-r border-[#E5E5E5]">Fecha de Captura</td><td className="p-3 font-medium">{ini.ini_capture_date || '—'}</td></tr>
                  <tr><td className="p-3 bg-gray-50 font-bold border-r border-[#E5E5E5]">Responsable Medición</td><td className="p-3 font-medium">{ini.ini_measurement || '—'}</td></tr>
                </tbody>
              </table>
            </section>

            <section className="break-inside-avoid">
              <h4 className="text-sm font-black text-[#DA1222] uppercase tracking-widest mb-4 bg-gray-50 p-2 border-l-4 border-[#DA1222]">Evaluación Cuantitativa</h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="font-bold text-[#333333] mb-2 uppercase text-[11px]">Valor Negocio</div>
                  <table className="w-full text-left text-[13px] border-collapse border border-[#E5E5E5]">
                    <tbody>
                      <tr className="border-b border-[#E5E5E5]"><td className="p-2 bg-gray-50 font-bold border-r border-[#E5E5E5]">Ingresos (MM)</td><td className="p-2 font-medium">{ini.val_revenue || '—'}</td></tr>
                      <tr className="border-b border-[#E5E5E5]"><td className="p-2 bg-gray-50 font-bold border-r border-[#E5E5E5]">Eficiencia (MM)</td><td className="p-2 font-medium">{ini.val_efficiency || '—'}</td></tr>
                      <tr><td className="p-2 bg-gray-50 font-bold border-r border-[#E5E5E5]">Experiencia</td><td className="p-2 font-medium">{ini.val_experience || '—'}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <div className="font-bold text-[#333333] mb-2 uppercase text-[11px]">Esfuerzo y Riesgo</div>
                  <table className="w-full text-left text-[13px] border-collapse border border-[#E5E5E5]">
                    <tbody>
                      <tr className="border-b border-[#E5E5E5]"><td className="p-2 bg-gray-50 font-bold border-r border-[#E5E5E5]">Esfuerzo Tiempo</td><td className="p-2 font-medium">{ini.dur_time || '—'}</td></tr>
                      <tr className="border-b border-[#E5E5E5]"><td className="p-2 bg-gray-50 font-bold border-r border-[#E5E5E5]">Esfuerzo Costo</td><td className="p-2 font-medium">{ini.dur_cost || '—'}</td></tr>
                      <tr className="border-b border-[#E5E5E5]"><td className="p-2 bg-gray-50 font-bold border-r border-[#E5E5E5]">Incertidumbre Técn.</td><td className="p-2 font-medium">{ini.dur_uncertainty || '—'}</td></tr>
                      <tr><td className="p-2 bg-gray-50 font-bold border-r border-[#E5E5E5]">Capacidad Disponible</td><td className="p-2 font-medium">{ini.dur_capacity || '—'}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="break-inside-avoid">
              <h4 className="text-sm font-black text-[#DA1222] uppercase tracking-widest mb-4 bg-gray-50 p-2 border-l-4 border-[#DA1222]">Categorización y Detalles</h4>
              <div className="grid grid-cols-4 gap-4 mb-4 border-b border-[#E5E5E5] pb-4">
                <div><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Marca</div><div className="font-medium text-[13px]">{ini.brand || '—'}</div></div>
                <div><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Segmento</div><div className="font-medium text-[13px]">{ini.segment_type || '—'}</div></div>
                <div><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Tipo de Red</div><div className="font-medium text-[13px]">{ini.network || '—'}</div></div>
                <div>
                  <div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Impactos</div>
                  <div className="font-medium text-[13px]">{(ini.impact || []).join(', ') || '—'}</div>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Detalle de Evaluación</div>
                <div className="font-medium text-[14px] bg-[#FDFDFD] border border-[#E5E5E5] p-4 whitespace-pre-wrap">{ini.ini_evaluation_detail || '—'}</div>
              </div>
            </section>
          </div>
          
        </div>
      </div>
    </div>
  );
}
