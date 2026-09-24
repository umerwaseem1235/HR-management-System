import DashboardLayout from '@/components/layout/DashboardLayout';

/**
 * Shared dashboard shell — Sidebar + TopBar mount ONCE and persist while
 * switching modules, so module navigation only swaps the page content.
 * (Route group: URLs are unchanged, e.g. `/attendance`, `/employees`.)
 */
export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
