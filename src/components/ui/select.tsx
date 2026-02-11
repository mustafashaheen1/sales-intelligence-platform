"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}

function Select({ value, onValueChange, children, placeholder, className }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<{ value: string; children: React.ReactNode }> => React.isValidElement(child)
  );

  const selectedOption = options.find((opt) => (opt.props as { value: string }).value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {(selectedOption?.props as { children?: React.ReactNode })?.children || placeholder || "Select..."}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95">
          {options.map((option) => {
            const optProps = option.props as { value: string; children: React.ReactNode };
            return (
              <button
                key={optProps.value}
                type="button"
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  value === optProps.value && "bg-accent text-accent-foreground"
                )}
                onClick={() => {
                  onValueChange(optProps.value);
                  setOpen(false);
                }}
              >
                {optProps.children}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <>{children}</>;
}

export { Select, SelectItem };
