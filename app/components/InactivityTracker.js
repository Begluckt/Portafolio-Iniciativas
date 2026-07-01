'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function InactivityTracker() {
  const [isActive, setIsActive] = useState(true);
  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutos

  useEffect(() => {
    let timeout;
    let isWarningShown = false;

    const resetTimer = () => {
      setIsActive(true);
      if (timeout) clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        setIsActive(false);
        if (!isWarningShown) {
          toast('¿Sigues ahí? Llevas un tiempo inactivo.', {
            icon: '👋',
            duration: 10000, // 10 segundos
          });
          isWarningShown = true;
        }
      }, INACTIVITY_LIMIT);
    };

    // Events that reset inactivity timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(e => {
      window.addEventListener(e, resetTimer, true);
    });

    // Start timer on mount
    resetTimer();

    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach(e => {
        window.removeEventListener(e, resetTimer, true);
      });
    };
  }, []);

  return null; // Componente sin interfaz gráfica
}
