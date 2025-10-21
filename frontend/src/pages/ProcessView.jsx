import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Breadcrumbs from '../components/navigation/Breadcrumbs';
import { useAuthStore } from '../stores/authStore';
import { isFavorite, toggleFavorite } from '../services/favorites';
import { trackRecent } from '../services/recents';
import { Star } from 'lucide-react';
import StatusPill from '../components/common/StatusPill';
import InlineToast from '../components/common/InlineToast';
import QuickEditManager from '../components/editor/QuickEditManager';

const ProcessView = () => {
  const { id } = useParams();
  const navId = Number(id);
  const { user } = useAuthStore();
  const [fav, setFav] = useState(false);
  const [toast, setToast] = useState(null);

  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const headerTitle = useMemo(() => `Process (Navigation ID: ${navId})`, [navId]);

  useEffect(() => {
    isFavorite(navId).then(setFav).catch(() => setFav(false));
    trackRecent(navId);
  }, [navId]);

  const toggleFav = async () => {
    const state = await toggleFavorite(navId);
    setFav(state);
    setToast({ type: state ? 'success' : 'info', message: state ? 'Added to favorites' : 'Removed from favorites' });
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs navId={navId} />

      {toast && <InlineToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{headerTitle}</h1>
        <button
          onClick={toggleFav}
          className={`flex items-center gap-1 px-3 py-1.5 rounded border ${fav ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          title={fav ? 'Unfavorite' : 'Add to favorites'}
        >
          <Star className={`w-4 h-4 ${fav ? 'fill-yellow-400 stroke-yellow-600' : ''}`} />
          <span className="text-sm">{fav ? 'Favorited' : 'Favorite'}</span>
        </button>
      </div>

      <StatusPill status="active" />
      <QuickEditManager id={navId} type="process" canEdit={canEdit} />
    </div>
  );
};

export default ProcessView;
