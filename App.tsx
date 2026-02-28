import React, { useState, useEffect } from 'react';
import { PaperRequest, GeneratedPaper, Order, OrderStatus, User, SystemSettings } from './types';
import { generatePaperPipeline } from './services/geminiService';
import { supabase } from './lib/supabase';
import { uploadPaymentProof, createOrder, fetchAllOrders, fetchUserOrders, updateOrderStatus } from './services/supabaseService';
import GeneratorForm from './components/GeneratorForm';
import PaperPreview from './components/PaperPreview';
import AdminDashboard from './components/AdminDashboard';
import AuthForm from './components/AuthForm';
import TermsOfUse from './components/TermsOfUse';
import PrivacyPolicy from './components/PrivacyPolicy';
import { Book, LayoutDashboard, User as UserIcon, LogOut, Upload, LogIn, CheckCircle, X, Building2 } from 'lucide-react';

// Mock Data for Admin
const MOCK_ORDERS: Order[] = [
  { id: '1', user: 'Ana Silva', theme: 'Ética na IA', date: '25 Out 2024', status: 'Pendente', amount: 2000 },
  { id: '2', user: 'Carlos Santos', theme: 'Economia Global', date: '24 Out 2024', status: 'Aprovado', amount: 1500 },
  { id: '3', user: 'Maria Costa', theme: 'Urbanismo Sustentável', date: '24 Out 2024', status: 'Rejeitado', amount: 1000 },
];

const DEFAULT_SETTINGS: SystemSettings = {
  price: 1000,
  bankAccounts: [
    {
      id: '1',
      bankName: 'Banco BAI',
      iban: 'AO06 0000 0000 0000 0000 0',
      accountHolder: 'Trabalho Pronto Lda'
    }
  ]
};

type View = 'home' | 'preview' | 'admin' | 'login';

