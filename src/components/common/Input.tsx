import { forwardRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  inputPrefix?: React.ReactNode;
  prefixIcon?: React.ReactNode;
  inputSuffix?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  showClear?: boolean;
  error?: boolean;
  errorMessage?: string;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      inputPrefix,
      prefixIcon,
      inputSuffix,
      suffixIcon,
      showClear = false,
      error = false,
      errorMessage,
      className,
      wrapperClassName,
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
      if (onChange) {
        const event = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    return (
      <div className={cn("w-full", wrapperClassName)}>
        <div
          className={cn(
            "flex items-center w-full rounded-lg border transition-all duration-200 overflow-hidden",
            "bg-white",
            isFocused && !error && !disabled
              ? "border-primary ring-2 ring-primary/20"
              : "border-slate-300",
            error && !disabled ? "border-danger ring-2 ring-danger/20" : "",
            disabled ? "bg-slate-50 cursor-not-allowed" : ""
          )}
        >
          {(inputPrefix || prefixIcon) && (
            <span className="pl-3 text-slate-400 flex-shrink-0 flex items-center gap-1.5">
              {prefixIcon}
              {inputPrefix}
            </span>
          )}
          <input
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "flex-1 px-3 py-2 text-sm text-slate-800 placeholder-slate-400",
              "focus:outline-none bg-transparent",
              "disabled:cursor-not-allowed disabled:text-slate-500",
              (inputPrefix || prefixIcon) && "pl-2",
              (showClear || inputSuffix || suffixIcon) && "pr-2",
              className
            )}
            {...props}
          />
          {showClear && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="pr-3 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {(inputSuffix || suffixIcon) && !showClear && (
            <span className="pr-3 text-slate-400 flex-shrink-0 flex items-center gap-1.5">
              {inputSuffix}
              {suffixIcon}
            </span>
          )}
        </div>
        {error && errorMessage && (
          <p className="mt-1.5 text-xs text-danger">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
