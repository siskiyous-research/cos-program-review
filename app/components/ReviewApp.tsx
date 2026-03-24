'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { ProgramReviewForm } from './ProgramReviewForm';
import { SummaryModal } from './SummaryModal';
import { DirectorySidebar } from './DirectorySidebar';
import { AuthHeader } from './AuthHeader';
import { ChatMessage, ProgramData, HistoricalData, HistoricalReview, Citation, AggregatedProgramData } from '@/lib/types';
import {
  ANNUAL_PROGRAM_REVIEW_TEMPLATE,
  COMPREHENSIVE_PROGRAM_REVIEW_TEMPLATE,
  NON_INSTRUCTIONAL_COMPREHENSIVE_TEMPLATE,
  PROGRAM_LIST,
  SUBJECT_CODE_MAP,
} from '@/lib/constants';
import { AccjcFeedback } from './AccjcFeedback';
import { DataViewPanel } from './DataViewPanel';
import { InstitutionalDataModal } from './InstitutionalDataModal';
import { useAutoSave } from '@/app/hooks/useAutoSave';

type ReviewType = 'annual' | 'comprehensive_instructional' | 'comprehensive_non_instructional';

const defaultProgram = PROGRAM_LIST.instructional[0] || 'Nursing';

interface ReviewAppProps {
  user: {
    id: string;
    email?: string;
  };
}

