'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function EscalationPage() {
  return <ConfigPage config={getPageConfig('super-admin/risk/escalation')} />;
}
