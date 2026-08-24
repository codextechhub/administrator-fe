"use client";

import * as React from "react";
import { Loader } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";

interface CustomTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  id: string;
  error?: string;
  isRequired?: boolean;
  loading?: boolean;
}

export const CustomTextArea = React.forwardRef<
  HTMLTextAreaElement,
  CustomTextAreaProps
>(({ label, id, error, className, isRequired, loading, ...props }, ref) => {
  return (
    <div className="grid w-full items-center gap-1 h-fit">
      {label && (
        <Label
          htmlFor={id}
          className={cn(
            "text-sm text-black-01 font-normal",
            isRequired && "after:text-error after:content-['*']",
          )}
        >
          {label}
        </Label>
      )}
      <div className="relative">
        <Textarea
          id={id}
          className={className}
          ref={ref}
          {...props}
          aria-invalid={error ? true : false}
        />

        {loading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute z-1 right-1 top-0 h-full px-3 py-2 hover:bg-transparent"
          >
            <Loader className="text-primary animate-spin size-4.5 bg-white" />
          </Button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-error-text">{error}</p>}
    </div>
  );
});
CustomTextArea.displayName = "CustomTextArea";
