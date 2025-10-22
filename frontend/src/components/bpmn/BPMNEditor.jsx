import React, { useEffect, useRef, useCallback } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import api from '../../services/api';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

const BPMNEditor = ({ processId, onSave, onElementClick }) => {
  const containerRef = useRef(null);
  const modelerRef = useRef(null);

  useEffect(() => {
    modelerRef.current = new BpmnModeler({
      container: containerRef.current,
      keyboard: { bindTo: document },
    });

    loadDiagram();
    setupElementClick();

    return () => {
      modelerRef.current?.destroy();
    };
  }, [processId]);

  const loadDiagram = useCallback(async () => {
    try {
      const res = await api.get(`processes/${processId}`);
      await modelerRef.current.importXML(res.data.bpmn_xml);
      const canvas = modelerRef.current.get('canvas');
      canvas.zoom('fit-viewport');
    } catch (err) {
      console.error('Error loading diagram', err);
    }
  });

  const setupElementClick = useCallback(() => {
    const eventBus = modelerRef.current.get('eventBus');
    eventBus.on('element.click', (e) => {
      if (onElementClick) onElementClick(e.element);
    });
  });

  const handleSave = async () => {
    const { xml } = await modelerRef.current.saveXML({ format: true });
    await onSave(xml);
  };

  return (
    <div className="relative border rounded-lg overflow-hidden">
      <div ref={containerRef} style={{ height: '70vh' }} />
      <div className="absolute bottom-3 right-3">
        <button
          onClick={handleSave}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700"
        >
          💾 Save Diagram
        </button>
      </div>
    </div>
  );
};

export default BPMNEditor;
