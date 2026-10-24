'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function SecurityPage() {
  return <ConfigPage config={getPageConfig('admin/settings/security')} />;
}
