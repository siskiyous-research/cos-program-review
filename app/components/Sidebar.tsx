'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, ProgramData } from '@/lib/types';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface SidebarProps {
  chatHistory: ChatMessage[];
  programData: ProgramData | null;
  isLoadingData: boolean;
  isChatting: boolean;
  onChatSubmit: (prompt: string) => void;
  knowledgeBaseData: string;
  onKnowledgeBaseUpdate: (data: string) => void;
}

const ChatMessageContent: React.FC<{ content: string; role: 'user' | 'model' }> = ({ content, role }) => {
  // This regex will find markdown links: [text](url)
  const contentParts = content.split(/(\[.*?\]\(.*?\))/g).filter(Boolean);

  return (
    <p className="text-sm break-words">
      {contentParts.map((part, index) => {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const [, text, href] = match;

          const linkClassName =
            role === 'user'
              ? 'text-blue-200 underline hover:text-white'
              : 'text-blue-600 font-medium underline hover:text-blue-700';

          return (
            <a
              key={index}
              href={href}
              className={linkClassName}
              target="_blank"
              rel="noopener noreferrer"
            >
              {text}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
};

const KnowledgeBase: React.FC<{
  data: string;
  onUpdate: (data: string) => void;
}> = ({ data, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [kbInput, setKbInput] = useState(data);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setKbInput(data);
  }, [data]);

  const handleSave = () => {
    onUpdate(kbInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="border-t border-slate-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left font-semibold text-slate-700 hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <DatabaseIcon className="w-5 h-5 text-slate-500" />
          <span>Data Knowledge Base</span>
        </div>
        <ChevronRightIcon
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="p-4 pt-0">
          <p className="text-sm text-slate-500 mb-2">
            Add raw data, notes, or contextual information. This will be used by the AI for better
            analysis.
          </p>
          <textarea
            value={kbInput}
            onChange={(e) => setKbInput(e.target.value)}
            placeholder="Paste any relevant data here..."
            className="w-full h-32 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 resize-y text-sm"
          />
          <div className="mt-2 text-right">
            <button
              onClick={handleSave}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed ${
                isSaved ? 'bg-green-600 text-white' : 'bg-slate-600 text-white hover:bg-slate-700'
              }`}
            >
              {isSaved ? 'Saved ✓' : 'Save Knowledge Base'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  chatHistory,
  programData,
  isLoadingData,
  isChatting,
  onChatSubmit,
  knowledgeBaseData,
  onKnowledgeBaseUpdate,
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

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Data Chat Assistant</h3>
      </header>

      <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-xl ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              <ChatMessageContent content={msg.content} role={msg.role} />
            </div>
          </div>
        ))}
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

      <KnowledgeBase data={knowledgeBaseData} onUpdate={onKnowledgeBaseUpdate} />

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
