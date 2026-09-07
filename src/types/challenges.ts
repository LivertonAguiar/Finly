export type ChallengeType = '52_weeks' | '30_days' | 'no_delivery' | 'custom';

export interface ChallengeMilestone {
  id: number;
  label: string; // e.g. "Semana 1", "Dia 1"
  targetAmount: number; // Amount planned for this milestone
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

export interface SavingsChallenge {
  id: string;
  userId?: string;
  title: string;
  description: string;
  type: ChallengeType;
  baseMultiplier?: number; // e.g., 1 (R$ 1/wk), 2 (R$ 2/wk), 5 (R$ 5/wk)
  targetTotalAmount: number;
  savedAmount: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'abandoned';
  milestones: ChallengeMilestone[];
  targetAccountId?: string;
  targetGoalId?: string;
  color?: string;
  icon?: string;
}
