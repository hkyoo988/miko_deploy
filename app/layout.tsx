import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "./_components/SessionProvider";
import { MainSocketProvider } from "./_components/Socket/SocketContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MIKO",
  description: "Meeting In, Keywords Out",
  icons: {
    icon: "/MIKO_LOGO_Square.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <MainSocketProvider>{children}</MainSocketProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
