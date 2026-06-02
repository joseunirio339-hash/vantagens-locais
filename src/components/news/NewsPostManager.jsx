import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Megaphone, Trash2, Plus, Tag, Sparkles, Star, CalendarDays, Lightbulb } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TAG_OPTIONS = [
  { value: 'promoção', label: '🏷️ Promoção', icon: Tag },
  { value: 'novidade', label: '✨ Novidade', icon: Sparkles },
  { value: 'destaque', label: '⭐ Destaque', icon: Star },
  { value: 'evento', label: '📅 Evento', icon: CalendarDays },
  { value: 'dica', label: '💡 Dica', icon: Lightbulb },
];

const MAX_CHARS = 280;

export default function NewsPostManager({ partner }) {
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('novidade');
  const [imageUrl, setImageUrl] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ['news-posts-partner', partner?.id],
    queryFn: () => base44.entities.NewsPost.filter({ partner_id: partner.id }, '-created_date', 20),
    enabled: !!partner?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NewsPost.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news-posts'] });
      qc.invalidateQueries({ queryKey: ['news-posts-partner', partner?.id] });
      setContent('');
      setImageUrl('');
      setTag('novidade');
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NewsPost.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news-posts'] });
      qc.invalidateQueries({ queryKey: ['news-posts-partner', partner?.id] });
    },
  });

  const handleSubmit = () => {
    if (!content.trim() || content.length > MAX_CHARS) return;
    createMutation.mutate({
      partner_id: partner.id,
      partner_name: partner.business_name,
      partner_logo_url: partner.logo_url || '',
      content: content.trim(),
      tag,
      image_url: imageUrl.trim() || undefined,
      is_active: true,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-fuchsia-500" />
            Novidades & Promoções
          </h3>
          <p className="text-sm text-slate-500">Publique destaques para seus clientes na home do LINKA</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nova Publicação
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-6">
          <div className="mb-3">
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAG_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Ex: 🔥 50% OFF em todos os hambúrgueres hoje! Venha nos visitar!"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
            className="resize-none mb-1 bg-white"
            rows={3}
          />
          <p className={`text-xs mb-3 text-right ${content.length >= MAX_CHARS ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
            {content.length}/{MAX_CHARS}
          </p>

          <Input
            placeholder="URL de imagem opcional (https://...)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mb-4 bg-white"
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || createMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0"
            >
              {createMutation.isPending ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl">
            <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma publicação ainda. Crie a primeira!</p>
          </div>
        )}
        {posts.map(post => (
          <div key={post.id} className="flex gap-3 items-start bg-white border border-slate-100 rounded-xl p-4">
            <div className="flex-1 min-w-0">
              <span className="inline-block text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full mb-1">{post.tag}</span>
              <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
              {post.image_url && (
                <img src={post.image_url} alt="" className="mt-2 h-16 w-28 object-cover rounded-lg border" />
              )}
              <p className="text-xs text-slate-400 mt-1">
                {formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-rose-500 flex-shrink-0"
              onClick={() => deleteMutation.mutate(post.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}