'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { ProgramReviewForm } from './ProgramReviewForm';
import { SummaryModal } from './SummaryModal';
import { DirectorySidebar } from './DirectorySidebar';
import { AuthHeader } from './AuthHeader';
import { ChatMessage, ProgramData, HistoricalData, HistoricalReview, Citation, KBFile } from '@/lib/types';
import {
  ANNUAL_PROGRAM_REVIEW_TEMPLATE,
  COMPREHENSIVE_PROGRAM_REVIEW_TEMPLATE,
  NON_INSTRUCTIONAL_COMPREHENSIVE_TEMPLATE,
  PROGRAM_LIST,
} from '@/lib/constants';
import { AccjcFeedback } from './AccjcFeedback';
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
  const [knowledgeBaseNotes, setKnowledgeBaseNotes] = useState<Record<string, string>>({});
  const [sectionCitations, setSectionCitations] = useState<Record<string, Citation[]>>({});
  const [sectionGuidance, setSectionGuidance] = useState<Record<string, string>>({});
  const [isGeneratingGuidance, setIsGeneratingGuidance] = useState<string | null>(null);

  // KB file upload state
  const [kbFiles, setKbFiles] = useState<Record<string, KBFile[]>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Review persistence state
  const [reviewId, setReviewId] = useState<string | null>(null);

  const currentTemplate =
    reviewType === 'annual'
      ? ANNUAL_PROGRAM_REVIEW_TEMPLATE
      : reviewType === 'comprehensive_instructional'
        ? COMPREHENSIVE_PROGRAM_REVIEW_TEMPLATE
        : NON_INSTRUCTIONAL_COMPREHENSIVE_TEMPLATE;

  // Auto-save hook
  const { saveStatus, markClean } = useAutoSave({
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
   * Build combined KB data (uploaded file texts + manual notes) for AI prompts
   */
  const getKnowledgeBaseData = useCallback((program: string): string => {
    const files = kbFiles[program] || [];
    const notes = knowledgeBaseNotes[program] || '';
    const parts: string[] = [];
    for (const file of files) {
      parts.push(`--- ${file.name} ---\n${file.textContent}`);
    }
    if (notes.trim()) parts.push(`--- Notes ---\n${notes}`);
    return parts.join('\n\n');
  }, [kbFiles, knowledgeBaseNotes]);

  /**
   * Initialize program data by calling the API
   */
  const initializeData = useCallback(async () => {
    if (!programName) return;
    setIsLoadingData(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-program-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programName }),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to generate program data');
      }

      setProgramData(result.data);
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
          content: `Hello! I'm here to help you with your program review for the ${programName} department. Ask me anything about the provided data.`,
        },
      ]);

      // Load/create review after program data is ready
      await loadReview(programName, reviewType);
    } catch (e) {
      console.error('Failed to initialize program data:', e);
      setError('An error occurred while fetching program data. Please check your API key and try again.');
    } finally {
      setIsLoadingData(false);
    }
  }, [programName, currentTemplate, reviewType, loadReview, markClean]);

  useEffect(() => {
    initializeData();
  }, [reviewType, programName, initializeData]);

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
            knowledgeBaseData: getKnowledgeBaseData(programName),
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
          knowledgeBaseData: getKnowledgeBaseData(programName),
          programCategory: getProgramCategory(programName),
        }),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to get chat response');
      }

      setChatHistory((prev) => [...prev, { role: 'model', content: result.response }]);
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

  // KB Upload handlers
  const handleKBUpload = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(`Processing ${files.length} file(s)...`);
    try {
      const formData = new FormData();
      formData.append('program', programName);
      for (const file of files) {
        formData.append('files', file);
      }

      const response = await fetch('/api/kb-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error);

      const newFiles: KBFile[] = result.files.map((f: KBFile) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        textContent: f.textContent,
        processingTime: f.processingTime,
      }));

      setKbFiles((prev) => ({
        ...prev,
        [programName]: [...(prev[programName] || []), ...newFiles],
      }));
    } catch (e) {
      console.error('KB upload failed:', e);
      setError('Failed to upload file(s). Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleKBUrlFetch = async (url: string) => {
    setIsUploading(true);
    setUploadProgress('Fetching URL...');
    try {
      const response = await fetch('/api/kb-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, program: programName }),
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error);

      const newFiles: KBFile[] = result.files.map((f: KBFile) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        textContent: f.textContent,
        processingTime: f.processingTime,
      }));

      setKbFiles((prev) => ({
        ...prev,
        [programName]: [...(prev[programName] || []), ...newFiles],
      }));
    } catch (e) {
      console.error('KB URL fetch failed:', e);
      setError('Failed to fetch URL. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleKBFileRemove = async (fileId: string) => {
    setKbFiles((prev) => ({
      ...prev,
      [programName]: (prev[programName] || []).filter((f) => f.id !== fileId),
    }));
    try {
      await fetch(`/api/admin/uploads/${fileId}`, { method: 'DELETE' });
    } catch {
      // Silent fail — file is already removed from client state
    }
  };

  const handleKnowledgeBaseNotesUpdate = (data: string) => {
    setKnowledgeBaseNotes((prev) => ({
      ...prev,
      [programName]: data,
    }));
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

  const handleExportReview = () => {
    const fullText = getFullReviewText();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${programName} Program Review</title>
            <style>
              body { font-family: sans-serif; line-height: 1.6; padding: 2rem; }
              h1 { color: #1e3a8a; }
              h2 { color: #1e40af; border-bottom: 2px solid #ddd; padding-bottom: 0.5rem; margin-top: 2rem;}
              pre { background-color: #f4f4f5; padding: 1rem; border-radius: 0.5rem; white-space: pre-wrap; word-wrap: break-word; }
            </style>
          </head>
          <body>
            <h1>${programName} Program Review</h1>
            <pre>${fullText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </body>
        </html>
      `);
      newWindow.document.close();
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
          knowledgeBaseData: getKnowledgeBaseData(programName),
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
                onGenerateSummary={handleGenerateSummary}
                isGeneratingSummary={isGeneratingSummary}
                sectionCitations={sectionCitations}
                sectionGuidance={sectionGuidance}
                onGetGuidance={handleGetGuidance}
                isGeneratingGuidance={isGeneratingGuidance}
                saveStatus={saveStatus}
              />
            </>
          )}
        </main>

        <aside className="w-full md:w-1/3 xl:w-1/4 bg-white border-l border-slate-200 flex flex-col h-full max-h-screen">
          <Sidebar
            chatHistory={chatHistory}
            programData={programData}
            isLoadingData={isLoadingData}
            isChatting={isChatting}
            onChatSubmit={handleChatSubmit}
            knowledgeBaseNotes={knowledgeBaseNotes[programName] || ''}
            onKnowledgeBaseUpdate={handleKnowledgeBaseNotesUpdate}
            kbFiles={kbFiles[programName] || []}
            onKBUpload={handleKBUpload}
            onKBUrlFetch={handleKBUrlFetch}
            onKBFileRemove={handleKBFileRemove}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        </aside>
      </div>
    </>
  );
}
