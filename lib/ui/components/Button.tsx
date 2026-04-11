"use client";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const styles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--color-brand-blue)",
    color: "#ffffff",
    border: "1px solid var(--color-brand-blue)",
    boxShadow: "var(--shadow-brand-blue)",
  },
  secondary: {
    background: "var(--color-bg-subtle)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text-second)",
    border: "1px solid transparent",
  },
  danger: {
    background: "var(--color-danger-bg)",
    color: "var(--color-danger-text)",
    border: "1px solid var(--color-danger-border)",
  },
};

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: "30px", padding: "0 10px", fontSize: "12px", borderRadius: "var(--radius-sm)" },
  md: { height: "36px", padding: "0 14px", fontSize: "13px", borderRadius: "var(--radius-md)" },
  lg: { height: "42px", padding: "0 20px", fontSize: "14px", borderRadius: "var(--radius-md)" },
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontWeight: 500,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "var(--transition-fast)",
        whiteSpace: "nowrap",
        width: fullWidth ? "100%" : undefined,
        ...styles[variant],
        ...sizes[size],
        ...style,
      }}
      {...props}
    >
      {loading ? "..." : children}
    </button>
  );
}
