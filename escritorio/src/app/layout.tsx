import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Providers from "@/components/Providers";
import UnifiedLayoutWrapper from "@/components/layout/UnifiedLayoutWrapper";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/constants";
import { normalizeLocale, translateServer } from "@/lib/i18n/server";
import "./globals.css";

async function getRequestLocale() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  return normalizeLocale(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? headerStore.get("accept-language"),
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    title: "Fenix Lab",
    description: translateServer(locale, "metadata.description"),
    keywords: translateServer(locale, "metadata.keywords")
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    authors: [{ name: "Fenix Lab" }],
    openGraph: {
      title: "Fenix Lab",
      description: translateServer(locale, "metadata.openGraphDescription"),
      siteName: "Fenix Lab",
      type: "website",
    },
    icons: {
      shortcut: "/fenix-favicon.svg",
      icon: [
        { url: "/fenix-favicon.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-icon.png",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full bg-bg text-white flex flex-col overflow-hidden">
        <Providers initialLocale={locale}>
          <UnifiedLayoutWrapper>
            {children}
          </UnifiedLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
