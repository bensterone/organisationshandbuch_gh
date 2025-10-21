import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavigationItem = ({ item }) => {
  const navigate = useNavigate();

  const go = () => {
    if (item.type === 'process') navigate(`/processes/${item.id}`);
    else if (item.type === 'document') navigate(`/documents/${item.id}`);
    else navigate(`/`);
  };

  return (
    <button
      onClick={go}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition"
    >
      <div className="font-medium text-gray-800">{item.title}</div>
      <div className="text-xs text-gray-500 uppercase">{item.type}</div>
    </button>
  );
};

export default NavigationItem;
