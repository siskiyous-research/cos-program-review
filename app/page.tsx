'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProgramReviewForm } from './components/ProgramReviewForm';
import { SummaryModal } from './components/SummaryModal';
import { DirectorySidebar } from './components/DirectorySidebar';
import { ChatMessage, ProgramData, HistoricalData, HistoricalReview, Citation } from '@/lib/types';
import {
  ANNUAL_PROGRAM_REVIEW_TEMPLATE,
  COMPREHENSIVE_PROGRAM_REVIEW_TEMPLATE,
  NON_INSTRUCTIONAL_COMPREHENSIVE_TEMPLATE,
  PROGRAM_LIST,
} from '@/lib/constants';
import { AccjcFeedback } from './components/AccjcFeedback';

type ReviewType = 'annual' | 'comprehensive_instructional' | 'comprehensive_non_instructional';

const defaultProgram = PROGRAM_LIST.instructional[0] || 'Nursing';

// Historical data is loaded from the reviews manifest (public/reviews/manifest.json)
// via the DirectorySidebar component on mount.

export default function Home() {
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
  const [knowledgeBaseData, setKnowledgeBaseData] = useState<Record<string, string>>({});
  const [sectionCitations, setSectionCitations] = useState<Record<string, Citation[]>>({});
  const [sectionGuidance, setSectionGuidance] = useState<Record<string, string>>({});
  const [isGeneratingGuidance, setIsGeneratingGuidance] = useState<string | null>(null);

  const currentTemplate =
    reviewType === 'annual'
      ? ANNUAL_PROGRAM_REVIEW_TEMPLATE
      : reviewType === 'comprehensive_instructional'
        ? COMPREHENSIVE_PROGRAM_REVIEW_TEMPLATE
        : NON_INSTRUCTIONAL_COMPREHENSIVE_TEMPLATE;

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
      setChatHistory([
        {
          role: 'model',
          content: `Hello! I'm here to help you with your program review for the ${programName} department. Ask me anything about the provided data.`,
        },
      ]);
    } catch (e) {
      console.error('Failed to initialize program data:', e);
      setError('An error occurred while fetching program data. Please check your API key and try again.');
    } finally {
      setIsLoadingData(false);
    }
  }, [programName, currentTemplate]);

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
   * Supports empty notes (draft from scratch) and notes expansion
   * Returns citations from RAG data
   */
  const handleAiAssist = async (sectionId: string) => {
    if (!programData) return;

    const userNotes = reviewSections[sectionId]?.trim() || '';

    setIsGeneratingSection(sectionId);
    setError(null);
    try {
      const section = currentTemplate.find((s) => s.id === sectionId);
      if (section) {
        // Determine program category for RAG retrieval
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
            knowledgeBaseData: knowledgeBaseData[programName],
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
          knowledgeBaseData: knowledgeBaseData[programName],
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
          knowledgeBaseData: knowledgeBaseData[programName],
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

  const handleKnowledgeBaseUpdate = (data: string) => {
    setKnowledgeBaseData((prev) => ({
      ...prev,
      [programName]: data,
    }));
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
              // Preserve any manually-added reviews from drag & drop
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
                <h1 className="text-4xl font-bold text-slate-900">Program Review Assistant</h1>
                <p className="text-lg text-slate-600 flex items-center gap-2">
                  <span>College of the Siskiyous</span>
                  <span className="text-2xl">🎓</span>
                  <span>ACCJC Accreditation Ready</span>
                </p>
              </div>
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
            knowledgeBaseData={knowledgeBaseData[programName] || ''}
            onKnowledgeBaseUpdate={handleKnowledgeBaseUpdate}
          />
        </aside>
      </div>
    </>
  );
}
