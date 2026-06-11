import { useState } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from "date-fns";
import { zhCN } from "date-fns/locale";

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange?: (startDate: string, endDate: string) => void;
  className?: string;
}

const presetOptions = [
  { label: "今天", getRange: () => { const today = new Date(); return { start: today, end: today }; } },
  { label: "本周", getRange: () => ({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "本月", getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
];

export default function DateRangePicker({ startDate, endDate, onChange, className }: DateRangePickerProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate || "");
  const [localEndDate, setLocalEndDate] = useState(endDate || "");

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalStartDate(value);
    onChange?.(value, localEndDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalEndDate(value);
    onChange?.(localStartDate, value);
  };

  const handlePresetClick = (preset: typeof presetOptions[0]) => {
    const { start, end } = preset.getRange();
    const startStr = format(start, "yyyy-MM-dd", { locale: zhCN });
    const endStr = format(end, "yyyy-MM-dd", { locale: zhCN });
    setLocalStartDate(startStr);
    setLocalEndDate(endStr);
    onChange?.(startStr, endStr);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "yyyy-MM-dd", { locale: zhCN });
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        {presetOptions.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all duration-200",
              "border border-slate-200 text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5",
              localStartDate && localEndDate && (() => {
                const { start, end } = preset.getRange();
                const startStr = format(start, "yyyy-MM-dd", { locale: zhCN });
                const endStr = format(end, "yyyy-MM-dd", { locale: zhCN });
                return localStartDate === startStr && localEndDate === endStr;
              })()
                ? "bg-primary/10 border-primary text-primary"
                : ""
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center flex-1 rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
          <Calendar className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
          <input
            type="date"
            value={localStartDate}
            onChange={handleStartDateChange}
            className="flex-1 px-2 py-2 text-sm text-slate-800 focus:outline-none bg-transparent"
            placeholder="开始日期"
          />
        </div>

        <span className="text-slate-400 text-sm">至</span>

        <div className="flex items-center flex-1 rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
          <Calendar className="w-4 h-4 text-slate-400 ml-3 flex-shrink-0" />
          <input
            type="date"
            value={localEndDate}
            onChange={handleEndDateChange}
            className="flex-1 px-2 py-2 text-sm text-slate-800 focus:outline-none bg-transparent"
            placeholder="结束日期"
          />
        </div>
      </div>

      {(localStartDate || localEndDate) && (
        <div className="text-xs text-slate-400">
          {formatDisplayDate(localStartDate) || "请选择开始日期"} ~ {formatDisplayDate(localEndDate) || "请选择结束日期"}
        </div>
      )}
    </div>
  );
}
