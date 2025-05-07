"use client"

import React from "react"

import { useState, type ReactNode } from "react"

interface TabProps {
  value: string
  children: ReactNode
}

interface TabsProps {
  defaultValue: string
  children: ReactNode
  className?: string
  onChange?: (value: string) => void
}

interface TabsListProps {
  children: ReactNode
  className?: string
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

const TabsContext = React.createContext<{
  value: string
  onChange: (value: string) => void
} | null>(null)

export function Tabs({ defaultValue, children, className = "", onChange }: TabsProps) {
  const [value, setValue] = useState(defaultValue)

  const handleChange = (newValue: string) => {
    setValue(newValue)
    onChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value, onChange: handleChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = "" }: TabsListProps) {
  return <div className={`flex rounded-lg bg-gray-100 p-1 ${className}`}>{children}</div>
}

export function TabsTrigger({ value, children, className = "" }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)

  if (!context) {
    throw new Error("TabsTrigger must be used within a Tabs component")
  }

  const isActive = context.value === value

  return (
    <button
      className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all ${
        isActive ? "bg-white text-[#6148F4] shadow-sm" : "text-gray-600 hover:bg-gray-200/60 hover:text-gray-900"
      } ${className}`}
      onClick={() => context.onChange(value)}
      type="button"
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className = "" }: TabsContentProps) {
  const context = React.useContext(TabsContext)

  if (!context) {
    throw new Error("TabsContent must be used within a Tabs component")
  }

  return context.value === value ? <div className={className}>{children}</div> : null
}
