interface CardProps {
  children: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function Card({
  children,
  padding = "20px",
  style,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)",
        padding,
        boxShadow: "var(--shadow-sm)",
        cursor: onClick ? "pointer" : undefined,
        transition: "var(--transition-fast)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
