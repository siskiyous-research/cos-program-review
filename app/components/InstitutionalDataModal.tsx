'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AggregatedProgramData } from '@/lib/types';
import { DataDashboard } from './DataDashboard';

interface InstitutionalDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AggregatedProgramData | null;
  isLoading: boolean;
  allSubjects: Array<{ subject: string; data: AggregatedProgramData }>;
  isLoadingAll: boolean;
}

export const InstitutionalDataModal: React.FC<InstitutionalDataModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading,
  allSubjects,
  isLoadingAll,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [size, setSize] = useState({ width: 700, height: 520 });
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const modalRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Center on first open
  useEffect(() => {
    if (isOpen && position.x === -1) {
      setPosition({
        x: Math.max(40, (window.innerWidth - size.width) / 2),
        y: Math.max(40, (window.innerHeight - size.height) / 2),
      });
    }
  }, [isOpen, position.x, size.width, size.height]);

  const selectedData = selectedSubject
    ? allSubjects.find(s => s.subject === selectedSubject)?.data ?? null
    : data;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.body.style.userSelect = 'none';
  }, [position]);

  const handleResizeStart = useCallback((edge: string, e: React.MouseEvent) => {
    e.stopPropagation();
    isResizing.current = edge;
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
      if (isResizing.current) {
        const edge = isResizing.current;
        setSize(prev => {
          let w = prev.width;
          let h = prev.height;
          if (edge.includes('e')) w = Math.max(400, e.clientX - position.x);
          if (edge.includes('s')) h = Math.max(300, e.clientY - position.y);
          if (edge.includes('w')) {
            const dx = e.clientX - position.x;
            w = Math.max(400, prev.width - dx);
            if (w !== prev.width) setPosition(p => ({ ...p, x: e.clientX }));
          }
          if (edge.includes('n')) {
            const dy = e.clientY - position.y;
            h = Math.max(300, prev.height - dy);
            if (h !== prev.height) setPosition(p => ({ ...p, y: e.clientY }));
          }
          return { width: w, height: h };
        });
      }
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      isResizing.current = null;
      document.body.style.userSelect = '';
    };

    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, position]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col"
      style={{
        width: size.width,
        height: size.height,
        left: position.x,
        top: position.y,
      }}
    >
      {/* Resize handles */}
      <div onMouseDown={(e) => handleResizeStart('n', e)} className="absolute top-0 left-2 right-2 h-1.5 cursor-n-resize" />
      <div onMouseDown={(e) => handleResizeStart('s', e)} className="absolute bottom-0 left-2 right-2 h-1.5 cursor-s-resize" />
      <div onMouseDown={(e) => handleResizeStart('e', e)} className="absolute top-2 bottom-2 right-0 w-1.5 cursor-e-resize" />
      <div onMouseDown={(e) => handleResizeStart('w', e)} className="absolute top-2 bottom-2 left-0 w-1.5 cursor-w-resize" />
      <div onMouseDown={(e) => handleResizeStart('ne', e)} className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" />
      <div onMouseDown={(e) => handleResizeStart('nw', e)} className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" />
      <div onMouseDown={(e) => handleResizeStart('se', e)} className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" />
      <div onMouseDown={(e) => handleResizeStart('sw', e)} className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" />

      {/* Title bar - draggable */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-4 py-3 border-b border-slate-200 cursor-move bg-slate-50 rounded-t-lg shrink-0"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-sm font-semibold text-slate-800">Institutional Data</h3>
        </div>
        <div className="flex items-center gap-3" data-no-drag>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Current Program</option>
            {allSubjects.map(s => (
              <option key={s.subject} value={s.subject}>{s.subject}</option>
            ))}
          </select>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" data-no-drag>
        {isLoadingAll && !selectedData ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading institutional data...</div>
        ) : (
          <DataDashboard
            data={selectedData}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
