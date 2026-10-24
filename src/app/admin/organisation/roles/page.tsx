'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function RolesPage() {
  return <ConfigPage config={getPageConfig('admin/organisation/roles')} />;
}
