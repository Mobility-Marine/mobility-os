import AuthProvider from "@/lib/auth/AuthProvider";
import TenantProvider from "@/lib/tenant/TenantProvider";

export const metadata = {
  title: "Mobility OS",
  description: "Logistics & Foreign Trade Management System",
  applicationName: "Mobility OS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mobility OS",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#070b12",
          color: "#f8fafc",
          minHeight: "100vh",
          width: "100%",
          overflowX: "hidden",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <AuthProvider>
          <TenantProvider>{children}</TenantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
