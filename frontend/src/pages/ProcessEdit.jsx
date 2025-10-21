import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import BPMNEditor from '../components/bpmn/BPMNEditor';
import LinkPanel from '../components/bpmn/LinkPanel';
import Button from '../components/common/Button';
import api from '../services/api';
import { getLinks } from '../services/links';

const ProcessEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedElement, setSelectedElement] = useState(null);
  const [allLinks, setAllLinks] = useState([]);
  const [showPanel, setShowPanel] = useState(false);

  const loadLinks = async () => {
    const data = await getLinks(id);
    setAllLinks(data);
  };

  useEffect(() => {
    loadLinks();
  }, [id]);

  const handleSave = async (xml) => {
    await api.put(`/api/processes/${id}`, {
      bpmn_xml: xml,
      process_name: `Process_${id}`,
      process_version: '1.0'
    });
    alert('Diagram saved successfully');
  };

  // Pass a modified BPMNEditor with element click event listener
  const handleElementClick = (element) => {
    const elementLinks = allLinks.filter(l => l.bpmn_element_id === element.id);
    setSelectedElement(element);
    setShowPanel(true);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Edit Process Diagram</h1>
        <Button variant="secondary" onClick={() => navigate(`/processes/${id}`)}>
          ← Back to View
        </Button>
      </div>

      <BPMNEditor
        processId={id}
        onSave={handleSave}
        onElementClick={handleElementClick}
      />

      {showPanel && selectedElement && (
        <LinkPanel
          processId={id}
          element={selectedElement}
          links={allLinks.filter(l => l.bpmn_element_id === selectedElement.id)}
          refreshLinks={loadLinks}
          onClose={() => setShowPanel(false)}
        />
      )}
    </Layout>
  );
};

export default ProcessEdit;
