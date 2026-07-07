import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ClerkProvider } from "@clerk/nextjs";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { NavigationProgressProvider } from "@/components/layout/NavigationProgress";
import "./globals.css";

const MuiThemeProvider = dynamic(
  () =>
    import("@/components/providers/MuiThemeProvider").then((mod) => mod.MuiThemeProvider),
  {
    loading: () => (
      <div className="min-h-screen bg-[var(--background,#f4f5fa)]" aria-busy="true" />
    ),
  }
);

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Sentinel — Release Management",
  description: "AI-powered release command center for software engineering teams",
  icons: {
    icon: "/sentinel-logo.png",
    apple: "/sentinel-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ClerkProvider afterSignOutUrl="/sign-in">
          <MuiThemeProvider>
            <NavigationProgressProvider>{children}</NavigationProgressProvider>
          </MuiThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
