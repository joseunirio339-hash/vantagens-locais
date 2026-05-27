import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useFavorites(user) {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteRecords, setFavoriteRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      setLoading(true);
      const records = await base44.entities.FavoriteProduct.filter({ user_email: user.email });
      setFavoriteRecords(records);
      setFavoriteIds(new Set(records.map(r => r.product_id)));
      setLoading(false);
    };
    load();
  }, [user?.email]);

  const toggleFavorite = useCallback(async (product, partner) => {
    if (!user?.email) return;

    const isFav = favoriteIds.has(product.id);

    if (isFav) {
      const record = favoriteRecords.find(r => r.product_id === product.id);
      if (record) {
        await base44.entities.FavoriteProduct.delete(record.id);
        setFavoriteRecords(prev => prev.filter(r => r.product_id !== product.id));
        setFavoriteIds(prev => { const s = new Set(prev); s.delete(product.id); return s; });
      }
    } else {
      const created = await base44.entities.FavoriteProduct.create({
        user_email: user.email,
        product_id: product.id,
        partner_id: product.partner_id
      });
      setFavoriteRecords(prev => [...prev, created]);
      setFavoriteIds(prev => new Set([...prev, product.id]));
    }
  }, [user?.email, favoriteIds, favoriteRecords]);

  return { favoriteIds, favoriteRecords, toggleFavorite, loading };
}