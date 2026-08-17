import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";



interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {

  icon?: ReactNode;

}



export function Chip({ icon, className, children, ...props }: ChipProps) {

  return (

    <button

      type="button"

      className={cn(

        "inline-flex h-[32px] items-center gap-2 rounded-[var(--radius-pill)] border border-hairline bg-canvas px-2.5 text-sm font-medium text-ink transition-[transform,background-color,border-color] duration-150 ease-out hover:border-charcoal-400 hover:bg-canvas-soft active:scale-[0.96] motion-reduce:transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transit-blue",

        className,

      )}

      {...props}

    >

      {icon}

      {children}

    </button>

  );

}

