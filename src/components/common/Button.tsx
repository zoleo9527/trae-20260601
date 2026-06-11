import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md",
  secondary: "bg-secondary text-white hover:bg-secondary/90 shadow-sm hover:shadow-md",
  success: "bg-success text-white hover:bg-success/90 shadow-sm hover:shadow-md",
  danger: "bg-danger text-white hover:bg-danger/90 shadow-sm hover:shadow-md",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
  outline: "border border-slate-300 text-slate-700 bg-white hover:border-slate-400 hover:bg-slate-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-2.5 text-base gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
