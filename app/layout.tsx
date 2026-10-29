import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "./modal-context";
import { initServerI18next, getT, getResources, generateI18nStaticParams } from 'next-i18next/server';
import { I18nProvider } from 'next-i18next/client';
import i18nConfig from '../i18n.config';

initServerI18next(i18nConfig);

export async function generateStaticParams() {
  return generateI18nStaticParams();
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LINTU vs LINTU",
  description: "Compare bird species",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { i18n, lng } = await getT('common');
  const resources = getResources(i18n, ['common'], [lng, 'en']);

  return (
    <html
      lang={lng}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider language={lng} resources={resources}>
          <ModalProvider>{children}</ModalProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
