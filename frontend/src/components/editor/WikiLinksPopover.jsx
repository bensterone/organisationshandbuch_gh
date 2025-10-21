import React, { useEffect, useRef } from 'react';

const WikiLinkPopover = ({ visible, position, results, onSelect }) => {
  const ref = useRef();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onSelect(null);
    };
    if (visible) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible, onSelect]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      style={{
        top: position.top + 20,
        left: position.left,
        position: 'absolute',
        zIndex: 50,
      }}
      className="bg-white border border-gray-200 rounded-lg shadow-lg w-64"
    >
      {results.length === 0 ? (
        <div className="p-2 text-sm text-gray-500">No matches</div>
      ) : (
        <ul className="max-h-48 overflow-auto">
          {results.map((r) => (
            <li
              key={r.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => onSelect(r)}
            >
              <span className="font-medium text-gray-800">{r.title}</span>
              <span className="ml-1 text-xs uppercase text-gray-400">({r.type})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WikiLinkPopover;
