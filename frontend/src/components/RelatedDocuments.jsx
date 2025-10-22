import React from 'react';

export default function RelatedDocuments({ items = [], onSelect }) {
  if (!items?.length) return null;
  return (
    <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <h3 className="text-sm font-semibold opacity-80">Related documents</h3>
      <ul className="mt-3 space-y-2">
        {items.map(d => (
          <li key={d.id}>
            <button
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition"
              onClick={() => onSelect?.(d.id)}
            >
              <div className="text-sm font-medium">{d.title}</div>
              <div className="text-xs opacity-60">Score {d.score ?? 0}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
