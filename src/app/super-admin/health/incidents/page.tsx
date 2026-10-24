'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function IncidentsPage() {
  return <ConfigPage config={getPageConfig('super-admin/health/incidents')} />;
}
