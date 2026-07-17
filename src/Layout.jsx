import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, Store, Tag, Ticket, User, LogOut, Menu, X,
  CreditCard, LayoutDashboard, ChevronDown, Sparkles, ShieldAlert, ShoppingCart, Gift, Users,
  MessageCircle, Mail, Camera, Search, Heart
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
  const [headerSearch, setHeaderSearch] = useState('');
  const [authLoaded, setAuthLoaded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth || cancelled) return;
        const currentUser = await base44.auth.me();
        if (cancelled) return;
        setUser(currentUser);
        try {
          const partners = await base44.entities.Partner.filter({
            owner_email: currentUser.email
          });
          if (!cancelled) setIsPartner(partners.length > 0);
        } catch (e) {
          // Partner check failed silently — user still logged in without partner menu
        }
      } catch (e) {
        // Rate limit / network error — user stays logged out until next page reload
      }
      if (!cancelled) setAuthLoaded(true);
    };
    loadUser();
    return () => { cancelled = true; };
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
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <img
                src="https://media.base44.com/images/public/6996317474c6e4e8fab2245f/188f1bafc_clubemax.png"
                alt="Descontos do Club Max"
                className="w-10 h-10 rounded-2xl object-cover"
              />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-extrabold text-sm text-stone-800 tracking-tight">Descontos do Club Max</span>
                <span className="text-[11px] text-stone-400 font-medium">Vantagens Locais</span>
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
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Global Search + User Menu */}
            <div className="flex items-center gap-3">
              {/* Compact Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (headerSearch.trim()) {
                    window.location.href = createPageUrl(`Products?search=${encodeURIComponent(headerSearch.trim())}`);
                  }
                }}
                className="hidden md:flex items-center relative"
              >
                <Search className="absolute left-3 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  placeholder="Buscar ofertas..."
                  className="w-40 lg:w-52 pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-all"
                />
              </form>
              {/* Cart Icon */}
              <Link to="/Cart" className="relative p-2 rounded-xl hover:bg-stone-100 transition-colors">
                <ShoppingCart className="w-5 h-5 text-stone-600" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
              {user && <UserNotificationBell user={user} />}
              {!authLoaded ? (
                <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-amber-700">
                          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-stone-700">
                        {user.full_name?.split(' ')[0] || 'Usuário'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-stone-400">{user.email}</p>
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
                    <Link to="/UserProfile?tab=favorites">
                      <DropdownMenuItem className="cursor-pointer">
                        <Heart className="w-4 h-4 mr-2" />
                        Meus Favoritos
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
                        Loja de Fidelidade
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
                      <>
                        <Link to={createPageUrl('AdminDashboard')}>
                          <DropdownMenuItem className="cursor-pointer text-violet-700 font-medium">
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            Painel Admin
                          </DropdownMenuItem>
                        </Link>
                        <Link to={createPageUrl('RepresentativesDashboard')}>
                          <DropdownMenuItem className="cursor-pointer text-violet-700 font-medium">
                            <Users className="w-4 h-4 mr-2" />
                            Representantes
                          </DropdownMenuItem>
                        </Link>
                        <Link to={createPageUrl('VendedorApp')}>
                          <DropdownMenuItem className="cursor-pointer text-amber-700 font-medium">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            App do Vendedor
                          </DropdownMenuItem>
                        </Link>
                      </>
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
                  className="bg-amber-500 hover:bg-amber-600 text-white border-0"
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
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-stone-600 hover:bg-stone-100'
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
      <footer className="bg-stone-900 mt-auto text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="https://media.base44.com/images/public/6996317474c6e4e8fab2245f/188f1bafc_clubemax.png"
                  alt="Descontos do Club Max"
                  className="w-11 h-11 rounded-2xl object-cover"
                />
                <div className="flex flex-col leading-tight">
                  <span className="font-extrabold text-lg tracking-tight text-white">Descontos do Club Max</span>
                  <span className="text-xs text-stone-400 font-medium">Vantagens Locais</span>
                </div>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed">
                Conectamos você aos melhores descontos da sua região. 
                São centenas de lojistas parceiros com ofertas exclusivas pra você economizar de verdade.
              </p>
            </div>
            {/* Links */}
            <div>
              <p className="font-semibold text-stone-300 mb-4 text-sm">Navegue</p>
              <div className="space-y-2.5">
                <Link to="/Home" className="block text-sm text-stone-400 hover:text-amber-400 transition-colors">Início</Link>
                <Link to="/Partners" className="block text-sm text-stone-400 hover:text-amber-400 transition-colors">Parceiros</Link>
                <Link to="/Products" className="block text-sm text-stone-400 hover:text-amber-400 transition-colors">Produtos</Link>
                <Link to="/ParceiroContato" className="block text-sm text-stone-400 hover:text-amber-400 transition-colors">Seja Parceiro</Link>
                <Link to="/Subscription" className="block text-sm text-stone-400 hover:text-amber-400 transition-colors">Planos e Preços</Link>
                <Link to="/LoyaltyStore" className="block text-sm text-stone-400 hover:text-amber-400 transition-colors">Loja de Fidelidade</Link>
              </div>
            </div>
            {/* Contato */}
            <div>
              <p className="font-semibold text-stone-300 mb-4 text-sm">Fale com a gente</p>
              <div className="space-y-3">
                <a href="https://wa.me/5521997914496" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors group">
                  <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  (21) 99791-4496
                </a>
                <a href="mailto:clubemaxdescontos@gmail.com"
                  className="flex items-center gap-2.5 text-sm text-stone-400 hover:text-amber-400 transition-colors group">
                  <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  clubemaxdescontos@gmail.com
                </a>
                <a href="https://instagram.com/clubemaxdescontos" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-stone-400 hover:text-amber-400 transition-colors group">
                  <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  @clubemaxdescontos
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-stone-500">
              © {new Date().getFullYear()} Descontos do Club Max · Feito com carinho pra você economizar
            </p>
            <div className="flex gap-5">
              <Link to="/PrivacyPolicy" className="text-xs text-stone-500 hover:text-stone-300 transition-colors">
                Privacidade
              </Link>
              <Link to="/TermsOfUse" className="text-xs text-stone-500 hover:text-stone-300 transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}