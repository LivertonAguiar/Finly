import React, { useState } from 'react';
import {
  MessageSquare,
  Smartphone,
  Sparkles,
  Send,
  CheckCircle2,
  ExternalLink,
  Mic,
  Receipt,
  Zap,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

export const WhatsAppPage: React.FC = () => {
  const { addTransaction, user, updateUser, categories, accounts } = useFinancial();

  const [phone, setPhone] = useState(user.whatsappPhone || '35984595502');
  const [isSaved, setIsSaved] = useState(!!user.whatsappPhone);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Interactive AI Agent Simulator Chat state
  const [messages, setMessages] = useState<
    { id: string; sender: 'user' | 'agent'; text: string; time: string; txCreated?: any }[]
  >([
    {
      id: '1',
      sender: 'agent',
      text: 'Olá! Sou o seu Agente de IA do PlannerFin no WhatsApp 🤖💚\\n\\nVocê pode me mandar qualquer mensagem em linguagem natural, áudios ou fotos de comprovantes. Como posso te ajudar hoje?',
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
      let agentReply = '';
      let createdTx: any = null;
      const lower = text.toLowerCase();

      const expenseMatch = lower.match(/(?:gastei|paguei|comprei|despesa|almoço|lanche|mercado)\\s*(?:r\\$|reais)?\\s*([0-9]+(?:[\\.,][0-9]{2})?)/i) ||
        lower.match(/([0-9]+(?:[\\.,][0-9]{2})?)\\s*(?:reais|r\\$)?\\s*(?:no|na|em|de)?\\s*(mercado|lanche|padaria|uber|gasolina|farmacia|luz|agua|aluguel)/i);

      const incomeMatch = lower.match(/(?:recebi|ganhei|salario|freelance|venda|pix\\s*recebido)\\s*(?:r\\$|reais)?\\s*([0-9]+(?:[\\.,][0-9]{2})?)/i);

      if (expenseMatch) {
        const amtStr = expenseMatch[1].replace(',', '.');
        const amount = parseFloat(amtStr) || 45.00;
        let desc = 'Despesa via WhatsApp';
        let catId = 'cat-alimentacao';

        if (lower.includes('mercado')) { desc = 'Supermercado'; catId = 'cat-alimentacao'; }
        else if (lower.includes('uber') || lower.includes('gasolina') || lower.includes('combustivel')) { desc = 'Transporte / Combustível'; catId = 'cat-transporte'; }
        else if (lower.includes('farmacia') || lower.includes('remedio')) { desc = 'Farmácia'; catId = 'cat-saude'; }
        else if (lower.includes('luz') || lower.includes('energia')) { desc = 'Conta de Energia'; catId = 'cat-moradia'; }
        else if (lower.includes('lanche') || lower.includes('almoço')) { desc = 'Alimentação / Lanche'; catId = 'cat-alimentacao'; }

        createdTx = {
          description: desc,
          amount,
          type: 'expense' as const,
          date: new Date().toISOString().split('T')[0],
          categoryId: catId,
          accountId: accounts[0]?.id || 'acc-1',
          status: 'completed' as const,
          recurring: false,
          tags: ['whatsapp', 'ia'],
          notes: 'Cadastrado automaticamente via Agente de IA WhatsApp',
        };

        addTransaction(createdTx);
        agentReply = '✅ Despesa registrada com sucesso!\\n\\n💸 Valor: R$ ' + amount.toFixed(2).replace('.', ',') + '\\n📝 Descrição: ' + desc + '\\n📁 Categoria: ' + (categories.find(c => c.id === catId)?.name || 'Geral') + '\\n🏦 Conta: ' + (accounts[0]?.name || 'Conta Principal') + '\\n\\nSeu saldo já foi atualizado no PlannerFin!';
      } else if (incomeMatch) {
        const amtStr = incomeMatch[1].replace(',', '.');
        const amount = parseFloat(amtStr) || 500.00;
        const desc = lower.includes('salario') ? 'Salário' : lower.includes('freelance') ? 'Renda Freelance' : 'Receita via WhatsApp';
        const catId = lower.includes('salario') ? 'cat-salario' : 'cat-renda-extra';

        createdTx = {
          description: desc,
          amount,
          type: 'income' as const,
          date: new Date().toISOString().split('T')[0],
          categoryId: catId,
          accountId: accounts[0]?.id || 'acc-1',
          status: 'completed' as const,
          recurring: false,
          tags: ['whatsapp', 'ia'],
          notes: 'Receita cadastrada automaticamente via Agente WhatsApp',
        };

        addTransaction(createdTx);
        agentReply = '🎉 Receita cadastrada com sucesso!\\n\\n💰 Valor: R$ ' + amount.toFixed(2).replace('.', ',') + '\\n📝 Descrição: ' + desc + '\\n📁 Categoria: ' + (categories.find(c => c.id === catId)?.name || 'Receitas') + '\\n\\nExcelente! O valor foi somado ao seu saldo.';
      } else if (lower.includes('saldo')) {
        agentReply = '📊 Seu saldo geral consolidado em contas ativas está disponível no Dashboard. Deseja que eu liste suas últimas transações?';
      } else {
        agentReply = 'Entendido! Registrei sua mensagem: "' + text + '".\\n\\n💡 Dica: você pode enviar mensagens diretas como:\\n• "Gastei R$ 60 no almoço"\\n• "Paguei 120 de luz"\\n• "Recebi 1500 de adiantamento"';
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: agentReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          txCreated: createdTx,
        },
      ]);
      setIsTyping(false);
    }, 1000);
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
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">WhatsApp</h2>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full">
              Agente IA Ativo
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Gerencie suas finanças e lance despesas pelo WhatsApp com IA</p>
        </div>

        <a
          href="https://wa.me/5535984595502?text=Ol%C3%A1%2C%20gostaria%20de%20ativar%20meu%20PlannerFin%20no%20WhatsApp!"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 self-start transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Abrir WhatsApp Oficial</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
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
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cadastre seu número com DDD para que o agente de IA identifique suas mensagens e crie os lançamentos na sua conta.
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
                { icon: MessageSquare, text: 'Envie mensagens naturais como "Gastei R$ 50 no mercado" ou "Paguei 120 de luz"' },
                { icon: Mic, text: 'Mande áudios curtos relatando suas compras do dia' },
                { icon: Receipt, text: 'Envie fotos de cupons fiscais e notas fiscais' },
                { icon: Zap, text: 'O Agente de IA reconhece valor, categoria, conta e salva em segundos' },
                { icon: CheckCircle2, text: 'Você recebe a confirmação imediata com o resumo da transação' },
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

        {/* Right Column: Interactive AI Agent Simulator */}
        <div className="lg:col-span-7">
          <div className="h-[620px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            {/* WhatsApp Header Bar */}
            <div className="px-4 py-3 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shadow-inner">
                  🤖
                </div>
                <div>
                  <h4 className="text-xs font-bold">PlannerFin AI Assistant</h4>
                  <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    Online • Responde instantaneamente
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-700/50">
                Simulador IA
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
                    <span>Agente digitando...</span>
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
