import React from 'react';

export const StatSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
      <div className="w-16 h-4 bg-gray-100 rounded-full"></div>
    </div>
    <div className="w-12 h-8 bg-gray-200 rounded mb-2"></div>
    <div className="w-3/4 h-3 bg-gray-150 rounded"></div>
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
      <div className="w-20 h-4 bg-gray-100 rounded"></div>
    </div>
    <div className="space-y-2">
      <div className="w-2/3 h-6 bg-gray-200 rounded"></div>
      <div className="w-1/2 h-4 bg-gray-150 rounded"></div>
    </div>
    <div className="flex gap-2">
      <div className="w-16 h-5 bg-gray-100 rounded-full"></div>
      <div className="w-20 h-5 bg-gray-100 rounded-full"></div>
    </div>
    <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
      <div className="flex justify-between">
        <div className="w-12 h-3 bg-gray-200 rounded"></div>
        <div className="w-24 h-3 bg-gray-200 rounded"></div>
      </div>
      <div className="flex justify-between">
        <div className="w-12 h-3 bg-gray-200 rounded"></div>
        <div className="w-16 h-3 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="w-full h-1 bg-gray-100 rounded-full"></div>
    <div className="flex gap-2">
      <div className="flex-1 h-11 bg-gray-200 rounded-xl"></div>
      <div className="w-11 h-11 bg-gray-100 rounded-xl"></div>
    </div>
  </div>
);

const SkeletonLoader = () => {
  return (
    <div className="space-y-8">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <StatSkeleton key={idx} />
        ))}
      </div>
      
      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;
