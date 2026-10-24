'use client';

import ConfigPage from '@/components/ConfigPage';
import { getPageConfig } from '@/config/dashboardPages';

export default function FeaturesPage() {
  return <ConfigPage config={getPageConfig('super-admin/settings/features')} />;
}