export default function App() {
  // Inicialização de estado com persistência (LocalStorage) para suportar refresh e troca de contas no demo
  const [view, setView] = useState<View>('home');
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tp_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const role = session.user.email === 'bu.ila@hotmail.com' ? 'admin' : 'client';
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || 'Utilizador',
          email: session.user.email || '',
          role: role,
          balance: 500
        });
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role = session.user.email === 'bu.ila@hotmail.com' ? 'admin' : 'client';
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || 'Utilizador',
          email: session.user.email || '',
          role: role,
          balance: 500
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  
  const [currentPaper, setCurrentPaper] = useState<GeneratedPaper | null>(() => {
    const saved = localStorage.getItem('tp_currentPaper');
    return saved ? JSON.parse(saved) : null;
  });

  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem('tp_isUnlocked') === 'true';
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  
  // Admin State com Persistência
  const [orders, setOrders] = useState<Order[]>([]);

  // Carregar pedidos do Supabase
  useEffect(() => {
    const loadOrders = async () => {
      if (!user) {
        setOrders([]);
        return;
      }
      try {
        if (user.role === 'admin') {
          const allOrders = await fetchAllOrders();
          setOrders(allOrders);
        } else {
          const userOrders = await fetchUserOrders(user.id);
          setOrders(userOrders);
        }
      } catch (error) {
        console.error("Failed to load orders", error);
      }
    };
    loadOrders();
  }, [user]);

  // Configurações do Sistema com Persistência
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('tp_settings');
    // Migration logic for old settings format if necessary
    const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    if (!parsed.bankAccounts) {
        return DEFAULT_SETTINGS;
    }
    return parsed;
  });

  // Efeitos de Persistência
  useEffect(() => {
    if (user) localStorage.setItem('tp_user', JSON.stringify(user));
    else localStorage.removeItem('tp_user');
  }, [user]);

  useEffect(() => {
    if (currentPaper) localStorage.setItem('tp_currentPaper', JSON.stringify(currentPaper));
    else localStorage.removeItem('tp_currentPaper');
  }, [currentPaper]);

  useEffect(() => {
    localStorage.setItem('tp_isUnlocked', String(isUnlocked));
  }, [isUnlocked]);

  useEffect(() => {
    localStorage.setItem('tp_settings', JSON.stringify(settings));
  }, [settings]);

  // Efeito Mágico: Desbloqueio Automático ao Aprovar Pedido
  // Verifica se existe um pedido APROVADO que corresponda ao utilizador e ao tema atual
  useEffect(() => {
    if (currentPaper && user) {
      const hasApprovedOrder = orders.some(o => 
        o.user === user.name && 
        o.theme === currentPaper.title && 
        o.status === 'Aprovado'
      );
      
      if (hasApprovedOrder && !isUnlocked) {
        setIsUnlocked(true);
        if (view === 'preview') {
            // Pequeno feedback visual se estiver na tela
            // alert('Pagamento confirmado! O documento foi desbloqueado.'); 
        }
      }
    }
  }, [orders, currentPaper, user, isUnlocked, view]);

  // Auth Handlers
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'admin') {
      setView('admin');
    } else {
      setView('home');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('home'); 
    // Nota: Não limpamos o currentPaper aqui para permitir que o utilizador
    // faça logout, entre como admin, aprove, e volte como utilizador para ver o resultado (Demo Flow)
  };

  const handleGenerate = async (request: PaperRequest) => {
    if (!user) {
      setView('login');
      return;
    }

    setLoading(true);
    setLoadingStatus('Iniciando pipeline...');
    try {
      const content = await generatePaperPipeline(request, (status) => setLoadingStatus(status));
      setCurrentPaper({
        title: request.theme,
        content: content,
        request: request,
        timestamp: new Date()
      });
      setIsUnlocked(false); // Novo trabalho começa bloqueado
      setView('preview');
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar o trabalho. Verifique a chave de API.');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!user || !currentPaper) return;
    
    if (!proofFile) {
      alert("Por favor, anexe o comprovativo de pagamento antes de enviar.");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      // Upload do comprovativo para o Supabase Storage
      const proofUrl = await uploadPaymentProof(proofFile, user.id);

      // Cria um novo pedido pendente com o preço calculado por página
      const calculatedAmount = settings.price * (currentPaper.content.split('<!--PAGE_BREAK-->').length);
      
      const newOrder = await createOrder(
        user.id,
        user.name,
        currentPaper,
        calculatedAmount,
        proofUrl
      );
      
      setOrders(prev => [newOrder, ...prev]);
      setShowPaymentModal(false);
      setProofFile(null);
      alert('Comprovativo enviado! O estado do seu pedido é agora "Pendente". Aguarde aprovação do administrador.');
    } catch (error: any) {
      console.error(error);
      alert('Erro ao enviar comprovativo: ' + error.message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Admin Actions
  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status);
      setOrders(prevOrders => prevOrders.map(o => o.id === id ? { ...o, status } : o));
    } catch (error: any) {
      console.error(error);
      alert('Erro ao atualizar estado: ' + error.message);
    }
  };

  const handleUpdateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Book className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">Trabalho<span className="text-blue-600">Pronto</span></span>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => setView('home')} 
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${view === 'home' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Gerador
              </button>
               {currentPaper && user && (
                <button 
                    onClick={() => setView('preview')} 
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${view === 'preview' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Meu Trabalho {isUnlocked && <span className="ml-1 text-green-500 text-xs">●</span>}
                </button>
               )}
              {user && user.role === 'admin' && (
                <button 
                  onClick={() => setView('admin')} 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${view === 'admin' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <LayoutDashboard size={16} /> Admin
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-slate-700">{user.name}</p>
                    <p className="text-xs text-slate-500">Saldo: {user.balance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border border-blue-200">
                    <UserIcon size={16} />
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                    title="Sair"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setView('login')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition shadow-sm"
                >
                  <LogIn size={16} /> Entrar
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {view === 'login' && (
          <div className="animate-fade-in">
             <AuthForm onLogin={handleLogin} />
          </div>
        )}

        {view === 'home' && (
          <div className="max-w-4xl mx-auto">
             
             {/* Hero Image */}
             <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-10 shadow-xl group">
              <img 
                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80" 
                alt="Estudantes universitários africanos felizes" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex items-end">
                <div className="p-6 md:p-10 text-white max-w-2xl">
                   <div className="flex items-center gap-2 mb-3">
                     <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Novidade</span>
                     <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium border border-white/30">Angola 🇦🇴</span>
                   </div>
                   <h2 className="text-3xl md:text-4xl font-bold mb-2 shadow-sm">O teu sucesso académico começa aqui.</h2>
                   <p className="text-slate-200 text-sm md:text-base font-medium hidden md:block">
                     Junta-te a milhares de estudantes angolanos que usam o Trabalho Pronto para melhorar as suas notas e poupar tempo.
                   </p>
                </div>
              </div>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Trabalhos Escolares <span className="text-blue-600">Humanizados</span></h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Gere trabalhos académicos completos, com escrita natural e anti-plágio. 
                Perfeito para Ensino Médio e Universidade.
              </p>
            </div>
            
            {!user ? (
               <div className="grid md:grid-cols-2 gap-0 md:gap-8 items-stretch bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="p-8 flex flex-col justify-center space-y-4 text-center md:text-left">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto md:mx-0 mb-2">
                        <UserIcon size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">Junta-te aos melhores</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Não percas mais noites em claro. Cria a tua conta agora para começares a gerar trabalhos de alta qualidade em segundos, formatados e prontos para entrega.
                    </p>
                    <button 
                        onClick={() => setView('login')}
                        className="mt-2 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 hover:shadow-lg transition w-full"
                    >
                        Entrar ou Criar Conta
                    </button>
                  </div>
                  <div className="relative min-h-[250px] md:min-h-full">
                     <img 
                       src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                       alt="Grupo de estudantes africanos a estudar" 
                       className="absolute inset-0 w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply"></div>
                  </div>
               </div>
            ) : (
               <GeneratorForm onSubmit={handleGenerate} isLoading={loading} loadingStatus={loadingStatus} />
            )}
          </div>
        )}

        {view === 'preview' && currentPaper && (
          <PaperPreview 
            paper={currentPaper} 
            isUnlocked={isUnlocked} 
            onRequestUnlock={() => setShowPaymentModal(true)}
            onBack={() => setView('home')}
          />
        )}

        {view === 'admin' && user?.role === 'admin' ? (
          <AdminDashboard 
            orders={orders} 
            onUpdateStatus={handleUpdateStatus} 
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        ) : view === 'admin' ? (
           <div className="text-center py-20">
             <h2 className="text-2xl font-bold text-slate-800">Acesso Negado</h2>
             <p className="text-slate-500">Apenas administradores podem ver esta página.</p>
             <button onClick={() => setView('home')} className="mt-4 text-blue-600 hover:underline">Voltar ao Início</button>
           </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
             <Book className="text-blue-500" size={20} />
             <span className="text-white font-bold text-lg">TrabalhoPronto</span>
          </div>
          <p className="text-sm mb-4">
            O Trabalho Pronto é uma ferramenta de apoio ao estudo. 
            A responsabilidade pelo uso do conteúdo é inteiramente do utilizador.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <button onClick={() => setShowTerms(true)} className="hover:text-white transition">Termos de Uso</button>
            <button onClick={() => setShowPrivacy(true)} className="hover:text-white transition">Privacidade</button>
            <a href="https://wa.me/244958582309" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-1">
              Suporte (+244 958 582 309)
            </a>
          </div>
          <p className="mt-8 text-xs text-slate-600">© 2024 Trabalho Pronto Angola. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Terms and Privacy Modals */}
      {showTerms && <TermsOfUse onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex-shrink-0">Desbloquear Documento</h3>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-blue-800 font-medium">Preço por página:</p>
                  <p className="text-sm font-bold text-blue-900">{settings.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-blue-800 font-medium">Total de páginas (inclui Sumário e Referências):</p>
                  <p className="text-sm font-bold text-blue-900">{currentPaper ? currentPaper.content.split('<!--PAGE_BREAK-->').length : 1}</p>
                </div>
                <div className="border-t border-blue-200 pt-2 mb-4 flex justify-between items-center">
                  <p className="text-sm text-blue-800 font-bold">Valor Total a Pagar:</p>
                  <p className="text-lg font-bold text-blue-900">
                    {((currentPaper ? currentPaper.content.split('<!--PAGE_BREAK-->').length : 1) * settings.price).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </p>
                </div>
                
                <p className="text-xs text-blue-700 font-bold mb-2 uppercase tracking-wide">Contas Disponíveis:</p>
                <div className="space-y-3">
                  {settings.bankAccounts && settings.bankAccounts.length > 0 ? (
                    settings.bankAccounts.map((account) => (
                      <div key={account.id} className="bg-white/60 p-3 rounded border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Building2 size={12} className="text-blue-500" />
                          <p className="text-xs font-bold text-blue-800">{account.bankName}</p>
                        </div>
                        <p className="text-xs text-blue-600 font-mono bg-white p-1.5 rounded border border-blue-50 select-all mb-1">
                           {account.iban}
                        </p>
                        <p className="text-[10px] text-blue-500">Titular: {account.accountHolder}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-red-500">Nenhuma conta bancária configurada.</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Envie o Comprovativo (Foto/PDF)
                </label>
                
                {!proofFile ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50 relative group">
                    <Upload className="mx-auto text-slate-400 mb-2 group-hover:text-blue-500" size={32} />
                    <p className="text-sm text-slate-500 font-medium">Clique para selecionar o ficheiro</p>
                    <p className="text-xs text-slate-400 mt-1">Suporta JPG, PNG ou PDF</p>
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      id="proof-upload" 
                      accept="image/*,.pdf"
                      onChange={handleFileSelect} 
                    />
                  </div>
                ) : (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-green-800 truncate">{proofFile.name}</p>
                        <p className="text-xs text-green-600">{(proofFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setProofFile(null)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-slate-100">
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setProofFile(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handlePaymentSubmit}
                disabled={!proofFile || isSubmittingPayment}
                className={`flex-1 py-2.5 text-white font-medium rounded-lg transition shadow-md
                   ${(!proofFile || isSubmittingPayment) ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                `}
              >
                {isSubmittingPayment ? 'A enviar...' : 'Enviar e Desbloquear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}