'use client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = {
  'Aprobado': '#22c55e', // green-500
  'En Evaluación': '#eab308', // yellow-500
  'En Ejecución': '#3b82f6', // blue-500
  'Rechazado': '#ef4444', // red-500
  'Borrador': '#9ca3af', // gray-400
  'Cerrado': '#6b7280', // gray-500
};
const DEFAULT_COLOR = '#8b5cf6';

export default function AnalyticsCharts({ initiatives }) {
  if (!initiatives || initiatives.length === 0) return null;

  // Process data for charts
  const statusCounts = {};
  const brandCounts = {};

  initiatives.forEach(ini => {
    const status = ini.ini_status || 'Borrador';
    const brand = ini.brand || 'No Definido';
    
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
  });

  const pieData = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));
  const barData = Object.keys(brandCounts).map(key => ({ name: key, count: brandCounts[key] }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Iniciativas por Estado</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || DEFAULT_COLOR} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Iniciativas por Marca</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis allowDecimals={false} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: '#f3f4f6'}} />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
