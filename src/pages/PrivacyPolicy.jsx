import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Política de Privacidade</h1>
      <p className="text-sm text-slate-500 mb-8">Última atualização: maio de 2026</p>

      <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">1. Quem somos</h2>
          <p>
            O <strong>Clube Max Descontos</strong> é uma plataforma de descontos e benefícios exclusivos que conecta consumidores a parceiros locais. Operamos o site <strong>clubemaxdescontos.com.br</strong> e nos comprometemos a proteger sua privacidade.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">2. Dados que coletamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nome completo e endereço de e-mail (no cadastro)</li>
            <li>CPF (para geração de vouchers)</li>
            <li>Informações de pagamento (processadas com segurança pelo Stripe — não armazenamos dados de cartão)</li>
            <li>Dados de uso da plataforma (visualizações, cliques, vouchers gerados)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">3. Como usamos seus dados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Para criar e gerenciar sua conta</li>
            <li>Para processar pagamentos de assinaturas</li>
            <li>Para gerar e validar vouchers de desconto</li>
            <li>Para enviar notificações e e-mails sobre sua conta (ex: confirmação de voucher)</li>
            <li>Para melhorar a plataforma e a experiência do usuário</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">4. Compartilhamento de dados</h2>
          <p>
            Seus dados <strong>não são vendidos</strong> a terceiros. Compartilhamos informações apenas com:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Stripe</strong> — para processamento seguro de pagamentos</li>
            <li><strong>Parceiros do Clube</strong> — apenas o nome e CPF necessários para validar um voucher</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">5. Seus direitos (LGPD)</h2>
          <p>De acordo com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018), você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou incorretos</li>
            <li>Solicitar a exclusão de seus dados</li>
            <li>Revogar o consentimento a qualquer momento</li>
          </ul>
          <p className="mt-2">
            Para exercer seus direitos, entre em contato: <strong>contato@clubemaxdescontos.com.br</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">6. Cookies</h2>
          <p>
            Utilizamos cookies essenciais para o funcionamento da plataforma (autenticação e preferências). Não utilizamos cookies de rastreamento de terceiros para publicidade.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">7. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou destruição. Todos os pagamentos são processados pelo Stripe, certificado PCI-DSS.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">8. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas por e-mail ou aviso na plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">9. Contato</h2>
          <p>
            Dúvidas? Entre em contato: <strong>contato@clubemaxdescontos.com.br</strong>
          </p>
        </section>
      </div>
    </div>
  );
}