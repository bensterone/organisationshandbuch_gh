import React from 'react';
const map = {
  draft: 'bg-gray-100 text-gray-700',
  in_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  deprecated: 'bg-red-100 text-red-800',
};
const label = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  deprecated: 'Deprecated',
};
const StatusPill = ({ status = 'draft' }) => (
  <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded ${map[status] || map.draft}`}>
    {label[status] || label.draft}
  </span>
);
export default StatusPill;
