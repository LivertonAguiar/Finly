import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { saveOrShareFile } from '../../utils/fileDownloadHelper';
import { useBackButton } from '../../hooks/useBackButton';

export interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  blob: Blob | null;
  filename: string;
  dialogTitle?: string;
  isLoading?: boolean;
}

/**
 * High-end executive in-memory PDF Viewer Modal.
 * Renders the generated document in a temporary ObjectURL without writing to persistent disk storage,
 * freeing the object URL and memory automatically upon close.
 */
export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  blob,
  filename,
  dialogTitle,
  isLoading = false,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Close modal on Android physical back gesture
  useBackButton(isOpen, onClose);

  // Manage in-memory Object URL lifecycle
  useEffect(() => {
    if (!isOpen || !blob) {
      setPdfUrl(null);
      return;
    }

    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [isOpen, blob]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!blob) return;
    setIsSaving(true);
    try {
      await saveOrShareFile({
        filename,
        blob,
        mimeType: 'application/pdf',
        dialogTitle: dialogTitle || title,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar documento:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      } catch {
        // Fallback below
      }
    }
    window.open(pdfUrl, '_blank');
  };

  const handleOpenNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl h-[94vh] sm:h-[90vh] bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Temporário em Memória
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {subtitle || 'Visualização temporária do documento sem download'}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {pdfUrl && (
              <>
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer active:scale-95"
                  title="Abrir em nova aba do navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Nova Aba</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer active:scale-95"
                  title="Imprimir documento"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer active:scale-95 ${
                    saveSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/25'
                  }`}
                  title="Salvar cópia do arquivo no seu dispositivo"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{saveSuccess ? 'Salvo!' : 'Salvar Cópia'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar (ESC)"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 relative bg-slate-900 overflow-hidden flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-slate-300">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                <FileText className="w-5 h-5 text-purple-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                Gerando documento de alta resolução...
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Carregando dados executivos e renderizando gráficos em memória temporária.
              </p>
            </div>
          ) : pdfUrl ? (
            <iframe
              ref={iframeRef}
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0 bg-slate-900"
              title={title}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 text-slate-600" />
              <p>Nenhum documento disponível para visualização.</p>
            </div>
          )}
        </div>

        {/* Footer Observability Notice */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-[#151516] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="truncate">
              Documento alocado apenas na memória RAM. Ao fechar, ele será descartado sem ocupar espaço no seu aparelho.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hidden sm:inline-flex px-3 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
