import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { RecentlyViewedProvider } from "@/lib/recently-viewed-context"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"
import FacebookPixel from "@/components/facebook-pixel"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "OZO — все для птахівництва",
  description: "Все для птахівництва. Якісне обладнання для птахоферм. Вигідні ціни та швидка доставка Новою Поштою по Україні 1-3 дні.",
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
      </body>
    </html>
  )
}