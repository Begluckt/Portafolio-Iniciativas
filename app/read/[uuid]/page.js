'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Printer, DownloadCloud, MonitorPlay, Activity, Sparkles, Copy, X } from 'lucide-react';
import { exportToPPTX } from '../../../lib/exportPptx'; // We'll create this
import toast from 'react-hot-toast';

function AuditLogViewer({ uuid }) {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    fetch(`/api/initiatives/${uuid}/history`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
      });
  }, [uuid]);

  if (logs.length === 0) return <div className="text-sm text-gray-500 italic p-4 bg-gray-50 border border-gray-200">No hay historial registrado.</div>;

  return (
    <div className="space-y-4">
      {logs.map(log => (
        <div key={log.id} className="flex gap-4 items-start border-l-2 border-gray-200 pl-4 py-2 relative">
          <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
            <Activity size={10} className="text-gray-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-800">{log.action}</span>
              <span className="text-xs text-gray-400 font-medium">{new Date(log.created_at).toLocaleString('es-ES')}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Usuario: {log.changed_by} | Estado: {log.changes?.status || '—'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentsSection({ uuid }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  useEffect(() => {
    fetch(`/api/initiatives/${uuid}/comments`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setComments(data);
      });
  }, [uuid]);

  const handlePost = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/initiatives/${uuid}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, author_id: 'user' })
      });
      const data = await res.json();
      if (!data.error) {
        setComments([...comments, data]);
        setNewComment('');
        toast.success('Comentario agregado');
      }
    } catch(e) {
      toast.error('Error al agregar comentario');
    }
  };

  return (
    <div className="mt-8 border-t border-gray-200 pt-8 print:hidden">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Comentarios y Discusión</h3>
      
      <div className="space-y-6 mb-8">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No hay comentarios aún. Sé el primero en opinar.</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm text-gray-800">{c.author_id}</span>
                <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString('es-ES')}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-red-500 transition-shadow">
        <textarea 
          rows="3" 
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Escribe un comentario..."
          className="w-full p-4 text-sm focus:outline-none resize-none"
        ></textarea>
        <div className="bg-gray-50 px-4 py-3 flex justify-end border-t border-gray-200">
          <button 
            onClick={handlePost}
            disabled={!newComment.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Comentar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReadView({ params }) {
  const router = useRouter();
  const [ini, setIni] = useState(null);
  const [loading, setLoading] = useState(true);
  const resolvedParams = use(params);
  const uuid = resolvedParams.uuid;

  const [pitch, setPitch] = useState('');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);

  const handleGeneratePitch = async () => {
    setIsGeneratingPitch(true);
    setShowPitchModal(true);
    try {
      const res = await fetch('/api/ai/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ini)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPitch(data.pitch);
    } catch(e) {
      toast.error('Error al generar pitch');
      setShowPitchModal(false);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const copyPitch = () => {
    navigator.clipboard.writeText(pitch);
    toast.success('Copiado al portapapeles');
  };

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
          <button onClick={handleGeneratePitch} className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors">
            <Sparkles size={18} /> Generar Pitch (IA)
          </button>

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

      {/* Modal Elevator Pitch */}
      {showPitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
              <div className="flex items-center gap-2 text-indigo-800">
                <Sparkles size={20} className="text-indigo-600" />
                <h3 className="font-bold text-lg">Elevator Pitch Ejecutivo</h3>
              </div>
              <button onClick={() => setShowPitchModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {isGeneratingPitch ? (
                <div className="flex flex-col items-center justify-center py-8 text-indigo-600">
                  <Sparkles size={32} className="animate-pulse mb-3" />
                  <p className="font-medium">Redactando un pitch persuasivo...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-gray-800 text-lg leading-relaxed shadow-inner">
                    {pitch}
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={copyPitch} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                      <Copy size={16} /> Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex max-w-6xl mx-auto w-full p-8 print:p-0 print:max-w-full gap-8 relative">
        
        {/* Table of Contents (Sidebar) */}
        <aside className="hidden lg:block w-64 shrink-0 print:hidden sticky top-28 h-fit">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4">Tabla de Contenidos</h3>
            <nav className="flex flex-col gap-3 text-sm font-medium text-gray-600">
              <a href="#info" className="hover:text-red-600 transition-colors">Información Estratégica</a>
              <a href="#context" className="hover:text-red-600 transition-colors">Contexto y Definición</a>
              <a href="#value" className="hover:text-red-600 transition-colors">Captura de Valor</a>
              <a href="#eval" className="hover:text-red-600 transition-colors">Evaluación Cuantitativa</a>
              <a href="#cats" className="hover:text-red-600 transition-colors">Categorización y Detalles</a>
            </nav>
          </div>
        </aside>

        {/* Document Content */}
        <div className="flex-1 bg-white border border-[#E5E5E5] p-12 print:border-none print:shadow-none print:p-0 shadow-sm rounded-xl print:rounded-none">
          
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
            
            <section id="info" className="break-inside-avoid scroll-mt-24">
              <h4 className="text-sm font-black text-[#DA1222] uppercase tracking-widest mb-4 bg-gray-50 p-2 border-l-4 border-[#DA1222]">Información Estratégica</h4>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div className="border-b border-gray-100 pb-2"><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Owner / Área</div><div className="font-medium text-[15px]">{ini.ini_owner || '—'}</div></div>
                <div className="border-b border-gray-100 pb-2"><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Sponsor / Mesa</div><div className="font-medium text-[15px]">{ini.ini_sponsor || '—'}</div></div>
                <div className="border-b border-gray-100 pb-2"><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Objetivo Estratégico</div><div className="font-medium text-[15px]">{ini.ini_objective || '—'}</div></div>
                <div className="border-b border-gray-100 pb-2"><div className="text-[11px] font-bold text-gray-500 mb-1 uppercase">Segmento Negocio</div><div className="font-medium text-[15px]">{ini.ini_segment || '—'}</div></div>
              </div>
            </section>

            <section id="context" className="break-inside-avoid scroll-mt-24">
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

            <section id="value" className="break-inside-avoid scroll-mt-24">
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

            <section id="eval" className="break-inside-avoid scroll-mt-24">
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

            <section id="cats" className="break-inside-avoid scroll-mt-24">
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

            <section id="history" className="break-inside-avoid scroll-mt-24">
              <h4 className="text-sm font-black text-[#DA1222] uppercase tracking-widest mb-4 bg-gray-50 p-2 border-l-4 border-[#DA1222]">Historial de Actividad</h4>
              <AuditLogViewer uuid={uuid} />
            </section>
          </div>
          
          <CommentsSection uuid={uuid} />
        </div>
      </div>
    </div>
  );
}
