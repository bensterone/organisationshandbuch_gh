import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { globalSearch } from '../../services/search';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';

const SearchBar = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const run = useMemo(
    () => debounce(async (term) => {
      if (!term || term.length < 2) { setResults([]); return; }
      const items = await globalSearch(term, 10);
      setResults(items);
    }, 250),
    []
  );

  useEffect(() => {
    run(q);
    return () => run.cancel();
  }, [q, run]);

  return (
    <div className="relative w-80">
      <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-white">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          className="w-full text-sm outline-none"
          placeholder="Search documents & processes…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">
          <ul className="max-h-80 overflow-auto">
            {results.map(r => (
              <li
                key={`${r.type}-${r.id}`}
                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  navigate(r.type === 'process' ? `/processes/${r.id}` : `/documents/${r.id}`);
                }}
              >
                <span className="font-medium">{r.title}</span>
                <span className="ml-1 text-xs uppercase text-gray-400">({r.type})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
