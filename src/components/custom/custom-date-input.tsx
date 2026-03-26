"use client";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CustomDateInputProps {
  label: string;
  id: string;
  error?: string;
  isRequired?: boolean;
  containerClass?: string;
  value?: string;
  onValueChange?: (date: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomDateInput = ({
  label,
  id,
  error,
  isRequired,
  value,
  onValueChange,
  className,
  placeholder,
  disabled,
}: CustomDateInputProps) => {
  const formatDateToLocalString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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
      <div className="relative">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date"
              disabled={disabled}
              className={cn(
                "w-full h-10.5 border-none justify-between font-normal text-gray-02 hover:bg-white bg-white hover:text-gray-02 group shadow-none rounded-md text-sm",
                value && "text-black-01",
                className,
              )}
            >
              {value
                ? new Date(value).toLocaleDateString()
                : (placeholder ?? "Select date")}
              <CalendarDays className="group-hover:text-primary" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              captionLayout="dropdown"
              onSelect={(date) => {
                if (date && onValueChange) {
                  onValueChange(formatDateToLocalString(date));
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  );
};
CustomDateInput.displayName = "CustomDateInput";
