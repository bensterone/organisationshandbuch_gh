import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, FileText, GitBranch, Home } from 'lucide-react';
import { enableMagneticEffect } from '../../utils/magneticEffect';
import '../../styles/magnetic.css';

const Sidebar = () => {
  const location = useLocation();

  useEffect(() => {
    enableMagneticEffect();
  }, []);

  const linkClasses = (path) =>
    `magnetic-nav relative flex items-center gap-2 text-sm px-3 py-2 rounded-md transition ${
      location.pathname === path
        ? 'active bg-blue-50 text-blue-700 font-medium'
        : 'text-gray-700 hover:text-blue-600'
    }`;

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4 flex flex-col gap-2">
      <Link to="/" className={linkClasses('/')}>
        <Home className="w-4 h-4" />
        Home
        <span className="magnetic-glow" />
      </Link>

      <Link to="/documents" className={linkClasses('/documents')}>
        <FileText className="w-4 h-4" />
        Documents
        <span className="magnetic-glow" />
      </Link>

      <Link to="/processes" className={linkClasses('/processes')}>
        <GitBranch className="w-4 h-4" />
        Processes
        <span className="magnetic-glow" />
      </Link>

      <Link to="/discovery" className={linkClasses('/discovery')}>
        <Brain className="w-4 h-4" />
        Smart Discovery
        <span className="magnetic-glow" />
      </Link>
    </aside>
  );
};

export default Sidebar;
