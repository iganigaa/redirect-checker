import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEO Platform",
  description: "Инструменты для SEO специалистов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div style={{ 
            marginLeft: '260px', 
            width: 'calc(100% - 260px)',
            minHeight: '100vh',
          }}>
            {/* Header */}
            <Header />

            {/* Content Area */}
            <main style={{ 
              marginTop: '64px',
              padding: '30px',
            }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
