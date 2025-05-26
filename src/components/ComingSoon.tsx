import React from 'react';

export const ComingSoon = () => {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-text-primary mb-4 text-4xl font-bold sm:text-5xl md:text-6xl">
        Coming Soon
      </h1>
      <p className="text-text-secondary mb-8 max-w-xl text-lg">
        We’re putting the finishing touches on something exciting. Stay tuned — we’ll be launching
        soon!
      </p>
    </div>
  );
};
