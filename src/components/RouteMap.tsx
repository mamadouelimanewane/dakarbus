import React from 'react';
import MapView from './MapView';

interface RouteMapProps {
  show: boolean;
  onClose: () => void;
}

export default function RouteMap({ show, onClose }: RouteMapProps) {
  if (!show) return null;
  
  return (
    <div className="flex-shrink-0 h-[40vh] relative z-0 border-b border-gray-700">
      <MapView />
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
      >
        ✕
      </button>
    </div>
  );
}