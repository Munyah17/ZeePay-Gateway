'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function PermissionsPage() {
  return <ConfigPage config={getPageConfig('super-admin/access/permissions')} />;
}
