import React from 'react';

function SkeletonLine({ w = '100%', h = 12 }: { w?: string; h?: number }) {
  return (
    <div className="rounded-full overflow-hidden relative" style={{ width: w, height: h, background: 'rgba(255,255,255,0.04)' }}>
      <div className="absolute inset-0 skeleton-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
    </div>
  );
}

export function SkeletonStopCard() {
  return (
    <div className="card rounded-[24px] p-5 relative overflow-hidden transition-all" 
      style={{ 
        background: 'linear-gradient(145deg, rgba(30,41,59,0.4), rgba(15,23,42,0.6))', 
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)'
      }}>
      <div className="absolute inset-0 skeleton-shimmer pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent)' }} />
      
      <div className="flex items-start gap-4 mb-4 relative z-10">
        <div className="w-12 h-12 rounded-[16px] flex-shrink-0 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="absolute inset-0 skeleton-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
        </div>
        <div className="flex-1 space-y-3 pt-1">
          <SkeletonLine w="75%" h={14} />
          <SkeletonLine w="45%" h={10} />
        </div>
        <div className="w-8 h-8 rounded-full flex-shrink-0 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="absolute inset-0 skeleton-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
        </div>
      </div>
      
      <div className="flex gap-2 mb-4 relative z-10">
        <div className="rounded-full relative overflow-hidden" style={{ width: 44, height: 22, background: 'rgba(255,255,255,0.04)' }}>
          <div className="absolute inset-0 skeleton-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
        </div>
        <div className="rounded-full relative overflow-hidden" style={{ width: 56, height: 22, background: 'rgba(255,255,255,0.04)' }}>
          <div className="absolute inset-0 skeleton-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
        </div>
      </div>
      
      <div className="space-y-3 pt-3 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl flex-shrink-0 relative overflow-hidden" style={{ width: 52, height: 32, background: 'rgba(255,255,255,0.04)' }}>
            <div className="absolute inset-0 skeleton-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
          </div>
          <SkeletonLine w="55%" h={12} />
          <div className="ml-auto rounded-full flex-shrink-0 relative overflow-hidden" style={{ width: 34, height: 16, background: 'rgba(255,255,255,0.04)' }}>
            <div className="absolute inset-0 skeleton-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
          </div>
        </div>
      </div>
      
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } .skeleton-shimmer { animation: shimmer 2s infinite linear; }`}</style>
    </div>
  );
}

export function SkeletonAlertCard() {
  return (
    <div className="rounded-[20px] p-5 relative overflow-hidden transition-all" 
      style={{ 
        background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', 
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(8px)'
      }}>
      <div className="absolute inset-0 skeleton-shimmer pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent)' }} />
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="w-12 h-12 rounded-[16px] flex-shrink-0 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
           <div className="absolute inset-0 skeleton-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
        </div>
        <div className="flex-1 space-y-2.5 pt-1">
          <SkeletonLine w="55%" h={14} />
          <SkeletonLine w="35%" h={10} />
        </div>
        <div className="rounded-xl relative overflow-hidden" style={{ width: 64, height: 34, background: 'rgba(255,255,255,0.04)' }}>
          <div className="absolute inset-0 skeleton-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
        </div>
      </div>
      <div className="pl-16 mt-3 space-y-2 relative z-10">
        <SkeletonLine w="90%" h={12} />
        <SkeletonLine w="75%" h={12} />
      </div>
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } .skeleton-shimmer { animation: shimmer 2s infinite linear; }`}</style>
    </div>
  );
}

export default SkeletonStopCard;
