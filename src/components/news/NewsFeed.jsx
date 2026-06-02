import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Megaphone, Sparkles, Star, CalendarDays, Lightbulb, Tag, ChevronRight, Store } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TAG_CONFIG = {
  promoção: { label: 'Promoção', icon: Tag, color: 'bg-rose-100 text-rose-600' },
  novidade: { label: 'Novidade', icon: Sparkles, color: 'bg-violet-100 text-violet-600' },
  destaque: { label: 'Destaque', icon: Star, color: 'bg-amber-100 text-amber-600' },
  evento: { label: 'Evento', icon: CalendarDays, color: 'bg-blue-100 text-blue-600' },
  dica: { label: 'Dica', icon: Lightbulb, color: 'bg-emerald-100 text-emerald-600' },
};

function NewsCard({ post }) {
  const tag = TAG_CONFIG[post.tag] || TAG_CONFIG['novidade'];
  const TagIcon = tag.icon;

  return (
    <Link
      to={createPageUrl(`PartnerStore?id=${post.partner_id}`)}
      className="flex-shrink-0 w-72 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
    >
      {post.image_url && (
        <div className="h-36 overflow-hidden">
          <img
            src={post.image_url}
            alt={post.partner_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4">
        {/* Partner info */}
        <div className="flex items-center gap-2 mb-3">
          {post.partner_logo_url ? (
            <img src={post.partner_logo_url} alt={post.partner_name} className="w-7 h-7 rounded-full object-cover border border-slate-100" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-violet-500" />
            </div>
          )}
          <span className="text-xs font-semibold text-slate-600 truncate">{post.partner_name}</span>
        </div>

        {/* Tag */}
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${tag.color}`}>
          <TagIcon className="w-3 h-3" />
          {tag.label}
        </span>

        {/* Content */}
        <p className="text-sm text-slate-700 leading-relaxed line-clamp-3 mb-3">{post.content}</p>

        {/* Time */}
        <p className="text-xs text-slate-400">
          {formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
    </Link>
  );
}

export default function NewsFeed() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['news-posts'],
    queryFn: () => base44.entities.NewsPost.filter({ is_active: true }, '-created_date', 20),
  });

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-fuchsia-500" />
              Novidades dos Parceiros
            </h2>
            <p className="text-slate-500 text-sm">Promoções e destaques em tempo real</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 h-52 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (posts.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-fuchsia-500" />
            Novidades dos Parceiros
          </h2>
          <p className="text-slate-500 text-sm">Promoções e destaques em tempo real</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
        {posts.map(post => (
          <NewsCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}