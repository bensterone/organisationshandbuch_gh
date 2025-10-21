import React, { useState, useEffect } from 'react';
import SmartDiscoverySearch from '../components/search/SmartDiscoverySearch';
import { FileText, GitBranch, Folder, Tag } from 'lucide-react';
import { getNavigationItem } from '../services/navigation';
import Loading from '../components/common/Loading';
import InlineToast from '../components/common/InlineToast';
import api from '../services/api';

/**
 * SmartDiscoveryPanel
 * Full-page discovery workspace:
 * - Search, tags, and semantic filters (top)
 * - Result list (left)
 * - Live preview (right)
 */
const SmartDiscoveryPanel = () => {
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [toast, setToast] = useState(null);

  // Subscribe to global event from SmartDiscoverySearch
  useEffect(() => {
    const handleResults = (e) => {
      if (e.detail?.results) setResults(e.detail.results);
    };
    window.addEventListener('smartdiscovery:results', handleResults);
    return () => window.removeEventListener('smartdiscovery:results', handleResults);
  }, []);

  // Load preview for selected item
  useEffect(() => {
    const loadPreview = async () => {
      if (!selected) return;
      setLoadingPreview(true);
      setPreview(null);
      try {
        const item = await getNavigationItem(selected.id);
        let content = null;
        if (item.type === 'document') {
          const res = await api.get(`/api/documents/${item.id}`);
          content = res.data;
        } else if (item.type === 'process') {
          const res = await api.get(`/api/processes/${item.id}`);
          content = res.data;
        }
        setPreview({ ...item, content });
      } catch (e) {
        console.error('Failed to load preview:', e);
        setToast({
          type: 'error',
          message: e.response?.data?.error || 'Failed to load preview.',
        });
      } finally {
        setLoadingPreview(false);
      }
    };
    loadPreview();
  }, [selected]);

  const TypeIcon = ({ type }) => {
    if (type === 'process') return <GitBranch className="w-4 h-4 text-violet-600" />;
    if (type === 'folder') return <Folder className="w-4 h-4 text-amber-600" />;
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Smart Discovery</h1>
        <div className="flex-1 max-w-xl ml-8">
          <SmartDiscoverySearch />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar results */}
        <aside className="w-1/3 border-r bg-white overflow-auto">
          {toast && (
            <InlineToast
              type={toast.type}
              message={toast.message}
              onClose={() => setToast(null)}
            />
          )}

          {results.length === 0 ? (
            <div className="p-6 text-sm text-gray-500 text-center">
              Start by typing in the search bar above.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {results.map((r) => (
                <li
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`px-4 py-3 cursor-pointer transition ${
                    selected?.id === r.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <TypeIcon type={r.type} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{r.title}</p>
                      {r.snippet && (
                        <p className="text-xs text-gray-500 line-clamp-2">{r.snippet}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.tags &&
                          r.tags.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200"
                            >
                              <Tag className="w-3 h-3 text-gray-400" />
                              {t}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Preview pane */}
        <section className="flex-1 bg-gray-50 overflow-auto p-6">
          {loadingPreview ? (
            <Loading text="Loading preview..." />
          ) : preview ? (
            <div className="bg-white shadow-sm rounded-lg border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TypeIcon type={preview.type} />
                  <h2 className="text-xl font-semibold">{preview.title}</h2>
                </div>
                <span className="text-xs uppercase text-gray-500">
                  {preview.type}
                </span>
              </div>

              {preview.content?.content_text ? (
                <article className="prose max-w-none">
                  {preview.content.content_text.split(/\n+/).map((p, i) => (
                    <p key={i} className="text-gray-700 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </article>
              ) : (
                <p className="text-gray-400 italic">No detailed content available.</p>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <p>Select a result to view its content.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SmartDiscoveryPanel;
