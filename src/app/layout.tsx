"use client"

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { loginSuccess, logout } from "@/lib/redux/slices/authSlice"
import api from "@/lib/api"

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
  const dispatch = useDispatch()

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => dispatch(loginSuccess(res.data)))
      .catch(() => dispatch(logout()))
  }, [dispatch])

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  )
}
