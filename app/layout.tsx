import "./globals.css";
import { AuthProvider } from "./context/AuthContext"; // Ensure you have the AuthProvider

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
