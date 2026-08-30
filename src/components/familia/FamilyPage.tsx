import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShoppingCart,
  Link as LinkIcon,
  Unlink,
  Mail,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Heart,
  Crown,
  Lock,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Modal } from '../ui/Modal';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isOwner?: boolean;
  type: 'linked' | 'unlinked';
  joinedAt: string;
}

export const FamilyPage: React.FC = () => {
  const { user } = useFinancial();

  const [members, setMembers] = useState<FamilyMember[]>([
    {
      id: 'mem-1',
      name: 'Mariane Farias Aguiar',
      email: 'mary031fariias@gmail.com',
      isOwner: false,
      type: 'linked',
      joinedAt: '12/05/2026',
    },
    {
      id: 'mem-2',
      name: user.name || 'Liverton da Ponte Aguiar',
      email: user.email || 'liverton.aguiar@hotmail.com',
      phone: '85985949115',
      isOwner: true,
      type: 'linked',
      joinedAt: '01/01/2026',
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formType, setFormType] = useState<'linked' | 'unlinked'>('linked');

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormType('linked');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (m: FamilyMember) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormEmail(m.email);
    setFormPhone(m.phone || '');
    setFormType(m.type);
    setIsAddModalOpen(true);
  };

  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;

    if (editingMember) {
      setMembers(prev =>
        prev.map(m =>
          m.id === editingMember.id
            ? { ...m, name: formName, email: formEmail, phone: formPhone, type: formType }
            : m
        )
      );
    } else {
      const newM: FamilyMember = {
        id: 'mem-' + Date.now(),
        name: formName,
        email: formEmail,
        phone: formPhone,
        isOwner: false,
        type: formType,
        joinedAt: new Date().toLocaleDateString('pt-BR'),
      };
      setMembers(prev => [newM, ...prev]);
    }
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Title & Header Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Família</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gerencie os membros da sua família financeira
          </p>
        </div>

        {/* Adquirir +1 Membro Button */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all self-start sm:self-auto"
        >
          <ShoppingCart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Adquirir +1 Membro</span>
        </button>
      </div>

      {/* Card: Minha Família */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Minha Família</h3>
        </div>
        <p className="text-xs text-slate-400 font-medium -mt-2">{members.length} membros</p>

        {/* Member Cards List */}
        <div className="space-y-3 pt-2">
          {members.map((member) => {
            const initial = member.name.charAt(0).toUpperCase();

            return (
              <div
                key={member.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs flex items-center justify-between gap-4 transition-all"
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#4f46e5] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {initial}
                    </div>
                    {member.isOwner && (
                      <span className="absolute -top-1 -right-1 text-base leading-none drop-shadow">
                        👑
                      </span>
                    )}
                  </div>

                  {/* Name, Email, Phone, Badges */}
                  <div className="min-w-0 space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {member.name}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </span>

                      {member.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{member.phone}</span>
                        </span>
                      )}
                    </div>

                    {/* Status Pill Badge */}
                    <div className="pt-0.5">
                      {member.type === 'linked' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold shadow-xs">
                          <LinkIcon className="w-2.5 h-2.5 text-slate-300" />
                          Vinculado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          <Unlink className="w-2.5 h-2.5" />
                          Não Vinculado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(member)}
                    className="p-2 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    title="Editar membro"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {!member.isOwner && (
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Excluir membro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card: Tipos de Vínculo */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Tipos de Vínculo</h3>
          <p className="text-xs text-slate-400 mt-0.5">Entenda as diferenças entre os tipos de membros</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1: Membro Vinculado */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center">
                <Heart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold">Membro Vinculado</h4>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Ideal para casais</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Compartilham todas as transações, contas e cartões. Cada transação mostra quem a criou.
            </p>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Compartilha lançamentos</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Vê todas as contas e cartões</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Email e perfil independentes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Personalização própria</span>
              </li>
            </ul>
          </div>

          {/* Box 2: Membro Não Vinculado */}
          <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-4">
            <div className="flex items-center gap-2.5 text-blue-800 dark:text-blue-300">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold">Membro Não Vinculado</h4>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Irmãos e amigos</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Cada membro tem suas próprias transações e contas completamente independentes.
            </p>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Lançamentos independentes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Contas e cartões próprios</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Total privacidade</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Personalização própria</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar / Editar Membro */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingMember ? 'Editar Membro da Família' : 'Adicionar Membro da Família'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              placeholder="Ex: Mariane Farias"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail do Membro *</label>
            <input
              type="email"
              required
              placeholder="Ex: mariane@email.com"
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp / Telefone</label>
            <input
              type="text"
              placeholder="Ex: (85) 98594-9115"
              value={formPhone}
              onChange={e => setFormPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Tipo de Vínculo</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  formType === 'linked'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Vinculado</span>
                  <input
                    type="radio"
                    name="type"
                    checked={formType === 'linked'}
                    onChange={() => setFormType('linked')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Compartilha finanças e contas (ideal para casais)</p>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  formType === 'unlinked'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Não Vinculado</span>
                  <input
                    type="radio"
                    name="type"
                    checked={formType === 'unlinked'}
                    onChange={() => setFormType('unlinked')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Finanças e contas 100% independentes</p>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all"
            >
              {editingMember ? 'Salvar Alterações' : 'Convidar / Adicionar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/5535984595502"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        title="Falar no WhatsApp"
      >
        <MessageSquare className="w-6 h-6 fill-current" />
      </a>
    </div>
  );
};
