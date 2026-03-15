import AuthProvider from "@/lib/auth/AuthProvider";

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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
