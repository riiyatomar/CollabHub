import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      if (position === 'top') {
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
      } else if (position === 'bottom') {
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
      } else if (position === 'right') {
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
      } else if (position === 'left') {
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
      }
      
      setCoords({ top, left });
    }
  }, [isVisible, position]);

  useEffect(() => {
    if (!isVisible) return;
    
    const handleScroll = () => {
      setIsVisible(false);
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isVisible]);

  return (
    <div 
      className="inline-flex" 
      ref={triggerRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && createPortal(
        <div 
          className={cn(
            "fixed z-[9999] px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-200",
            position === 'top' && "-translate-x-1/2 -translate-y-full",
            position === 'bottom' && "-translate-x-1/2",
            position === 'left' && "-translate-x-full -translate-y-1/2",
            position === 'right' && "-translate-y-1/2"
          )}
          style={{ top: coords.top, left: coords.left }}
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  );
}
