import assert from 'node:assert/strict';
import {
  getMonthlyInterestRate,
  calculatePricePMT,
  generateAmortizationSchedule,
} from '../src/utils/financingCalculations';

// ────────────────────────────────────────────────────────────────
// 1. Conversão de taxa
// ────────────────────────────────────────────────────────────────
{
  const rate = getMonthlyInterestRate(4.25);
  assert.ok(Math.abs(rate - 0.00354167) < 0.00001, `Taxa mensal nominal 4.25%: ${rate}`);
  console.log('OK: taxa mensal nominal 4.25% a.a.');
}

{
  const rate = getMonthlyInterestRate(0);
  assert.equal(rate, 0, 'Taxa zero deve retornar 0');
  console.log('OK: taxa zero');
}

// ────────────────────────────────────────────────────────────────
// 2. PMT da Tabela Price
// ────────────────────────────────────────────────────────────────
{
  // Sem juros: PMT = valor / meses
  const pmt = calculatePricePMT(120000, 0, 120);
  assert.equal(pmt, 1000, `PMT sem juros: ${pmt}`);
  console.log('OK: PMT sem juros = valor / meses');
}

{
  // Com juros 4.25% a.a. sobre R$ 160.000, 420 meses
  const iMonthly = getMonthlyInterestRate(4.25);
  const pmt = calculatePricePMT(160000, iMonthly, 420);
  assert.ok(pmt > 0 && pmt < 1200, `PMT Price 4.25% a.a. / 420m: ${pmt.toFixed(2)}`);
  console.log(`OK: PMT Price com juros = R$ ${pmt.toFixed(2)}`);
}

// ────────────────────────────────────────────────────────────────
// 3. Cronograma Price completo
// ────────────────────────────────────────────────────────────────
{
  const result = generateAmortizationSchedule({
    principal: 160000,
    nominalAnnualRate: 4.25,
    remainingMonths: 420,
    system: 'PRICE',
    monthlyTR: 0.1708,
    monthlyInsurance: 28.76,
    adminFee: 25,
    startDate: new Date('2026-10-05'),
  });

  assert.equal(result.schedule.length, 420, 'Price deve gerar 420 linhas');

  // Primeira parcela deve incluir juros + seguro + taxa
  const first = result.schedule[0];
  assert.ok(first.totalInstallment > 0, `Parcela 1: ${first.totalInstallment}`);
  assert.ok(first.interestAmount > 0, 'Juros da parcela 1 > 0');
  assert.ok(first.insuranceAmount === 28.76, `Seguro: ${first.insuranceAmount}`);
  assert.ok(first.adminFeeAmount === 25, `Taxa admin: ${first.adminFeeAmount}`);
  assert.ok(first.trCorrection > 0, 'TR correction > 0');

  // Com TR acumulada, o saldo pode não zerar no modelo simplificado.
  // Validamos que o cronograma foi gerado completamente e os totais são coerentes.
  assert.ok(result.totalPaid > 0, `Total pago > 0: ${result.totalPaid}`);
  assert.ok(result.totalInterest > 0, 'Total juros > 0');
  assert.ok(result.totalCorrection > 0, 'Total correção TR > 0');
  assert.ok(result.totalInsurance > 0, 'Total seguro > 0');

  console.log('OK: cronograma Price 420m com TR, seguro e taxa');
}

// ────────────────────────────────────────────────────────────────
// 4. Cronograma SAC — parcelas decrescentes
// ────────────────────────────────────────────────────────────────
{
  const result = generateAmortizationSchedule({
    principal: 100000,
    nominalAnnualRate: 6.0,
    remainingMonths: 120,
    system: 'SAC',
    monthlyInsurance: 15,
  });

  assert.equal(result.schedule.length, 120, 'SAC deve gerar 120 linhas');

  // SAC: a parcela total deve ser decrescente (pelo menos as primeiras)
  for (let i = 1; i < Math.min(10, result.schedule.length); i++) {
    assert.ok(
      result.schedule[i].totalInstallment <= result.schedule[i - 1].totalInstallment + 0.01,
      `SAC parcela ${i} (${result.schedule[i].totalInstallment}) deve ser <= parcela ${i - 1} (${result.schedule[i - 1].totalInstallment})`
    );
  }

  // Amortização constante no SAC (sem TR)
  const amort1 = result.schedule[0].amortizationAmount;
  const amort50 = result.schedule[49].amortizationAmount;
  assert.ok(Math.abs(amort1 - amort50) < 1, 'SAC: amortização deve ser constante');

  console.log('OK: cronograma SAC com parcelas decrescentes');
}

// ────────────────────────────────────────────────────────────────
// 5. Price sem juros — igual a divisão simples
// ────────────────────────────────────────────────────────────────
{
  const result = generateAmortizationSchedule({
    principal: 60000,
    nominalAnnualRate: 0,
    remainingMonths: 60,
    system: 'PRICE',
  });

  assert.equal(result.schedule.length, 60);
  const first = result.schedule[0];
  assert.ok(Math.abs(first.totalInstallment - 1000) < 0.01, `Price 0%: parcela ${first.totalInstallment}`);
  assert.equal(first.interestAmount, 0, 'Sem juros: interest = 0');
  assert.equal(result.totalInterest, 0, 'Total juros = 0');

  console.log('OK: Price sem juros = parcelas iguais (valor/meses)');
}

// ────────────────────────────────────────────────────────────────
// 6. paidInstallments offset
// ────────────────────────────────────────────────────────────────
{
  const result = generateAmortizationSchedule({
    principal: 150000,
    nominalAnnualRate: 4.25,
    remainingMonths: 401,
    paidInstallments: 19,
    system: 'PRICE',
  });

  assert.equal(result.schedule[0].installmentNumber, 20, 'Primeira parcela = 20 (19 pagas)');
  assert.equal(result.schedule.length, 401);

  console.log('OK: offset de parcelas pagas');
}

console.log('\n✅ Todos os testes de financingCalculations passaram!');
