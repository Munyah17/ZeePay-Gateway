'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function TeamsPage() {
  return <ConfigPage config={getPageConfig('super-admin/organisation/teams')} />;
}
