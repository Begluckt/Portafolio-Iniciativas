import './globals.css';
import { Inter } from 'next/font/google';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Gestor de Iniciativas | Claro VTR',
  description: 'Aplicación para gestionar iniciativas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-inter antialiased`}>
        <Sidebar />
        <main className="flex-1 relative overflow-hidden bg-gray-50 print:bg-white print:overflow-visible">
          {children}
        </main>
      </body>
    </html>
  );
}
