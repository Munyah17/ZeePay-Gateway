'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function ApprovalsPage() {
  return <ConfigPage config={getPageConfig('super-admin/providers/approvals')} />;
}
