'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, ProgramData, Citation } from '@/lib/types';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';

interface SidebarProps {
  chatHistory: ChatMessage[];
  programData: ProgramData | null;
  isLoadingData: boolean;
  isChatting: boolean;
  onChatSubmit: (prompt: string) => void;
}

const QUICK_ACTIONS = [
  { label: 'Analyze enrollment trends', prompt: 'Analyze the enrollment trends for this program. What patterns do you see?' },
  { label: 'Summarize success rates', prompt: 'Summarize the course success and completion rates. Are there any equity gaps?' },
  { label: 'Review demographics', prompt: 'Review the student demographics for this program. How do they compare to the college overall?' },
  { label: 'Suggest improvements', prompt: 'Based on the available data, what are the top areas for improvement in this program?' },
  { label: 'Draft action plan', prompt: 'Help me draft a four-year action plan based on the program data and trends.' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  chatHistory,
  programData,
  isLoadingData,
  isChatting,
  onChatSubmit,
}) => {
  const [prompt, setPrompt] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onChatSubmit(prompt.trim());
      setPrompt('');
    }
  };

  const handleQuickAction = (actionPrompt: string) => {
    onChatSubmit(actionPrompt);
  };

  // Show quick actions when not currently chatting
  const showQuickActions = !isChatting;

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Data Chat Assistant</h3>
      </header>

      {/* Chat messages */}
      <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-xl ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              <div className={`text-sm break-words prose prose-sm max-w-none prose-p:mb-2 prose-p:mt-0 ${
                msg.role === 'user'
                  ? 'prose-invert prose-a:text-blue-200'
                  : 'prose-a:text-blue-600'
              }`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
              {/* Referenced documents */}
              {msg.role === 'model' && msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-300">
                  <p className="text-[10px] font-semibold text-slate-500 mb-1">Referenced Documents</p>
                  <div className="space-y-0.5">
                    {msg.citations.map((cite) => (
                      <div key={cite.id} className="text-[10px] text-slate-500">
                        <span className="font-mono text-blue-600 font-semibold">[{cite.id}]</span>{' '}
                        {cite.url ? (
                          <a
                            href={cite.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {cite.title}
                          </a>
                        ) : (
                          <span>{cite.title}</span>
                        )}
                        <span className="text-slate-400 ml-1">({cite.source})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Quick action buttons */}
        {showQuickActions && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={!programData || isChatting}
                  className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isChatting && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-sm px-4 py-2 rounded-xl bg-slate-200 text-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={programData ? 'Ask about your data...' : 'Loading data...'}
            className="flex-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
            disabled={!programData || isChatting}
          />
          <button
            type="submit"
            disabled={!programData || isChatting || !prompt.trim()}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
