import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 text-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-cocoa text-white hover:bg-coffee active:bg-ink",
  secondary:
    "border-2 border-cocoa bg-white/70 text-coffee hover:bg-blush active:bg-blush-2",
  ghost: "text-coffee underline-offset-4 hover:underline",
  danger: "bg-danger text-white hover:brightness-90",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({ variant = "primary", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...rest} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; children: ReactNode };

export function LinkButton({ variant = "primary", className = "", ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, className)} {...rest} />;
}
