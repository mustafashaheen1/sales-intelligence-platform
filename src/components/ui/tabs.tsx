"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("w-full", className)} data-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue: value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

function TabsList({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { activeValue?: string; onValueChange?: (v: string) => void }) {
  const { activeValue, onValueChange, ...rest } = props as any;
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...rest}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

function TabsTrigger({
  value,
  children,
  className,
  activeValue,
  onValueChange,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  activeValue?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        activeValue === value && "bg-background text-foreground shadow-sm",
        className
      )}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({
  value,
  children,
  className,
  activeValue,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value: string;
  activeValue?: string;
  onValueChange?: (v: string) => void;
}) {
  const { onValueChange, ...rest } = props as any;
  if (activeValue !== value) return null;
  return (
    <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)} {...rest}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
