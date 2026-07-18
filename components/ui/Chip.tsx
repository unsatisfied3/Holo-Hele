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

        "inline-flex h-[30px] items-center gap-2 rounded-[var(--radius-pill)] border border-hairline bg-canvas px-2 text-sm font-medium text-ink transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",

        className,

      )}

      {...props}

    >

      {icon}

      {children}

    </button>

  );

}

