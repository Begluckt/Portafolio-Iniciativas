import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function ExportExcelButton({ initiatives }) {
  const handleExport = () => {
    if (!initiatives || initiatives.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      const data = initiatives.map(ini => ({
        'ID': ini.ini_id || '',
        'Nombre': ini.ini_name || '',
        'Estado': ini.ini_status || '',
        'Prioridad': ini.ini_priority || '',
        'Dueño': ini.ini_owner || '',
        'Sponsor': ini.ini_sponsor || '',
        'Segmento': ini.ini_segment || '',
        'Tipo Segmento': ini.segment_type || '',
        'Marca': ini.brand || '',
        'Red': ini.network || '',
        'Fecha Actualización': new Date(ini.updatedAt).toLocaleDateString('es-ES')
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Iniciativas');
      
      const fileName = `Portafolio_Iniciativas_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success('Excel exportado correctamente');
    } catch (e) {
      toast.error('Error al exportar Excel');
    }
  };

  return (
    <button 
      onClick={handleExport}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all"
    >
      <Download size={18} /> Exportar Excel
    </button>
  );
}
