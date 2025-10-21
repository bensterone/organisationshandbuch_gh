import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Breadcrumbs = ({ navId }) => {
  const [chain, setChain] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get(`/api/navigation/${navId}/breadcrumbs`);
      setChain(data || []);
    };
    if (navId) load();
  }, [navId]);

  if (!chain.length) return null;

  return (
    <div className="flex items-center text-sm text-gray-600">
      {chain.map((c, idx) => (
        <span key={c.id} className="flex items-center">
          {idx > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
          {idx < chain.length - 1 ? (
            <Link
              to={c.type === 'process' ? `/processes/${c.id}` : `/documents/${c.id}`}
              className="hover:underline"
            >
              {c.title}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{c.title}</span>
          )}
        </span>
      ))}
    </div>
  );
};

export default Breadcrumbs;
