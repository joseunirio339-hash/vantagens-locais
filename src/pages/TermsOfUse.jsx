import React from 'react';

export default function TermsOfUse() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Termos de Uso</h1>
      <p className="text-sm text-slate-500 mb-8">Última atualização: maio de 2026</p>

      <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">1. Aceitação dos Termos</h2>
          <p>
            Ao se cadastrar e utilizar o <strong>Clube Max Descontos</strong> (clubemaxdescontos.com.br), você concorda com estes Termos de Uso. Caso não concorde, não utilize a plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">2. O que é o Clube Max Descontos</h2>
          <p>
            Somos uma plataforma de clube de descontos que conecta assinantes a parceiros locais (lojistas e empreendedores). Assinantes têm acesso a descontos exclusivos por meio de vouchers digitais.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">3. Cadastro e Conta</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Você deve ter pelo menos 18 anos para se cadastrar</li>
            <li>As informações fornecidas devem ser verdadeiras e atualizadas</li>
            <li>Você é responsável pela segurança da sua senha e conta</li>
            <li>É proibido criar múltiplas contas para se beneficiar de ofertas</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">4. Assinaturas e Pagamentos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>As assinaturas são cobradas mensalmente via cartão de crédito</li>
            <li>Os valores são os exibidos na página de assinatura no momento da contratação</li>
            <li>O período de teste gratuito (quando disponível) não requer cartão</li>
            <li>Pagamentos são processados com segurança pelo Stripe</li>
            <li>Cancelamentos podem ser solicitados a qualquer momento pelo suporte</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">5. Vouchers e Descontos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Vouchers são válidos apenas para assinantes ativos</li>
            <li>Cada voucher possui validade e condições específicas definidas pelo parceiro</li>
            <li>Vouchers não podem ser transferidos, revendidos ou trocados por dinheiro</li>
            <li>O desconto é aplicado pelo parceiro no momento da apresentação do voucher</li>
            <li>A plataforma não se responsabiliza por recusa indevida de vouchers por parceiros</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">6. Parceiros</h2>
          <p>
            Lojistas e empreendedores cadastrados como parceiros concordam em:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Honrar os descontos anunciados na plataforma</li>
            <li>Manter suas informações atualizadas</li>
            <li>Não praticar discriminação no atendimento a portadores de vouchers</li>
            <li>Pagar a assinatura do plano de parceiro para manter o perfil ativo</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">7. Proibições</h2>
          <p>É proibido:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Usar a plataforma para fins ilegais ou fraudulentos</li>
            <li>Falsificar vouchers ou criar códigos não autorizados</li>
            <li>Tentar burlar o sistema de autenticação ou pagamento</li>
            <li>Publicar conteúdo ofensivo, falso ou enganoso</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">8. Limitação de Responsabilidade</h2>
          <p>
            O Clube Max Descontos atua como intermediário entre assinantes e parceiros. Não nos responsabilizamos pela qualidade dos produtos/serviços dos parceiros, nem por prejuízos decorrentes do uso inadequado da plataforma por terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">9. Cancelamento de Conta</h2>
          <p>
            Reservamos o direito de suspender ou cancelar contas que violem estes termos, sem aviso prévio, em casos de fraude ou comportamento abusivo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">10. Alterações nos Termos</h2>
          <p>
            Podemos atualizar estes termos a qualquer momento. O uso continuado da plataforma após as alterações implica aceitação dos novos termos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">11. Lei Aplicável</h2>
          <p>
            Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca do domicílio do usuário para dirimir quaisquer controvérsias.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">12. Contato</h2>
          <p>
            Dúvidas ou sugestões: <strong>contato@clubemaxdescontos.com.br</strong>
          </p>
        </section>
      </div>
    </div>
  );
}