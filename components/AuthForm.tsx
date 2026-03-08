import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, Phone, KeyRound } from 'lucide-react';
import { signIn, signUp, resetPassword } from '../services/supabaseService';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset' | 'update_password'>(() => {
    if (typeof window !== 'undefined' && window.location.href.includes('type=recovery')) {
      return 'update_password';
    }
    return 'login';
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'update_password') {
        const { updatePassword } = await import('../services/supabaseService');
        const { success, error: updateError } = await updatePassword(formData.password);
        if (success) {
          setSuccessMsg('Senha atualizada com sucesso! Pode fazer login agora.');
          setMode('login');
          setFormData({ ...formData, password: '' });
          // Clear hash from URL
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          setError(updateError || 'Erro ao atualizar a senha.');
        }
        setIsLoading(false);
        return;
      }

      if (mode === 'reset') {
        const { success, error: resetError } = await resetPassword(formData.email);
        if (success) {
          setSuccessMsg('Enviámos um link de recuperação para o seu email.');
          setFormData({ ...formData, password: '' });
        } else {
          setError(resetError || 'Erro ao enviar email de recuperação.');
        }
        setIsLoading(false);
        return;
      }

      let user: User | null = null;
      
      if (mode === 'login') {
        user = await signIn(formData.email, formData.password);
        if (!user) {
          setError('Email ou senha incorretos.');
          setIsLoading(false);
          return;
        }
      } else {
        user = await signUp(formData.email, formData.password, formData.name);
        if (!user) {
          setError('Erro ao criar conta. O email pode já estar em uso.');
          setIsLoading(false);
          return;
        }
      }
      
      onLogin(user);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError('Ocorreu um erro na autenticação. Verifique os seus dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Crie a sua conta' : mode === 'reset' ? 'Recuperar Senha' : 'Nova Senha'}
          </h2>
          <p className="text-slate-400 text-sm">
            {mode === 'login' ? 'Aceda aos seus trabalhos académicos' : mode === 'register' ? 'Comece a gerar trabalhos humanizados' : mode === 'reset' ? 'Insira o seu email para receber um link de recuperação' : 'Defina a sua nova senha de acesso'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
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

            {mode !== 'update_password' && (
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
            )}

            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-700 ml-1">
                    {mode === 'update_password' ? 'Nova Senha' : 'Senha'}
                  </label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => { setMode('reset'); setError(''); setSuccessMsg(''); }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    required
                    type="password"
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            )}

            {error && (
                <div className="text-red-600 text-sm text-center font-medium bg-red-50 p-2 rounded">
                    {error}
                </div>
            )}
            
            {successMsg && (
                <div className="text-emerald-600 text-sm text-center font-medium bg-emerald-50 p-2 rounded">
                    {successMsg}
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
                  {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Registar' : mode === 'reset' ? 'Enviar Link' : 'Guardar Nova Senha'} 
                  {(mode === 'reset' || mode === 'update_password') ? <KeyRound size={18} /> : <ArrowRight size={18} />}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {(mode === 'reset' || mode === 'update_password') ? (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); window.history.replaceState(null, '', window.location.pathname); }}
                className="text-blue-600 font-bold hover:underline text-sm"
              >
                Voltar ao Login
              </button>
            ) : (
              <p className="text-sm text-slate-600">
                {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccessMsg(''); }}
                  className="ml-1 text-blue-600 font-semibold hover:underline focus:outline-none"
                >
                  {mode === 'login' ? 'Criar agora' : 'Fazer login'}
                </button>
              </p>
            )}
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