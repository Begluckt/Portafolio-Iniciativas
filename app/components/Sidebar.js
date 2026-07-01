'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Edit3, Download, Upload, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // No mostrar el Sidebar en las páginas de login y registro
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleExport = async () => {
    try {
      const res = await fetch('/api/initiatives');
      const data = await res.json();
      if (!data || data.length === 0) {
        toast.error("No hay iniciativas para exportar.");
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iniciativas_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportación exitosa");
    } catch (e) {
      toast.error("Error al exportar");
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          const res = await fetch('/api/initiatives/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(imported)
          });
          if (res.ok) {
            toast.success("Importación completada con éxito");
            setTimeout(() => window.location.reload(), 1500);
          } else {
            toast.error("Hubo un problema al importar las iniciativas.");
          }
        } else {
          toast.error("El archivo JSON debe contener un arreglo de iniciativas.");
        }
      } catch (err) {
        toast.error("Error leyendo o procesando el archivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 z-[110] absolute top-0 w-full print:hidden">
        <Image src="/logos_sin_fondo.png" alt="Claro VTR Logo" width={120} height={35} className="object-contain h-8 w-auto" />
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 p-1">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[90] md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full w-[260px] bg-white flex flex-col z-[100] border-r border-gray-200 shrink-0 print:hidden transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-center pt-8 md:pt-6">
          <Image src="/logos_sin_fondo.png" alt="Claro VTR Logo" width={180} height={50} className="object-contain h-12 w-auto" priority />
        </div>

        <div className="px-6 mt-4 mb-2 text-[11px] font-bold text-gray-500 tracking-widest uppercase">MENÚ</div>

        <nav className="px-3 flex flex-col gap-1">
          <Link onClick={() => setIsOpen(false)} href="/" className={`flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium transition-all ${pathname === '/' ? 'bg-red-600 text-white font-semibold' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
            <LayoutDashboard size={18} />
            <span>Portafolio</span>
          </Link>
          {pathname.startsWith('/read') && (
            <div className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-semibold bg-red-600 text-white">
              <FileText size={18} />
              <span>Ver Iniciativa</span>
            </div>
          )}
          {pathname.startsWith('/form') && (
            <div className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-semibold bg-red-600 text-white">
              <Edit3 size={18} />
              <span>Formulario</span>
            </div>
          )}
        </nav>

        <div className="mt-auto pb-6 px-3 flex flex-col gap-1">
          <div className="px-3 mt-4 mb-2 text-[11px] font-bold text-gray-500 tracking-widest uppercase">HERRAMIENTAS</div>
          <button onClick={handleExport} className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all text-left">
            <Download size={18} />
            <span>Exportar JSON</span>
          </button>
          <label className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all text-left cursor-pointer">
            <Upload size={18} />
            <span>Importar JSON</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </aside>
    </>
  );
}
