import {
  Bookmark,
  CalendarClock,
  ClipboardCheck,
  Compass,
  FileStack,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const APP_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/schemes', label: 'Explore Schemes', icon: Compass },
  { to: '/saved', label: 'Saved Schemes', icon: Bookmark },
  { to: '/deadlines', label: 'Deadlines', icon: CalendarClock },
  { to: '/checklist', label: 'Document Checklist', icon: ListChecks },
  { to: '/applications', label: 'Applications', icon: ClipboardCheck },
  { to: '/profile', label: 'My Profile', icon: UserRound },
];

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: ShieldCheck },
  { to: '/admin/schemes', label: 'Manage Schemes', icon: FileStack },
];

export const PUBLIC_NAV = [
  { to: '/', label: 'Home' },
  { to: '/schemes', label: 'Explore Schemes' },
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/about', label: 'About' },
];
