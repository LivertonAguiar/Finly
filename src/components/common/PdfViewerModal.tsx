import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { saveOrShareFile } from '../../utils/fileDownloadHelper';
import { useBackButton } from '../../hooks/useBackButton';

// Configurar o worker do PDF.js
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
}

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

interface RenderedPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * High-end executive in-memory PDF Viewer Modal.
 * Renders PDF pages directly to HTML5 Canvas (universal compatibility with Android WebView, Mobile and Desktop),
 * allowing users to view the document before deciding to save or share.
 */
export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  blob,
  filename,
  dialogTitle,
  isLoading: isExternalLoading = false,
}) => {
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Close modal on Android physical back gesture
  useBackButton(isOpen, onClose);

  // Render PDF pages to images using PDF.js
  const renderPdfToPages = useCallback(async (pdfBlob: Blob) => {
    setIsRendering(true);
    setRenderError(null);

    try {
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      });

      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      const pagesData: RenderedPage[] = [];

      // Escala 2.0 para nitidez retina impecável em qualquer zoom ou celular
      const targetScale = 2.0;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: targetScale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx) {
          throw new Error('Não foi possível inicializar o contexto 2D do Canvas.');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Fundo branco nítido
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        pagesData.push({
          pageNumber: pageNum,
          dataUrl,
          width: viewport.width,
          height: viewport.height,
        });
      }

      setRenderedPages(pagesData);
    } catch (err: any) {
      console.error('Falha ao renderizar PDF em canvas:', err);
      setRenderError('Não foi possível exibir a prévia gráfica do documento.');
    } finally {
      setIsRendering(false);
    }
  }, []);

  // Process blob whenever modal opens or blob updates
  useEffect(() => {
    if (!isOpen || !blob) {
      setRenderedPages([]);
      setRenderError(null);
      setZoomScale(1);
      return;
    }

    renderPdfToPages(blob);
  }, [isOpen, blob, renderPdfToPages]);

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
    if (renderedPages.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 0; padding: 0; background: #fff; text-align: center; }
            img { width: 100%; max-width: 210mm; display: block; margin: 0 auto; page-break-after: always; }
            @media print {
              body { margin: 0; }
              img { width: 100%; max-width: 100%; page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${renderedPages.map(p => `<img src="${p.dataUrl}" />`).join('')}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(2.0, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(0.6, Number((prev - 0.15).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
  };

  const isBusy = isExternalLoading || isRendering;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl h-[94vh] sm:h-[90vh] bg-slate-900 rounded-3xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0 shadow-xs border border-rose-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-base font-extrabold text-slate-100 truncate">
                  {title}
                </h3>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Visualização
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {subtitle || 'Confira o documento antes de baixar ou compartilhar'}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Controles de Zoom */}
            {renderedPages.length > 0 && !isBusy && (
              <div className="hidden sm:flex items-center gap-0.5 bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80 mr-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomScale <= 0.6}
                  className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2 text-[11px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Ajustar escala normal"
                >
                  {Math.round(zoomScale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomScale >= 2.0}
                  className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Imprimir (Desktop/Tablet) */}
            {renderedPages.length > 0 && !isBusy && (
              <button
                type="button"
                onClick={handlePrint}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer active:scale-95 border border-slate-700"
                title="Imprimir documento"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            )}

            {/* BOTÃO PRINCIPAL DE BAIXAR / SALVAR */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !blob}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer active:scale-95 ${
                saveSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/25 ring-1 ring-purple-400/30'
              }`}
              title="Salvar arquivo no seu dispositivo ou compartilhar"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{saveSuccess ? 'Salvo!' : 'Baixar PDF'}</span>
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Fechar (ESC)"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 relative bg-slate-950 overflow-y-auto p-3 sm:p-6 md:p-8 flex flex-col items-center gap-6">
          {isBusy ? (
            <div className="my-auto flex flex-col items-center justify-center gap-3 p-8 text-center text-slate-300">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                <FileText className="w-5 h-5 text-purple-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                Renderizando documento em alta resolução...
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Carregando tabelas, gráficos e tipografia executiva para prévia instantânea.
              </p>
            </div>
          ) : renderError ? (
            <div className="my-auto flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-300 max-w-md bg-slate-900/60 rounded-2xl border border-slate-800">
              <FileText className="w-12 h-12 text-rose-400" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">Visualização Indisponível</h4>
                <p className="text-xs text-slate-400">{renderError}</p>
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Documento Diretamente</span>
              </button>
            </div>
          ) : renderedPages.length > 0 ? (
            <div
              className="flex flex-col items-center gap-6 w-full max-w-4xl transition-transform duration-150 origin-top"
              style={{
                transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
              }}
            >
              {renderedPages.map((page) => (
                <div
                  key={page.pageNumber}
                  className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700/80 animate-in fade-in"
                >
                  <img
                    src={page.dataUrl}
                    alt={`Página ${page.pageNumber} de ${renderedPages.length}`}
                    className="w-full h-auto block select-none"
                    loading="eager"
                  />
                  {renderedPages.length > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white/90">
                      Página {page.pageNumber} de {renderedPages.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="my-auto flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-400 text-xs">
              <FileText className="w-10 h-10 text-slate-600" />
              <p>Nenhum documento disponível para visualização.</p>
            </div>
          )}
        </div>

        {/* Footer Observability Notice */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              Documento temporário em memória RAM. Para guardar no aparelho, use o botão <strong>Baixar PDF</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {renderedPages.length > 0 && !isBusy && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Salvar Cópia</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
