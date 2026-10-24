'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function CurrenciesPage() {
  return <ConfigPage config={getPageConfig('super-admin/payments/currencies')} />;
}
