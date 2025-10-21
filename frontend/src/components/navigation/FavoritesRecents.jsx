import React, { useEffect, useState } from 'react';
import { myFavorites } from '../../services/favorites';
import { myRecents } from '../../services/recents';
import { Star, Clock } from 'lucide-react';

const Item = ({ item }) => {
  const href = item.type === 'process' ? `/processes/${item.id}` : `/documents/${item.id}`;
  return (
    <a href={href} className="block px-3 py-2 rounded hover:bg-gray-100 text-sm">
      <span className="font-medium">{item.title}</span>
      <span className="ml-1 text-xs uppercase text-gray-400">({item.type})</span>
    </a>
  );
};

const FavoritesRecents = () => {
  const [favorites, setFavorites] = useState([]);
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    myFavorites().then(setFavorites).catch(() => setFavorites([]));
    myRecents().then(setRecents).catch(() => setRecents([]));
  }, []);

  return (
    <div className="mt-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 px-3 py-2 text-gray-700">
          <Star className="w-4 h-4" /> <span className="font-semibold text-sm">Favorites</span>
        </div>
        {favorites.length === 0 ? (
          <p className="px-3 text-xs text-gray-500">No favorites yet.</p>
        ) : favorites.map((f) => <Item key={`fav-${f.id}`} item={f} />)}
      </div>
      <div>
        <div className="flex items-center gap-2 px-3 py-2 text-gray-700">
          <Clock className="w-4 h-4" /> <span className="font-semibold text-sm">Recent</span>
        </div>
        {recents.length === 0 ? (
          <p className="px-3 text-xs text-gray-500">No recent items.</p>
        ) : recents.map((r) => <Item key={`rec-${r.id}`} item={r} />)}
      </div>
    </div>
  );
};

export default FavoritesRecents;
