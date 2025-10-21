import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import Button from '../common/Button';
import SearchBar from '../search/SearchBar';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { enableMagneticEffect } from '../../utils/magneticEffect';
import '../../styles/magnetic.css';

const Header = () => {
  const { user, logout } = useAuthStore();

  useEffect(() => {
    enableMagneticEffect();
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b px-6 py-3">
      <div className="flex items-center justify-between gap-6">
        {/* Left: Title + Navigation */}
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-800">Organisationshandbuch</h1>

          <nav className="flex gap-4 items-center text-sm">
            <Link to="/" className="magnetic-nav relative text-gray-700 hover:text-blue-600">
              Home
              <span className="magnetic-glow" />
            </Link>
            <Link
              to="/documents"
              className="magnetic-nav relative text-gray-700 hover:text-blue-600"
            >
              Documents
              <span className="magnetic-glow" />
            </Link>
            <Link
              to="/processes"
              className="magnetic-nav relative text-gray-700 hover:text-blue-600"
            >
              Processes
              <span className="magnetic-glow" />
            </Link>
            <Link
              to="/discovery"
              className="magnetic-link flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 transition-all duration-300 relative overflow-hidden"
              title="Explore all documents and processes semantically"
            >
              <Brain className="w-4 h-4" />
              <span>Smart Discovery</span>
              <span className="magnetic-glow" />
            </Link>
          </nav>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-6">
          <SearchBar />
        </div>

        {/* Right: User info */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.full_name}</span>
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
