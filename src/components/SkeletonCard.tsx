import React from 'react';

function SkeletonLine({ w = '100%', h = 12 }: { w?: string; h?: number }) {
  return (
    <div className="skeleton-pulse rounded-full"
      style={{ width: w, height: h, background: 'rgba(255,255,255,.06)' }} />
  );
}

export function SkeletonStopCard() {
  return (
    <div className="card rounded-2xl p-4" style={{ border: '1px solid var(--c-border)' }}>
      <div className="flex items-start gap-3 mb-3">
        <div className="skeleton-pulse w-9 h-9 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,.06)' }} />
        <div className="flex-1 space-y-2">
          <SkeletonLine w="70%" h={13} />
          <SkeletonLine w="40%" h={10} />
        </div>
        <div className="skeleton-pulse w-6 h-6 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,.06)' }} />
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="skeleton-pulse rounded-full" style={{ width: 36, height: 18, background: 'rgba(255,255,255,.06)' }} />
        <div className="skeleton-pulse rounded-full" style={{ width: 44, height: 18, background: 'rgba(255,255,255,.06)' }} />
      </div>
      <div className="space-y-2 pt-2.5" style={{ borderTop: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="skeleton-pulse rounded-lg flex-shrink-0" style={{ width: 46, height: 26, background: 'rgba(255,255,255,.06)' }} />
          <SkeletonLine w="60%" h={11} />
          <div className="skeleton-pulse rounded-full flex-shrink-0" style={{ width: 28, height: 14, background: 'rgba(255,255,255,.06)' }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonAlertCard() {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--c-border)' }}>
      <div className="flex items-start gap-3">
        <div className="skeleton-pulse w-9 h-9 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,.06)' }} />
        <div className="flex-1 space-y-2">
          <SkeletonLine w="50%" h={13} />
          <SkeletonLine w="30%" h={10} />
        </div>
        <div className="skeleton-pulse rounded-xl" style={{ width: 52, height: 30, background: 'rgba(255,255,255,.06)' }} />
      </div>
      <div className="pl-12 mt-2.5 space-y-1.5">
        <SkeletonLine w="90%" h={11} />
        <SkeletonLine w="75%" h={11} />
      </div>
    </div>
  );
}

export default SkeletonStopCard;
