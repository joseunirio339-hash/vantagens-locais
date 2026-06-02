import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function usePartnerFavorites(user) {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteRecords, setFavoriteRecords] = useState([]);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.FavoritePartner.filter({ user_email: user.email }).then(records => {
      setFavoriteRecords(records);
      setFavoriteIds(new Set(records.map(r => r.partner_id)));
    });
  }, [user?.email]);

  const toggleFavorite = useCallback(async (partnerId) => {
    if (!user?.email) return;
    const isFav = favoriteIds.has(partnerId);
    if (isFav) {
      const record = favoriteRecords.find(r => r.partner_id === partnerId);
      if (record) {
        await base44.entities.FavoritePartner.delete(record.id);
        setFavoriteRecords(prev => prev.filter(r => r.partner_id !== partnerId));
        setFavoriteIds(prev => { const s = new Set(prev); s.delete(partnerId); return s; });
      }
    } else {
      const created = await base44.entities.FavoritePartner.create({
        user_email: user.email,
        partner_id: partnerId,
      });
      setFavoriteRecords(prev => [...prev, created]);
      setFavoriteIds(prev => new Set([...prev, partnerId]));
    }
  }, [user?.email, favoriteIds, favoriteRecords]);

  return { favoriteIds, toggleFavorite };
}