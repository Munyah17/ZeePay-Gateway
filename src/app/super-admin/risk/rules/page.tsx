'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function RulesPage() {
  return <ConfigPage config={getPageConfig('super-admin/risk/rules')} />;
}
