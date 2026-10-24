'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function ReportsPage() {
  return <ConfigPage config={getPageConfig('admin/finance/reports')} />;
}
