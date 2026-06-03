import type { Table, SoundSystem, MotionLine } from '@shared/types';

interface TableLayoutProps {
  tables: Table[];
  soundSystem?: SoundSystem[];
  motionLines?: MotionLine[];
  hallName?: string;
}

const shapeStyles: Record<string, string> = {
  round: 'rounded-full',
  square: 'rounded-lg',
  rectangle: 'rounded-lg',
};

export default function TableLayout({ tables, soundSystem = [], motionLines = [], hallName }: TableLayoutProps) {
  const svgWidth = 700;
  const svgHeight = 500;

  return (
    <div className="bg-gradient-to-br from-champagne-50 to-white rounded-xl border border-champagne-200 p-4">
      {hallName && (
        <div className="text-center mb-4">
          <h4 className="font-display text-lg font-semibold text-wine-800">{hallName}</h4>
          <p className="text-xs text-gray-500">桌型布局图</p>
        </div>
      )}
      
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden" style={{ aspectRatio: `${svgWidth}/${svgHeight}` }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          style={{ minHeight: '300px' }}
        >
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
            </pattern>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.2" />
            </filter>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <rect
            x="10"
            y="10"
            width={svgWidth - 20}
            height={svgHeight - 20}
            fill="none"
            stroke="#c49e2e"
            strokeWidth="2"
            strokeDasharray="8 4"
            rx="8"
          />

          {motionLines.map(line => {
            const pathData = line.path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const colors: Record<string, string> = {
              bride: '#DC143C',
              guest: '#228B22',
              service: '#D4AF37',
              emergency: '#FF8C00',
            };
            return (
              <g key={line.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={colors[line.type] || '#666'}
                  strokeWidth="3"
                  strokeDasharray="10 5"
                  opacity="0.7"
                />
                {line.path.length > 0 && (
                  <circle cx={line.path[line.path.length - 1].x} cy={line.path[line.path.length - 1].y} r="6" fill={colors[line.type] || '#666'} />
                )}
              </g>
            );
          })}

          {tables.map(table => {
            const size = table.shape === 'rectangle' ? 80 : table.seats > 10 ? 70 : 60;
            const width = table.shape === 'rectangle' ? size * 1.5 : size;
            const height = size;
            
            return (
              <g key={table.id} filter="url(#shadow)" className="hover:opacity-80 transition-opacity cursor-pointer">
                <rect
                  x={table.x - width / 2}
                  y={table.y - height / 2}
                  width={width}
                  height={height}
                  rx={table.shape === 'round' ? height / 2 : 8}
                  fill="white"
                  stroke="#8B1A1A"
                  strokeWidth="2"
                />
                <circle
                  cx={table.x}
                  cy={table.y}
                  r={table.shape === 'rectangle' ? 15 : table.seats > 10 ? 20 : 18}
                  fill="#8B1A1A"
                />
                <text
                  x={table.x}
                  y={table.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {table.tableNumber}
                </text>
                <text
                  x={table.x}
                  y={table.y + height / 2 + 16}
                  textAnchor="middle"
                  fill="#666"
                  fontSize="10"
                >
                  {table.seats}人
                </text>
              </g>
            );
          })}

          {soundSystem.map(system => {
            const colors: Record<string, string> = {
              main: '#8B1A1A',
              auxiliary: '#D4AF37',
              wireless_mic: '#228B22',
              projector: '#FF8C00',
            };
            const icons: Record<string, string> = {
              main: '🔊',
              auxiliary: '📢',
              wireless_mic: '🎤',
              projector: '📽️',
            };
            const bgColors: Record<string, string> = {
              available: '#22c55e',
              in_use: '#eab308',
              maintenance: '#f97316',
              missing: '#ef4444',
            };
            return (
              <g key={system.id}>
                <rect
                  x={system.position.x - 18}
                  y={system.position.y - 18}
                  width="36"
                  height="36"
                  rx="8"
                  fill="white"
                  stroke={colors[system.type]}
                  strokeWidth="2"
                />
                <text
                  x={system.position.x}
                  y={system.position.y + 5}
                  textAnchor="middle"
                  fontSize="16"
                >
                  {icons[system.type]}
                </text>
                <circle
                  cx={system.position.x + 14}
                  cy={system.position.y - 14}
                  r="5"
                  fill={bgColors[system.status]}
                  stroke="white"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          <text x="30" y="40" fill="#8B1A1A" fontSize="12" fontWeight="bold">入口</text>
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-wine-800"></div>
          <span className="text-gray-600">圆桌</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-4 rounded bg-wine-800"></div>
          <span className="text-gray-600">长桌</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-red-500 border-b-4 border-b-transparent"></div>
          <span className="text-gray-600">新人动线</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-green-600 border-b-4 border-b-transparent"></div>
          <span className="text-gray-600">宾客动线</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-amber-500 border-b-4 border-b-transparent"></div>
          <span className="text-gray-600">服务动线</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">设备正常</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">设备缺失</span>
        </div>
      </div>
    </div>
  );
}
