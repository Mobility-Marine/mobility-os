import AuthProvider from "@/lib/auth/AuthProvider";
import TenantProvider from "@/lib/tenant/TenantProvider";

export const metadata = {
  title: "Mobility OS",
  description: "Logistics & Foreign Trade Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <TenantProvider>{children}</TenantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
