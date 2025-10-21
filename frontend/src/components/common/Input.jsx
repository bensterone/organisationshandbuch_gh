import React from 'react';

const Input = ({ label, error, ...props }) => {
  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <input
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;