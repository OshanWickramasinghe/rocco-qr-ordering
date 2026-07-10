import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-body font-semibold transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-chili active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-chili text-white hover:bg-chili-dark shadow-sm",
        secondary: "bg-espresso text-cream hover:bg-espresso-light",
        outline: "border border-espresso/20 bg-transparent text-ink hover:bg-espresso/5",
        ghost: "bg-transparent text-ink hover:bg-espresso/5",
        success: "bg-basil text-white hover:bg-basil-light",
        warning: "bg-gold text-espresso hover:bg-gold-dark",
        destructive: "bg-chili-dark text-white hover:bg-chili-dark/90",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
