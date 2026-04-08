"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const CollapsibleRoot = CollapsiblePrimitive.Root;

function CollapsibleTrigger({
  className,
  children,
  ...props
}: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      className={cn(
        "flex w-full items-center justify-between px-5 py-4 text-sm font-semibold transition-colors [&[data-open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className="h-4 w-4 shrink-0 transition-transform duration-200"
        style={{ color: "#9e9b94" }}
      />
    </CollapsiblePrimitive.Trigger>
  );
}

function CollapsiblePanel({
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      className={cn("overflow-hidden", className)}
      {...props}
    />
  );
}

export { CollapsibleRoot, CollapsibleTrigger, CollapsiblePanel };
