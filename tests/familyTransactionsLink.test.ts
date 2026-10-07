import assert from 'node:assert/strict';
import {
  formatMemberDisplayName,
  getFamilyMemberList,
  getMemberDisplayNameById,
} from '../src/utils/familyUtils';
import { buildCardInstallmentSeries } from '../src/utils/cardInstallmentSeries';
import { FamilyMember, UserProfile, Transaction } from '../src/types';

// 1. Validação de Formatação de Nomes (primeiro e último nome)
assert.equal(formatMemberDisplayName('Liverton'), 'Liverton');
assert.equal(formatMemberDisplayName('Liverton Aguiar'), 'Liverton Aguiar');
assert.equal(formatMemberDisplayName('Liverton Pereira de Aguiar'), 'Liverton Aguiar');
assert.equal(formatMemberDisplayName('Ana Beatriz Souza Santos'), 'Ana Santos');
assert.equal(formatMemberDisplayName('  Carlos   Eduardo  '), 'Carlos Eduardo');
assert.equal(formatMemberDisplayName(''), '');

// 2. Validação da Lista de Membros Familiares com Titular Garantido
const mockUser: UserProfile = {
  id: 'usr-123',
  name: 'Liverton Pereira Aguiar',
  email: 'liverton@gmail.com',
  currency: 'BRL',
  role: 'user',
  theme: 'dark',
  showValues: true,
};

// Caso A: Sem membros adicionais -> Apenas o Titular
const membersSolo = getFamilyMemberList(mockUser, []);
assert.equal(membersSolo.length, 1);
assert.equal(membersSolo[0].isOwner, true);
assert.equal(membersSolo[0].name, 'Liverton Pereira Aguiar');

// Caso B: Com dependentes/cônjuge cadastrados
const mockEsposa: FamilyMember = {
  id: 'fam-esposa',
  name: 'Ana Beatriz Aguiar',
  email: 'ana@gmail.com',
  role: 'editor',
  status: 'active',
  isOwner: false,
  joinedAt: '2026-02-01',
};

const membersDuo = getFamilyMemberList(mockUser, [mockEsposa]);
assert.equal(membersDuo.length, 2);
assert.equal(membersDuo[0].isOwner, true);
assert.equal(membersDuo[0].id, 'owner');
assert.equal(membersDuo[1].id, 'fam-esposa');

// 3. Validação de Resolução de Nome por ID
assert.equal(getMemberDisplayNameById('owner', membersDuo), 'Liverton Aguiar');
assert.equal(getMemberDisplayNameById(undefined, membersDuo), 'Liverton Aguiar');
assert.equal(getMemberDisplayNameById('fam-esposa', membersDuo), 'Ana Aguiar');

// 4. Validação de Propagação do Membro Responsável no Parcelamento de Cartão
const seriesResult = buildCardInstallmentSeries({
  seriesId: 'series-test',
  description: 'Notebook Trabalho',
  amount: 3000,
  amountInputMode: 'total',
  totalInstallments: 3,
  firstTrackedInstallment: 1,
  purchaseDate: '2026-10-05',
  firstInvoiceMonth: '2026-10',
  cardId: 'card-1',
  cardClosingDay: 28,
  cardDueDay: 5,
  categoryId: 'cat-eletronicos',
  ignored: false,
  isThirdParty: false,
  tags: ['eletronicos'],
  createdAt: '2026-10-05T12:00:00.000Z',
  userId: 'fam-esposa',
  relationships: { personId: 'fam-esposa' },
});

assert.equal(seriesResult.transactions.length, 3);
for (const tx of seriesResult.transactions) {
  assert.equal(tx.userId, 'fam-esposa', 'Cada parcela deve conter o userId do membro responsável');
  assert.equal(tx.relationships?.personId, 'fam-esposa', 'Cada parcela deve conter o personId nos relacionamentos');
}

// 5. Validação de Filtro de Transações por Membro
const tx1: Transaction = {
  id: 'tx-1',
  description: 'Almoço',
  amount: 50,
  type: 'expense',
  date: '2026-10-05',
  categoryId: 'cat-alimentacao',
  status: 'completed',
  recurring: false,
  tags: [],
  userId: 'owner',
  createdAt: '2026-10-05T12:00:00.000Z',
};

const tx2: Transaction = {
  id: 'tx-2',
  description: 'Salão de Beleza',
  amount: 120,
  type: 'expense',
  date: '2026-10-06',
  categoryId: 'cat-beleza',
  status: 'completed',
  recurring: false,
  tags: [],
  userId: 'fam-esposa',
  createdAt: '2026-10-06T12:00:00.000Z',
};

const allTxs = [tx1, tx2];

// Filtrar apenas transações da esposa
const filterEsposaIds = ['fam-esposa'];
const filteredEsposa = allTxs.filter(t => filterEsposaIds.includes(t.userId || 'owner'));
assert.equal(filteredEsposa.length, 1);
assert.equal(filteredEsposa[0].id, 'tx-2');

// Filtrar apenas transações do titular
const filterOwnerIds = ['owner'];
const filteredOwner = allTxs.filter(t => filterOwnerIds.includes(t.userId || 'owner'));
assert.equal(filteredOwner.length, 1);
assert.equal(filteredOwner[0].id, 'tx-1');

console.log('✅ Todos os testes de vinculação, formatação e filtros de membros familiares passaram com 100% de sucesso!');
