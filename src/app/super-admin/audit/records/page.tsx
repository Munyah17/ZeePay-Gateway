'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function RecordsPage() {
  return <ConfigPage config={getPageConfig('super-admin/audit/records')} />;
}
