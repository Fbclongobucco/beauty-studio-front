import type { ComponentProps } from "react";

export function Card({ className = "", ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-3xl border border-blush-2 bg-white/80 p-5 shadow-[0_1px_2px_rgba(80,34,22,0.06)] ${className}`}
      {...rest}
    />
  );
}
