import * as React from "react";
import { ChevronDownIcon, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

function NativeSelect({
  className,
  size = "default",
  loading,
  ...props
}: Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default";
  loading?: boolean;
}) {
  return (
    <div
      className="group/native-select relative w-full has-[select:disabled]:opacity-50"
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          "placeholder:text-gray-02 selection:bg-primary selection:text-gray-01 h-10.5 w-full min-w-0 appearance-none rounded-md bg-white px-3 py-1 pr-9 text-sm transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed data-[size=sm]:h-8 data-[size=sm]:py-1",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className,
        )}
        {...props}
      />
      {!loading ? (
        <ChevronDownIcon
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 opacity-50 select-none"
          aria-hidden="true"
          data-slot="native-select-icon"
        />
      ) : (
        <Loader2
          aria-hidden="true"
          data-slot="native-select-icon"
          className="animate-spin text-primary pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 opacity-50 select-none"
        />
      )}
    </div>
  );
}

function NativeSelectOption({ ...props }: React.ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />;
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn(className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
