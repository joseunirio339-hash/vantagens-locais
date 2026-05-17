import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FavoriteButton({ partnerId, user }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.email || !partnerId) return;
    const check = async () => {
      const favs = await base44.entities.FavoritePartner.filter({
        user_email: user.email,
        partner_id: partnerId
      });
      if (favs.length > 0) {
        setIsFavorited(true);
        setFavoriteId(favs[0].id);
      }
    };
    check();
  }, [user?.email, partnerId]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    setLoading(true);
    if (isFavorited && favoriteId) {
      await base44.entities.FavoritePartner.delete(favoriteId);
      setIsFavorited(false);
      setFavoriteId(null);
    } else {
      const created = await base44.entities.FavoritePartner.create({
        user_email: user.email,
        partner_id: partnerId
      });
      setIsFavorited(true);
      setFavoriteId(created.id);
    }
    setLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0"
      onClick={toggle}
      disabled={loading}
      title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-400'}`}
      />
    </Button>
  );
}