import { CheckCircle, FileText, MapPin, User, Wrench } from 'lucide-react';
import type { TimelineNode } from '../../types';

interface TimelineProps {
  nodes: TimelineNode[];
}

const typeIcons = {
  report: FileText,
  assign: User,
  arrive: MapPin,
  process: Wrench,
  close: CheckCircle
};

const typeColors = {
  report: 'bg-cyan-500',
  assign: 'bg-blue-500',
  arrive: 'bg-purple-500',
  process: 'bg-orange-500',
  close: 'bg-green-500'
};

export const Timeline = ({ nodes }: TimelineProps) => {
  return (
    <div className="relative">
      <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-200" />
      
      <div className="space-y-5">
        {nodes.map((node, index) => {
          const Icon = typeIcons[node.type];
          const bgColor = typeColors[node.type];
          
          return (
            <div key={index} className="relative flex gap-4">
              <div className="relative z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  node.completed ? bgColor : 'bg-slate-200'
                } ${node.completed ? 'text-white' : 'text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {!node.completed && (
                  <div className="absolute inset-0 rounded-full bg-slate-300 animate-ping opacity-30" />
                )}
              </div>
              
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className={`text-sm font-medium ${
                    node.completed ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {node.title}
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {node.time}
                  </span>
                </div>
                {node.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{node.description}</p>
                )}
                {node.operator && (
                  <p className="text-xs text-slate-400 mt-0.5">处理人：{node.operator}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
