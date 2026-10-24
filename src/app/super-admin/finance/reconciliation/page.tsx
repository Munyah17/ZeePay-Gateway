'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function ReconciliationPage() {
  return <ConfigPage config={getPageConfig('super-admin/finance/reconciliation')} />;
}
