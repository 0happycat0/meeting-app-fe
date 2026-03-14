import * as React from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

export interface InputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

function Input({ className, type, icon, iconRight, ...props }: InputProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-input-placeholder [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </div>
      )}
      <input
        type={type}
        data-slot="input"
        className={cn(
          "h-10 w-full min-w-0 rounded-md border border-input px-3 py-1 text-base transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-input-placeholder disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          "bg-input-background text-md",
          icon && "pl-9",
          className,
        )}
        {...props}
      />
      {iconRight && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {iconRight}
        </div>
      )}
    </div>
  );
}

function InputPassword({ className, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPassword ? "text" : "password";

  return (
    <Input
      {...props}
      type={inputType}
      iconRight={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-input-placeholder hover:text-foreground"
        >
          {showPassword ? (
            <EyeSlashIcon
              weight="bold"
              className="h-5 w-5"
            />
          ) : (
            <EyeIcon
              weight="bold"
              className="h-5 w-5"
            />
          )}
        </button>
      }
    />
  );
}

export { Input, InputPassword };
