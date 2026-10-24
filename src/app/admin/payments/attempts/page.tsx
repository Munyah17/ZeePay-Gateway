'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function AttemptsPage() {
  return <ConfigPage config={getPageConfig('admin/payments/attempts')} />;
}
