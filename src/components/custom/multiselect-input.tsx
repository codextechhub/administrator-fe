"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MultiSelect, type MultiSelectProps } from "../ui/multi-select";

interface MultiSelectInputProps extends MultiSelectProps {
  id: string;
  label?: string;
  error?: string;
  touched?: boolean;
  isRequired?: boolean;
  loading?: boolean;
}

export const MultiSelectInput = ({
  id,
  label,
  onValueChange,
  isRequired,
  error,
  touched,
  ...props
}: MultiSelectInputProps) => {
  const [internalTouched, setInternalTouched] = React.useState(
    touched || false,
  );

  const handleValueChange = (newValue: string[]) => {
    onValueChange(newValue);
    setInternalTouched(true);
  };

  const showError = error && (touched || internalTouched);

  return (
    <div className="grid w-full items-center gap-1">
      <label
        htmlFor={id}
        className={cn(
          "text-sm text-black-01",
          isRequired && "after:text-error after:content-['*'] after:pl-1.5",
        )}
      >
        {label}
      </label>

      <MultiSelect onValueChange={handleValueChange} {...props} />
      {showError ? (
        <p className="text-xs font-medium text-error/70">{error}</p>
      ) : null}
    </div>
  );
};
MultiSelectInput.displayName = "MultiSelectInput";
