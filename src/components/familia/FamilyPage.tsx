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
  Lock,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Modal } from '../ui/Modal';
import { FamilyMember } from '../../types';

export const FamilyPage: React.FC = () => {
  const { user, familyMembers, inviteFamilyMember, updateFamilyMember, removeFamilyMember } = useFinancial();
  const { confirm } = useConfirm();

  // Ensure user is in family list
  const allMembers: FamilyMember[] = familyMembers.length > 0 ? familyMembers : [
    {
      id: 'mem-owner',
      name: user.name || 'Liverton da Ponte Aguiar',
      email: user.email || 'liverton.aguiar@hotmail.com',
      phone: '85985949115',
      role: 'admin',
      status: 'active',
      isOwner: true,
      type: 'linked',
      joinedAt: '01/01/2026',
    }
  ];

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
    setFormType(m.type || 'linked');
    setIsAddModalOpen(true);
  };

  const handleDeleteMember = async (m: FamilyMember) => {
    if (m.isOwner) {
      alert('O titular da conta não pode ser removido.');
      return;
    }

    const ok = await confirm({
      title: 'Remover Membro',
      message: `Deseja realmente remover ${m.name} da sua família financeira?`,
      confirmText: 'Remover',
      type: 'danger',
    });

    if (ok) {
      removeFamilyMember(m.id);
    }
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingMember) {
      updateFamilyMember(editingMember.id, {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        type: formType,
      });
    } else {
      inviteFamilyMember({
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: 'editor',
        status: 'active',
        isOwner: false,
        type: formType,
      });
    }
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in pb-16">
      {/* Top Title & Header Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Família</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gerencie os membros da sua família financeira com sincronização instantânea
          </p>
        </div>

        {/* Adicionar Membro Button */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Adicionar Membro</span>
        </button>
      </div>

      {/* Card: Minha Família */}
      <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Minha Família</h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
            {allMembers.length} {allMembers.length === 1 ? 'membro' : 'membros'}
          </span>
        </div>

        {/* Member Cards List */}
        <div className="space-y-3 pt-2">
          {allMembers.map((member) => {
            const initial = member.name.charAt(0).toUpperCase();

            return (
              <div
                key={member.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-[#343437]/50 border border-slate-200/80 dark:border-slate-700/60 hover:border-purple-300 dark:hover:border-purple-800 shadow-xs flex items-center justify-between gap-4 transition-all group"
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#7c4dff] text-white flex items-center justify-center font-black text-lg shadow-sm">
                      {initial}
                    </div>
                  </div>

                  {/* Name, Email, Phone, Badges */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {member.name}
                      </h4>
                      {member.isOwner && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          Titular
                        </span>
                      )}
                    </div>

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
                      {member.type === 'linked' || !member.type ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold shadow-xs">
                          <LinkIcon className="w-2.5 h-2.5 text-emerald-400" />
                          Vinculado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          <Unlink className="w-2.5 h-2.5 text-slate-400" />
                          Não Vinculado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(member)}
                    className="p-2 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                    title="Editar membro"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {!member.isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(member)}
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Excluir membro permanentemente"
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
      <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
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
              O membro vinculado tem acesso completo aos dados financeiros da família. Pode visualizar e registrar transações em todas as contas e cartões compartilhados.
            </p>

            <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Visualiza saldo de todas as contas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Registra despesas e receitas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Acompanha limites de cartões e faturas</span>
              </li>
            </ul>
          </div>

          {/* Box 2: Membro Não Vinculado */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <Unlink className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold">Membro Não Vinculado</h4>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ideal para dependentes</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              O membro não vinculado serve apenas para categorizar despesas e receitas atribuídas a ele (como filhos, dependentes ou funcionários), sem conceder acesso de login à conta.
            </p>

            <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Não possui acesso ao login</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Permite filtrar gastos específicos deste membro</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Ideal para gestão de mesada e despesas de filhos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar / Editar Membro */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingMember ? 'Editar Membro da Família' : 'Novo Membro da Família'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Mariane Farias"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              E-mail *
            </label>
            <input
              type="email"
              required
              placeholder="Ex: mary@gmail.com"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Telefone / WhatsApp (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: (85) 98594-9115"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Vínculo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormType('linked')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  formType === 'linked'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Vinculado</span>
              </button>
              <button
                type="button"
                onClick={() => setFormType('unlinked')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  formType === 'unlinked'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Não Vinculado</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              {editingMember ? 'Salvar Alterações' : 'Adicionar Membro'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
