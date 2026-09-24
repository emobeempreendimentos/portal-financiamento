import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Portal de financiamento - Emobe Empreendimentos",
  description: "Acompanhe o andamento do seu financiamento imobiliário em tempo real",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
