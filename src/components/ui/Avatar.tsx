'use client';

import React from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-[#17324D]', 'bg-[#0F8B8D]', 'bg-blue-600', 'bg-indigo-600',
    'bg-purple-600', 'bg-pink-600', 'bg-orange-500', 'bg-emerald-600',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

// Only treat src as an image when it is a real image URL. Mock data stores
// initials (e.g. "MC") in the avatar field — rendering those as <img src>
// makes the browser request a relative path like /employees/MC and logs a 404.
function isImageSrc(src: string): boolean {
  if (/^(https?:\/\/|blob:|data:image\/|\/)/.test(src)) return true;
  return /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(src);
}

export default function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const [imgFailed, setImgFailed] = React.useState(false);

  if (src && !imgFailed && isImageSrc(src)) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgFailed(true)}
        className={`${sizes[size]} aspect-square shrink-0 rounded-full object-cover object-center block ${className}`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} aspect-square shrink-0 ${getColorFromName(name)} rounded-full flex items-center justify-center text-white font-semibold leading-none ${className}`}>
      {getInitials(name)}
    </div>
  );
}
