import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProgramReviewForm } from './components/ProgramReviewForm';
import { SummaryModal } from './components/SummaryModal';
import { DirectorySidebar } from './components/DirectorySidebar';
import { generateProgramData, getSectionAssistance, getChatResponse, getExecutiveSummary } from './services/geminiService';
import { ChatMessage, ProgramData, HistoricalData, HistoricalReview } from './types';
import { ANNUAL_PROGRAM_REVIEW_TEMPLATE, COMPREHENSIVE_PROGRAM_REVIEW_TEMPLATE, NON_INSTRUCTIONAL_COMPREHENSIVE_TEMPLATE, PROGRAM_LIST } from './constants';
import { MOCK_HISTORICAL_DATA } from './historicalData';

type ReviewType = 'annual' | 'comprehensive_instructional' | 'comprehensive_non_instructional';

const defaultProgram = PROGRAM_LIST.instructional[0] || 'Nursing';

function App() {
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
  const [historicalData, setHistoricalData] = useState<HistoricalData>(MOCK_HISTORICAL_DATA);
  const [knowledgeBaseData, setKnowledgeBaseData] = useState<Record<string, string>>({
    'Nursing': 'Fall 2023 Student Survey Results:\n- 85% of students reported satisfaction with clinical placements.\n- 60% requested more flexible scheduling options.\n\nBudget Allocation Note 2022:\n- Received one-time grant of $50,000 for simulation equipment upgrades.'
  });


  const currentTemplate =
    reviewType === 'annual'
      ? ANNUAL_PROGRAM_REVIEW_TEMPLATE
      : reviewType === 'comprehensive_instructional'
      ? COMPREHENSIVE_PROGRAM_REVIEW_TEMPLATE
      : NON_INSTRUCTIONAL_COMPREHENSIVE_TEMPLATE;

  const initializeData = useCallback(async () => {
    if (!programName) return;
    setIsLoadingData(true);
    setError(null);
    try {
      const data = await generateProgramData(programName);
      setProgramData(data);
      const initialSections = currentTemplate.reduce((acc, section) => {
        acc[section.id] = '';
        return acc;
      }, {} as Record<string, string>);
      setReviewSections(initialSections);
      setChatHistory([
        { role: 'model', content: `Hello! I'm here to help you with your program review for the ${programName} department. Ask me anything about the provided data.` }
      ]);
    } catch (e) {
      console.error("Failed to initialize program data:", e);
      setError("An error occurred while fetching program data. Please check your API key and try again.");
    } finally {
      setIsLoadingData(false);
    }
  }, [programName, currentTemplate]);
  
  useEffect(() => {
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewType, programName]);

  const handleSectionTextChange = (sectionId: string, text: string) => {
    setReviewSections(prev => ({ ...prev, [sectionId]: text }));
  };

  const handleAiAssist = async (sectionId: string) => {
    if (!programData) return;
    
    const userNotes = reviewSections[sectionId]?.trim() || '';
    if (!userNotes) {
      setError("Please provide some notes or bullet points in the text area before using AI Assist. The AI will use your input to expand and elaborate.");
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
      return;
    }

    setIsGeneratingSection(sectionId);
    setError(null);
    try {
      const section = currentTemplate.find(s => s.id === sectionId);
      if (section) {
        const generatedText = await getSectionAssistance(section.id, section.title, section.description, programData, userNotes, knowledgeBaseData[programName]);
        setReviewSections(prev => ({ ...prev, [sectionId]: generatedText }));
      }
    } catch (e) {
      console.error("Failed to get AI assistance:", e);
      setError("An error occurred while generating content. Please try again.");
    } finally {
      setIsGeneratingSection(null);
    }
  };

  const handleChatSubmit = async (prompt: string) => {
    if (!programData || isChatting) return;
    setIsChatting(true);
    setError(null);
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: prompt }];
    setChatHistory(updatedHistory);

    try {
      const response = await getChatResponse(prompt, programData, updatedHistory.slice(-6), knowledgeBaseData[programName]);
      setChatHistory(prev => [...prev, { role: 'model', content: response }]);
    } catch (e) {
      console.error("Failed to get chat response:", e);
      setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
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
      .map(section => `## ${section.title}\n\n${reviewSections[section.id] || 'No content provided.'}`)
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
            <pre>${fullText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryContent('');
    setIsSummaryModalOpen(true);
    setError(null);
    try {
      const fullText = getFullReviewText();
      const programHistory = historicalData[programName] || [];
      const summary = await getExecutiveSummary(fullText, programHistory, knowledgeBaseData[programName]);
      setSummaryContent(summary);
    } catch (e) {
      console.error("Failed to generate summary:", e);
      setSummaryContent("An error occurred while generating the summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAddHistoricalReview = (program: string, review: HistoricalReview) => {
    setHistoricalData(prevData => {
      const newProgramHistory = [...(prevData[program] || []), review];
      // Sort by year, descending
      newProgramHistory.sort((a, b) => b.year - a.year);
      return {
        ...prevData,
        [program]: newProgramHistory,
      };
    });
  };

  const handleKnowledgeBaseUpdate = (data: string) => {
    setKnowledgeBaseData(prev => ({
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
        />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <header className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-900">Program Review Assistant</h1>
                <p className="text-lg text-slate-600">College of the Siskiyous</p>
              </div>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
                 <div className="w-full sm:min-w-[250px]">
                  <label htmlFor="program-select" className="block text-sm font-medium text-slate-700 mb-1">Select Program/Department</label>
                  <select
                    id="program-select"
                    name="program"
                    className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                    value={programName}
                    onChange={handleProgramChange}
                  >
                    <optgroup label="Instructional">
                      {PROGRAM_LIST.instructional.map(p => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                    <optgroup label="Academic Affairs">
                      {PROGRAM_LIST.academicAffairs.map(p => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                     <optgroup label="President's Office">
                      {PROGRAM_LIST.presidentsOffice.map(p => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                     <optgroup label="Administrative Services">
                      {PROGRAM_LIST.administrativeServices.map(p => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                     <optgroup label="Student Services">
                      {PROGRAM_LIST.studentServices.map(p => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div className="w-full sm:min-w-[250px]">
                  <label htmlFor="review-type" className="block text-sm font-medium text-slate-700 mb-1">Review Type</label>
                  <select
                    id="review-type"
                    name="review-type"
                    className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                    value={reviewType}
                    onChange={handleReviewTypeChange}
                  >
                    <option value="annual">Annual Update</option>
                    <option value="comprehensive_instructional">Comprehensive Review (Instructional)</option>
                    <option value="comprehensive_non_instructional">Comprehensive Review (Non-Instructional)</option>
                  </select>
                </div>
              </div>
            </div>
          </header>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
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
            />
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

export default App;
