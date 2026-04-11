type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "blue" | "orange";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: "var(--color-bg-subtle)",
    color: "var(--color-text-muted)",
    border: "1px solid var(--color-border)",
  },
  success: {
    background: "var(--color-success-bg)",
    color: "var(--color-success-text)",
    border: "1px solid var(--color-success-border)",
  },
  warning: {
    background: "var(--color-warning-bg)",
    color: "var(--color-warning-text)",
    border: "1px solid var(--color-warning-border)",
  },
  danger: {
    background: "var(--color-danger-bg)",
    color: "var(--color-danger-text)",
    border: "1px solid var(--color-danger-border)",
  },
  info: {
    background: "var(--color-info-bg)",
    color: "var(--color-info-text)",
    border: "1px solid var(--color-info-border)",
  },
  blue: {
    background: "var(--color-brand-blue-light)",
    color: "var(--color-brand-blue)",
    border: "1px solid var(--color-brand-blue-light)",
  },
  orange: {
    background: "var(--color-brand-orange-light)",
    color: "var(--color-brand-orange)",
    border: "1px solid var(--color-brand-orange-light)",
  },
};

export default function Badge({
  children,
  variant = "default",
  style,
}: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "22px",
        padding: "0 8px",
        borderRadius: "var(--radius-full)",
        fontSize: "11px",
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
