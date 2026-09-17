import React from 'react';
import { OverviewTab, TransactionsNavParams } from './OverviewTab';

interface DashboardPageProps {
  onOpenNewTransaction: () => void;
  onOpenNewCard?: () => void;
  setActiveTab: (tab: string) => void;
  onOpenCardDetail?: (cardId: string) => void;
  selectedMonthOffset?: number;
  onChangeMonthOffset?: (offset: number) => void;
  onNavigateToTransactions?: (params?: TransactionsNavParams) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenNewTransaction,
  onOpenNewCard,
  setActiveTab,
  onOpenCardDetail,
  selectedMonthOffset,
  onChangeMonthOffset,
  onNavigateToTransactions,
}) => {
  return (
    <OverviewTab
      onOpenNewTransaction={onOpenNewTransaction}
      onOpenNewCard={onOpenNewCard}
      setActiveTab={setActiveTab}
      onOpenCardDetail={onOpenCardDetail}
      selectedMonthOffset={selectedMonthOffset}
      onChangeMonthOffset={onChangeMonthOffset}
      onNavigateToTransactions={onNavigateToTransactions}
    />
  );
};