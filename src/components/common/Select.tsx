import { forwardRef, useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | number;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  wrapperClassName?: string;
  onChange?: (value: string | number) => void;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ options, value, placeholder = "请选择", disabled = false, error = false, className, wrapperClassName, onChange }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: SelectOption) => {
      if (option.disabled) return;
      onChange?.(option.value);
      setIsOpen(false);
    };

    return (
      <div ref={containerRef} className={cn("relative w-full", wrapperClassName)}>
        <div
          ref={ref}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between w-full px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer bg-white",
            isOpen && !error && !disabled
              ? "border-primary ring-2 ring-primary/20"
              : "border-slate-300",
            error && !disabled ? "border-danger ring-2 ring-danger/20" : "",
            disabled ? "bg-slate-50 cursor-not-allowed opacity-60" : "hover:border-slate-400",
            className
          )}
        >
          <span
            className={cn(
              "text-sm",
              selectedOption ? "text-slate-800" : "text-slate-400"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                  option.disabled
                    ? "text-slate-300 cursor-not-allowed"
                    : value === option.value
                    ? "bg-primary/5 text-primary font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