export default function ReviewApp({ user }: ReviewAppProps) {
  const [reviewType, setReviewType] = useState<ReviewType>('annual');
  const [programName, setProgramName] = useState<string>(defaultProgram);
  const [programData, setProgramData] = useState<ProgramData | null>(null);
  const [reviewSections, setReviewSections] = useState<Record<string, string>>({});
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isGeneratingSection, setIsGeneratingSection] = useState<string | null>(null);
  const [isChatting, setIsChatting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(true);
  const [historicalData, setHistoricalData] = useState<HistoricalData>({});
  const [sectionCitations, setSectionCitations] = useState<Record<string, Citation[]>>({});
  const [sectionGuidance, setSectionGuidance] = useState<Record<string, string>>({});
  const [isGeneratingGuidance, setIsGeneratingGuidance] = useState<string | null>(null);

  // Institutional data dashboard state
  const [aggregatedData, setAggregatedData] = useState<AggregatedProgramData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dataViewSection, setDataViewSection] = useState<string | null>(null);
  const [isInstitutionalModalOpen, setIsInstitutionalModalOpen] = useState(false);

  // Review persistence state
  const [reviewId, setReviewId] = useState<string | null>(null);

  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setSidebarWidth(Math.max(280, Math.min(newWidth, 700)));
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const currentTemplate =
    reviewType === 'annual'
      ? ANNUAL_PROGRAM_REVIEW_TEMPLATE
      : reviewType === 'comprehensive_instructional'
        ? COMPREHENSIVE_PROGRAM_REVIEW_TEMPLATE
        : NON_INSTRUCTIONAL_COMPREHENSIVE_TEMPLATE;

  // Auto-save hook
  const { saveStatus, flushSave, markClean } = useAutoSave({
    reviewId,
    reviewSections,
    sectionCitations,
    sectionGuidance,
  });

  /**
   * Load or create a review for the current program+type
   */
  const loadReview = useCallback(async (program: string, type: ReviewType) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programName: program, reviewType: type }),
      });
      const result = await res.json();
      if (!result.ok) {
        console.error('Failed to load/create review:', result.error);
        return;
      }

      setReviewId(result.review.id);

      // Load existing sections if this is an existing review
      if (result.isExisting) {
        const sectionsRes = await fetch(`/api/reviews/${result.review.id}/sections`);
        const sectionsResult = await sectionsRes.json();
        if (sectionsResult.ok && sectionsResult.sections) {
          const loadedSections: Record<string, string> = {};
          const loadedCitations: Record<string, Citation[]> = {};
          const loadedGuidance: Record<string, string> = {};

          for (const s of sectionsResult.sections) {
            loadedSections[s.section_id] = s.content || '';
            if (s.citations) loadedCitations[s.section_id] = s.citations;
            if (s.guidance) loadedGuidance[s.section_id] = s.guidance;
          }

          setReviewSections((prev) => ({ ...prev, ...loadedSections }));
          setSectionCitations((prev) => ({ ...prev, ...loadedCitations }));
          setSectionGuidance((prev) => ({ ...prev, ...loadedGuidance }));
          markClean({ ...loadedSections });
        }
      }
    } catch (e) {
      console.error('Failed to load review:', e);
    }
  }, [markClean]);

  /**
   * Initialize review for selected program
   */
  const initializeData = useCallback(async () => {
    if (!programName) return;
    setIsLoadingData(true);
    setError(null);
    try {
      // Set minimal program data (real data will come from ZogoTech later)
      setProgramData({
        programName,
        summary: { strengths: [], weaknesses: [] },
        enrollment: [],
        completionRate: 0,
        jobPlacementRate: 0,
        demographics: {},
      });

      const initialSections = currentTemplate.reduce(
        (acc, section) => {
          acc[section.id] = '';
          return acc;
        },
        {} as Record<string, string>
      );
      setReviewSections(initialSections);
      markClean(initialSections);
      setChatHistory([
        {
          role: 'model',
          content: `Hello! I'm here to help you with your program review for the ${programName} department. Ask me anything about institutional data, policies, or accreditation standards.`,
        },
      ]);

      // Load/create review
      await loadReview(programName, reviewType);

      // Fetch aggregated institutional data (non-blocking)
      const subjectCodes = SUBJECT_CODE_MAP[programName];
      const subjectCode = subjectCodes?.[0];
      if (subjectCode) {
        setIsDashboardLoading(true);
        fetch(`/api/program-data?subject=${subjectCode}`)
          .then(res => res.json())
          .then(result => {
            if (result.ok) setAggregatedData(result.data);
            else setAggregatedData(null);
          })
          .catch(() => setAggregatedData(null))
          .finally(() => setIsDashboardLoading(false));
      } else {
        setAggregatedData(null);
      }
    } catch (e) {
      console.error('Failed to initialize:', e);
      setError('An error occurred while loading. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  }, [programName, currentTemplate, reviewType, loadReview, markClean]);

  useEffect(() => {
    initializeData();
  }, [reviewType, programName, initializeData]);

  const handleOpenInstitutionalModal = useCallback(() => {
    setIsInstitutionalModalOpen(true);
  }, []);

  const handleSectionTextChange = (sectionId: string, text: string) => {
    setReviewSections((prev) => ({ ...prev, [sectionId]: text }));
  };

  /**
   * Determine the program category based on program list membership
   */
  const getProgramCategory = (name: string): string => {
    if (PROGRAM_LIST.instructional.includes(name)) return 'instructional';
    if (PROGRAM_LIST.academicAffairs.includes(name)) return 'academicAffairs';
    if (PROGRAM_LIST.presidentsOffice.includes(name)) return 'presidentsOffice';
    if (PROGRAM_LIST.administrativeServices.includes(name)) return 'administrativeServices';
    if (PROGRAM_LIST.studentServices.includes(name)) return 'studentServices';
    return 'instructional';
  };

  /**
   * Call AI Assist API for section assistance
   */
  const handleAiAssist = async (sectionId: string) => {
    if (!programData) return;

    const userNotes = reviewSections[sectionId]?.trim() || '';

    setIsGeneratingSection(sectionId);
    setError(null);
    try {
      const section = currentTemplate.find((s) => s.id === sectionId);
      if (section) {
        const programCategory = getProgramCategory(programName);
        const response = await fetch('/api/section-assistance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: section.id,
            sectionTitle: section.title,
            sectionDescription: section.description,
            programData,
            userNotes,
            programCategory,
          }),
        });

        const result = await response.json();
        if (!result.ok) {
          throw new Error(result.error || 'Failed to generate assistance');
        }

        setReviewSections((prev) => ({ ...prev, [sectionId]: result.assistance }));
        if (result.citations) {
          setSectionCitations((prev) => ({ ...prev, [sectionId]: result.citations }));
        }
      }
    } catch (e) {
      console.error('Failed to get AI assistance:', e);
      setError('An error occurred while generating content. Please try again.');
    } finally {
      setIsGeneratingSection(null);
    }
  };

  /**
   * Get ACCJC guidance for a section's current content
   */
  const handleGetGuidance = async (sectionId: string) => {
    if (!programData) return;
    const sectionContent = reviewSections[sectionId]?.trim() || '';
    if (!sectionContent) return;

    setIsGeneratingGuidance(sectionId);
    setError(null);
    try {
      const section = currentTemplate.find((s) => s.id === sectionId);
      if (section) {
        const programCategory = getProgramCategory(programName);
        const response = await fetch('/api/section-guidance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: section.id,
            sectionTitle: section.title,
            sectionContent,
            programData,
            programCategory,
          }),
        });

        const result = await response.json();
        if (!result.ok) {
          throw new Error(result.error || 'Failed to generate guidance');
        }

        setSectionGuidance((prev) => ({ ...prev, [sectionId]: result.guidance }));
      }
    } catch (e) {
      console.error('Failed to get ACCJC guidance:', e);
      setError('An error occurred while generating guidance. Please try again.');
    } finally {
      setIsGeneratingGuidance(null);
    }
  };

  /**
   * Submit chat message to API
   */
  const handleChatSubmit = async (prompt: string) => {
    if (!programData || isChatting) return;
    setIsChatting(true);
    setError(null);
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: prompt }];
    setChatHistory(updatedHistory);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          chatHistory: updatedHistory.slice(-6),
          programData,
          programCategory: getProgramCategory(programName),
          aggregatedData,
        }),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to get chat response');
      }

      setChatHistory((prev) => [...prev, { role: 'model', content: result.response, citations: result.citations }]);
    } catch (e) {
      console.error('Failed to get chat response:', e);
      setChatHistory((prev) => [
        ...prev,
        { role: 'model', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleReviewTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReviewType(e.target.value as ReviewType);
  };

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProgramName(e.target.value);
  };

  const getFullReviewText = () => {
    return currentTemplate
      .map((section) => `## ${section.title}\n\n${reviewSections[section.id] || 'No content provided.'}`)
      .join('\n\n---\n\n');
  };

  const reviewTypeLabel =
    reviewType === 'annual'
      ? 'Annual Program Review'
      : reviewType === 'comprehensive_instructional'
        ? 'Comprehensive Program Review (Instructional)'
        : 'Comprehensive Program Review (Non-Instructional)';

  const buildReviewHTML = () => {
    const sections = currentTemplate
      .map(
        (section) =>
          `<div class="section">
            <h2>${section.title}</h2>
            <div class="content">${reviewSections[section.id] || '<p><em>No content provided.</em></p>'}</div>
          </div>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${programName} - ${reviewTypeLabel}</title>
  <style>
    @media print { .no-print { display: none; } .section { page-break-inside: avoid; } }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.7; padding: 2rem 3rem; max-width: 900px; margin: 0 auto; color: #1e293b; }
    .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 1.5rem; margin-bottom: 2rem; }
    .header h1 { color: #1e3a8a; font-size: 1.75rem; margin: 0; }
    .header p { color: #64748b; margin: 0.25rem 0 0; }
    .meta { display: flex; justify-content: space-between; font-size: 0.875rem; color: #64748b; margin-bottom: 2rem; }
    h2 { color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-top: 2.5rem; font-size: 1.25rem; }
    .content { margin-top: 0.75rem; }
    .content p { margin: 0.5rem 0; }
    .content ul, .content ol { margin: 0.5rem 0; padding-left: 1.5rem; }
    .content li { margin: 0.25rem 0; }
    .content img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }
    .content blockquote { border-left: 4px solid #cbd5e1; padding-left: 1rem; margin: 1rem 0; color: #475569; }
    a { color: #2563eb; }
    .print-btn { position: fixed; top: 1rem; right: 1rem; padding: 0.5rem 1.5rem; background: #1e40af; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem; }
    .print-btn:hover { background: #1e3a8a; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
  <div class="header">
    <img src="${window.location.origin}/cos-logo.png" alt="College of the Siskiyous" style="height: 80px; margin: 0 auto 0.75rem;" />
    <h1>College of the Siskiyous</h1>
    <p>${reviewTypeLabel}</p>
  </div>
  <div class="meta">
    <span><strong>Program:</strong> ${programName}</span>
    <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
  </div>
  ${sections}
</body>
</html>`;
  };

  const handlePreviewReview = () => {
    const html = buildReviewHTML();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  const handleExportReview = () => {
    const html = buildReviewHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${programName} - ${reviewTypeLabel}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitReview = () => {
    const subject = encodeURIComponent(`[Program Review] ${programName} - ${reviewTypeLabel} - ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(
      `Hello,\n\nPlease find the program review for ${programName} (${reviewTypeLabel}).\n\nReview Link: ${window.location.href}\n\nThank you,\n${user.email || ''}`
    );
    window.location.href = `mailto:JT@siskiyous.edu?subject=${subject}&body=${body}`;
  };

  const handleSaveAll = () => {
    flushSave();
  };

  const [sharePointStatus, setSharePointStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Map app program names to exact SharePoint folder names
  const sharePointFolderMap: Record<string, { parent: string; folder: string }> = {
    // Instructional
    'Administration of Justice': { parent: 'Instructional Program Reviews', folder: 'Administration of Justice (CTE)' },
    'Alcohol & Drug Studies (ADHS)': { parent: 'Instructional Program Reviews', folder: 'Alcohol & Drug Studies (CTE)' },
    'Business and Computer Sciences': { parent: 'Instructional Program Reviews', folder: 'Business and Computer Sciences (CTE)' },
    'Early Childhood Education': { parent: 'Instructional Program Reviews', folder: 'Early Childhood Education (CTE)' },
    'Emergency Medical Services (EMS)': { parent: 'Instructional Program Reviews', folder: 'EMS (CTE)' },
    'Fine and Performing Arts': { parent: 'Instructional Program Reviews', folder: 'Fine and Performing Arts' },
    'Fire': { parent: 'Instructional Program Reviews', folder: 'Fire (CTE)' },
    'Health, Physical Education and Recreation': { parent: 'Instructional Program Reviews', folder: 'Health, Physical Education and Recreation' },
    'Humanities and Social Sciences': { parent: 'Instructional Program Reviews', folder: 'Humanities and Social Sciences' },
    'Math': { parent: 'Instructional Program Reviews', folder: 'Math' },
    'Modern Languages': { parent: 'Instructional Program Reviews', folder: 'Modern Languages (MLAN)' },
    'Nursing': { parent: 'Instructional Program Reviews', folder: 'Nursing (CTE)' },
    'Sciences': { parent: 'Instructional Program Reviews', folder: 'Sciences' },
    'Welding': { parent: 'Instructional Program Reviews', folder: 'Welding (CTE)' },
    // Non-Instructional
    'Academic Affairs Division': { parent: 'Non Instructional Program Reviews', folder: 'Academic Affairs' },
    'Academic Success Center (ASC)': { parent: 'Non Instructional Program Reviews', folder: 'Academic Success Center' },
    'Admissions and Records': { parent: 'Non Instructional Program Reviews', folder: 'Admissions and Records' },
    'Basecamp': { parent: 'Non Instructional Program Reviews', folder: 'Basecamp' },
    'Bookstore': { parent: 'Non Instructional Program Reviews', folder: 'Bookstore' },
    'Counseling & Advising - Transfer & Orientation': { parent: 'Non Instructional Program Reviews', folder: 'Counseling' },
    'Distance Learning': { parent: 'Non Instructional Program Reviews', folder: 'Distance Learning' },
    'FIELD Program (ISA)': { parent: 'Non Instructional Program Reviews', folder: 'FIELD' },
    'Financial Aid, Veterans and AB540': { parent: 'Non Instructional Program Reviews', folder: 'Financial Aid' },
    'Food Services': { parent: 'Non Instructional Program Reviews', folder: 'Food Services' },
    'Human Resources': { parent: 'Non Instructional Program Reviews', folder: 'Human Resources' },
    'Library': { parent: 'Non Instructional Program Reviews', folder: 'Library' },
    'Maintenance, Operations & Transportation': { parent: 'Non Instructional Program Reviews', folder: 'Maintenance, Operations & Transportation' },
    'Institutional Research': { parent: 'Non Instructional Program Reviews', folder: 'Planning Assessment & Research' },
    "President's Office": { parent: 'Non Instructional Program Reviews', folder: "President's Office" },
    'Public Information Office': { parent: 'Non Instructional Program Reviews', folder: 'Public Information Office' },
    'Student Access Services': { parent: 'Non Instructional Program Reviews', folder: 'Student Access Services (SAS)' },
    'Student Housing': { parent: 'Non Instructional Program Reviews', folder: 'Student Lodges' },
    'Student Services Division': { parent: 'Non Instructional Program Reviews', folder: 'Student Services' },
    'Technology Services': { parent: 'Non Instructional Program Reviews', folder: 'Technology Services' },
    'Dual Enrollment': { parent: 'Non Instructional Program Reviews', folder: 'Dual Enrollment' },
    'Student Equity & Achievement': { parent: 'Non Instructional Program Reviews', folder: 'Student Equity & Achievement' },
    'Outreach & Retention': { parent: 'Non Instructional Program Reviews', folder: 'Outreach & Retention' },
    'Special Populations – EOPS, CARE CalWORKs, NextUP, TRIO': { parent: 'Non Instructional Program Reviews', folder: 'Special Populations' },
    'Student Services – AB 19, Health Clinic, International Students, Mental Health': { parent: 'Non Instructional Program Reviews', folder: 'Student Services - AB19 Health Mental Health' },
    'Student Life': { parent: 'Non Instructional Program Reviews', folder: 'Student Life' },
    'Fiscal Services': { parent: 'Non Instructional Program Reviews', folder: 'Fiscal Services' },
    'Administrative Services Division': { parent: 'Non Instructional Program Reviews', folder: 'Administrative Services' },
  };

  const handleSaveToSharePoint = async () => {
    setSharePointStatus('saving');
    try {
      const html = buildReviewHTML();
      const mapping = sharePointFolderMap[programName];
      const category = getProgramCategory(programName);
      const isInstructional = category === 'instructional';
      const parentFolder = mapping?.parent || (isInstructional ? 'Instructional Program Reviews' : 'Non Instructional Program Reviews');
      const programFolder = mapping?.folder || programName;
      const folderPath = `/Shared Documents/General/${parentFolder}/${programFolder}`;
      const now = new Date();
      const date = now.toLocaleDateString().replace(/\//g, '-');
      const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/[: ]/g, '');
      const fileName = `${programName} - ${reviewTypeLabel} - ${date}_${time}.html`;
      const res = await fetch('/api/sharepoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          content: html,
          programName,
          reviewType,
          folderPath,
        }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error);
      setSharePointStatus('saved');
      setTimeout(() => setSharePointStatus('idle'), 3000);
    } catch (e) {
      console.error('SharePoint save failed:', e);
      setSharePointStatus('error');
      setTimeout(() => setSharePointStatus('idle'), 3000);
    }
  };

  const handleSaveSection = async (sectionId: string) => {
    if (!reviewId) return;
    try {
      await fetch(`/api/reviews/${reviewId}/sections`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          content: reviewSections[sectionId] || '',
          citations: sectionCitations[sectionId] || null,
          guidance: sectionGuidance[sectionId] || null,
        }),
      });
    } catch (e) {
      console.error('Failed to save section:', e);
    }
  };

  /**
   * Generate executive summary
   */
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryContent('');
    setIsSummaryModalOpen(true);
    setError(null);
    try {
      const fullText = getFullReviewText();
      const programHistory = historicalData[programName] || [];
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullReviewText: fullText,
          historicalData: programHistory,
          programName,
          programCategory: getProgramCategory(programName),
        }),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to generate summary');
      }

      setSummaryContent(result.summary);
    } catch (e) {
      console.error('Failed to generate summary:', e);
      setSummaryContent('An error occurred while generating the summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAddHistoricalReview = (program: string, review: HistoricalReview) => {
    setHistoricalData((prevData) => {
      const newProgramHistory = [...(prevData[program] || []), review];
      newProgramHistory.sort((a, b) => b.year - a.year);
      return {
        ...prevData,
        [program]: newProgramHistory,
      };
    });
  };

  return (
    <>
      <DataViewPanel
        isOpen={dataViewSection !== null}
        onClose={() => setDataViewSection(null)}
        sectionId={dataViewSection || ''}
        sectionTitle={currentTemplate.find(s => s.id === dataViewSection)?.title || ''}
        data={aggregatedData}
      />
      <InstitutionalDataModal
        isOpen={isInstitutionalModalOpen}
        onClose={() => setIsInstitutionalModalOpen(false)}
        data={aggregatedData}
        isLoading={isDashboardLoading}
      />
      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summaryContent={summaryContent}
        isLoading={isGeneratingSummary}
        programName={programName}
      />
      <div className="flex h-screen font-sans bg-slate-100 text-slate-800">
        <DirectorySidebar
          isOpen={isArchiveOpen}
          onToggle={() => setIsArchiveOpen(!isArchiveOpen)}
          historicalData={historicalData}
          currentProgram={programName}
          onAddReview={handleAddHistoricalReview}
          onHistoricalDataLoaded={useCallback((data: HistoricalData) => {
            setHistoricalData((prev) => {
              const merged = { ...data };
              for (const [prog, reviews] of Object.entries(prev)) {
                if (!merged[prog]) merged[prog] = reviews;
                else {
                  const existingTitles = new Set(merged[prog].map((r) => r.title));
                  for (const r of reviews) {
                    if (!existingTitles.has(r.title)) merged[prog].push(r);
                  }
                }
              }
              return merged;
            });
          }, [])}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <header className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <a href="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-4xl font-bold text-slate-900">Program Review Assistant</h1>
                </a>
                <p className="text-lg text-slate-600 flex items-center gap-2">
                  <span>College of the Siskiyous</span>
                  <span className="text-2xl">🎓</span>
                  <span>ACCJC Accreditation Ready</span>
                </p>
                <button
                  onClick={handleOpenInstitutionalModal}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Institutional Data
                </button>
              </div>
              <div className="flex flex-col items-end gap-3">
                <AuthHeader userEmail={user.email || ''} />
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:min-w-[250px]">
                    <label htmlFor="program-select" className="block text-sm font-medium text-slate-700 mb-1">
                      Select Program/Department
                    </label>
                    <select
                      id="program-select"
                      name="program"
                      className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                      value={programName}
                      onChange={handleProgramChange}
                    >
                      <optgroup label="Instructional">
                        {PROGRAM_LIST.instructional.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Academic Affairs">
                        {PROGRAM_LIST.academicAffairs.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="President's Office">
                        {PROGRAM_LIST.presidentsOffice.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Administrative Services">
                        {PROGRAM_LIST.administrativeServices.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Student Services">
                        {PROGRAM_LIST.studentServices.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div className="w-full sm:min-w-[250px]">
                    <label htmlFor="review-type" className="block text-sm font-medium text-slate-700 mb-1">
                      Review Type
                    </label>
                    <select
                      id="review-type"
                      name="review-type"
                      className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                      value={reviewType}
                      onChange={handleReviewTypeChange}
                    >
                      <option value="annual">Annual Update</option>
                      <option value="comprehensive_instructional">
                        Comprehensive Review (Instructional)
                      </option>
                      <option value="comprehensive_non_instructional">
                        Comprehensive Review (Non-Instructional)
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-save status indicator */}
            {saveStatus !== 'idle' && (
              <div className="mt-2 text-sm text-right">
                {saveStatus === 'saving' && (
                  <span className="text-blue-600 flex items-center justify-end gap-1">
                    <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                    Saving...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-green-600">All changes saved</span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-600">Save failed — will retry</span>
                )}
              </div>
            )}
          </header>

          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6"
              role="alert"
            >
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {isLoadingData ? (
            <div className="space-y-6">
              <div className="h-16 bg-slate-200 rounded-md animate-pulse"></div>
              <div className="h-48 bg-slate-200 rounded-md animate-pulse"></div>
              <div className="h-48 bg-slate-200 rounded-md animate-pulse"></div>
            </div>
          ) : (
            <>
              {/* ACCJC Integration: Show feedback on page load */}
              <AccjcFeedback sectionId="program_info" showCommonIssues={true} />


              <ProgramReviewForm
                programName={programName}
                reviewSections={reviewSections}
                template={currentTemplate}
                onSectionTextChange={handleSectionTextChange}
                onAiAssist={handleAiAssist}
                isGeneratingSection={isGeneratingSection}
                onExport={handleExportReview}
                onPreview={handlePreviewReview}
                onSubmit={handleSubmitReview}
                onSaveAll={handleSaveAll}
                onSaveToSharePoint={handleSaveToSharePoint}
                sharePointStatus={sharePointStatus}
                onSaveSection={handleSaveSection}
                sectionCitations={sectionCitations}
                sectionGuidance={sectionGuidance}
                onGetGuidance={handleGetGuidance}
                isGeneratingGuidance={isGeneratingGuidance}
                saveStatus={saveStatus}
                onViewData={(sectionId) => setDataViewSection(sectionId)}
                hasData={!!aggregatedData}
              />
            </>
          )}
        </main>

        <aside className="relative bg-white border-l border-slate-200 flex flex-col h-full max-h-screen" style={{ width: sidebarWidth }}>
          {/* Resize handle */}
          <div
            onMouseDown={startResizing}
            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors z-10"
          />
          <Sidebar
            chatHistory={chatHistory}
            programData={programData}
            isLoadingData={isLoadingData}
            isChatting={isChatting}
            onChatSubmit={handleChatSubmit}
          />
        </aside>
      </div>
    </>
  );
}
