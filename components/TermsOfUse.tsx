import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface TermsOfUseProps {
  onClose: () => void;
}

const TermsOfUse: React.FC<TermsOfUseProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <ShieldCheck className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold">Termos de Uso</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto text-slate-600 space-y-6 text-sm leading-relaxed custom-scrollbar">
          
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">1. Sobre a Plataforma</h3>
            <p>O Trabalho Pronto é uma plataforma digital que fornece ferramentas de apoio à produção de conteúdos académicos e escolares.</p>
            <p className="mt-2">O serviço destina-se exclusivamente a fins educativos, como:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Apoio ao estudo</li>
              <li>Inspiração</li>
              <li>Estruturação de trabalhos</li>
              <li>Auxílio na organização de ideias</li>
            </ul>
            <p className="mt-2 font-medium">O utilizador é responsável pelo uso final do conteúdo gerado.</p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">2. Responsabilidade do Utilizador</h3>
            <p>Ao utilizar o Trabalho Pronto, o utilizador declara que:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>É responsável por rever e adaptar o conteúdo antes de qualquer entrega académica.</li>
              <li>Não utilizará a plataforma para violar regras internas de instituições de ensino.</li>
              <li>Não utilizará o serviço para fins ilegais ou fraudulentos.</li>
              <li>Assume total responsabilidade pelo uso do material gerado.</li>
            </ul>
            <p className="mt-2 text-amber-600 font-medium">O Trabalho Pronto não se responsabiliza por penalizações académicas resultantes do uso indevido da ferramenta.</p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">3. Natureza do Conteúdo</h3>
            <p>O conteúdo gerado pela plataforma:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>É automatizado.</li>
              <li>Pode conter imprecisões.</li>
              <li>Deve ser sempre revisado pelo utilizador.</li>
              <li>Não substitui pesquisa académica própria.</li>
            </ul>
            <p className="mt-2">Não garantimos aprovação, notas específicas ou aceitação institucional.</p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">4. Pagamentos</h3>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>O acesso a downloads completos pode exigir pagamento.</li>
              <li>Os valores são definidos por página ou por pacote.</li>
              <li>Pagamentos confirmados desbloqueiam o conteúdo conforme descrito no momento da compra.</li>
              <li><strong>Não há reembolso</strong> após a geração e disponibilização do conteúdo.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">5. Propriedade Intelectual</h3>
            <p>Após a geração e liberação do trabalho:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>O utilizador pode usar o conteúdo para fins pessoais.</li>
              <li>É proibida a revenda direta do conteúdo sem autorização.</li>
              <li>O sistema e a tecnologia do Trabalho Pronto permanecem propriedade da plataforma.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">6. Limitação de Garantias</h3>
            <p>O Trabalho Pronto não garante:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Indetectabilidade por sistemas externos.</li>
              <li>Aprovação automática em qualquer instituição.</li>
              <li>Ausência total de semelhanças com outros textos.</li>
            </ul>
            <p className="mt-2">A plataforma é ferramenta de apoio e não substitui responsabilidade individual.</p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">7. Suspensão de Conta</h3>
            <p>Reservamo-nos o direito de:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Suspender contas que usem o sistema de forma abusiva.</li>
              <li>Bloquear utilizadores envolvidos em fraude ou manipulação de pagamento.</li>
              <li>Alterar funcionalidades sem aviso prévio.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">8. Alterações aos Termos</h3>
            <p>Os Termos de Uso podem ser atualizados a qualquer momento. O uso contínuo da plataforma implica aceitação automática das novas condições.</p>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition shadow-sm"
          >
            Entendi e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;