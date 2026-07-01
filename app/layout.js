import './globals.css';
import { Inter } from 'next/font/google';
import Sidebar from './components/Sidebar';
import { Toaster } from 'react-hot-toast';
import InactivityTracker from './components/InactivityTracker';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Gestor de Iniciativas | Claro VTR',
  description: 'Aplicación para gestionar iniciativas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-inter antialiased flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 relative overflow-hidden bg-gray-50 pt-[72px] md:pt-0 print:bg-white print:overflow-visible print:pt-0">
          {children}
        </main>
        <InactivityTracker />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
