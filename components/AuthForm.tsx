import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, Phone } from 'lucide-react';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulação de delay de rede
    setTimeout(() => {
      // Lógica de Autenticação Atualizada
      
      // Credenciais Admin Específicas
      const ADMIN_EMAIL = 'bu.ila@hotmail.com';
      const ADMIN_PASS = 'Aurio@bianca-1';

      if (isLogin && formData.email === ADMIN_EMAIL) {
         if (formData.password === ADMIN_PASS) {
             const adminUser: User = {
                id: 'admin-001',
                name: 'Administrador (Bu Ila)',
                email: ADMIN_EMAIL,
                role: 'admin',
                balance: 0
             };
             onLogin(adminUser);
         } else {
             setError('Senha incorreta para conta administrativa.');
             setIsLoading(false);
             return;
         }
      } else {
          // Lógica para usuários normais (cliente)
          // Em mock, qualquer outro email/senha loga como cliente
          const mockUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            name: isLogin ? 'Cliente' : formData.name,
            email: formData.email,
            role: 'client',
            balance: 500 // Bónus de boas-vindas mock
          };
          onLogin(mockUser);
      }
      
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-1">
            {isLogin ? 'Bem-vindo de volta' : 'Crie a sua conta'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isLogin ? 'Aceda aos seus trabalhos académicos' : 'Comece a gerar trabalhos humanizados'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 ml-1">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon size={18} />
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  required
                  type="email"
                  placeholder="exemplo@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 ml-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error && (
                <div className="text-red-600 text-sm text-center font-medium bg-red-50 p-2 rounded">
                    {error}
                </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2
                ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99]'}
              `}
            >
              {isLoading ? (
                'Processando...'
              ) : (
                <>
                  {isLogin ? 'Entrar' : 'Registar'} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-blue-600 font-semibold hover:underline focus:outline-none"
              >
                {isLogin ? 'Criar agora' : 'Fazer login'}
              </button>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400 mb-1">Dificuldades no acesso?</p>
             <a href="https://wa.me/244958582309" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition">
                <Phone size={14} /> Suporte: +244 958 582 309
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;