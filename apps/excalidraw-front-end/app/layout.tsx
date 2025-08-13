import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Caveat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import colorPalette from "./color-palette.png";
// Load local fonts
const excalifont = localFont({
  src: "./fonts/excalifont-Regular.woff2",
  display: "swap",
  variable: "--font-excalifont",
});

const virgil = localFont({
  src: "./fonts/virgil.woff2",
  display: "swap",
  variable: "--font-virgil",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Drawdeck",
  description: "Collaborative Drawing App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
           <link rel="icon" href={colorPalette.src} type="image/png" />
        </head>
        <body className={`${caveat.variable} ${excalifont.variable} ${virgil.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
