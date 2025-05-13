"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { loginSuccess, logout, setAuthChecked } from "@/lib/redux/slices/authSlice"
import api from "@/lib/api"
import Cookies from "js-cookie"

export default function AuthLoader() {
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First check if the JWT cookie exists
        const token = Cookies.get("jwt")

        if (!token) {
          // No token, mark as checked and logout
          dispatch(setAuthChecked())
          dispatch(logout())
          return
        }

        // Set the token in the API headers
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`

        // Add a timeout to prevent hanging requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const res = await api.get("/auth/me", {
          signal: controller.signal,
          // Prevent throwing on non-2xx responses
          validateStatus: (status) => status < 500,
        })

        clearTimeout(timeoutId)

        // Only dispatch success if we got a valid response
        if (res.status === 200 && res.data) {
          dispatch(loginSuccess(res.data))
        } else {
          // Invalid response, clear token
          Cookies.remove("jwt", {
            path: "/",
            domain: window.location.hostname.includes("vercel.app") ? window.location.hostname : undefined,
          })
          delete api.defaults.headers.common["Authorization"]
          dispatch(logout())
        }
      } catch (error) {
        // Handle network errors silently - just clean up the token
        console.log("Auth check failed silently - user not logged in")
        Cookies.remove("jwt", {
          path: "/",
          domain: window.location.hostname.includes("vercel.app") ? window.location.hostname : undefined,
        })
        delete api.defaults.headers.common["Authorization"]
        dispatch(logout())
      } finally {
        dispatch(setAuthChecked())
      }
    }

    fetchUser()
  }, [dispatch])

  return null
}
