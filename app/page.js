'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Trash2, FileText, BarChart2, MonitorPlay, Copy, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ExportExcelButton from './components/ExportExcelButton';
import AnalyticsCharts from './components/AnalyticsCharts';

function CountUpAnimation({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (start === end) return;
    
    let totalDuration = 1000;
    let incrementTime = (totalDuration / end);
    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{count || value}</span>;
}

export default function Dashboard() {
  const [initiatives, setInitiatives] = useState([]);
  const [stats, setStats] = useState({ total: 0, countB2B: 0, countB2C: 0, countRecent: 0 });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  // Load favorites from local storage
  useEffect(() => {
    const saved = localStorage.getItem('gestor_favorites');
    if (saved) {
      try { setFavorites(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const toggleFavorite = (uuid) => {
    const newFavs = favorites.includes(uuid) 
      ? favorites.filter(id => id !== uuid)
      : [...favorites, uuid];
    setFavorites(newFavs);
    localStorage.setItem('gestor_favorites', JSON.stringify(newFavs));
    if (!favorites.includes(uuid)) toast.success('Agregado a favoritos');
  };

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch stats once
  useEffect(() => {
    fetch('/api/stats', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStats(data);
      });
  }, []);

  // Fetch initiatives when filter or search changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (filter !== 'all' && filter !== 'favorites') params.append('segment', filter);

    fetch(`/api/initiatives?${params.toString()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setInitiatives(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [debouncedSearch, filter]);

  const deleteInitiative = async (uuid) => {
    if (!confirm('¿Estás seguro de eliminar esta iniciativa?')) return;
    await fetch(`/api/initiatives/${uuid}`, { method: 'DELETE' });
    setInitiatives(initiatives.filter(i => i.uuid !== uuid));
  };

  const duplicateInitiative = async (uuid) => {
    try {
      toast.loading("Duplicando...", { id: "dup" });
      const res = await fetch(`/api/initiatives/${uuid}`);
      const data = await res.json();
      
      if (data && !data.error) {
        const copy = { ...data, ini_name: `Copia de ${data.ini_name || 'Iniciativa'}`, ini_id: '' };
        delete copy.uuid;
        delete copy.createdAt;
        delete copy.updatedAt;
        
        const postRes = await fetch('/api/initiatives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(copy)
        });
        
        if (postRes.ok) {
          toast.success("Duplicada con éxito", { id: "dup" });
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.error("Error al duplicar", { id: "dup" });
        }
      }
    } catch (e) {
      toast.error("Error al duplicar", { id: "dup" });
    }
  };

  const updateStatus = async (uuid, newStatus) => {
    try {
      const ini = initiatives.find(i => i.uuid === uuid);
      if (!ini) return;
      
      const originalStatus = ini.ini_status;
      setInitiatives(initiatives.map(i => i.uuid === uuid ? { ...i, ini_status: newStatus } : i));
      
      const res = await fetch(`/api/initiatives/${uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ini, ini_status: newStatus })
      });
      
      if (!res.ok) {
        toast.error("Error al actualizar el estado");
        setInitiatives(initiatives.map(i => i.uuid === uuid ? { ...i, ini_status: originalStatus } : i));
      } else {
        toast.success("Estado actualizado");
      }
    } catch (e) {
      toast.error("Error al actualizar el estado");
    }
  };

  const filtered = filter === 'favorites' 
    ? initiatives.filter(ini => favorites.includes(ini.uuid))
    : initiatives;

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] p-4 md:p-8 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Portafolio de Iniciativas</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Gestiona y evalúa los proyectos de la compañía</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <ExportExcelButton initiatives={initiatives} />
          <Link href="/form" className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-all shadow-red-200 flex-1 md:flex-none">
            <Plus size={18} /> Nueva Iniciativa
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {[
          { label: 'Total Iniciativas', val: stats.total },
          { label: 'B2B', val: stats.countB2B },
          { label: 'B2C', val: stats.countB2C },
          { label: 'Recientes (30d)', val: stats.countRecent }
        ].map((s, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            key={s.label} 
            className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="text-[10px] md:text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-1">{s.label}</div>
            <div className="text-3xl md:text-4xl font-black text-gray-800">
              <CountUpAnimation value={s.val} />
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && initiatives.length > 0 && (
        <AnalyticsCharts initiatives={filtered} />
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {['all', 'B2B', 'B2C', 'Ambas', 'favorites'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-full transition-colors border ${filter === f ? 'bg-red-50 text-red-700 border-red-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {f === 'all' ? 'Todas' : f === 'favorites' ? '⭐ Favoritas' : f}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-auto">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar iniciativas..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full lg:w-64 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Cargando portafolio...</div>
      ) : filtered.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center h-48"
        >
          <BarChart2 size={32} className="text-gray-300 mb-3" />
          <p className="font-medium text-gray-700">No se encontraron iniciativas</p>
          <p className="text-sm">Ajusta los filtros o crea una nueva.</p>
        </motion.div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12"
        >
          <AnimatePresence>
          {filtered.map((ini, idx) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              key={ini.uuid} 
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-red-200 transition-all flex flex-col overflow-hidden relative group"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-0.5 rounded text-xs font-bold font-mono tracking-wide">
                      {ini.ini_id || 'S/ID'}
                    </span>
                    <select
                      value={ini.ini_status || 'Borrador'}
                      onChange={(e) => updateStatus(ini.uuid, e.target.value)}
                      className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide border cursor-pointer outline-none appearance-none ${
                        ini.ini_status === 'Aprobado' ? 'bg-green-50 text-green-700 border-green-200' :
                        ini.ini_status === 'En Evaluación' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        ini.ini_status === 'En Ejecución' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        ini.ini_status === 'Rechazado' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      <option value="Borrador">Borrador</option>
                      <option value="En Evaluación">En Evaluación</option>
                      <option value="Aprobado">Aprobado</option>
                      <option value="En Ejecución">En Ejecución</option>
                      <option value="Rechazado">Rechazado</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(ini.updatedAt).toLocaleDateString('es-ES', {day:'2-digit', month:'short'})}
                    </span>
                    <button 
                      onClick={() => toggleFavorite(ini.uuid)}
                      className={`p-1 rounded-full transition-colors ${favorites.includes(ini.uuid) ? 'text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-50'}`}
                    >
                      <Star size={16} fill={favorites.includes(ini.uuid) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 group-hover:text-red-600 transition-colors">
                  {ini.ini_name || 'Iniciativa sin título'}
                </h3>
                <div className="text-sm text-gray-500 font-medium flex items-center gap-1.5 mb-4">
                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">👤</span> 
                  {ini.ini_owner || 'Owner no definido'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[ini.brand, ini.network, ini.segment_type].filter(Boolean).map((tag, i) => (
                    <span key={`${tag}-${i}`} className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 p-3 px-5 border-t border-gray-100 flex justify-between items-center opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <button onClick={() => deleteInitiative(ini.uuid)} title="Eliminar" className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => duplicateInitiative(ini.uuid)} title="Duplicar" className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                    <Copy size={16} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Link href={`/preview/${ini.uuid}`} className="text-sm font-semibold text-gray-600 hover:text-red-600 flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:border-red-200 transition-all">
                    <MonitorPlay size={14} /> Presentar
                  </Link>
                  <Link href={`/read/${ini.uuid}`} className="text-sm font-semibold text-gray-600 hover:text-red-600 flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:border-red-200 transition-all">
                    <FileText size={14} /> Documento
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
