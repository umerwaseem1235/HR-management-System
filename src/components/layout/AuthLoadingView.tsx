'use client';

import React from 'react';

export function AuthLoadingView() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF2F4]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#024fa7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#17324D] font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default AuthLoadingView;
