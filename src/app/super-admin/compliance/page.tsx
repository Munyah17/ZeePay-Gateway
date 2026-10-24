'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function CompliancePage() {
  return <ConfigPage config={getPageConfig('super-admin/compliance')} />;
}
