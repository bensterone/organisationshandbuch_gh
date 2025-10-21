import React from 'react';
import NavigationTree from '../components/navigation/NavigationTree';

const DocumentsIndex = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Documents</h1>
      <p className="text-gray-600 mb-4">
        Select a document in the navigation to view or edit its content. Folders expand/collapse; documents open directly.
      </p>
      <NavigationTree />
    </div>
  );
};

export default DocumentsIndex;
