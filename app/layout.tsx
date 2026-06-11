import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"

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
  openGraph: {
    title: "OZO — все для птахівництва",
    description: "Обладнання для птахівництва: клітки, годівниці, напувалки, інкубатори. Вигідні ціни та швидка доставка Новою Поштою по Україні.",
    url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "",
    siteName: "OZO",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""}/icon.jpg`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "uk_UA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OZO — все для птахівництва",
    description: "Обладнання для птахівництва: клітки, годівниці, напувалки, інкубатори.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""}/icon.jpg`],
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
      <head>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`,
              }}
            />
          </>
        )}
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <CartProvider>
            {children}
          </CartProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}