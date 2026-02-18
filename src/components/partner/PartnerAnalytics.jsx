import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Ticket, TrendingUp, Package } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

export default function PartnerAnalytics({ products, vouchers, views }) {
  // Most viewed products
  const productViewsData = products
    .map(product => ({
      name: product.name?.substring(0, 15) + (product.name?.length > 15 ? '...' : ''),
      views: views.filter(v => v.product_id === product.id).length,
      fullName: product.name
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  // Vouchers by product
  const vouchersByProduct = products
    .map(product => ({
      name: product.name?.substring(0, 15) + (product.name?.length > 15 ? '...' : ''),
      vouchers: vouchers.filter(v => v.product_id === product.id).length,
      fullName: product.name
    }))
    .sort((a, b) => b.vouchers - a.vouchers)
    .slice(0, 6);

  // Voucher status distribution
  const voucherStatusData = [
    { name: 'Pendentes', value: vouchers.filter(v => v.status === 'pending').length },
    { name: 'Utilizados', value: vouchers.filter(v => v.status === 'used').length },
    { name: 'Expirados', value: vouchers.filter(v => v.status === 'expired').length }
  ].filter(d => d.value > 0);

  // Conversion rate
  const totalViews = views.length;
  const totalVouchers = vouchers.length;
  const conversionRate = totalViews > 0 ? ((totalVouchers / totalViews) * 100).toFixed(1) : 0;

  const stats = [
    {
      label: 'Total de Visualizações',
      value: totalViews,
      icon: Eye,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      label: 'Vouchers Gerados',
      value: totalVouchers,
      icon: Ticket,
      color: 'text-emerald-600 bg-emerald-100'
    },
    {
      label: 'Taxa de Conversão',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: 'text-violet-600 bg-violet-100'
    },
    {
      label: 'Produtos Ativos',
      value: products.filter(p => p.is_active).length,
      icon: Package,
      color: 'text-amber-600 bg-amber-100'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Produtos Mais Acessados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productViewsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={productViewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Visualizações']}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                Nenhuma visualização ainda
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-emerald-600" />
              Vouchers por Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vouchersByProduct.some(v => v.vouchers > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={vouchersByProduct}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Vouchers']}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="vouchers" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                Nenhum voucher gerado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status dos Vouchers</CardTitle>
        </CardHeader>
        <CardContent>
          {voucherStatusData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={voucherStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {voucherStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              Nenhum voucher gerado ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}