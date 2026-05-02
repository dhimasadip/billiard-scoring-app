'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Trophy, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Schedule', icon: Calendar, href: '/session' },
    { name: 'Standings', icon: Trophy, href: '/session/scoreboard' },
    { name: 'History', icon: History, href: '/session/history' },
  ];

  // Don't show nav on the active match screen or summary
  const hideNav = pathname.includes('/match') || pathname.includes('/summary');

  return (
    <div className="min-h-screen bg-background pb-20">
      <main>{children}</main>
      
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-around px-2 z-50">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 flex-1 py-2 transition-colors",
                  isActive ? "text-primary" : "text-text-secondary"
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium uppercase tracking-wider">{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
