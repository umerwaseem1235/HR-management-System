'use client';

import React from 'react';
import Avatar from '@/components/ui/Avatar';
import { getEmployeeAvatars } from '@/lib/actions/employees';

/**
 * Module-level avatar cache — one bulk/one-per-employee fetch per session,
 * shared by every EmployeeCell on the page. Records that already carry
 * `employeeAvatar` (server joins) never hit the network.
 */
const avatarCache = new Map<string, string>();
const pendingFetches = new Map<string, Promise<string | undefined>>();

function fetchAvatar(employeeId: string): Promise<string | undefined> {
  const cached = avatarCache.get(employeeId);
  if (cached) return Promise.resolve(cached);
  const pending = pendingFetches.get(employeeId);
  if (pending) return pending;
  const p = getEmployeeAvatars([employeeId])
    .then((map) => {
      const url = map[employeeId];
      if (url) avatarCache.set(employeeId, url);
      pendingFetches.delete(employeeId);
      return url;
    })
    .catch(() => {
      pendingFetches.delete(employeeId);
      return undefined;
    });
  pendingFetches.set(employeeId, p);
  return p;
}

export function useResolvedAvatar(employeeId?: string, avatarSrc?: string): string | undefined {
  const [resolved, setResolved] = React.useState<string | undefined>(avatarSrc);
  React.useEffect(() => {
    if (avatarSrc) {
      setResolved(avatarSrc);
      return;
    }
    if (!employeeId) {
      setResolved(undefined);
      return;
    }
    const cached = avatarCache.get(employeeId);
    if (cached) {
      setResolved(cached);
      return;
    }
    let cancelled = false;
    fetchAvatar(employeeId).then((url) => {
      if (!cancelled && url) setResolved(url);
    });
    return () => {
      cancelled = true;
    };
  }, [employeeId, avatarSrc]);
  return resolved;
}

/** Avatar-only: photo when available, initials fallback — zero layout shift. */
export function EmployeeAvatar({
  name,
  employeeId,
  avatar,
  size = 'sm',
  className = '',
}: {
  name: string;
  employeeId?: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const src = useResolvedAvatar(employeeId, avatar);
  return <Avatar name={name} src={src} size={size} className={className} />;
}

/**
 * Professional employee cell used in every table/list across the system:
 * photo + name + optional sub-line (code, dates, description...).
 */
export default function EmployeeCell({
  name,
  employeeId,
  avatar,
  sub,
  size = 'sm',
  subClassName = '',
}: {
  name: string;
  employeeId?: string;
  avatar?: string;
  sub?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subClassName?: string;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <EmployeeAvatar name={name} employeeId={employeeId} avatar={avatar} size={size} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-dark-text dark:text-gray-100 truncate">{name}</p>
        {sub != null && sub !== '' && (
          <div className={`text-xs text-gray-500 dark:text-gray-400 truncate ${subClassName}`}>{sub}</div>
        )}
      </div>
    </div>
  );
}
