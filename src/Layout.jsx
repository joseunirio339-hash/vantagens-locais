import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, Store, Tag, Ticket, User, LogOut, Menu, X,
  CreditCard, LayoutDashboard, ChevronDown, Sparkles, ShieldAlert, ShoppingCart, Gift
} from 'lucide-react';
import UserNotificationBell from '@/components/notifications/UserNotificationBell';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Layout({ children }) {
  const { totalItems } = useCart();
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
    ...(!isPartner ? [{ label: 'Seja Parceiro', href: 'ParceiroContato', icon: Store }] : []),
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
              <img
                src="https://media.base44.com/images/public/6996317474c6e4e8fab2245f/7319561ea_clubemax.png"
                alt="Descontos do Club Max"
                className="w-10 h-10 rounded-xl object-cover shadow-md"
              />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-black text-sm text-slate-800 tracking-tight">Descontos do Club Max</span>
                <span className="text-xs text-slate-400 font-medium">Vantagens Locais</span>
              </div>
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
              {/* Cart Icon */}
              <Link to="/Cart" className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <ShoppingCart className="w-5 h-5 text-slate-600" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-fuchsia-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
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
                    <Link to="/UserProfile">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Meu Perfil
                      </DropdownMenuItem>
                    </Link>
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
                    <Link to="/LoyaltyStore">
                      <DropdownMenuItem className="cursor-pointer text-violet-700 font-medium">
                        <Gift className="w-4 h-4 mr-2" />
                        Loja de Fidelidade 🪙
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

      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp />

      {/* Footer */}
      <footer className="bg-slate-900 mt-auto text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="https://media.base44.com/images/public/6996317474c6e4e8fab2245f/7319561ea_clubemax.png"
                  alt="Descontos do Club Max"
                  className="w-10 h-10 rounded-xl object-cover shadow"
                />
                <div className="flex flex-col leading-none">
                  <span className="font-black text-lg tracking-tight">Descontos do Club Max</span>
                  <span className="text-xs text-slate-400">Vantagens Locais</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Vantagens Locais reúne ofertas de lojistas parceiros. Encontre descontos e vouchers via CPF.
              </p>
            </div>
            {/* Links */}
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wide">Links</p>
              <div className="space-y-2">
                <Link to="/Home" className="block text-sm text-slate-400 hover:text-white transition-colors">Início</Link>
                <Link to="/Partners" className="block text-sm text-slate-400 hover:text-white transition-colors">Parceiros</Link>
                <Link to="/ParceiroContato" className="block text-sm text-slate-400 hover:text-white transition-colors">Seja Parceiro</Link>
                <Link to="/Subscription" className="block text-sm text-slate-400 hover:text-white transition-colors">Planos e Preços</Link>
                <Link to="/LoyaltyStore" className="block text-sm text-slate-400 hover:text-white transition-colors">Loja de Fidelidade 🪙</Link>
              </div>
            </div>
            {/* Contato */}
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wide">Contato</p>
              <div className="space-y-2">
                <a href="https://wa.me/5521997914496" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                  <span>💬</span> (21) 99791-4496 (WhatsApp)
                </a>
                <a href="mailto:clubemaxdescontos@gmail.com"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <span>✉️</span> clubemaxdescontos@gmail.com
                </a>
                <a href="https://instagram.com/clubemaxdescontos" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <span>📸</span> @clubemaxdescontos
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Vantagens Locais — Descontos do Club Max. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <Link to="/PrivacyPolicy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/TermsOfUse" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}