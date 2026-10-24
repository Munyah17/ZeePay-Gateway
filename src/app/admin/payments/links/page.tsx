'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function LinksPage() {
  return <ConfigPage config={getPageConfig('admin/payments/links')} />;
}
