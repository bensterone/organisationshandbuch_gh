import React from 'react';

const Loading = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="spinner mb-4" />
      <p className="text-gray-600">{text}</p>
    </div>
  );
};

export default Loading;