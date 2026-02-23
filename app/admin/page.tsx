'use client';

import { useState, useEffect, useCallback } from 'react';

interface KBUpload {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  program: string;
  uploadedAt: string;
  textPreview: string;
  textLength: number;
}

interface ReviewFile {
  title: string;
  year: number;
  type: string;
  filename: string;
}

interface ReviewProgram {
  program: string;
  category: string;
  files: ReviewFile[];
}

interface RAGStats {
  totalChunks: number;
  bySource: Record<string, number>;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminPage() {
  const [uploads, setUploads] = useState<KBUpload[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewProgram>>({});
  const [ragStats, setRagStats] = useState<RAGStats | null>(null);
  const [expandedUpload, setExpandedUpload] = useState<string | null>(null);
  const [expandedText, setExpandedText] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uploadsRes, reviewsRes, ragRes] = await Promise.all([
        fetch('/api/admin/uploads'),
        fetch('/api/admin/reviews'),
        fetch('/api/rag-stats'),
      ]);
      const uploadsData = await uploadsRes.json();
      const reviewsData = await reviewsRes.json();
      const ragData = await ragRes.json();

      if (uploadsData.ok) setUploads(uploadsData.uploads);
      if (reviewsData.ok) setReviews(reviewsData.reviews);
      if (ragData.ok) setRagStats(ragData.stats);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteUpload = async (id: string) => {
    if (!confirm('Delete this upload?')) return;
    const res = await fetch(`/api/admin/uploads/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) setUploads(prev => prev.filter(u => u.id !== id));
  };

  const handleViewText = async (id: string) => {
    if (expandedUpload === id) {
      setExpandedUpload(null);
      return;
    }
    const res = await fetch(`/api/admin/uploads/${id}`);
    const data = await res.json();
    if (data.ok) {
      setExpandedText(data.text);
      setExpandedUpload(id);
    }
  };

  const handleReassign = async (id: string, newProgram: string) => {
    const res = await fetch(`/api/admin/uploads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program: newProgram }),
    });
    const data = await res.json();
    if (data.ok) {
      setUploads(prev => prev.map(u => u.id === id ? { ...u, program: newProgram } : u));
    }
  };

  const totalReviewFiles = Object.values(reviews).reduce((sum, p) => sum + p.files.length, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Loading admin data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-500">Manage knowledge base uploads and review archives</p>
          </div>
          <a href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            ← Back to App
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* RAG Stats */}
        {ragStats && (
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">RAG Index Stats</h2>
            <div className="flex flex-wrap gap-4">
              <div className="bg-blue-50 rounded-lg px-4 py-3">
                <div className="text-2xl font-bold text-blue-700">{ragStats.totalChunks}</div>
                <div className="text-xs text-blue-600">Total Chunks</div>
              </div>
              {Object.entries(ragStats.bySource).map(([source, count]) => (
                <div key={source} className="bg-slate-50 rounded-lg px-4 py-3">
                  <div className="text-2xl font-bold text-slate-700">{count}</div>
                  <div className="text-xs text-slate-500 capitalize">{source}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* KB Uploads */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Knowledge Base Uploads
            <span className="ml-2 text-sm font-normal text-slate-500">({uploads.length} files)</span>
          </h2>

          {uploads.length === 0 ? (
            <p className="text-sm text-slate-500">No uploads yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2 pr-4 font-medium text-slate-600">Filename</th>
                    <th className="py-2 pr-4 font-medium text-slate-600">Type</th>
                    <th className="py-2 pr-4 font-medium text-slate-600">Program</th>
                    <th className="py-2 pr-4 font-medium text-slate-600">Size</th>
                    <th className="py-2 pr-4 font-medium text-slate-600">Uploaded</th>
                    <th className="py-2 pr-4 font-medium text-slate-600">Text</th>
                    <th className="py-2 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((upload) => (
                    <>
                      <tr key={upload.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 pr-4 font-medium">{upload.filename}</td>
                        <td className="py-2 pr-4">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs uppercase">
                            {upload.fileType}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="text"
                            defaultValue={upload.program}
                            onBlur={(e) => {
                              if (e.target.value !== upload.program) {
                                handleReassign(upload.id, e.target.value);
                              }
                            }}
                            className="w-32 px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 pr-4 text-slate-500">{formatSize(upload.fileSize)}</td>
                        <td className="py-2 pr-4 text-slate-500 text-xs">
                          {new Date(upload.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-4 text-slate-500 text-xs">
                          {upload.textLength.toLocaleString()} chars
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewText(upload.id)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              {expandedUpload === upload.id ? 'Hide' : 'View'}
                            </button>
                            <button
                              onClick={() => handleDeleteUpload(upload.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedUpload === upload.id && (
                        <tr key={`${upload.id}-text`}>
                          <td colSpan={7} className="py-2 px-4">
                            <pre className="text-xs bg-slate-50 p-3 rounded-lg max-h-64 overflow-y-auto whitespace-pre-wrap">
                              {expandedText}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Review Archive */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Review Archive
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({totalReviewFiles} files across {Object.keys(reviews).length} programs)
            </span>
          </h2>

          {Object.keys(reviews).length === 0 ? (
            <p className="text-sm text-slate-500">No reviews in archive.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(reviews).map(([key, program]) => (
                <div key={key} className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-medium text-slate-700 mb-2">
                    {program.program}
                    <span className="ml-2 text-xs text-slate-400 capitalize">({program.category})</span>
                  </h3>
                  <div className="space-y-1">
                    {program.files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <a
                          href={`/reviews/${program.category}/${key.split('/').pop()}/${file.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 truncate max-w-lg"
                        >
                          {file.title}
                        </a>
                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0 ml-4">
                          <span>{file.year}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded">{file.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
