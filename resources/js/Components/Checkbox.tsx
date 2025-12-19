import React, { useId } from "react";
import { Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge tailwind classes safely
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  containerClassName?: string;
  labelClassName?: string;
  children?: React.ReactNode;
}

const colorStyles = {
  primary: "checked:bg-slate-900 border-slate-300 dark:border-slate-700",
  secondary: "checked:bg-slate-500 border-slate-300 dark:border-slate-700",
  success: "checked:bg-green-600 border-slate-300 dark:border-slate-700",
  error: "checked:bg-red-600 border-slate-300 dark:border-slate-700",
  info: "checked:bg-blue-600 border-slate-300 dark:border-slate-700",
  warning: "checked:bg-amber-600 border-slate-300 dark:border-slate-700",
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      color = "primary",
      className,
      containerClassName,
      labelClassName,
      id,
      checked,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <div className={cn("inline-flex items-center group", containerClassName)}>
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            id={checkboxId}
            checked={checked}
            className={cn(
              "peer h-5 w-5 cursor-pointer appearance-none rounded border transition-all duration-200 outline-none shadow-sm",
              "",
              "disabled:cursor-not-allowed disabled:opacity-50",
              colorStyles[color],
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="absolute pointer-events-none text-white transition-opacity duration-200 opacity-0 peer-checked:opacity-100 peer-disabled:opacity-50 flex items-center justify-center">
            {children ? (
              children
            ) : (
              <Check className="h-3.5 w-3.5 stroke-[2px]" stroke="currentColor" />
            )}
          </div>
        </div>
        {label && (
          <label
            htmlFor={checkboxId}
            className={cn(
              "ml-2.5 cursor-pointer select-none text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50",
              labelClassName
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

/**
 * Sub-component for indicator-only usage
 */
const CheckboxIndicator = () => (
  <Check className="h-3.5 w-3.5 stroke-[4px]" stroke="currentColor" />
);

// @ts-ignore
Checkbox.Indicator = CheckboxIndicator;

export default Checkbox;
