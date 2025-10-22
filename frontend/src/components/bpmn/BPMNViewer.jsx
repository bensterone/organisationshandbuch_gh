
import React, { useRef, useEffect, useState } from 'react';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import api from '../../services/api';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

const BPMNViewer = ({ processId, onElementClick }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [documentLinks, setDocumentLinks] = useState([]);

  useEffect(() => {
    if (!containerRef.current) return;

    viewerRef.current = new BpmnViewer({
      container: containerRef.current,
      height: '600px'
    });

    loadDiagram();

    return () => viewerRef.current?.destroy();
  }, [processId]);

  const loadDiagram = async () => {
    try {
      const [processRes, linksRes] = await Promise.all([
        api.get(`processes/${processId}`),
        api.get(`processes/${processId}/links`)
      ]);

      await viewerRef.current.importXML(processRes.data.bpmn_xml);
      setDocumentLinks(linksRes.data);

      const canvas = viewerRef.current.get('canvas');
      canvas.zoom('fit-viewport');

      addDocumentBadges(linksRes.data);
      addClickHandlers(linksRes.data);
    } catch (error) {
      console.error('Error loading diagram:', error);
    }
  };

  const addDocumentBadges = (links) => {
    const overlays = viewerRef.current.get('overlays');
    const elementRegistry = viewerRef.current.get('elementRegistry');

    const linksByElement = {};
    links.forEach(link => {
      if (!linksByElement[link.bpmn_element_id]) {
        linksByElement[link.bpmn_element_id] = [];
      }
      linksByElement[link.bpmn_element_id].push(link);
    });

    Object.keys(linksByElement).forEach(elementId => {
      const element = elementRegistry.get(elementId);
      if (!element) return;

      const count = linksByElement[elementId].length;
      const badge = document.createElement('div');
      badge.style.cssText = 'width:24px;height:24px;background:#3b82f6;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;cursor:pointer';
      badge.textContent = '📄';
      badge.title = `${count} linked document(s)`;

      overlays.add(elementId, 'docs', { position: { top: -10, right: -10 }, html: badge });
    });
  };

  const addClickHandlers = (links) => {
    const eventBus = viewerRef.current.get('eventBus');
    eventBus.on('element.click', (event) => {
      const elementLinks = links.filter(l => l.bpmn_element_id === event.element.id);
      if (elementLinks.length > 0 && onElementClick) {
        onElementClick(event.element, elementLinks);
      }
    });
  };

  return <div ref={containerRef} className="border border-gray-200 rounded-lg" style={{ height: '600px' }} />;
};

export default BPMNViewer;