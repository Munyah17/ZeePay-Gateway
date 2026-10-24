'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function AuditPage() {
  return <ConfigPage config={getPageConfig('admin/compliance/audit')} />;
}
