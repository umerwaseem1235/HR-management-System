'use client';

import React from 'react';
import Image from 'next/image';
import { getInitials } from '@/utils';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-primary', 'bg-teal', 'bg-blue-600', 'bg-indigo-600',
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

export default React.memo(function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const pxSizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const [imgFailed, setImgFailed] = React.useState(false);

  // A new photo (e.g. avatars arriving progressively after the list
  // rendered with initials) must retry instead of sticking on fallback.
  React.useEffect(() => {
    setImgFailed(false);
  }, [src]);

  if (src && !imgFailed && isImageSrc(src)) {
    // Employee photos are base64 data URLs (or blob: URLs). These must NEVER
    // go through next/image — even `unoptimized` + custom loader proved
    // unreliable in production and fell back to initials. A plain <img>
    // always renders them. Only http(s)/file-path URLs use next/image.
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={pxSizes[size]}
          height={pxSizes[size]}
          onError={() => setImgFailed(true)}
          className={`${sizes[size]} aspect-square shrink-0 rounded-full object-cover object-center block ${className}`}
        />
      );
    }
    return (
      <Image
        src={src}
        alt={name}
        width={pxSizes[size]}
        height={pxSizes[size]}
        onError={() => setImgFailed(true)}
        className={`${sizes[size]} aspect-square shrink-0 rounded-full object-cover object-center block ${className}`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} aspect-square shrink-0 ${getColorFromName(name)} rounded-full flex items-center justify-center text-white font-semibold leading-none ${className}`}
          style={{
            fontVariantNumeric: 'tabular-nums',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}>
      {getInitials(name)}
    </div>
  );
});
