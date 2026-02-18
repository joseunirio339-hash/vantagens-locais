import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ticket, CheckCircle, Clock, XCircle, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  used: { label: 'Utilizado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  expired: { label: 'Expirado', color: 'bg-slate-100 text-slate-700', icon: XCircle }
};

export default function VoucherManagement({ vouchers, products, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const formatCPF = (cpf) => {
    const clean = cpf?.replace(/\D/g, '');
    if (!clean || clean.length !== 11) return cpf;
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const filteredVouchers = vouchers
    .filter(v => {
      const matchesSearch = 
        v.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.user_cpf?.includes(searchTerm) ||
        v.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const handleMarkAsUsed = async (voucher) => {
    await base44.entities.Voucher.update(voucher.id, {
      status: 'used',
      used_at: new Date().toISOString()
    });

    // Notify partner about used voucher
    await base44.entities.Notification.create({
      partner_id: voucher.partner_id,
      type: 'voucher_used',
      title: 'Voucher Utilizado!',
      message: `Voucher ${voucher.code} para "${voucher.product_name}" foi validado com sucesso.`,
      is_read: false,
      reference_id: voucher.id
    });

    toast.success('Voucher marcado como utilizado!');
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-emerald-600" />
          Vouchers ({vouchers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por código, CPF ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="used">Utilizados</SelectItem>
              <SelectItem value="expired">Expirados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredVouchers.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum voucher encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.map(voucher => {
                  const status = statusConfig[voucher.status] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={voucher.id}>
                      <TableCell>
                        <span className="font-mono font-bold text-emerald-600">
                          {voucher.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{voucher.product_name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {formatCPF(voucher.user_cpf)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-semibold text-emerald-600">
                            R$ {voucher.discount_price?.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs text-slate-400 ml-1 line-through">
                            R$ {voucher.original_price?.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {format(new Date(voucher.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {voucher.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsUsed(voucher)}
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Validar
                          </Button>
                        )}
                        {voucher.status === 'used' && voucher.used_at && (
                          <span className="text-xs text-slate-500">
                            Usado em {format(new Date(voucher.used_at), "dd/MM HH:mm")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}