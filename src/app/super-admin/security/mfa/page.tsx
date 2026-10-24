'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function MfaPage() {
  return <ConfigPage config={getPageConfig('super-admin/security/mfa')} />;
}
