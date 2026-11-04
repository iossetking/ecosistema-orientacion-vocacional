import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { getMatrixSnapshot } from "@/lib/data";
import { MatrixProvider } from "@/hooks/useRealtimeMatrix";
import NavbarShell from "@/components/layout/NavbarShell";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ecosistema de Orientación Vocacional",
  description:
    "Matriz colaborativa en tiempo real del ecosistema de orientación vocacional (Media Superior → Superior).",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const snapshot = await getMatrixSnapshot();
  const jar = await cookies();
  const user = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}>
        <MatrixProvider initial={snapshot}>
          <NavbarShell user={user} />
          {children}
        </MatrixProvider>
      </body>
    </html>
  );
}
