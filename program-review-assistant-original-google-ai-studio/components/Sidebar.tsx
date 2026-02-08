import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ProgramData } from '../types';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { UploadIcon } from './icons/UploadIcon';
import { extractTextFromImage } from '../services/geminiService';


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
  // It will split the string by the links, keeping the delimiters.
  const contentParts = content.split(/(\[.*?\]\(.*?\))/g).filter(Boolean);

  return (
    <p className="text-sm break-words">
      {contentParts.map((part, index) => {
        // Check if the part is a markdown link
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const [, text, href] = match;
          
          // Style the link differently based on the message role for better visibility
          const linkClassName = role === 'user'
            ? 'text-blue-200 underline hover:text-white' // For dark blue user bubble
            : 'text-blue-600 font-medium underline hover:text-blue-700'; // For light grey model bubble
            
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
        return part; // Return regular text part
      })}
    </p>
  );
};

const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const [meta, base64Data] = result.split(',');
        if (!meta || !base64Data) {
            return reject(new Error("Invalid file format for base64 conversion."));
        }
        const mimeType = meta.split(':')[1].split(';')[0];
        resolve({ mimeType, data: base64Data });
    };
    reader.onerror = error => reject(error);
  });

const parseCsvToMarkdown = (csvText: string, fileName: string): string => {
  const lines = csvText.trim().replace(/\r/g, '').split('\n');
  if (lines.length === 0) return '';
  
  // Basic CSV parsing, may not handle commas in quotes correctly
  const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
  if (rows.length === 0) return '';
  
  const header = rows[0];
  const separator = header.map(() => '---');
  const body = rows.slice(1);

  let markdown = `\n\n**Data from ${fileName}**\n`;
  markdown += `| ${header.join(' | ')} |\n`;
  markdown += `| ${separator.join(' | ')} |\n`;
  body.forEach(row => {
    if (row.length === header.length && row.some(cell => cell !== '')) {
       markdown += `| ${row.join(' | ')} |\n`;
    }
  });
  markdown += '\n';

  return markdown;
};

const KnowledgeBase: React.FC<{
    data: string;
    onUpdate: (data: string) => void;
}> = ({ data, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [kbInput, setKbInput] = useState(data);
    const [isSaved, setIsSaved] = useState(false);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [processingError, setProcessingError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        setKbInput(data);
    }, [data]);

    const handleSave = () => {
        onUpdate(kbInput);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

     const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessingFile(true);
        setProcessingError(null);

        try {
            if (file.type.startsWith('image/')) {
                const { mimeType, data: base64Data } = await fileToBase64(file);
                const extractedText = await extractTextFromImage(base64Data, mimeType);
                setKbInput(prev => `${prev}\n\n**Data from ${file.name}**\n${extractedText}`);
            } else if (file.name.endsWith('.csv')) {
                const text = await file.text();
                const markdownTable = parseCsvToMarkdown(text, file.name);
                setKbInput(prev => `${prev}${markdownTable}`);
            } else {
                throw new Error('Unsupported file. Please upload an image or CSV. Excel files must be saved as CSV first.');
            }
        } catch (error) {
            console.error('Error processing file:', error);
            setProcessingError(error instanceof Error ? error.message : 'An unknown error occurred during file processing.');
            setTimeout(() => setProcessingError(null), 6000);
        } finally {
            setIsProcessingFile(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
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
                <ChevronRightIcon className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 pt-0">
                    <p className="text-sm text-slate-500 mb-2">Add raw data, notes, or upload image/CSV files. This will be used by the AI for trend analysis.</p>
                    <textarea
                        value={kbInput}
                        onChange={(e) => setKbInput(e.target.value)}
                        placeholder="Paste any relevant data here, or upload a file below..."
                        className="w-full h-32 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 resize-y text-sm"
                    />
                     {processingError && <p className="text-xs text-red-600 mt-2">{processingError}</p>}
                    <div className="mt-2 flex justify-between items-center gap-2">
                        <div>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept="image/*,.csv"
                            />
                            <button
                                onClick={triggerFileUpload}
                                disabled={isProcessingFile}
                                className="flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 shadow-sm bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-wait"
                            >
                                <UploadIcon className="w-4 h-4" />
                                {isProcessingFile ? 'Processing...' : 'Upload Data'}
                            </button>
                        </div>
                        <button
                            onClick={handleSave}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed ${
                                isSaved 
                                ? 'bg-green-600 text-white' 
                                : 'bg-slate-600 text-white hover:bg-slate-700'
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
  onKnowledgeBaseUpdate
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
            <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-xl ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-800'
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

      <KnowledgeBase
        data={knowledgeBaseData}
        onUpdate={onKnowledgeBaseUpdate}
      />

      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={programData ? "Ask about your data..." : "Loading data..."}
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