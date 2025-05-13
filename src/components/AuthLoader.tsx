"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { loginSuccess, logout } from "@/lib/redux/slices/authSlice"
import api from "@/lib/api"

export default function AuthLoader() {
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me")
        dispatch(loginSuccess(res.data))
      } catch (error) {
        dispatch(logout())
      }
    }

    fetchUser()
  }, [dispatch])

  return null  
}
