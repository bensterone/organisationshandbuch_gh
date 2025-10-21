import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GlobalSearch = () => {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef();

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setQ('');
    inputRef.current?.blur();
  };

  return (
    <form onSubmit={submit} className="relative w-full max-w-lg">
      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search documents, processes, folders…"
        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </form>
  );
};

export default GlobalSearch;
