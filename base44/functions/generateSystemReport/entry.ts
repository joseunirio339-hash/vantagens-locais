import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch counts
    const [partners, products, vouchers, users, subscriptions] = await Promise.all([
      base44.asServiceRole.entities.Partner.list(),
      base44.asServiceRole.entities.Product.list(),
      base44.asServiceRole.entities.Voucher.list(),
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Subscription.list(),
    ]);

    const doc = new jsPDF();
    let y = 20;

    // Helper functions
    const addTitle = (text, size = 18) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.setTextColor(124, 58, 237); // violet-600
      doc.text(text, 20, y);
      y += size > 16 ? 10 : 8;
    };

    const addSubtitle = (text) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(55, 65, 81); // gray-700
      doc.text(text, 20, y);
      y += 7;
    };

    const addText = (text, indent = 20) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99); // gray-600

      const maxWidth = 170 - indent;
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach(line => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, indent, y);
        y += 5;
      });
      y += 2;
    };

    const addBullet = (text) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const maxWidth = 165;
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line, i) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(i === 0 ? `• ${line}` : `  ${line}`, 22, y);
        y += 5;
      });
      y += 1;
    };

    const addLine = () => {
      doc.setDrawColor(229, 231, 235);
      doc.line(20, y, 190, y);
      y += 6;
    };

    const addPageIfNeeded = (needed) => {
      if (y + needed > 275) {
        doc.addPage();
        y = 20;
      }
    };

    // =============================================
    // PAGE 1 - Cover
    // =============================================
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('CLUBE MAX', 20, 28);
    doc.setFontSize(14);
    doc.text('DE DESCONTO', 20, 37);

    y = 55;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(124, 58, 237);
    doc.text('Relatorio do Sistema', 20, y);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, y);
    y += 16;

    addLine();

    // Resumo numerico
    addSubtitle('📊 Numeros Gerais');
    y += 2;
    addBullet(`${partners.length} Parceiros cadastrados`);
    addBullet(`${products.length} Produtos com desconto`);
    addBullet(`${vouchers.length} Vouchers gerados`);
    addBullet(`${users.length} Usuarios registrados`);
    addBullet(`${subscriptions.length} Assinaturas ativas`);
    y += 6;

    // =============================================
    // ENTITIES
    // =============================================
    addPageIfNeeded(80);
    addTitle('🏗️ Estrutura de Dados (19 Entidades)');
    addLine();

    const entities = [
      { name: 'Partner', desc: 'Lojistas e empreendedores — categoria, localizacao, assinatura, WhatsApp Business' },
      { name: 'Product', desc: 'Produtos com desconto — nome, preco original, preco promocional, % OFF, visualizacoes' },
      { name: 'Voucher', desc: 'Cupons gerados para o cliente usar na loja com codigo unico e QR Code' },
      { name: 'FavoritePartner', desc: 'Lojas favoritas do usuario — dispara notificacao ao adicionar novo desconto' },
      { name: 'FavoriteProduct', desc: 'Produtos salvos nos favoritos do usuario' },
      { name: 'UserPoints', desc: 'Saldo de pontos, codigo de indicacao, estatisticas de referencias' },
      { name: 'Badge', desc: 'Conquistas gamificadas por compras, indicacoes, fidelidade e exploracao' },
      { name: 'StampCard', desc: 'Programa de selos — acumule selos e ganhe desconto surpresa ao completar' },
      { name: 'StampCardConfig', desc: 'Configuracao do programa de selos por parceiro' },
      { name: 'LoyaltyReward', desc: 'Recompensas da loja de fidelidade — troque pontos por descontos' },
      { name: 'LoyaltyRedemption', desc: 'Registro de resgates de recompensas da loja de fidelidade' },
      { name: 'Raffle', desc: 'Roletas de premios criadas pelos parceiros' },
      { name: 'RaffleSpin', desc: 'Registros de giros na roleta — usuario usa voucher para participar' },
      { name: 'Review', desc: 'Avaliacoes dos parceiros — nota 1 a 5 com comentario' },
      { name: 'Appointment', desc: 'Agendamento de servicos nos parceiros com data e horario' },
      { name: 'UserNotification', desc: 'Notificacoes in-app — novo cupom, voucher expirando, conquistas, agendamentos' },
      { name: 'Notification', desc: 'Notificacoes para o painel do parceiro' },
      { name: 'Referral', desc: 'Sistema de indicacao com recompensa em pontos' },
      { name: 'Subscription', desc: 'Planos: Usuario (R$19,99), Empreendedor (R$29,99) e Lojista (R$49,99)' },
      { name: 'NewsPost', desc: 'Feed de novidades e promocoes publicadas pelos parceiros' },
      { name: 'ProductView', desc: 'Contador de visualizacoes por produto para analytics' },
    ];

    entities.forEach(e => {
      addPageIfNeeded(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(124, 58, 237);
      doc.text(e.name, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(e.desc, 85, y);
      y += 7;
    });
    y += 6;

    // =============================================
    // PAGES
    // =============================================
    addPageIfNeeded(80);
    addTitle('🌐 Paginas');
    addLine();

    const pages = [
      { name: 'Home', desc: 'Dashboard: busca inteligente, produtos em destaque, parceiros proximos no mapa, feed de noticias, top ranqueados, badges de conquistas' },
      { name: 'Partners', desc: 'Diretorio com busca textual, filtros por categoria/nota, visualizacao em mapa, ordenacao por proximidade (geolocalizacao)' },
      { name: 'Products', desc: 'Catalogo com busca por nome/descricao/categoria, chips de categoria visuais, ordenacao por preco/relevancia' },
      { name: 'PartnerStore', desc: 'Vitrine individual do parceiro com produtos, roleta de premios, avaliacoes, agendamento de servicos' },
      { name: 'UserProfile', desc: 'Perfil com abas: visao geral, vouchers, favoritos, pagamentos, resgates, conquistas e assinatura' },
      { name: 'PartnerDashboard', desc: 'Painel do parceiro: produtos, vendas, analytics, agendamentos, fidelidade, selos, roleta, QR scanner, exportacao' },
      { name: 'LojistaManager', desc: 'Gestao de descontos, criacao/edicao de produtos, gerenciamento de vouchers' },
      { name: 'AdminDashboard', desc: 'Painel administrativo com visao geral da plataforma' },
      { name: 'Cart', desc: 'Carrinho de compras com gerenciamento de itens' },
      { name: 'MyVouchers', desc: 'Lista de vouchers ativos do usuario com QR Code para uso na loja' },
      { name: 'ReferralPage', desc: 'Sistema de indicacao: codigo unico, link de compartilhamento e estatisticas' },
      { name: 'LoyaltyStore', desc: 'Loja de fidelidade com catalogo de recompensas resgataveis por pontos' },
      { name: 'Leaderboard', desc: 'Ranking de usuarios e parceiros' },
      { name: 'Subscription', desc: 'Planos de assinatura com checkout via Stripe' },
      { name: 'PurchaseHistory', desc: 'Historico de compras e transacoes' },
      { name: 'PartnerSignup', desc: 'Cadastro de novos parceiros (lojista ou empreendedor)' },
      { name: 'ParceiroContato', desc: 'Landing page para captacao de parceiros' },
    ];

    pages.forEach(p => {
      addPageIfNeeded(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(124, 58, 237);
      doc.text(p.name, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const maxW = 115;
      const descLines = doc.splitTextToSize(p.desc, maxW);
      descLines.forEach((line, i) => {
        if (i === 0) {
          doc.text(line, 70, y);
        } else {
          y += 4.5;
          doc.text(line, 70, y);
        }
      });
      y += descLines.length > 1 ? (descLines.length * 4.5) : 7;
    });
    y += 6;

    // =============================================
    // FEATURES
    // =============================================
    addPageIfNeeded(60);
    addTitle('⚡ Funcionalidades');
    addLine();

    const features = [
      {
        title: '🔍 Descoberta Inteligente',
        items: [
          'Busca por nome, descricao e categoria em todos os produtos',
          'Filtros por categoria com chips visuais na pagina de produtos',
          'Geolocalizacao com ordenacao por parceiros mais proximos',
          'Visualizacao dos parceiros em mapa interativo (Leaflet)',
        ]
      },
      {
        title: '💸 Sistema de Descontos',
        items: [
          'Produtos com preco original, preco promocional e percentual de desconto',
          'Geracao de vouchers com codigo unico para uso na loja fisica',
          'QR Code para leitura rapida pelo parceiro',
          'Validade configurada por produto',
        ]
      },
      {
        title: '⭐ Favoritos Inteligentes',
        items: [
          'Favoritar parceiros e produtos individualmente',
          'Notificacao automatica quando loja favorita adiciona novo desconto',
          'Notificacao in-app (sininho) + e-mail para cada seguidor',
          'Aba de favoritos no perfil com acao direta de compra',
        ]
      },
      {
        title: '🎮 Gamificacao',
        items: [
          'Pontos por acoes na plataforma (compras, indicacoes, engajamento)',
          'Badges/conquistas em 4 categorias: compras, indicacoes, fidelidade e exploracao',
          'Leaderboard com ranking de usuarios',
        ]
      },
      {
        title: '🎟️ Programa de Selos (Stamp Card)',
        items: [
          'Parceiros configuram quantos selos para completar o cartao',
          'Ao completar, usuario revela um desconto surpresa aleatorio',
          'Codigo unico para resgatar o premio surpresa',
        ]
      },
      {
        title: '🎰 Roleta de Premios',
        items: [
          'Parceiros criam roletas com premios e pesos de probabilidade',
          'Usuarios usam vouchers para girar a roleta',
          'Premios instantaneos ao girar',
        ]
      },
      {
        title: '🏪 Loja de Fidelidade',
        items: [
          'Catalogo de recompensas: descontos percentuais, itens gratis, brindes',
          'Resgate com pontos acumulados na plataforma',
          'Codigo unico de resgate para apresentar ao parceiro',
        ]
      },
      {
        title: '📅 Agendamento',
        items: [
          'Usuarios agendam horario no parceiro para usar o voucher',
          'Status: pendente, confirmado, cancelado, concluido',
          'Notificacoes de confirmacao, cancelamento e lembrete 2h antes',
        ]
      },
      {
        title: '👥 Indique e Ganhe',
        items: [
          'Codigo unico de indicacao por usuario',
          'Link de compartilhamento para redes sociais',
          'Bonus em pontos para quem indica e para o novo usuario',
          'Multiplos niveis de recompensa',
        ]
      },
      {
        title: '📰 Feed de Novidades',
        items: [
          'Parceiros publicam promocoes e novidades (max 280 caracteres)',
          'Tags: promocao, novidade, destaque, evento, dica',
          'Exibicao na Home com logo e nome do parceiro',
        ]
      },
      {
        title: '💳 Pagamentos (Stripe)',
        items: [
          'Tres planos: Usuario (R$19,99/mes), Empreendedor (R$29,99/mes), Lojista (R$49,99/mes)',
          'Checkout seguro via Stripe com cartao de credito',
          'Periodo de teste gratuito para novos usuarios',
          'Portal do cliente Stripe para gerenciar assinatura',
          'Webhooks para processar eventos de pagamento automaticamente',
        ]
      },
      {
        title: '📊 Analytics para Parceiros',
        items: [
          'Painel com metricas de visualizacoes, vouchers gerados e usados',
          'Graficos de desempenho (Recharts)',
          'Exportacao de relatorios em PDF e Excel',
          'Relatorios mensais automaticos por e-mail',
        ]
      },
    ];

    features.forEach(f => {
      addPageIfNeeded(30);
      addSubtitle(f.title);
      f.items.forEach(item => addBullet(item));
      y += 4;
    });
    y += 4;

    // =============================================
    // AUTOMATIONS
    // =============================================
    addPageIfNeeded(40);
    addTitle('🤖 Automacoes');
    addLine();

    const automations = [
      { name: 'Notificar seguidores (novo produto)', trigger: 'Product create', desc: 'Quando parceiro favoritado cadastra produto com desconto ativo, notifica todos os seguidores via notificacao in-app e e-mail com detalhes do produto e % OFF' },
      { name: 'Lembrete de agendamento', trigger: 'Scheduled', desc: 'Envia lembrete 2h antes do agendamento para o usuario' },
      { name: 'Verificar expiracao de vouchers', trigger: 'Scheduled', desc: 'Notifica usuarios sobre vouchers proximos de expirar' },
      { name: 'Verificar assinaturas expiradas', trigger: 'Scheduled', desc: 'Desativa acesso de parceiros com assinatura vencida' },
      { name: 'Verificar subida de nivel', trigger: 'Entity', desc: 'Concede badges ao atingir marcos de pontos/indicacoes' },
      { name: 'Relatorio mensal de parceiros', trigger: 'Scheduled', desc: 'Envia relatorio mensal com metricas para cada parceiro' },
    ];

    automations.forEach(a => {
      addPageIfNeeded(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(124, 58, 237);
      doc.text(a.name, 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(`Gatilho: ${a.trigger}  |  ${a.desc}`, 22, y);
      y += 8;
    });
    y += 4;

    // =============================================
    // NOTIFICATIONS
    // =============================================
    addPageIfNeeded(30);
    addTitle('🔔 Sistema de Notificacoes');
    addLine();

    addBullet('Notificacoes in-app: sininho no header com badge de nao lidas');
    addBullet('E-mails transacionais: novo cupom, voucher expirando, agendamentos, conquistas');
    addBullet('Tipos de notificacao para usuarios: new_coupon, voucher_expiring, level_up, badge_earned, appointment_confirmed, appointment_cancelled, appointment_reminder_2h');
    addBullet('Tipos de notificacao para parceiros: new_voucher, voucher_used, new_review, subscription_expiring');
    addBullet('Notificacao em tempo real quando loja favorita adiciona novo desconto');
    y += 6;

    // =============================================
    // TECH STACK
    // =============================================
    addPageIfNeeded(40);
    addTitle('🛠️ Stack Tecnologico');
    addLine();

    addSubtitle('Frontend');
    addBullet('React 18 + Vite');
    addBullet('Tailwind CSS com design system (tokens CSS)');
    addBullet('shadcn/ui — biblioteca de componentes acessivel');
    addBullet('React Router DOM — navegacao SPA');
    addBullet('TanStack React Query — gerenciamento de estado do servidor');
    addBullet('Framer Motion — animacoes fluidas');
    addBullet('Recharts — graficos e analytics');
    addBullet('React Leaflet — mapas interativos');
    addBullet('React Quill — editor de texto rico');
    addBullet('Stripe.js — checkout de pagamentos');
    addBullet('QR Code — geracao de QR codes');
    addBullet('Lucide React — icones consistentes');
    y += 4;

    addSubtitle('Backend (Base44)');
    addBullet('Base44 BaaS — autenticacao, banco de dados, funcoes serverless');
    addBullet('Deno runtime para funcoes backend');
    addBullet('Stripe — pagamentos, assinaturas e webhooks');
    addBullet('Integracoes Core: LLM, Email, Upload, Image Generation');
    addBullet('Automacoes: scheduled, entity triggers');
    y += 4;

    addSubtitle('Mobile');
    addBullet('PWA-ready — publicacao para iOS e Android a partir do mesmo codigo');
    addBullet('Design responsivo — mobile-first com Tailwind');
    y += 6;

    // Footer
    addLine();
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('Clube Max de Desconto — Conectando descontos a voce', 105, y, { align: 'center' });
    y += 5;
    doc.text('clubemaxdescontos@gmail.com | (35) 98839-7979 | @clubemaxdescontos', 105, y, { align: 'center' });

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=Clube_Max_Desconto_Relatorio.pdf',
      },
    });
  } catch (error) {
    console.error('generateSystemReport error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});