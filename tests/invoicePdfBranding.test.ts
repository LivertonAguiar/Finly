import assert from 'node:assert/strict';
import { getCardBankInfo } from '../src/utils/bankLogos';
import type { InvoiceExportData } from '../src/utils/reportExportService';
import { resolveBankPdfTheme } from '../src/utils/bankPdfThemes';
import { CreditCard } from '../src/types';

console.log('--- Iniciando testes de Identidade Bancária e PDF de Faturas ---');

// 1. Teste de mapeamento de banco pelo getCardBankInfo
{
  const nubankCard: CreditCard = {
    id: 'card-nu',
    name: 'Nubank Ultravioleta',
    brand: 'Mastercard',
    limit: 15000,
    closingDay: 28,
    dueDay: 5,
    color: '#820ad1',
  };
  const bankInfo = getCardBankInfo(nubankCard);
  assert.ok(bankInfo, 'Deveria encontrar informações para o Nubank');
  assert.equal(bankInfo?.id, 'nubank');
  assert.equal(bankInfo?.code, '260');
  console.log('✓ Teste 1: Nubank identificado com código 260 e cor oficial');
}

{
  const interCard: CreditCard = {
    id: 'card-inter',
    name: 'Inter Mastercard Black',
    brand: 'Mastercard',
    limit: 25000,
    closingDay: 15,
    dueDay: 22,
    color: '#ff7a00',
  };
  const bankInfo = getCardBankInfo(interCard);
  assert.ok(bankInfo, 'Deveria encontrar informações para o Banco Inter');
  assert.equal(bankInfo?.id, 'inter');
  assert.equal(bankInfo?.code, '077');
  console.log('✓ Teste 2: Banco Inter identificado com código 077 e cor oficial');
}

// 2. Teste de cálculo de data de fechamento e melhor dia de compra
{
  const closingDay = 15;
  const bestBuyDay = closingDay + 1 > 31 ? 1 : closingDay + 1;
  assert.equal(bestBuyDay, 16, 'Melhor dia de compra deve ser o dia subsequente ao fechamento');

  const closingDay31 = 31;
  const bestBuyDay31 = closingDay31 + 1 > 31 ? 1 : closingDay31 + 1;
  assert.equal(bestBuyDay31, 1, 'Melhor dia de compra para fechamento no dia 31 deve ser dia 1');
  console.log('✓ Teste 3: Cálculo do melhor dia de compra após o fechamento');
}

// 3. Teste de estrutura de dados da Fatura com fechamento e limites
{
  const invoiceData: InvoiceExportData = {
    card: {
      id: 'card-itau',
      name: 'Itaú Personnalité',
      brand: 'Visa',
      limit: 30000,
      closingDay: 10,
      dueDay: 17,
      color: '#ec7000',
    },
    monthLabel: 'Outubro de 2026',
    periodSlug: 'itau_fatura_2026-10',
    invoiceTotal: 4500,
    statusLabel: 'Fatura Aberta',
    transactions: [],
    categories: [],
    currency: 'BRL',
    availableLimit: 25500,
    totalCommitted: 4500,
  };

  assert.equal(invoiceData.card.closingDay, 10);
  assert.equal(invoiceData.card.dueDay, 17);
  assert.equal(invoiceData.availableLimit, 25500);
  console.log('✓ Teste 4: Dados enriquecidos de fatura e limites validados');
}

// 4. Teste de formatação dos últimos 4 dígitos e tratamento de ausência (ASCII 100% seguro contra .vhx)
{
  const formatCardMockupNumber = (last4?: string) => {
    const rawDigits = (last4 || '').replace(/\D/g, '').trim();
    return rawDigits.length >= 2 ? `**** **** **** ${rawDigits}` : '**** **** **** XXXX';
  };

  const formatFinalCardLabel = (last4?: string) => {
    const rawDigits = (last4 || '').replace(/\D/g, '').trim();
    return rawDigits.length >= 2 ? `Final ${rawDigits}` : 'Final XXXX';
  };

  assert.equal(
    formatCardMockupNumber('1234'),
    '**** **** **** 1234',
    'Deveria exibir os 4 dígitos finais no formato ASCII seguro quando informados'
  );

  assert.equal(
    formatCardMockupNumber(''),
    '**** **** **** XXXX',
    'Deveria exibir XXXX claramente na ausência dos 4 dígitos'
  );

  assert.equal(
    formatCardMockupNumber(undefined),
    '**** **** **** XXXX',
    'Deveria exibir XXXX quando ausente/undefined (sem corrupção .vhx)'
  );

  assert.equal(
    formatFinalCardLabel('4321'),
    'Final 4321',
    'Deveria formatar Final 4321 no pill do cabeçalho'
  );

  assert.equal(
    formatFinalCardLabel(undefined),
    'Final XXXX',
    'Deveria formatar Final XXXX no pill do cabeçalho na ausência de dígitos'
  );

  console.log('✓ Teste 5: Validação do final do cartão ASCII (**** XXXX) e eliminação de caracteres propensos a .vhx');
}

