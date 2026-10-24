'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function SettlementsPage() {
  return <ConfigPage config={getPageConfig('super-admin/finance/settlements')} />;
}
