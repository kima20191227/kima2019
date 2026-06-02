import type { Metadata } from "next";
import { Noto_Sans_KR, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTracker } from "@/components/analytics/PageTracker";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KIMA | 한국이주민선교연합회",
    template: "%s | KIMA",
  },
  description: "연결하고 기록하고 보이게 하고 후원으로 이어주는 전국 이주민 사역 연합 플랫폼",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kima2019.org"),
  openGraph: {
    title: "KIMA | 한국이주민선교연합회",
    description: "연결하고 기록하고 보이게 하고 후원으로 이어주는 전국 이주민 사역 연합 플랫폼",
    url: "https://kima2019.org",
    siteName: "KIMA",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KIMA 한국이주민선교연합회",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KIMA | 한국이주민선교연합회",
    description: "연결하고 기록하고 보이게 하고 후원으로 이어주는 전국 이주민 사역 연합 플랫폼",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-noto-sans-kr)] antialiased">
        <Providers>
          <PageTracker />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
