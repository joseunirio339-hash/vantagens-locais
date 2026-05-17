import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, Store, Tag, Ticket, User, LogOut, Menu, X,
  CreditCard, LayoutDashboard, ChevronDown, Sparkles, ShieldAlert
} from 'lucide-react';
import UserNotificationBell from '@/components/notifications/UserNotificationBell';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [isPartner, setIsPartner] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const partners = await base44.entities.Partner.filter({
          owner_email: currentUser.email
        });
        setIsPartner(partners.length > 0);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  const navItems = [
    { label: 'Início', href: 'Home', icon: Home },
    { label: 'Parceiros', href: 'Partners', icon: Store },
    { label: 'Produtos', href: 'Products', icon: Tag },
    ...(!isPartner ? [{ label: 'Seja Parceiro', href: 'PartnerSignup', icon: Store }] : []),
  ];

  const isActive = (href) => {
    const currentPath = location.pathname.split('/').pop();
    return currentPath === href;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800 hidden sm:block">
                Clube Max Descontos
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={createPageUrl(item.href)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive(item.href)
                        ? 'bg-violet-100 text-violet-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user && <UserNotificationBell user={user} />}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-emerald-700">
                          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-slate-700">
                        {user.full_name?.split(' ')[0] || 'Usuário'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <Link to={createPageUrl('MyVouchers')}>
                      <DropdownMenuItem className="cursor-pointer">
                        <Ticket className="w-4 h-4 mr-2" />
                        Meus Vouchers
                      </DropdownMenuItem>
                    </Link>
                    <Link to={createPageUrl('ReferralPage')}>
                      <DropdownMenuItem className="cursor-pointer text-fuchsia-600 font-medium">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Indique e Ganhe
                      </DropdownMenuItem>
                    </Link>

                    <Link to={createPageUrl('PurchaseHistory')}>
                      <DropdownMenuItem className="cursor-pointer">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Minhas Compras
                      </DropdownMenuItem>
                    </Link>
                    <Link to={createPageUrl('Subscription')}>
                      <DropdownMenuItem className="cursor-pointer">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Assinatura
                      </DropdownMenuItem>
                    </Link>
                    {isPartner && (
                      <>
                        <Link to={createPageUrl('PartnerDashboard')}>
                          <DropdownMenuItem className="cursor-pointer">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Painel do Parceiro
                          </DropdownMenuItem>
                        </Link>
                        <Link to={createPageUrl('LojistaManager')}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Tag className="w-4 h-4 mr-2" />
                            Gestão de Descontos
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <Link to={createPageUrl('AdminDashboard')}>
                        <DropdownMenuItem className="cursor-pointer text-violet-700 font-medium">
                          <ShieldAlert className="w-4 h-4 mr-2" />
                          Painel Admin
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0"
                >
                  <User className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white pb-4">
            <nav className="px-4 pt-4 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={createPageUrl(item.href)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                      isActive(item.href)
                        ? 'bg-violet-100 text-violet-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-700">Descontos Locais</span>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1">
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} Todos os direitos reservados.
              </p>
              <div className="flex gap-4">
                <Link to="/PrivacyPolicy" className="text-xs text-slate-400 hover:text-violet-600 transition-colors">
                  Política de Privacidade
                </Link>
                <Link to="/TermsOfUse" className="text-xs text-slate-400 hover:text-violet-600 transition-colors">
                  Termos de Uso
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}