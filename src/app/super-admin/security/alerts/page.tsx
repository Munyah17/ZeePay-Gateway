'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function AlertsPage() {
  return <ConfigPage config={getPageConfig('super-admin/security/alerts')} />;
}
