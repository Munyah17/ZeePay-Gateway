import { PageConfig } from '@/components/ConfigPage';
import { adminPageConfigs } from './admin';
import { superAdminPageConfigs } from './super-admin';
import { userPageConfigs } from './user';
import { dashboardPageConfigs as merchantPageConfigs } from './dashboard';

export const dashboardPageConfigs: Record<string, PageConfig> = {
  ...adminPageConfigs,
  ...superAdminPageConfigs,
  ...userPageConfigs,
  ...merchantPageConfigs,
};

export function getPageConfig(route: string): PageConfig {
  const config = dashboardPageConfigs[route];
  if (!config) {
    throw new Error(`No dashboard page config for route: ${route}`);
  }
  return { ...config, id: config.id || route };
}
