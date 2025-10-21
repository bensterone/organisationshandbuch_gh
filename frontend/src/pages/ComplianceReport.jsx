import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ComplianceReport = () => {
  const [data, setData] = useState({ dueForReview: [], approvals: [], acknowledgements: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/compliance/report/overview').then((res) => {
      setData(res.data || { dueForReview: [], approvals: [], acknowledgements: [] });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;

  const apprMap = Object.fromEntries(data.approvals.map(a => [a.id, a.last_approved_at]));
  const ackMap = Object.fromEntries(data.acknowledgements.map(a => [a.id, a.ack_count]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Compliance Overview</h1>

      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-2">Due for Review</h2>
        {data.dueForReview.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing due today 🎉</p>
        ) : (
          <ul className="divide-y">
            {data.dueForReview.map(d => (
              <li key={d.id} className="py-2 flex items-center justify-between">
                <div>
                  <a href={`/documents/${d.id}`} className="text-primary-600 underline">{d.title}</a>
                  <p className="text-xs text-gray-500">Next review: {d.next_review_at || '—'}</p>
                </div>
                <a className="text-sm text-gray-500" href={`/documents/${d.id}`}>Open</a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Last Approvals</h2>
          {data.approvals.length === 0 ? (
            <p className="text-sm text-gray-500">No approvals found.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.approvals.map(a => (
                <li key={a.id}>
                  <a href={`/documents/${a.id}`} className="text-primary-600 underline">#{a.id}</a>
                  {' '}— last approved at {a.last_approved_at ? new Date(a.last_approved_at).toLocaleDateString() : '—'}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Acknowledgements</h2>
          {data.acknowledgements.length === 0 ? (
            <p className="text-sm text-gray-500">No acknowledgements yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.acknowledgements.map(a => (
                <li key={a.id}>
                  <a href={`/documents/${a.id}`} className="text-primary-600 underline">#{a.id}</a>
                  {' '}— {ackMap[a.id] || 0} readers
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceReport;
