'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function VerificationPage() {
  return <ConfigPage config={getPageConfig('admin/merchants/verification')} />;
}
