"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomNativeSelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  label?: string;
  id: string;
  error?: string;
  isRequired?: boolean;
  loading?: boolean;
  containerClass?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: "default" | "sm";
}

export const CustomNativeSelect = React.forwardRef<
  HTMLSelectElement,
  CustomNativeSelectProps
>(
  (
    {
      label,
      id,
      error,
      className,
      isRequired,
      loading,
      containerClass,
      options,
      placeholder = "Select an option",
      disabled,
      size,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={cn("grid w-full items-center gap-1.5 h-fit", containerClass)}
      >
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "text-sm text-black-01",
              isRequired && "after:text-error after:content-['*'] after:pl-1.5",
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <NativeSelect
            size={size}
            id={id}
            disabled={disabled || loading}
            loading={loading}
            ref={ref}
            className={className}
            aria-invalid={error ? true : false}
            {...props}
          >
            <NativeSelectOption value="">
              {placeholder || "Select"}
            </NativeSelectOption>
            {options?.map((chi) => (
              <NativeSelectOption key={chi?.value} value={chi?.value}>
                {chi?.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {error && (
          <p className="text-xs font-medium text-destructive/70">{error}</p>
        )}
      </div>
    );
  },
);
CustomNativeSelect.displayName = "CustomNativeSelect";
