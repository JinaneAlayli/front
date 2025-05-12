"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { loginSuccess, logout } from "@/lib/redux/slices/authSlice"
import api from "@/lib/api"

export default function AuthLoader() {
  const dispatch = useDispatch()

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => dispatch(loginSuccess(res.data)))
      .catch(() => dispatch(logout()))
  }, [dispatch])

  return null
}
