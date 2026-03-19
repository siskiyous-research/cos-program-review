'use client';

import { useState, useRef, useCallback } from 'react';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { RichTextEditor } from './RichTextEditor';

export interface KBFile {
  id: string;
  name: string;
  type: string;
  size: number;
  textContent: string;
  processingTime?: number;
}

interface KnowledgeBaseProps {
  kbFiles: KBFile[];
  onUpload: (files: File[]) => void;
  onUrlFetch: (url: string) => void;
  onFileRemove: (fileId: string) => void;
  isUploading: boolean;
  uploadProgress?: string;
  knowledgeBaseNotes: string;
  onNotesUpdate: (notes: string) => void;
}

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.pptx,.xlsx,.xls,.csv';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({
  kbFiles,
  onUpload,
  onUrlFetch,
  onFileRemove,
  isUploading,
  uploadProgress,
  knowledgeBaseNotes,
  onNotesUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onUpload(files);
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onUpload(files);
    e.target.value = '';
  }, [onUpload]);

  const handleUrlFetch = () => {
    const url = urlInput.trim();
    if (!url) return;
    onUrlFetch(url);
    setUrlInput('');
  };

  const handleSaveNotes = () => {
    onNotesUpdate(knowledgeBaseNotes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <DatabaseIcon className="w-4 h-4 text-slate-500" />
          <span className="text-sm">Knowledge Base</span>
          {kbFiles.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
              {kbFiles.length}
            </span>
          )}
        </div>
        <ChevronRightIcon
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-3 space-y-2">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-slate-500">
              Drop files or <span className="text-blue-600 font-medium">browse</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              PDF, Word, PowerPoint, Excel, CSV
            </p>
          </div>

          {/* URL input */}
          <div className="flex gap-1">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste URL..."
              className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlFetch()}
            />
            <button
              onClick={handleUrlFetch}
              disabled={!urlInput.trim() || isUploading}
              className="px-2 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Fetch
            </button>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>{uploadProgress || 'Processing...'}</span>
            </div>
          )}

          {/* Uploaded file chips */}
          {kbFiles.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {kbFiles.map((file) => (
                <span
                  key={file.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full max-w-full"
                  title={`${file.name} (${formatSize(file.size)})`}
                >
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    onClick={() => onFileRemove(file.id)}
                    className="text-slate-400 hover:text-red-500 ml-0.5 flex-shrink-0"
                    aria-label={`Remove ${file.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Community Notes - Rich Text Editor */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">Community Notes</p>
            <RichTextEditor
              content={knowledgeBaseNotes}
              onChange={onNotesUpdate}
              placeholder="Add notes, links, or context for this program..."
            />
            <div className="text-right mt-1">
              <button
                onClick={handleSaveNotes}
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                  notesSaved
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-600 text-white hover:bg-slate-700'
                }`}
              >
                {notesSaved ? 'Saved ✓' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
