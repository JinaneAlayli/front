"use client"

import type React from "react"
import { useState, useRef } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { X, Upload, FileText, AlertCircle, Trash2, Download } from "lucide-react"

interface PayslipUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  salary: any
}

export default function PayslipUploadModal({ open, onClose, onSuccess, salary }: PayslipUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false)
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

      toast.success(isReplacing ? "Payslip replaced successfully" : "Payslip uploaded successfully")
      onSuccess()
    } catch (error: any) {
      console.error("Failed to upload payslip:", error)
      const errorMessage = error.response?.data?.message || "Failed to upload payslip"
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePayslip = async () => {
    if (!salary?.id) {
      toast.error("Invalid salary record")
      return
    }

    try {
      await api.delete(`/salaries/${salary.id}/remove-payslip`)
      toast.success("Payslip removed successfully")
      onSuccess()
    } catch (error: any) {
      console.error("Failed to remove payslip:", error)
      const errorMessage = error.response?.data?.message || "Failed to remove payslip"
      toast.error(errorMessage)
    }
  }

  const handleDownloadExisting = () => {
    if (salary?.file_url) {
      window.open(salary.file_url, "_blank")
    }
  }

  const handleReplaceClick = () => {
    setIsReplacing(true)
    setShowReplaceConfirm(false)
    // Clear any existing file selection
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCancelReplace = () => {
    setIsReplacing(false)
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
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

  // Check if payslip already exists
  const hasExistingPayslip = salary.file_url && salary.file_url !== ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#6148F4]/5 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {hasExistingPayslip && !isReplacing
                ? "Manage Payslip"
                : isReplacing
                  ? "Replace Payslip"
                  : "Upload Payslip"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              For {salary?.user?.name || "Employee"} - {getMonthName(salary?.month)} {salary?.year}
            </p>
          </div>
          <button onClick={onClose} className="focus:outline-none text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {hasExistingPayslip && !isReplacing ? (
            // Show existing payslip management options
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-green-600 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">Payslip Already Uploaded</p>
                    <p className="text-xs text-green-600 mt-1">
                      A payslip file has been uploaded for this salary record.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleDownloadExisting}
                  className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
                >
                  <Download size={18} className="mr-2" />
                  Download Current Payslip
                </button>

                <button
                  onClick={() => setShowReplaceConfirm(true)}
                  className="flex items-center justify-center rounded-lg bg-amber-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2"
                >
                  <Upload size={18} className="mr-2" />
                  Replace Payslip
                </button>

                <button
                  onClick={() => setShowReplaceConfirm(true)}
                  className="flex items-center justify-center rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2"
                >
                  <Trash2 size={18} className="mr-2" />
                  Remove Payslip
                </button>
              </div>

              {showReplaceConfirm && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">Confirm Action</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Are you sure you want to replace the existing payslip? This action cannot be undone.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={handleReplaceClick}
                          className="rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                        >
                          Yes, Replace
                        </button>
                        <button
                          onClick={handleRemovePayslip}
                          className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Yes, Remove
                        </button>
                        <button
                          onClick={() => setShowReplaceConfirm(false)}
                          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Show file upload interface
            <div className="space-y-4">
              {isReplacing && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
                    <p className="text-sm text-amber-800">
                      You are replacing the existing payslip. The old file will be permanently deleted.
                    </p>
                  </div>
                </div>
              )}

              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:bg-gray-100 cursor-pointer transition-colors"
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
                  onClick={isReplacing ? handleCancelReplace : onClose}
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
                      {isReplacing ? "Replacing..." : "Uploading..."}
                    </span>
                  ) : (
                    <>
                      <Upload size={18} className="mr-2" />
                      {isReplacing ? "Replace Payslip" : "Upload Payslip"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
