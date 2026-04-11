interface PageHeaderProps {
  section: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  section,
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            marginBottom: "4px",
          }}
        >
          {section}
        </div>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--color-text-muted)",
              marginTop: "4px",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
