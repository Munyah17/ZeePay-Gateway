'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function LoginsPage() {
  return <ConfigPage config={getPageConfig('super-admin/security/logins')} />;
}
