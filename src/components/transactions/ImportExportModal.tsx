import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancial } from '../../context/FinancialContext';
import { parseOFX } from '../../utils/ofxParser';
import { parseCSV } from '../../utils/csvParser';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const { accounts, categories, importTransactions, user } = useFinancial();

  const [fileType, setFileType] = useState<'ofx' | 'csv'>('ofx');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedList, setParsedList] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2>(1);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);

      if (file.name.toLowerCase().endsWith('.ofx')) {
        setFileType('ofx');
        const ofxItems = parseOFX(content);
        setParsedList(
          ofxItems.map((item) => ({
            description: item.memo,
            amount: item.amount,
            type: item.type === 'CREDIT' ? 'income' : 'expense',
            date: item.date,
            categoryId: categories.find(c => c.type === (item.type === 'CREDIT' ? 'income' : 'expense'))?.id || '',
            selected: true,
          }))
        );
      } else {
        setFileType('csv');
        const csvRows = parseCSV(content);
        // Simple heuristic for columns
        setParsedList(
          csvRows.slice(0, 50).map((row, idx) => {
            const desc = row['Descrição'] || row['Descricao'] || row['Historico'] || row['Memo'] || Object.values(row)[1] || `Item ${idx + 1}`;
            const valStr = row['Valor'] || row['Quantia'] || row['Amount'] || Object.values(row)[2] || '0';
            const cleanVal = parseFloat(valStr.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;
            const isInc = cleanVal >= 0;

            return {
              description: desc,
              amount: Math.abs(cleanVal),
              type: isInc ? 'income' : 'expense',
              date: new Date().toISOString().split('T')[0],
              categoryId: categories.find(c => c.type === (isInc ? 'income' : 'expense'))?.id || '',
              selected: true,
            };
          })
        );
      }

      setStep(2);
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    const itemsToImport = parsedList
      .filter(item => item.selected)
      .map(item => ({
        description: item.description,
        amount: item.amount,
        type: item.type,
        date: item.date,
        categoryId: item.categoryId || categories[0]?.id || '',
        accountId: selectedAccountId,
        status: 'completed' as const,
        recurring: false,
        tags: ['importado', fileType],
      }));

    importTransactions(itemsToImport);
    onClose();
    setStep(1);
    setParsedList([]);
    setFileName('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importar Extrato Bancário" maxWidth="2xl">
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Conta Bancária de Destino
            </label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.institution})
                </option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-emerald-500 transition-colors">
            <UploadCloud className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Selecione ou arraste seu arquivo OFX ou CSV
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Compatível com extratos do Nubank, Inter, Itaú, Bradesco, BB, Santander, C6, etc.
            </p>
            <label className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-md">
              Selecionar Arquivo
              <input
                type="file"
                accept=".ofx,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Arquivo: <span className="text-emerald-600">{fileName}</span> ({parsedList.length} transações identificadas)
            </span>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:underline"
            >
              Trocar arquivo
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            {parsedList.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={e => {
                      const updated = [...parsedList];
                      updated[idx].selected = e.target.checked;
                      setParsedList(updated);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.description}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(item.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold ${
                      item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {item.type === 'income' ? '+' : '-'}
                    {formatCurrency(item.amount, user.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirmImport}
              className="px-6 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
            >
              Importar {parsedList.filter(i => i.selected).length} Transações
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};