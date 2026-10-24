'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function MethodsPage() {
  return <ConfigPage config={getPageConfig('super-admin/payments/methods')} />;
}
