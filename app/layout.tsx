import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "SEO инструменты - Проверка редиректов и Clean-param",
  description: "Комплексные SEO инструменты для проверки редиректов и генерации директив Clean-param",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
