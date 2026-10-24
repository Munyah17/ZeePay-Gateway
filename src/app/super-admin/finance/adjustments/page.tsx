'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function AdjustmentsPage() {
  return <ConfigPage config={getPageConfig('super-admin/finance/adjustments')} />;
}
