'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function OnboardingPage() {
  return <ConfigPage config={getPageConfig('super-admin/merchants/onboarding')} />;
}
