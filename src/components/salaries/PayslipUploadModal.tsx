"use client"

import type React from "react"

import { useState, useRef } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { X, Upload, FileText } from "lucide-react"

interface PayslipUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  salary: any
}

export default function PayslipUploadModal({ open, onClose, onSuccess, salary }: PayslipUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    if (!salary?.id) {
      toast.error("Invalid salary record")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      await api.post(`/salaries/${salary.id}/upload-payslip`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      toast.success("Payslip uploaded successfully")
      onSuccess()
    } catch (error) {
      console.error("Failed to upload payslip:", error)
      toast.error("Failed to upload payslip")
    } finally {
      setIsUploading(false)
    }
  }

  if (!open || !salary) return null

  // Format month name
  const getMonthName = (month: number) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return months[month - 1]
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#6148F4]/5 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Upload Payslip</h2>
            <p className="mt-1 text-sm text-gray-500">
              For {salary?.user?.name || "Employee"} - {getMonthName(salary?.month)} {salary?.year}
            </p>
          </div>
          <button onClick={onClose} className="focus:outline-none text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div
            className="mb-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:bg-gray-100"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <div className="mb-3 rounded-full bg-[#6148F4]/10 p-3">
              <FileText className="h-6 w-6 text-[#6148F4]" />
            </div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              {file ? file.name : "Click or drag file to upload"}
            </p>
            <p className="text-xs text-gray-500">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF, Word, or Image files up to 10MB"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex flex-1 items-center justify-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                <>
                  <Upload size={18} className="mr-2" />
                  Upload Payslip
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
