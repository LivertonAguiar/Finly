import React from 'react';
import { OverviewTab } from './OverviewTab';

interface DashboardPageProps {
  onOpenNewTransaction: () => void;
  onOpenNewCard?: () => void;
  setActiveTab: (tab: string) => void;
  onOpenCardDetail?: (cardId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenNewTransaction,
  onOpenNewCard,
  setActiveTab,
  onOpenCardDetail,
}) => {
  return (
    <OverviewTab
      onOpenNewTransaction={onOpenNewTransaction}
      onOpenNewCard={onOpenNewCard}
      setActiveTab={setActiveTab}
      onOpenCardDetail={onOpenCardDetail}
    />
  );
};