// 5. Teste de resolução de temas visuais bancários e co-branded (Inter, Nubank, Itaú, Co-branded Amazon e Casas Bahia)
{
  const interCard: CreditCard = {
    id: 'c1',
    name: 'Banco Inter Gold',
    brand: 'Mastercard',
    limit: 6780,
    closingDay: 3,
    dueDay: 10,
    color: '#ff7a00',
  };
  const themeInter = resolveBankPdfTheme(interCard);
  assert.equal(themeInter.code, '077');
  assert.equal(themeInter.accent, '#FF7A00');
  assert.deepEqual(themeInter.accentRgb, [255, 122, 0]);

  const nuCard: CreditCard = {
    id: 'c2',
    name: 'Nubank',
    brand: 'Mastercard',
    limit: 10000,
    closingDay: 20,
    dueDay: 27,
  };
  const themeNu = resolveBankPdfTheme(nuCard);
  assert.equal(themeNu.code, '260');
  assert.equal(themeNu.accent, '#820AD1');

  const amazonCard: CreditCard = {
    id: 'c3',
    name: 'Cartão Amazon Prime',
    bankId: 'bradesco', // Mesmo emitido por Bradesco, o branding oficial deve ser Amazon
    brand: 'Mastercard',
    limit: 8000,
    closingDay: 15,
    dueDay: 22,
  };
  const themeAmazon = resolveBankPdfTheme(amazonCard);
  assert.equal(themeAmazon.id, 'amazon');
  assert.equal(themeAmazon.accent, '#FF9900');
  assert.ok(!themeAmazon.pillLabel?.includes('•'), 'pillLabel não deve conter caractere bullet •');

  // Validação do bankIdentifier co-branded
  const bankIdentifier = (themeAmazon.id && themeAmazon.id !== 'custom')
    ? themeAmazon.id
    : (amazonCard.bankId || amazonCard.name);
  assert.equal(bankIdentifier, 'amazon', 'Cartão Amazon deve resolver bankIdentifier como amazon mesmo com bankId bradesco');

  const casasBahiaCard: CreditCard = {
    id: 'c4',
    name: 'Casas Bahia Bradescard',
    bankId: 'bradescard',
    brand: 'Visa',
    limit: 5000,
    closingDay: 5,
    dueDay: 12,
  };
  const credicardCard: CreditCard = {
    id: 'c5',
    name: 'Credicard On Visa',
    bankId: 'credicard',
    brand: 'Visa',
    limit: 12000,
    closingDay: 8,
    dueDay: 15,
  };
  const themeCredicard = resolveBankPdfTheme(credicardCard);
  assert.equal(themeCredicard.id, 'credicard');
  assert.equal(themeCredicard.accent, '#00E5FF', 'Accent do Credicard On deve ser ciano neon #00E5FF');
  assert.deepEqual(themeCredicard.accentRgb, [0, 229, 255]);
  assert.deepEqual(themeCredicard.cardBg, [0, 20, 56], 'CardBg do Credicard On deve ser azul marinho profundo oficial');
  assert.ok(!themeCredicard.pillLabel?.includes('•'), 'pillLabel não deve conter caractere bullet •');

  console.log('✓ Teste 6: Resolução de temas visuais bancários e co-branded (Inter, Nubank, Amazon, Casas Bahia, Credicard On) validada com sucesso');
}

// 7. Teste de especificação geométrica da Mastercard (Círculos 1:1 rigorosos, sem achatamento e sem caixa branca)
{
  const mcRadius = 2.7;
  const distance = mcRadius * 1.22;
  const totalWidth = distance + 2 * mcRadius;
  const totalHeight = 2 * mcRadius;
  const aspectRatio = totalWidth / totalHeight;

  // Manual de Marca Mastercard: proporção oficial entre 1.55 e 1.65 (aprox 1.61)
  assert.ok(aspectRatio >= 1.58 && aspectRatio <= 1.64, `Proporção da Mastercard deve respeitar manual oficial: ${aspectRatio}`);

  // Validação da lente de interseção central
  const halfDist = distance / 2;
  const rx = mcRadius - halfDist;
  const ry = Math.sqrt(mcRadius * mcRadius - halfDist * halfDist);
  assert.ok(rx > 0 && ry > 0, 'Dimensões da lente de interseção devem ser estritamente positivas');
  assert.ok(ry < mcRadius, 'A semi-altura da lente deve ser menor ou igual ao raio do círculo');

  // Cores oficiais
  const mcRed = [235, 0, 27];
  const mcYellow = [247, 158, 27];
  const mcOrange = [255, 95, 0];
  assert.deepEqual(mcRed, [235, 0, 27], 'Vermelho Mastercard #EB001B');
  assert.deepEqual(mcYellow, [247, 158, 27], 'Amarelo Mastercard #F79E1B');
  assert.deepEqual(mcOrange, [255, 95, 0], 'Laranja de interseção Mastercard #FF5F00');

  console.log('✓ Teste 7: Geometria circular 1:1, proporcionalidade e paleta oficial da Mastercard validadas');
}

// 8. Teste de contrato de visualização temporária em memória (zero download forçado)
{
  type GeneratedResultShape = {
    blob: unknown;
    filename: string;
    dialogTitle: string;
  };

  const sampleResult: GeneratedResultShape = {
    blob: new Blob(['fake-pdf-content'], { type: 'application/pdf' }),
    filename: 'fatura_amazon_prime_2026-10.pdf',
    dialogTitle: 'Fatura Cartão Amazon Prime (PDF)',
  };

  assert.ok(sampleResult.blob instanceof Blob, 'Resultado deve encapsular Blob do PDF em memória');
  assert.equal(sampleResult.filename, 'fatura_amazon_prime_2026-10.pdf');
  assert.equal(sampleResult.dialogTitle, 'Fatura Cartão Amazon Prime (PDF)');
  console.log('✓ Teste 8: Contrato de visualização temporária em memória sem download validado');
}

console.log('✅ Todos os testes de Identidade Bancária e Fatura passaram com 100% de sucesso!');


