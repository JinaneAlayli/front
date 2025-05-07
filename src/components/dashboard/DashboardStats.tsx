"use client"

import type React from "react"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface DashboardStatsProps {
  title: string
  value: string
  icon: React.ReactNode
  description: string
  link: string
}

export default function DashboardStats({ title, value, icon, description, link }: DashboardStatsProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-[#6148F4]/10 p-2">{icon}</div>
          <Link href={link} className="text-[#6148F4] hover:underline">
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  )
}
