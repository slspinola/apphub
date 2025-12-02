import type { Metadata } from "next";
import { Funnel_Display, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { siteConfig } from "@/config/site"
import { ThemeProvider } from "@/lib/theme-provider"

const funnelDisplay = Funnel_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${funnelDisplay.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider defaultTheme="bee2hive" storageKey="apphub-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
