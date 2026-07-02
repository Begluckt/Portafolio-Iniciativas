'use client';
import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, Users, User, Target, Map, CheckCircle2 } from 'lucide-react';

export default function PresentationView({ params }) {
  const router = useRouter();
  const [ini, setIni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scale, setScale] = useState(1);
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

  useEffect(() => {
    const handleResize = () => {
      // Calculamos la escala para ajustar 1400x787 dentro de la ventana con un poco de margen (1500x900)
      const newScale = Math.min(window.innerWidth / 1500, window.innerHeight / 900);
      // Evitamos que escale a un tamaño gigante (máximo 1.2x)
      setScale(Math.min(newScale, 1.2));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSlides = 3;

  const nextSlide = useCallback(() => {
    setCurrentSlide(s => Math.min(s + 1, totalSlides - 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide(s => Math.max(s - 1, 0));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, router]);

  if (loading) return <div className="p-10 text-gray-500">Cargando presentación...</div>;
  if (!ini) return <div className="p-10 text-red-500">Iniciativa no encontrada</div>;

  // Helpers to render checkmarks
  const isObj = (val) => Array.isArray(ini.impact) && ini.impact.includes(val);
  const hasImpact = (val) => (ini.impact || []).includes(val);

  return (
    <div className="fixed inset-0 bg-[#F5F5F5] z-[9999] text-[#333333] flex flex-col font-sans overflow-hidden select-none">
      
      {/* Top Bar */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-[#DA1222] transition-colors flex items-center gap-2 text-sm font-medium">
            <X size={18} /> Cerrar Presentación
          </button>
          <div className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600 border border-gray-200">{ini.ini_id || 'Borrador'}</div>
        </div>
        <div className="text-xs font-bold text-gray-400 tracking-widest">{currentSlide + 1} / {totalSlides}</div>
      </div>
      
      {/* Progress */}
      <div className="h-1 w-full bg-gray-200 relative z-50">
        <div className="absolute top-0 left-0 h-full bg-[#DA1222] transition-all duration-300" style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}></div>
      </div>

      {/* Navigation Buttons */}
      <button onClick={prevSlide} className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-md border border-gray-200 text-[#DA1222] hover:bg-gray-50 flex items-center justify-center transition-all z-[100] ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <ChevronLeft size={24} />
      </button>
      <button onClick={nextSlide} className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-md border border-gray-200 text-[#DA1222] hover:bg-gray-50 flex items-center justify-center transition-all z-[100] ${currentSlide === totalSlides - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <ChevronRight size={24} />
      </button>

      {/* Slide Container (Scaling Wrapper to fit perfectly on screen) */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#F5F5F5]">
        
        {/* SLIDE 0: MAIN CANVAS */}
        <div 
          className={`absolute w-[1400px] h-[787px] transition-all duration-500 ease-out bg-white p-6 flex flex-col shadow-2xl rounded-sm ${currentSlide === 0 ? 'opacity-100 z-10' : 'opacity-0 -translate-x-32 pointer-events-none'}`}
          style={{ transform: `translate(-50%, -50%) scale(${scale})`, left: '50%', top: '50%', transformOrigin: 'center center' }}
        >
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-[#DA1222] pb-2 mb-4">
            <h1 className="text-[24px] font-bold text-[#DA1222]">
              CANVAS – {ini.ini_id || 'ID'} – {ini.ini_name || 'Nombre Iniciativa'}
            </h1>
            <div className="text-[26px] font-black text-[#DA1222] tracking-tighter pr-4">Claro-</div>
          </div>

          {/* Top 4 Boxes */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="border-[1.5px] border-[#DA1222] rounded-xl p-2 flex flex-col relative items-center text-center">
              <div className="text-[#DA1222] font-bold text-[12px] mb-2 text-center w-full">Owner / Area solicitante</div>
              <div className="flex items-center gap-4 w-full h-full justify-center">
                <Users size={36} className="text-[#DA1222]/40" strokeWidth={1.5} />
                <div className="text-[#555] text-[13px] font-medium leading-tight max-w-[120px]">{ini.ini_owner || '—'}</div>
              </div>
            </div>
            
            <div className="border-[1.5px] border-[#DA1222] rounded-xl p-2 flex flex-col relative items-center text-center">
              <div className="text-[#DA1222] font-bold text-[12px] mb-2 text-center w-full">Sponsor / Mesa de trabajo</div>
              <div className="flex items-center gap-4 w-full h-full justify-center">
                <User size={36} className="text-[#DA1222]/40" strokeWidth={1.5} />
                <div className="text-[#555] text-[13px] font-medium leading-tight max-w-[120px]">{ini.ini_sponsor || '—'}</div>
              </div>
            </div>

            <div className="border-[1.5px] border-[#DA1222] rounded-xl p-2 flex flex-col relative">
              <div className="text-[#DA1222] font-bold text-[12px] mb-2 text-center w-full">Objetivo estratégico</div>
              <div className="flex items-center gap-2 h-full">
                <Target size={36} className="text-[#DA1222] shrink-0 ml-2" strokeWidth={1.5} />
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-[#555] w-full pl-2">
                  <div className="flex items-center gap-1">{isObj('Eficiencia (ahorro)') ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Eficiencia (ahorro)</div>
                  <div className="flex items-center gap-1">{isObj('Obs. Tecnológica') ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Obs. Tecnológica</div>
                  <div className="flex items-center gap-1">{isObj('Ingresos') ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Ingresos</div>
                  <div className="flex items-center gap-1">{isObj('Reporte') ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Reporte</div>
                  <div className="flex items-center gap-1">{isObj('Reg. / Norm.') ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Reg. / Norm.</div>
                  <div className="flex items-center gap-1">{isObj('Ciberseguridad') ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Ciberseguridad</div>
                  <div className="flex items-center gap-1">{isObj('Exp. Cliente') ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Exp. Cliente</div>
                  <div className="flex items-center gap-1">{isObj('Otro') ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Otro</div>
                </div>
              </div>
            </div>

            <div className="border-[1.5px] border-[#DA1222] rounded-xl p-2 flex flex-col relative">
              <div className="text-[#DA1222] font-bold text-[12px] mb-2 text-center w-full">Línea de trabajo / Segmento / Negocio</div>
              <div className="flex items-center gap-2 h-full">
                <Map size={36} className="text-[#DA1222]/50 shrink-0 ml-2" strokeWidth={1.5} />
                <div className="grid grid-cols-3 gap-x-1 gap-y-0.5 text-[10px] text-[#555] w-full">
                  <div className="flex items-center gap-1">{ini.brand === 'Claro' ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Claro</div>
                  <div className="flex items-center gap-1">{ini.segment_type === 'B2B' ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} B2B</div>
                  <div className="flex items-center gap-1">{ini.network === 'Móvil' ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Móvil</div>
                  <div className="flex items-center gap-1">{ini.brand === 'VTR' ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} VTR</div>
                  <div className="flex items-center gap-1">{ini.segment_type === 'B2C' ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} B2C</div>
                  <div className="flex items-center gap-1">{ini.network === 'Fijo' ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Fijo</div>
                  <div className="flex items-center gap-1">{ini.brand === 'Ambas' ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Claro y VTR</div>
                  <div className="flex items-center gap-1">{ini.segment_type === 'Ambas' ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Ambas</div>
                  <div className="flex items-center gap-1">{ini.network === 'Convergente' ? <CheckCircle2 size={12} className="text-[#DA1222]"/> : <span className="w-3 h-3 text-[#DA1222] flex items-center justify-center">•</span>} Converg.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex gap-4 flex-1">
            
            {/* Left Column */}
            <div className="w-[45%] border-[1.5px] border-[#DA1222] rounded-xl overflow-hidden flex flex-col shrink-0">
              <div className="bg-white p-2.5 font-bold text-[16px] text-[#555] border-b-[1.5px] border-[#DA1222]">
                1. Descripción y contexto
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex border-b-[1.5px] border-[#DA1222] flex-1 min-h-[90px]">
                  <div className="w-[25%] p-3 font-bold text-[#555] text-[12px] flex items-center">Problema o oportunidad</div>
                  <div className="w-[75%] p-3 text-[11px] text-[#555] border-l-[1.5px] border-[#DA1222] whitespace-pre-wrap leading-relaxed">
                    <ul className="list-disc pl-3"><li>{ini.ini_problem || '—'}</li></ul>
                  </div>
                </div>
                <div className="flex border-b-[1.5px] border-[#DA1222] flex-1 min-h-[90px]">
                  <div className="w-[25%] p-3 font-bold text-[#555] text-[12px] flex items-center">Contexto actual</div>
                  <div className="w-[75%] p-3 text-[11px] text-[#555] border-l-[1.5px] border-[#DA1222] whitespace-pre-wrap leading-relaxed">
                    <ul className="list-disc pl-3"><li>{ini.ini_context ? ini.ini_context.substring(0, 150) + (ini.ini_context.length > 150 ? '...\nFavor revisar slide adicional - As Is -' : '') : '—'}</li></ul>
                  </div>
                </div>
                <div className="flex border-b-[1.5px] border-[#DA1222] flex-1 min-h-[90px]">
                  <div className="w-[25%] p-3 font-bold text-[#555] text-[12px] flex items-center">Situación deseada</div>
                  <div className="w-[75%] p-3 text-[11px] text-[#555] border-l-[1.5px] border-[#DA1222] whitespace-pre-wrap leading-relaxed">
                    <ul className="list-disc pl-3"><li>{ini.ini_desired ? ini.ini_desired.substring(0, 150) + (ini.ini_desired.length > 150 ? '...\nFavor revisar slide adicional - To Be -' : '') : '—'}</li></ul>
                  </div>
                </div>
                <div className="flex flex-1 min-h-[90px]">
                  <div className="w-[25%] p-3 font-bold text-[#555] text-[12px] flex items-center">Áreas o procesos impactados</div>
                  <div className="w-[75%] p-3 text-[11px] text-[#555] border-l-[1.5px] border-[#DA1222] whitespace-pre-wrap leading-relaxed">
                    <ul className="list-disc pl-3"><li>{ini.ini_impacted || '—'}</li></ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="w-[55%] flex flex-col gap-4">
              
              <div className="border-[1.5px] border-[#DA1222] rounded-xl overflow-hidden flex flex-col bg-white shrink-0">
                <div className="bg-white p-2 font-bold text-[16px] text-[#555] border-b-[1.5px] border-[#DA1222]">
                  2. Valor y captura de beneficio
                </div>
                <table className="w-full text-left text-[11px] text-[#555]">
                  <tbody>
                    <tr className="border-b-[1.5px] border-[#DA1222]"><td className="p-2 px-3 font-bold border-r-[1.5px] border-[#DA1222] w-[25%] bg-[#FDFDFD]">Beneficio esperado</td><td className="p-2 px-3">{ini.ini_benefit || '—'}</td></tr>
                    <tr className="border-b-[1.5px] border-[#DA1222]"><td className="p-2 px-3 font-bold border-r-[1.5px] border-[#DA1222] bg-[#FDFDFD]">Descripción</td><td className="p-2 px-3">{ini.ini_benefit_desc || '—'}</td></tr>
                    <tr className="border-b-[1.5px] border-[#DA1222]"><td className="p-2 px-3 font-bold border-r-[1.5px] border-[#DA1222] bg-[#FDFDFD]">Meta</td><td className="p-2 px-3">{ini.ini_goal || '—'}</td></tr>
                    <tr className="border-b-[1.5px] border-[#DA1222]"><td className="p-2 px-3 font-bold border-r-[1.5px] border-[#DA1222] bg-[#FDFDFD]">Fecha inicio captura</td><td className="p-2 px-3">{ini.ini_capture_date || '—'}</td></tr>
                    <tr><td className="p-2 px-3 font-bold border-r-[1.5px] border-[#DA1222] bg-[#FDFDFD]">Responsable medición</td><td className="p-2 px-3">{ini.ini_measurement || '—'}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="border-[1.5px] border-[#DA1222] rounded-xl overflow-hidden flex flex-col bg-white shrink-0">
                <div className="bg-white p-2 font-bold text-[16px] text-[#555] border-b-[1.5px] border-[#DA1222]">
                  3. Evaluación
                </div>
                <div className="p-3 grid grid-cols-2 gap-4">
                  <table className="w-full text-center text-[11px] border-collapse border-[1.5px] border-[#E5E5E5] text-[#555]">
                    <thead>
                      <tr className="bg-[#DA1222] text-white">
                        <th className="p-1.5 font-bold border-r-[1.5px] border-[#E5E5E5]">Dimensión – Valor negocio</th>
                        <th className="p-1.5 font-bold">Monto anual (MM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b-[1.5px] border-[#E5E5E5]"><td className="p-1.5 font-bold border-r-[1.5px] border-[#E5E5E5]">Ingresos</td><td className="p-1.5">{ini.val_revenue || 'N/A'}</td></tr>
                      <tr className="border-b-[1.5px] border-[#E5E5E5]"><td className="p-1.5 font-bold border-r-[1.5px] border-[#E5E5E5]">Eficiencia</td><td className="p-1.5">{ini.val_efficiency || 'N/A'}</td></tr>
                      <tr className="border-b-[1.5px] border-[#E5E5E5]"><td className="p-1.5 font-bold border-r-[1.5px] border-[#E5E5E5]">Experiencia</td><td className="p-1.5">{ini.val_experience || 'N/A'}</td></tr>
                      <tr><td className="p-1.5 font-bold border-r-[1.5px] border-[#E5E5E5]">Otros</td><td className="p-1.5">N/A</td></tr>
                    </tbody>
                  </table>

                  <table className="w-full text-center text-[11px] border-collapse border-[1.5px] border-[#E5E5E5] text-[#555]">
                    <thead>
                      <tr className="bg-[#DA1222] text-white">
                        <th className="p-1.5 font-bold border-r-[1.5px] border-[#E5E5E5]">Dimensión – Duración de trabajo</th>
                        <th className="p-1.5 font-bold">Indicador</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b-[1.5px] border-[#E5E5E5]"><td className="p-1.5 font-bold border-r-[1.5px] border-[#E5E5E5]">Esfuerzo tiempo</td><td className="p-1.5">{ini.dur_time || '—'}</td></tr>
                      <tr className="border-b-[1.5px] border-[#E5E5E5]"><td className="p-1.5 font-bold border-r-[1.5px] border-[#E5E5E5]">Esfuerzo costo</td><td className="p-1.5">{ini.dur_cost || '—'}</td></tr>
                      <tr className="border-b-[1.5px] border-[#E5E5E5]"><td className="p-1.5 font-bold border-r-[1.5px] border-[#E5E5E5]">Incertidumbre técnica</td><td className="p-1.5">{ini.dur_uncertainty || '—'}</td></tr>
                      <tr><td className="p-1.5 font-bold border-r-[1.5px] border-[#E5E5E5]">Capacidad disponible</td><td className="p-1.5">{ini.dur_capacity || '—'}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-[1.5px] border-[#DA1222] rounded-xl overflow-hidden flex flex-col bg-white flex-1">
                <div className="bg-white p-2 font-bold text-[16px] text-[#555]">
                  4. Detalle evaluación
                </div>
                <div className="p-4 pt-1 text-[11px] text-[#555] whitespace-pre-wrap flex-1 flex items-start">
                  {ini.ini_evaluation_detail || 'Desarrollo no documentado.'}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* SLIDE 1: AS IS */}
        <div 
          className={`absolute w-[1400px] h-[787px] transition-all duration-500 ease-out bg-white p-6 flex flex-col shadow-2xl rounded-sm ${currentSlide === 1 ? 'opacity-100 z-10' : currentSlide > 1 ? 'opacity-0 -translate-x-32 pointer-events-none' : 'opacity-0 translate-x-32 pointer-events-none'}`}
          style={{ transform: `translate(-50%, -50%) scale(${scale})`, left: '50%', top: '50%', transformOrigin: 'center center' }}
        >
          <div className="flex justify-between items-center border-b border-[#DA1222] pb-2 mb-8">
            <h1 className="text-[24px] font-bold text-[#DA1222]">
              CANVAS – {ini.ini_id || 'ID'} – {ini.ini_name || 'Nombre Iniciativa'}
            </h1>
            <div className="text-[26px] font-black text-[#DA1222] tracking-tighter pr-4">Claro-</div>
          </div>
          
          <div className="flex-1 border-[1.5px] border-[#DA1222] rounded-xl overflow-hidden flex flex-col bg-white shadow-sm mb-6 mx-4">
            <div className="bg-white p-4 font-bold text-[20px] text-[#555] border-b-[1.5px] border-[#DA1222]">
              1. As Is
            </div>
            <div className="flex flex-1">
              <div className="w-[15%] p-6 font-bold text-[#555] text-[15px] border-r-[1.5px] border-[#DA1222] flex items-center justify-center text-center">
                Contexto actual
              </div>
              <div className="w-[85%] p-8 text-[14px] text-[#555] whitespace-pre-wrap leading-relaxed overflow-y-auto">
                {ini.ini_context || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 2: TO BE */}
        <div 
          className={`absolute w-[1400px] h-[787px] transition-all duration-500 ease-out bg-white p-6 flex flex-col shadow-2xl rounded-sm ${currentSlide === 2 ? 'opacity-100 z-10' : currentSlide > 2 ? 'opacity-0 -translate-x-32 pointer-events-none' : 'opacity-0 translate-x-32 pointer-events-none'}`}
          style={{ transform: `translate(-50%, -50%) scale(${scale})`, left: '50%', top: '50%', transformOrigin: 'center center' }}
        >
          <div className="flex justify-between items-center border-b border-[#DA1222] pb-2 mb-8">
            <h1 className="text-[24px] font-bold text-[#DA1222]">
              CANVAS – {ini.ini_id || 'ID'} – {ini.ini_name || 'Nombre Iniciativa'}
            </h1>
            <div className="text-[26px] font-black text-[#DA1222] tracking-tighter pr-4">Claro-</div>
          </div>
          
          <div className="flex-1 border-[1.5px] border-[#DA1222] rounded-xl overflow-hidden flex flex-col bg-white shadow-sm mb-6 mx-4">
            <div className="bg-white p-4 font-bold text-[20px] text-[#555] border-b-[1.5px] border-[#DA1222]">
              1. To Be
            </div>
            <div className="flex flex-1">
              <div className="w-[15%] p-6 font-bold text-[#555] text-[15px] border-r-[1.5px] border-[#DA1222] flex items-center justify-center text-center">
                Situación deseada
              </div>
              <div className="w-[85%] p-8 text-[14px] text-[#555] whitespace-pre-wrap leading-relaxed overflow-y-auto">
                {ini.ini_desired || '—'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
