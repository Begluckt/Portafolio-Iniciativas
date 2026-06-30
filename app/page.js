'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Trash2, FileText, BarChart2, MonitorPlay } from 'lucide-react';

export default function Dashboard() {
  const [initiatives, setInitiatives] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/initiatives')
      .then(res => res.json())
      .then(data => {
        setInitiatives(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const deleteInitiative = async (uuid) => {
    if (!confirm('¿Estás seguro de eliminar esta iniciativa?')) return;
    await fetch(`/api/initiatives/${uuid}`, { method: 'DELETE' });
    setInitiatives(initiatives.filter(i => i.uuid !== uuid));
  };

  const filtered = initiatives.filter(i => {
    const q = search.toLowerCase();
    const matchQuery = (i.ini_id || '').toLowerCase().includes(q) || 
                       (i.ini_name || '').toLowerCase().includes(q) ||
                       (i.ini_owner || '').toLowerCase().includes(q);
    const matchFilter = filter === 'all' || i.segment_type === filter;
    return matchQuery && matchFilter;
  }).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const total = initiatives.length;
  const countB2B = initiatives.filter(i => i.segment_type === 'B2B').length;
  const countB2C = initiatives.filter(i => i.segment_type === 'B2C').length;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const countRecent = initiatives.filter(i => new Date(i.updatedAt) >= thirtyDaysAgo).length;

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Portafolio de Iniciativas</h1>
          <p className="text-gray-500 mt-1">Gestiona y evalúa los proyectos de la compañía</p>
        </div>
        <Link href="/form" className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all shadow-red-200">
          <Plus size={18} /> Nueva Iniciativa
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Iniciativas', val: total },
          { label: 'B2B', val: countB2B },
          { label: 'B2C', val: countB2C },
          { label: 'Recientes (30d)', val: countRecent }
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-1">{s.label}</div>
            <div className="text-4xl font-black text-gray-800">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {['all', 'B2B', 'B2C', 'Ambas'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors border ${filter === f ? 'bg-red-50 text-red-700 border-red-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {f === 'all' ? 'Todas' : f}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar iniciativas..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Cargando portafolio...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center h-48">
          <BarChart2 size={32} className="text-gray-300 mb-3" />
          <p className="font-medium text-gray-700">No se encontraron iniciativas</p>
          <p className="text-sm">Ajusta los filtros o crea una nueva.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
          {filtered.map(ini => (
            <div key={ini.uuid} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-red-200 transition-all flex flex-col overflow-hidden relative group">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-0.5 rounded text-xs font-bold font-mono tracking-wide">
                    {ini.ini_id || 'Borrador'}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(ini.updatedAt).toLocaleDateString('es-ES', {day:'2-digit', month:'short'})}
                  </span>
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
                <button onClick={() => deleteInitiative(ini.uuid)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
                <div className="flex gap-2">
                  <Link href={`/preview/${ini.uuid}`} className="text-sm font-semibold text-gray-600 hover:text-red-600 flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:border-red-200 transition-all">
                    <MonitorPlay size={14} /> Presentar
                  </Link>
                  <Link href={`/read/${ini.uuid}`} className="text-sm font-semibold text-gray-600 hover:text-red-600 flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:border-red-200 transition-all">
                    <FileText size={14} /> Documento
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
