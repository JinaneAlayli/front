// src/app/(auth)/register/page.tsx
import { Suspense } from "react"
import RegisterClient from "@/components/RegisterClient"

export const dynamic = "force-dynamic"

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterClient />
    </Suspense>
  )
}
