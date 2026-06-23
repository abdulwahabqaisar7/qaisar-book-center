import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Qaisar Book Center — Inventory & Invoices",
  description: "Advanced inventory management and billing system for Qaisar Book Center.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
