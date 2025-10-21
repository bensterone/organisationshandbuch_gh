import React from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DocumentLinkPanel = ({ element, links, onClose }) => {
  const navigate = useNavigate();

  if (!element || !links) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50">
      <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Linked Documents</h3>
          <p className="text-sm">{element.businessObject?.name || element.id}</p>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
        {links.map((link) => (
          <div
            key={link.id}
            onClick={() => navigate(`/documents/${link.linked_navigation_item_id}`)}
            className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition"
          >
            <h4 className="font-medium text-gray-900 mb-1">{link.document_title}</h4>
            {link.link_description && (
              <p className="text-sm text-gray-600">{link.link_description}</p>
            )}
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              {link.link_type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentLinkPanel;