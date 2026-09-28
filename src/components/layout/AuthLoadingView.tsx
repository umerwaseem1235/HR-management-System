'use client';

import React from 'react';

export function AuthLoadingView() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-gray">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-primary dark:text-blue-gray-light font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default AuthLoadingView;
