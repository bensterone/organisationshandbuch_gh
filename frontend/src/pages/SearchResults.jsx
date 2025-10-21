import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, GitBranch, Folder, X } from 'lucide-react';
import { apiRequest } from '../services/apiResponse';
import InlineToast from '../components/common/InlineToast';

const TypeIcon = ({ type }) => {
  if (type === 'process') return <GitBranch className="w-4 h-4 text-violet-600" />;
  if (type === 'folder') return <Folder className="w-4 h-4 text-amber-600" />;
  return <FileText className="w-4 h-4 text-blue-600" />;
};

const SearchResults = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const qParam = params.get('q') || '';

  const [query, setQuery] = useState(qParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch {
      return [];
    }
  });
  const [showRecent, setShowRecent] = useState(false);

  const debounceRef = useRef(null);

  // --- handle searching ---
  const performSearch = async (term) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError('');
    const { data, error } = await apiRequest('get', `/api/search?q=${encodeURIComponent(term)}&limit=50`);
    if (error) {
      setError(error);
      setResults([]);
      setToast({ type: 'error', message: error });
    } else if (data?.items?.length) {
      setResults(data.items);
      setToast({ type: 'success', message: `${data.items.length} results found` });
    } else {
      setResults([]);
      setToast({ type: 'info', message: 'No results found' });
    }
    setLoading(false);
  };

  // --- debounce effect ---
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query !== qParam) setParams({ q: query });
      performSearch(query);
      // Save to recent
      if (query.trim()) {
        setRecent((prev) => {
          const next = [query, ...prev.filter((p) => p !== query)].slice(0, 5);
          localStorage.setItem('recentSearches', JSON.stringify(next));
          return next;
        });
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // --- load initial ---
  useEffect(() => {
    if (qParam) performSearch(qParam);
  }, [qParam]);

  const go = (r) => {
    if (r.type === 'process') navigate(`/processes/${r.id}`);
    else if (r.type === 'document') navigate(`/documents/${r.id}`);
    else navigate(`/`);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError('');
    setToast(null);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Search</h1>

      {/* Search input */}
      <div className="relative w-full max-w-lg">
        <input
          type="text"
          value={query}
          onFocus={() => setShowRecent(true)}
          onBlur={() => setTimeout(() => setShowRecent(false), 200)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents or processes..."
          className="w-full border rounded-lg py-2 px-3 pr-9 focus:ring-2 focus:ring-primary-500 focus:outline-none"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
            title="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {/* Recent dropdown */}
        {showRecent && recent.length > 0 && (
          <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg mt-1 w-full shadow-md">
            {recent.map((r) => (
              <li
                key={r}
                onMouseDown={() => {
                  setQuery(r);
                  setShowRecent(false);
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
              >
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>

      {toast && <InlineToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Results */}
      {loading ? (
        <p className="text-gray-500">Searching…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : results.length === 0 && query.trim() ? (
        <p className="text-gray-500">No results found for “{query}”.</p>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white rounded-xl border">
          {results.map((r) => (
            <li key={`${r.type}-${r.id}`} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => go(r)}>
              <div className="flex items-start gap-3">
                <TypeIcon type={r.type} />
                <div>
                  <p className="font-medium">{r.title}</p>
                  {r.snippet && <p className="text-sm text-gray-600 line-clamp-2">{r.snippet}</p>}
                  <span className="text-xs uppercase tracking-wide text-gray-400">{r.type}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchResults;
