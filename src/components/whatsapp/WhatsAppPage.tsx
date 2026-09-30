import React, { useRef, useState } from 'react';
import {
  MessageSquare,
  Smartphone,
  Sparkles,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import {
  AssistantTransactionDraft,
  createAssistantTransactionDraft,
  DraftConfirmationRegistry,
} from '../../utils/assistantTransactionDraft';

interface AssistantMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
  draft?: AssistantTransactionDraft;
  confirmed?: boolean;
}

export const WhatsAppPage: React.FC = () => {
  const { addTransaction, user, updateUser, categories, accounts, transactions } = useFinancial();

  const [phone, setPhone] = useState(user.whatsappPhone || '');
  const [isSaved, setIsSaved] = useState(!!user.whatsappPhone);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const confirmations = useRef(new DraftConfirmationRegistry());

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: '1',
      sender: 'agent',
      text: 'Olá! Este é o simulador local do assistente Finly. Escreva um lançamento em texto; eu preparo uma sugestão para você revisar e confirmar. Nada é salvo automaticamente.',
      time: '10:00',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    updateUser({ whatsappPhone: phone });
    setIsSaved(true);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const draft = createAssistantTransactionDraft({
        text,
        categories,
        accountId: accounts[0]?.id,
        historicalTransactions: transactions,
      });
      const lower = text.toLocaleLowerCase('pt-BR');
      const agentReply = !accounts[0]
        ? 'Cadastre uma conta antes de usar o assistente. Sem uma conta válida, nenhum rascunho pode ser confirmado.'
        : draft
          ? 'Preparei este rascunho com regras locais. Revise os dados abaixo e confirme somente se estiverem corretos.'
          : lower.includes('saldo')
          ? 'Seu saldo consolidado está disponível no Dashboard. Este simulador não consulta nem divulga saldos pelo chat.'
          : 'Não consegui montar um rascunho seguro com valor e categoria. Tente algo como “Gastei R$ 60 no almoço” ou faça o lançamento pelo formulário completo.';

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: agentReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          draft: draft || undefined,
        },
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleConfirmDraft = (messageId: string, draft: AssistantTransactionDraft) => {
    const result = confirmations.current.confirm(draft, addTransaction);
    setMessages(prev => prev.map(message => message.id === messageId
      ? {
          ...message,
          confirmed: true,
          text: result === 'created'
            ? 'Lançamento confirmado e salvo no Finly.'
            : 'Este rascunho já havia sido confirmado; nenhum lançamento duplicado foi criado.',
        }
      : message));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Assistente de lançamentos</h2>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full">
              Simulador local
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Transforme texto em uma sugestão revisável, sem gravação automática</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold self-start">
          <MessageSquare className="w-4 h-4" />
          <span>Integração oficial com WhatsApp ainda não conectada</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Phone Setup & How it works */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Phone Number Setup */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Seu Número de WhatsApp</h3>
              </div>
              {isSaved && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Número salvo
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Este campo salva apenas sua preferência de contato no perfil. Ele não conecta o Finly ao WhatsApp.
            </p>

            <form onSubmit={handleSavePhone} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Número do WhatsApp (com DDD)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 35984595502"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {saveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                    Número salvo com sucesso!
                  </span>
                )}
                {!saveSuccess && <span />}
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all"
                >
                  {isSaved ? 'Atualizar Número' : 'Salvar Número'}
                </button>
              </div>
            </form>
          </div>

          {/* Card: How It Works */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Como Funciona</h3>
            </div>

            <div className="space-y-3">
              {[
                { icon: MessageSquare, text: 'Digite uma mensagem como “Gastei R$ 50 no mercado” ou “Paguei 120 de luz”' },
                { icon: Sparkles, text: 'Regras locais sugerem tipo, valor e uma categoria da sua lista atual' },
                { icon: CheckCircle2, text: 'Revise o rascunho e use Confirmar lançamento para salvar' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-5 h-5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3 h-3" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Quick Examples */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-100 dark:border-emerald-900/30 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              💡 Teste Rápido (Clique para simular):
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                'Gastei R$ 85 no supermercado',
                'Paguei 35 reais de Uber',
                'Comprei remédio de 42 reais na farmácia',
                'Recebi R$ 1200 de freelance',
              ].map((example, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(example)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Local transaction suggestion simulator */}
        <div className="lg:col-span-7">
          <div className="h-[min(620px,calc(100dvh-8rem))] min-h-[480px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            {/* WhatsApp Header Bar */}
            <div className="px-4 py-3 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shadow-inner">
                  🤖
                </div>
                <div>
                  <h4 className="text-xs font-bold">Assistente Finly</h4>
                  <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    Sugestões locais • confirmação obrigatória
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-700/50">
                Simulador
              </span>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/40 scrollbar-thin">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={'flex ' + (msg.sender === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={'max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm space-y-1.5 ' + (
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/60 rounded-bl-none'
                    )}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    {msg.draft && (
                      <div
                        data-testid="assistant-transaction-draft"
                        className="mt-3 space-y-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-3"
                      >
                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
                          <dt className="text-slate-500 dark:text-slate-400">Tipo</dt>
                          <dd className="font-bold text-right">{msg.draft.transaction.type === 'income' ? 'Receita' : 'Despesa'}</dd>
                          <dt className="text-slate-500 dark:text-slate-400">Valor</dt>
                          <dd className="font-bold text-right">
                            {msg.draft.transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </dd>
                          <dt className="text-slate-500 dark:text-slate-400">Categoria</dt>
                          <dd className="font-bold text-right">
                            {msg.draft.categoryName}{msg.draft.subcategoryName ? ` • ${msg.draft.subcategoryName}` : ''}
                          </dd>
                          <dt className="text-slate-500 dark:text-slate-400">Conta</dt>
                          <dd className="font-bold text-right">
                            {accounts.find(account => account.id === msg.draft?.transaction.accountId)?.name || 'Sem conta selecionada'}
                          </dd>
                        </dl>
                        <button
                          type="button"
                          data-testid="confirm-assistant-transaction"
                          disabled={msg.confirmed}
                          onClick={() => handleConfirmDraft(msg.id, msg.draft as AssistantTransactionDraft)}
                          className="min-h-11 w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-default disabled:bg-slate-400"
                        >
                          {msg.confirmed ? 'Lançamento confirmado' : 'Confirmar lançamento'}
                        </button>
                      </div>
                    )}
                    <span
                      className={'text-[9px] block text-right font-medium ' + (
                        msg.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
                      )}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-slate-400 flex items-center gap-1.5 shadow-sm">
                    <span>Assistente analisando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Digite sua mensagem (ex: Paguei 50 no mercado)..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
