"use client"

import type React from "react"

import { Provider } from "react-redux"
import { store } from "@/lib/redux/store"
import { useEffect, useRef } from "react"
import { useDispatch } from "react-redux"
import { loginSuccess, setAuthChecked } from "@/lib/redux/slices/authSlice"
import api from "@/lib/api"
import { usePathname } from "next/navigation"

function AppInitializer() {
  const dispatch = useDispatch()
  const pathname = usePathname()
  const authCheckedRef = useRef(false)

  useEffect(() => {
    const checkAuth = async () => {
      // Only run this once per page load
      if (authCheckedRef.current) return
      authCheckedRef.current = true

      try {
        // Try to get the complete user profile
        const res = await api.get("/users/me")
        dispatch(loginSuccess(res.data))
      } catch (error) {
        // If that fails, try the basic auth check
        try {
          const authRes = await api.get("/auth/me")
          dispatch(loginSuccess(authRes.data))
        } catch (authError) {
          // No valid cookie = guest
        }
      } finally {
        dispatch(setAuthChecked()) // mark as checked no matter what
      }
    }

    checkAuth()
  }, [dispatch])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppInitializer />
      {children}
    </Provider>
  )
}
