import React from 'react';
import { Order, OrderStatus, SystemSettings, BankAccount } from '../types';
import { CheckCircle, XCircle, Clock, Eye, Download, Settings, Save, CreditCard, Building2, Trash2, Plus, User as UserIcon } from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, onUpdateStatus, settings, onUpdateSettings }) => {
  const [formData, setFormData] = React.useState(settings);
  const [isSaved, setIsSaved] = React.useState(false);

  // Update local state if settings prop changes (e.g. initial load)
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAccountChange = (id: string, field: keyof BankAccount, value: string) => {
    const updatedAccounts = formData.bankAccounts.map(acc => 
        acc.id === id ? { ...acc, [field]: value } : acc
    );
    setFormData({ ...formData, bankAccounts: updatedAccounts });
  };

  const handleAddAccount = () => {
    const newAccount: BankAccount = {
        id: Math.random().toString(36).substr(2, 9),
        bankName: '',
        iban: '',
        accountHolder: ''
    };
    setFormData({ ...formData, bankAccounts: [...formData.bankAccounts, newAccount] });
  };

  const handleRemoveAccount = (id: string) => {
    const updatedAccounts = formData.bankAccounts.filter(acc => acc.id !== id);
    setFormData({ ...formData, bankAccounts: updatedAccounts });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Aprovado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" /> Aprovado</span>;
      case 'Rejeitado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} className="mr-1" /> Rejeitado</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" /> Pendente</span>;
    }
  };

  const revenue = orders
    .filter(o => o.status === 'Aprovado')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Painel de Administração</h2>
        <span className="text-sm text-slate-500">Gestão global do sistema</span>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium">Receita Total</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{revenue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium">Pedidos Pendentes</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{orders.filter(o => o.status === 'Pendente').length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium">Total de Trabalhos</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{orders.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Table - Takes up 2/3 space on large screens */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Pedidos Recentes</h3>
            </div>
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-white text-slate-800 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Utilizador</th>
                    <th className="px-6 py-3">Tema</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">
                         {order.user}
                         <div className="text-xs text-slate-400 font-normal">{order.date}</div>
                      </td>
                      <td className="px-6 py-4 truncate max-w-[150px]" title={order.theme}>{order.theme}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex flex-col items-end gap-2">
                            {order.proofUrl && (
                                <button 
                                    onClick={() => window.open(order.proofUrl, '_blank')}
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-medium"
                                >
                                    <Eye size={12} /> Ver Comp.
                                </button>
                            )}
                            {order.status === 'Pendente' && (
                            <div className="flex items-center justify-end gap-1">
                                <button 
                                onClick={() => onUpdateStatus(order.id, 'Aprovado')}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition" title="Aprovar"
                                >
                                <CheckCircle size={18} />
                                </button>
                                <button 
                                onClick={() => onUpdateStatus(order.id, 'Rejeitado')}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition" title="Rejeitar"
                                >
                                <XCircle size={18} />
                                </button>
                            </div>
                            )}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">Nenhum pedido encontrado.</div>
              )}
            </div>
          </div>

          {/* Settings Panel - Takes up 1/3 space on large screens */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 h-fit">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                <Settings className="text-slate-600" size={20} />
                <h3 className="font-bold text-slate-800">Configurações de Pagamento</h3>
              </div>
              <div className="p-6">
                <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Preço do Documento (Kz)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">Kz</span>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4 mt-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase">Contas Bancárias</label>
                            <button 
                                type="button" 
                                onClick={handleAddAccount}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                            >
                                <Plus size={14} /> Adicionar
                            </button>
                        </div>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                            {formData.bankAccounts.map((account, index) => (
                                <div key={account.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 relative group">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">#{index + 1}</span>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveAccount(account.id)}
                                                className="text-slate-400 hover:text-red-500 transition p-1"
                                                title="Remover conta"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 mb-0.5">Banco</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ex: Banco BAI"
                                                value={account.bankName}
                                                onChange={e => handleAccountChange(account.id, 'bankName', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 mb-0.5">IBAN</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="AO06..."
                                                value={account.iban}
                                                onChange={e => handleAccountChange(account.id, 'iban', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm font-mono focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500 mb-0.5">Titular</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Nome Completo"
                                                value={account.accountHolder}
                                                onChange={e => handleAccountChange(account.id, 'accountHolder', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {formData.bankAccounts.length === 0 && (
                                <p className="text-xs text-center text-slate-400 italic py-2">Nenhuma conta adicionada.</p>
                            )}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className={`w-full py-2.5 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 mt-2
                            ${isSaved ? 'bg-green-600' : 'bg-slate-900 hover:bg-slate-800'}
                        `}
                    >
                        {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
                        {isSaved ? 'Guardado com Sucesso!' : 'Guardar Alterações'}
                    </button>
                </form>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;