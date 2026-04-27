import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Store, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import PartnerCard from '@/components/partners/PartnerCard';

const categories = [
  { value: 'all', label: 'Todas Categorias' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'moda', label: 'Moda' },
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'beleza', label: 'Beleza' },
  { value: 'saude', label: 'Saúde' },
  { value: 'mercado', label: 'Mercado' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'outros', label: 'Outros' }
];

export default function Partners() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const active = await base44.entities.Partner.filter({ subscription_status: 'active' });
      const extras = await Promise.all([
        base44.entities.Partner.filter({ id: '699667374773d515504fac61' }),
        base44.entities.Partner.filter({ id: '69c6dd738bb52da27d1adad8' }),
      ]);
      const all = [...active];
      extras.flat().forEach(p => { if (!all.find(a => a.id === p.id)) all.push(p); });
      return all;
    }
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || partner.category === category;
    return matchesSearch && matchesCategory;
  });

  const getProductCount = (partnerId) => {
    return products.filter(p => p.partner_id === partnerId).length;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Parceiros</h1>
          <p className="text-slate-500">Encontre lojas com ofertas exclusivas</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar parceiros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum parceiro encontrado</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredPartners.map(partner => (
              <Link key={partner.id} to={createPageUrl(`PartnerStore?id=${partner.id}`)}>
                <PartnerCard
                  partner={partner}
                  productCount={getProductCount(partner.id)}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}