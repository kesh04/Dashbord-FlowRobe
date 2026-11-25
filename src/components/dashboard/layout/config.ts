import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'chart-pie' },
  { key: 'customers', title: 'Customers', href: paths.dashboard.customers, icon: 'users' },
  { key: 'Products', title: 'Products', href: paths.dashboard.products, icon: 'packege' },
  // { key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'gear-six' },
  // { key: 'account', title: 'Account', href: paths.dashboard.account, icon: 'user' },
  { key: 'orders', title: 'Orders', href: paths.dashboard.orders, icon: 'order' },
  { key: 'won', title: 'Won', href: paths.dashboard.won, icon: 'x-square' },
  { key: 'sellers', title: 'Sellers', href: paths.dashboard.sellers, icon: 'storefront' },
  { key: 'finances', title: 'Finances', href: paths.dashboard.finances, icon: 'currency' },

] satisfies NavItemConfig[];
