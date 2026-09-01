import React from 'react';
import { OverviewTab } from './OverviewTab';

interface DashboardPageProps {
  onOpenNewTransaction: () => void;
  onOpenNewCard?: () => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenNewTransaction,
  setActiveTab,
}) => {
  return (
    <OverviewTab onOpenNewTransaction={onOpenNewTransaction} setActiveTab={setActiveTab} />
  );
};