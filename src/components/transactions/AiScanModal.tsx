import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Sparkles, Upload, X, Check, Loader2, FileText, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { Category, Account, CreditCard } from '../../types';

interface AiScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  cards: CreditCard[];
  currency?: string;
  onApply: (data: any) => void;
}

export const AiScanModal: React.FC<AiScanModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  cards,
  currency = 'BRL',
  onApply,
}) => {
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcess = async (textToProcess: string) => {
    if (!textToProcess.trim()) {
      setError('Por favor, informe o texto ou comprovante para a IA analisar.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const response = await fetch('/api/ai/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToProcess,
          categories,
          accounts,
          cards,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com o serviço de IA local.');
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Não foi possível extrair os dados do comprovante.');
      }

      setExtractedData(result.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar com a IA local.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use filename and simulated local OCR preview
    const reader = new FileReader();
    reader.onload = async () => {
      const simulatedText = `Comprovante de pagamento: ${file.name.replace(/\.[^/.]+$/, '')}`;
      setInputText(simulatedText);
      await handleProcess(simulatedText);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmApply = () => {
    if (!extractedData) return;
    onApply(extractedData);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[230] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
      />

      {/* Card Modal / Bottom Sheet */}
      <div className="relative w-full sm:max-w-md max-h-[88dvh] bg-white dark:bg-[#18181B] rounded-t-[28px] sm:rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 z-10">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Preenchimento com IA Local
                </h3>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  100% privado • Processado no servidor
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 gap-1">
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'text'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Colar Pix / Texto</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('image');
                fileInputRef.current?.click();
              }}
              className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'image'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto do Recibo</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Text Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              Cole o texto do Pix, recibo ou fatura:
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Ex: 'Você pagou R$ 45,90 para Padaria Central no cartão de débito' ou cole o comprovante completo do seu banco..."
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
            />
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => handleProcess(inputText)}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>IA Local Analisando Comprovante...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extrair Dados com IA Local</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Extracted Preview Card */}
          {extractedData && (
            <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/80 bg-purple-50/40 dark:bg-purple-950/20 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Dados Identificados pela IA:
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Pronto
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold">VALOR</span>
                  <span className="text-base font-black text-purple-600 dark:text-purple-400">
                    {formatCurrency(extractedData.amount, currency)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold">DATA</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {extractedData.date}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">DESCRIÇÃO</span>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                  {extractedData.description}
                </p>
                {extractedData.categoryName && (
                  <span className="inline-block mt-1 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    Categoria: {extractedData.categoryName}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmApply}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Aplicar no Lançamento</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
