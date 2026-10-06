import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { RecentlyViewedProvider } from "@/lib/recently-viewed-context"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"
import FacebookPixel from "@/components/facebook-pixel"
import TikTokPixel from "@/components/tiktok-pixel"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
})

// Відновлює позицію скролу до першої відмальовки (прибирає «блимання шапки» при F5)
const restoreScrollScript = `
(function () {
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  var key = 'ozo-scroll:' + location.pathname + location.search;
  var saved = parseInt(sessionStorage.getItem(key) || '0', 10);
  if (!saved) return;
  var tries = 0;
  function restore() {
    var el = document.scrollingElement || document.documentElement;
    var max = el.scrollHeight - window.innerHeight;
    if (tries >= 20 || max >= saved - 1) {
      window.scrollTo(0, saved);
    } else {
      tries++;
      requestAnimationFrame(restore);
    }
  }
  requestAnimationFrame(restore);
})();
`

// Запам'ятовує позицію скролу (для кожної сторінки окремо)
const saveScrollScript = `
(function () {
  var key = 'ozo-scroll:' + location.pathname + location.search;
  var t;
  function save() {
    try {
      var y = window.scrollY || (document.scrollingElement || document.documentElement).scrollTop || 0;
      sessionStorage.setItem(key, String(y));
    } catch (e) {}
  }
  window.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(save, 150); }, { passive: true });
  window.addEventListener('pagehide', save);
  window.addEventListener('beforeunload', save);
})();
`

export const metadata: Metadata = {
  title: "OZO — товари ручної роботи, зроблено в Україні з турботою",
  description: "Товари ручної роботи, зроблено в Україні з турботою. Інфрачервоні нагрівальні килимки та вироби ручної роботи. Доставка Новою Поштою по Україні 1-3 дні.",
  generator: "v0.app",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
    other: [{ rel: "icon", url: "/favicon.ico" }],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "",
  },
}

export const viewport: Viewport = {
  themeColor: "#f8f7f4",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uk" className={`${inter.variable} ${playfair.variable} bg-background`} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: restoreScrollScript }} />
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <RecentlyViewedProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </RecentlyViewedProvider>
        </Providers>
        <Toaster />
        <FacebookPixel />
        <TikTokPixel />
        {/* ExitPopup temporarily disabled */}
        <script dangerouslySetInnerHTML={{ __html: saveScrollScript }} />
      </body>
    </html>
  )
}