import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Проверка редиректов сайта",
  description: "Инструмент для проверки основных редиректов и дублей страниц",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
