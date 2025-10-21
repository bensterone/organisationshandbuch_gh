import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Search,
  FileText,
  GitBranch,
  Folder,
  Loader2,
  Clock,
  Brain,
  Tag,
  X,
} from 'lucide-react';
import {
  getNavigationTree,
  flattenNavigationTree,
  fuzzySearchNavigation,
} from '../../services/navigation';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * SmartDiscoverySearch
 * Premium hybrid search (local + semantic)
 * - Highlights query matches
 * - Displays semantic tags (ISO, GDPR, etc.)
 * - Tag filter bar for contextual filtering
 * - Caches semantic responses
 * - No telemetry, fully local + backend API only
 */
const SmartDiscoverySearch = () => {
  const [tree, setTree] = useState([]);
  const [flat, setFlat] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [recent, setRecent] = useState([]);
  const [cache, setCache] = useState({});
  const [activeTags, setActiveTags] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef();
  const debounceTimer = useRef();

  // Load navigation tree and cached searches
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const t = await getNavigationTree();
        setTree(t);
        setFlat(flattenNavigationTree(t));
      } catch (e) {
        console.error('Failed to load navigation tree:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const cachedRecent = JSON.parse(localStorage.getItem('smartDiscovery.recent') || '[]');
    setRecent(cachedRecent);
  }, []);

  // Debounced input
  const handleSearch = (value) => {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => performSearch(value), 250);
  };

  // Perform hybrid search (local + semantic)
  const performSearch = async (term) => {
    const q = term.trim();
    if (!q) {
      setResults([]);
      setActiveTags([]);
      return;
    }

    setLoading(true);
    const localResults = fuzzySearchNavigation(flat, q, 0.5).slice(0, 10);
    let backendResults = [];

    try {
      if (cache[q]) {
        backendResults = cache[q];
      } else {
        const res = await api.get(`/api/discovery?q=${encodeURIComponent(q)}&limit=10`);
        backendResults =
          (res.data?.results || []).map((r) => ({
            id: r.id || `semantic-${r.type}-${r.title}`,
            title: r.title,
            snippet: r.snippet,
            type: r.type || 'document',
            relevance: r.score || 0.5,
            source: 'semantic',
            tags: r.tags || [],
          })) || [];
        setCache((prev) => ({ ...prev, [q]: backendResults }));
      }
    } catch (e) {
      console.warn('Semantic backend unavailable:', e.message);
    }

    const merged = mergeResults(localResults, backendResults);
    setResults(merged);
    setActiveTags([]); // reset filters for new query
    setLoading(false);
  };

  // Merge and deduplicate
  const mergeResults = (local, backend) => {
    const seen = new Set();
    const merged = [...backend, ...local].filter((r) => {
      const key = `${r.type}-${r.title}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return merged.slice(0, 15);
  };

  // Extract all unique semantic tags from current results
  const allTags = useMemo(() => {
    const tagSet = new Set();
    results.forEach((r) => {
      if (r.tags && r.tags.length > 0) {
        r.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [results]);

  // Apply tag filters
  const filteredResults = useMemo(() => {
    if (activeTags.length === 0) return results;
    return results.filter((r) =>
      r.tags?.some((t) => activeTags.includes(t))
    );
  }, [results, activeTags]);

  // Tag click toggle
  const toggleTag = (tag) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Clear all filters
  const clearFilters = () => setActiveTags([]);

  // Store query memory
  const rememberSearch = (term) => {
    if (!term.trim()) return;
    const updated = [term, ...recent.filter((r) => r !== term)].slice(0, 5);
    setRecent(updated);
    localStorage.setItem('smartDiscovery.recent', JSON.stringify(updated));
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => (i + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => (i - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0) go(filteredResults[focusedIndex]);
      else if (query.trim()) handleRecentClick(query);
    }
  };

  // Navigation
  const go = (item) => {
    if (!item) return;
    rememberSearch(query);
    if (item.type === 'process') navigate(`/processes/${item.id}`);
    else if (item.type === 'document') navigate(`/documents/${item.id}`);
    else navigate(`/`);
    setQuery('');
    setResults([]);
  };

  // Highlight matches
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'ig');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-100 text-gray-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Icons
  const TypeIcon = ({ type, source }) => {
    if (source === 'semantic') return <Brain className="w-4 h-4 text-rose-600" />;
    if (type === 'process') return <GitBranch className="w-4 h-4 text-violet-600" />;
    if (type === 'folder') return <Folder className="w-4 h-4 text-amber-600" />;
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  // Recent click
  const handleRecentClick = (term) => {
    setQuery(term);
    performSearch(term);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Input */}
      <div className="flex items-center bg-white border rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 ring-primary-500 transition-all">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search documents, processes, or topics..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent focus:outline-none text-sm"
        />
        {loading && <Loader2 className="animate-spin w-4 h-4 text-gray-400" />}
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all ${
                activeTags.includes(tag)
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
          {activeTags.length > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {query && filteredResults.length > 0 && (
        <ul className="absolute mt-2 w-full bg-white border rounded-xl shadow-lg z-50 max-h-96 overflow-auto">
          {filteredResults.map((r, i) => (
            <li
              key={r.id}
              className={`flex flex-col gap-1 px-4 py-2 cursor-pointer transition-colors ${
                i === focusedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => setFocusedIndex(i)}
              onClick={() => go(r)}
            >
              <div className="flex items-start gap-3">
                <TypeIcon type={r.type} source={r.source} />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 flex items-center gap-1">
                    {highlightMatch(r.title, query)}
                    {r.source === 'semantic' && (
                      <span className="text-[10px] uppercase text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                        AI Match
                      </span>
                    )}
                  </p>
                  {r.snippet && (
                    <p className="text-xs text-gray-500 line-clamp-2">{r.snippet}</p>
                  )}
                  <span className="text-xs uppercase tracking-wide text-gray-400">
                    {r.type}
                  </span>
                </div>
              </div>
              {r.tags && r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 ml-7">
                  {r.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200"
                    >
                      <Tag className="w-3 h-3 text-gray-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Recent Searches */}
      {!query && recent.length > 0 && (
        <div className="absolute mt-2 w-full bg-white border rounded-xl shadow-md z-40">
          <div className="p-2 text-xs text-gray-400 flex items-center gap-2 px-3">
            <Clock className="w-3 h-3" /> Recent Searches
          </div>
          <ul>
            {recent.map((term) => (
              <li
                key={term}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRecentClick(term)}
              >
                {term}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Results */}
      {query && filteredResults.length === 0 && !loading && (
        <div className="absolute mt-2 w-full bg-white border rounded-xl shadow-sm text-gray-500 text-sm p-3 text-center">
          No results found.
        </div>
      )}
    </div>
  );
};

export default SmartDiscoverySearch;
