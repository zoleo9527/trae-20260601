"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { TimelineEvent } from "@/types";
import { Circle, ArrowRight } from "lucide-react";

interface TimelineProps {
  events: TimelineEvent[];
}

function parseDetails(details: any): Record<string, any> {
  if (!details) return {};
  if (typeof details === 'string') {
    try {
      return JSON.parse(details);
    } catch {
      return { note: details };
    }
  }
  return details;
}

export default function Timeline({ events }: TimelineProps) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Circle className="w-4 h-4 text-primary" />
            </div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 my-2" />
            )}
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-800">
                {event.action}
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(event.timestamp), "yyyy-MM-dd HH:mm", {
                  locale: zhCN,
                })}
              </span>
            </div>

            <div className="text-sm text-gray-600 mb-2">
              操作人: {event.operator}
            </div>

            {event.fromStatus && event.toStatus && (
              <div className="flex items-center gap-2 text-xs mb-2">
                <span className="px-2 py-1 rounded bg-gray-100">
                  {event.fromStatus}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="px-2 py-1 rounded bg-primary/10 text-primary">
                  {event.toStatus}
                </span>
              </div>
            )}

            {event.details && Object.keys(event.details).length > 0 && (
              <div className="bg-gray-50 rounded p-3 text-xs space-y-1">
                {Object.entries(event.details).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-gray-500">{key}:</span>
                    <span className="text-gray-700">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}