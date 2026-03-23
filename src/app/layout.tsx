import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { getThemeBlockingScriptInnerHtml } from "@/lib/theme-blocking-inner-html";
import { SessionProvider } from "@/share-components/sections/providers/session-provider";
import { ROOT_THEME_BLOCKING } from "@/share-components/sections/providers/root-theme-settings";
import { ThemeProvider } from "@/share-components/sections/providers/theme-provider";
import { ReactQueryProvider } from "@/lib/react-query-provider";

import "./globals.css";
import { siteDescription, siteName } from "@/config/site";
import { TooltipProvider } from "@/share-components/molecules/tooltip/Default";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: getThemeBlockingScriptInnerHtml(ROOT_THEME_BLOCKING),
          }}
        />
        <ThemeProvider
          attribute={ROOT_THEME_BLOCKING.attribute}
          defaultTheme={ROOT_THEME_BLOCKING.defaultTheme}
          enableSystem={ROOT_THEME_BLOCKING.enableSystem}
        >
          <TooltipProvider>
            <ReactQueryProvider>
              <SessionProvider>{children}</SessionProvider>
            </ReactQueryProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
