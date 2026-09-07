import { SavingsChallenge, ChallengeMilestone } from '../types/challenges';

const CHALLENGES_STORAGE_KEY = 'finly_savings_challenges_db';

/**
 * Generates milestones for the 52-Week Challenge
 */
export function generate52WeeksMilestones(multiplier: number = 1): ChallengeMilestone[] {
  const milestones: ChallengeMilestone[] = [];
  for (let i = 1; i <= 52; i++) {
    milestones.push({
      id: i,
      label: `Semana ${i}`,
      targetAmount: i * multiplier,
      isCompleted: false,
    });
  }
  return milestones;
}

/**
 * Generates milestones for the 30-Day Quick Boost Challenge (R$ 500)
 */
export function generate30DaysMilestones(): ChallengeMilestone[] {
  // Diverse daily values between R$ 5 and R$ 25 summing up to R$ 500
  const dailyAmounts = [
    5, 10, 15, 20, 25, 10, 15, 20, 25, 30,
    10, 15, 20, 10, 15, 20, 25, 15, 20, 15,
    20, 10, 15, 20, 15, 20, 25, 20, 15, 10
  ];
  return dailyAmounts.map((amount, idx) => ({
    id: idx + 1,
    label: `Dia ${idx + 1}`,
    targetAmount: amount,
    isCompleted: false,
  }));
}

/**
 * Generates milestones for the No-Delivery Detox (14 Days)
 */
export function generateNoDeliveryMilestones(estimatedSavingsPerDay: number = 40): ChallengeMilestone[] {
  const milestones: ChallengeMilestone[] = [];
  for (let i = 1; i <= 14; i++) {
    milestones.push({
      id: i,
      label: `Dia ${i}`,
      targetAmount: estimatedSavingsPerDay,
      isCompleted: false,
    });
  }
  return milestones;
}

/**
 * Default preset templates to choose from
 */
export const CHALLENGE_TEMPLATES = [
  {
    type: '52_weeks' as const,
    title: 'Desafio das 52 Semanas',
    description: 'Poupe valores progressivos semana a semana. Semana 1 = R$ 1 até a Semana 52 = R$ 52.',
    multiplier: 1,
    targetAmount: 1378,
    color: '#7c4dff', // Purple
    icon: 'Trophy',
    badge: 'Mais Popular',
  },
  {
    type: '52_weeks' as const,
    title: 'Desafio 52 Semanas (Turbo R$ 2)',
    description: 'Versão duplicada: Semana 1 = R$ 2 até Semana 52 = R$ 104.',
    multiplier: 2,
    targetAmount: 2756,
    color: '#00A884', // Emerald
    icon: 'Zap',
    badge: 'Acelerado',
  },
  {
    type: '30_days' as const,
    title: 'Caixa Rápido (R$ 500 em 30 Dias)',
    description: 'Pequenos aportes diários entre R$ 5 e R$ 30 para montar uma reserva rápida.',
    targetAmount: 500,
    color: '#0091ff', // Blue
    icon: 'PiggyBank',
    badge: 'Curto Prazo',
  },
  {
    type: 'no_delivery' as const,
    title: 'Detox 14 Dias Sem Delivery',
    description: 'Cozinhe em casa por duas semanas e veja sua economia com apps de comida crescer.',
    targetAmount: 560,
    color: '#FF8A00', // Orange
    icon: 'ShieldCheck',
    badge: 'Hábito Saudável',
  },
];

/**
 * Loads stored challenges from localStorage
 */
export function getStoredChallenges(): SavingsChallenge[] {
  try {
    const saved = localStorage.getItem(CHALLENGES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading savings challenges:', e);
  }
  return [];
}

/**
 * Saves challenges to localStorage and dispatches event
 */
export function saveChallenges(challenges: SavingsChallenge[]): void {
  try {
    localStorage.setItem(CHALLENGES_STORAGE_KEY, JSON.stringify(challenges));
    window.dispatchEvent(new CustomEvent('finly_challenges_updated', { detail: challenges }));
  } catch (e) {
    console.error('Error saving challenges:', e);
  }
}

/**
 * Factory to create a new challenge from template
 */
export function createChallengeFromTemplate(
  templateType: '52_weeks' | '30_days' | 'no_delivery',
  customTitle?: string,
  multiplier: number = 1
): SavingsChallenge {
  const now = new Date().toISOString().split('T')[0];
  let milestones: ChallengeMilestone[] = [];
  let totalTarget = 0;
  let title = customTitle || '';
  let description = '';
  let color = '#7c4dff';
  let icon = 'Trophy';

  if (templateType === '52_weeks') {
    milestones = generate52WeeksMilestones(multiplier);
    totalTarget = milestones.reduce((sum, m) => sum + m.targetAmount, 0);
    title = title || (multiplier > 1 ? `Desafio 52 Semanas (x${multiplier})` : 'Desafio das 52 Semanas');
    description = `Poupe toda semana de R$ ${1 * multiplier} até R$ ${52 * multiplier}.`;
    color = multiplier > 1 ? '#00A884' : '#7c4dff';
  } else if (templateType === '30_days') {
    milestones = generate30DaysMilestones();
    totalTarget = milestones.reduce((sum, m) => sum + m.targetAmount, 0);
    title = title || 'Caixa Rápido em 30 Dias';
    description = '30 pequenos depósitos para acumular R$ 500 rapidamente.';
    color = '#0091ff';
    icon = 'PiggyBank';
  } else {
    milestones = generateNoDeliveryMilestones(40);
    totalTarget = milestones.reduce((sum, m) => sum + m.targetAmount, 0);
    title = title || 'Detox 14 Dias Sem Delivery';
    description = 'Evite gastos desnecessários com refeições e registre a economia.';
    color = '#FF8A00';
    icon = 'ShieldCheck';
  }

  return {
    id: `chal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title,
    description,
    type: templateType,
    baseMultiplier: multiplier,
    targetTotalAmount: totalTarget,
    savedAmount: 0,
    startDate: now,
    status: 'active',
    milestones,
    color,
    icon,
  };
}
