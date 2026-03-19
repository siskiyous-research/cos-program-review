import { useEffect, useRef, useState, useCallback } from 'react';
import { Citation } from '@/lib/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  reviewId: string | null;
  reviewSections: Record<string, string>;
  sectionCitations?: Record<string, Citation[]>;
  sectionGuidance?: Record<string, string>;
  debounceMs?: number;
}

export function useAutoSave({
  reviewId,
  reviewSections,
  sectionCitations = {},
  sectionGuidance = {},
  debounceMs = 1500,
}: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const dirtySections = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSections = useRef<Record<string, string>>({});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Detect dirty sections by comparing with previous values
  useEffect(() => {
    if (!reviewId) return;

    for (const [sectionId, content] of Object.entries(reviewSections)) {
      if (prevSections.current[sectionId] !== undefined && prevSections.current[sectionId] !== content) {
        dirtySections.current.add(sectionId);
      }
    }
    prevSections.current = { ...reviewSections };

    if (dirtySections.current.size === 0) return;

    // Reset timer on every change
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      flushSave();
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewSections, reviewId, debounceMs]);

  const flushSave = useCallback(async () => {
    if (!reviewId || dirtySections.current.size === 0) return;

    const sectionsToSave = Array.from(dirtySections.current);
    dirtySections.current.clear();
    setSaveStatus('saving');

    try {
      await Promise.all(
        sectionsToSave.map((sectionId) =>
          fetch(`/api/reviews/${reviewId}/sections`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sectionId,
              content: reviewSections[sectionId] || '',
              citations: sectionCitations[sectionId] || null,
              guidance: sectionGuidance[sectionId] || null,
            }),
          })
        )
      );
      if (isMounted.current) {
        setSaveStatus('saved');
        setTimeout(() => {
          if (isMounted.current) setSaveStatus('idle');
        }, 2000);
      }
    } catch {
      if (isMounted.current) {
        setSaveStatus('error');
      }
    }
  }, [reviewId, reviewSections, sectionCitations, sectionGuidance]);

  // Mark all sections as initialized (not dirty) when loading saved data
  const markClean = useCallback((sections: Record<string, string>) => {
    prevSections.current = { ...sections };
    dirtySections.current.clear();
  }, []);

  return { saveStatus, flushSave, markClean };
}
