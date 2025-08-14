import { MapPin } from 'lucide-react';

export default function InfrastructureMap() {
  return (
    <div className="bg-[#0B1440] p-4 rounded-lg shadow-lg">
      <h2 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">
        DISTRIBUIÇÃO DA INFRAESTRUTURA
      </h2>
      
      {/* World Map Container */}
      <div className="relative bg-[#12255F] rounded-lg p-4 h-64 overflow-hidden">
        {/* Simplified World Map using CSS */}
        <div className="relative w-full h-full">
          {/* World map silhouette - simplified representation */}
          <svg viewBox="0 0 1000 500" className="w-full h-full opacity-80">
            {/* North America */}
            <path
              d="M100 100 L250 120 L280 80 L320 90 L350 120 L380 140 L350 180 L320 200 L280 190 L250 200 L200 180 L150 160 L100 140 Z"
              fill="#E5E7EB"
              className="hover:fill-blue-300 transition-colors cursor-pointer"
            />
            
            {/* South America */}
            <path
              d="M280 250 L320 240 L340 280 L350 320 L340 360 L320 380 L300 370 L290 350 L285 320 L280 290 Z"
              fill="#E5E7EB"
              className="hover:fill-blue-300 transition-colors cursor-pointer"
            />
            
            {/* Europe */}
            <path
              d="M450 80 L520 85 L540 100 L530 120 L510 130 L480 125 L460 110 Z"
              fill="#E5E7EB"
              className="hover:fill-blue-300 transition-colors cursor-pointer"
            />
            
            {/* Africa */}
            <path
              d="M480 150 L520 145 L540 180 L550 220 L540 260 L520 280 L500 275 L485 250 L480 220 L485 190 Z"
              fill="#E5E7EB"
              className="hover:fill-blue-300 transition-colors cursor-pointer"
            />
            
            {/* Asia */}
            <path
              d="M550 80 L650 75 L700 90 L720 110 L740 140 L750 180 L740 200 L700 190 L650 185 L600 180 L570 160 L550 140 Z"
              fill="#E5E7EB"
              className="hover:fill-blue-300 transition-colors cursor-pointer"
            />
            
            {/* Australia */}
            <path
              d="M680 300 L750 305 L760 320 L750 335 L720 330 L690 325 Z"
              fill="#E5E7EB"
              className="hover:fill-blue-300 transition-colors cursor-pointer"
            />
          </svg>
          
          {/* Server Location Indicators */}
          <div className="absolute top-1/4 left-1/4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          
          <div className="absolute top-1/3 left-1/2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          
          <div className="absolute top-1/2 right-1/3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          
          <div className="absolute bottom-1/3 right-1/4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          
          <div className="absolute bottom-1/4 left-1/3">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-400 uppercase">SERVIDORES</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-400 uppercase">REDES</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-400 uppercase">FALHAS</span>
        </div>
      </div>
    </div>
  );
}
