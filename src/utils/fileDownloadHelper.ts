import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface SaveOrShareOptions {
  filename: string;
  blob?: Blob;
  content?: string;
  base64Data?: string;
  buffer?: ArrayBuffer | Uint8Array;
  mimeType: string;
  dialogTitle?: string;
}

/**
 * Converts a Blob to a Base64 data string (excluding the data URI scheme prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const commaIdx = reader.result.indexOf(',');
        resolve(commaIdx >= 0 ? reader.result.slice(commaIdx + 1) : reader.result);
      } else {
        reject(new Error('Falha ao converter Blob em base64'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Universal file save / share helper.
 * 
 * Works across:
 * - Native Android / iOS via Capacitor (Filesystem Cache + Share Dialog)
 * - Mobile web browsers via Web Share API (File object)
 * - Desktop web browsers via traditional <a> download with Blob URL
 */
export async function saveOrShareFile(options: SaveOrShareOptions): Promise<void> {
  const { filename, mimeType, dialogTitle } = options;
  const safeFilename = filename.replace(/[\\/:*?"<>|]/g, '_');

  // 1. Resolve or create the Blob
  let effectiveBlob: Blob;
  if (options.blob) {
    effectiveBlob = options.blob;
  } else if (options.buffer) {
    effectiveBlob = new Blob([options.buffer as any], { type: mimeType });
  } else if (options.content !== undefined) {
    effectiveBlob = new Blob([options.content], { type: mimeType });
  } else if (options.base64Data) {
    const cleanBase64 = options.base64Data.includes(',')
      ? options.base64Data.split(',')[1]
      : options.base64Data;
    const binaryStr = atob(cleanBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    effectiveBlob = new Blob([bytes as any], { type: mimeType });
  } else {
    throw new Error('Nenhum dado fornecido para download/compartilhamento.');
  }

  // 2. Native Capacitor App (Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      let base64 = options.base64Data;
      if (!base64) {
        base64 = await blobToBase64(effectiveBlob);
      } else if (base64.includes(',')) {
        base64 = base64.split(',')[1];
      }

      // Write file into Cache Directory (accessible to FileProvider, no special permissions required)
      const writeResult = await Filesystem.writeFile({
        path: safeFilename,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      });

      const fileUri = writeResult.uri;

      // Trigger native Android / iOS system share sheet (allows Save to Downloads, Open with Sheets/PDF/Excel, etc.)
      await Share.share({
        title: safeFilename,
        text: `Finly: ${safeFilename}`,
        url: fileUri,
        files: [fileUri],
        dialogTitle: dialogTitle || `Salvar ou Compartilhar ${safeFilename}`,
      });

      emitSuccessToast(safeFilename);
      return;
    } catch (nativeErr: any) {
      const msg = String(nativeErr?.message || nativeErr || '').toLowerCase();
      // If user simply closed/canceled the share sheet, treat as normal completion
      if (msg.includes('canceled') || msg.includes('cancelled') || msg.includes('dismissed')) {
        return;
      }
      console.warn('Native Filesystem/Share falhou, tentando fallback web:', nativeErr);
      // Fallback continues below
    }
  }

  // 3. Mobile Web Browser (Android Chrome, iOS Safari, PWA)
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');

  if (isMobile && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([effectiveBlob], safeFilename, { type: mimeType });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: safeFilename,
        });
        emitSuccessToast(safeFilename);
        return;
      }
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') {
        // User dismissed the native share sheet
        return;
      }
      console.warn('Web Share API falhou, tentando fallback <a>:', shareErr);
    }
  }

  // 4. Desktop Web Browser or standard browser fallback
  try {
    const url = URL.createObjectURL(effectiveBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    emitSuccessToast(safeFilename);
  } catch (downloadErr) {
    console.error('Falha ao acionar download no navegador:', downloadErr);
    throw downloadErr;
  }
}

/**
 * Emits an in-app toast notification to let the user know the file was created
 */
function emitSuccessToast(filename: string) {
  try {
    window.dispatchEvent(
      new CustomEvent('finly_in_app_notification', {
        detail: {
          title: 'Arquivo Pronto',
          body: `${filename} exportado com sucesso.`,
          tag: 'file_export',
        },
      })
    );
  } catch {
    // Ignore if event dispatch fails
  }
}
