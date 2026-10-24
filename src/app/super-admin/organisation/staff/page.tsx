'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function StaffPage() {
  return <ConfigPage config={getPageConfig('super-admin/organisation/staff')} />;
}
