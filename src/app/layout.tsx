import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import AuthLoader from "@/components/AuthLoader"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HR Management System",
  description: "A comprehensive HR management system",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthLoader />
          {children}
        </Providers>
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  )
}
