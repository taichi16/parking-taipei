import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  return {
    title: "泊台北｜台北市即時停車位",
    description: "用地圖、行政區或關鍵字，即時查詢台北市停車場空位、地址與收費資訊。",
    icons: { icon: "/favicon.svg" },
    openGraph: { title: "泊台北｜找到空位，少繞一圈。", description: "台北市即時停車位查詢", images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: "泊台北｜找到空位，少繞一圈。", description: "台北市即時停車位查詢", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
