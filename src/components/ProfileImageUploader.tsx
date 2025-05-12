"use client"

import { useState, useCallback } from "react"
import Modal from "@mui/material/Modal"
import Cropper from "react-easy-crop"
import Dropzone from "react-dropzone"
import { getCroppedImg } from "@/utils/cropImage"
import Cookies from "js-cookie"
import { Minus, Plus, Check, X } from "lucide-react"

export default function ProfileImageUploader({ open, onClose, onSuccess }: any) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      setError("Please select a valid image file")
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.addEventListener("load", () => setImageSrc(reader.result as string))
    reader.readAsDataURL(acceptedFiles[0])
  }, [])

  const onCropComplete = useCallback((_: any, cropped: any) => {
    setCroppedAreaPixels(cropped)
  }, [])

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setError("No image selected or crop area not defined!")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)

      // Create a file from the blob with a proper filename and type
      const file = new File([croppedBlob], "profile.png", { type: "image/png" })

      const formData = new FormData()
      formData.append("file", file)

      // Get the JWT token from cookies
      const token = Cookies.get("jwt")

      // Create a custom instance for this request to avoid modifying global defaults
      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/upload-profile`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          // Don't set Content-Type for FormData, browser will set it with boundary
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`)
      }

      const responseData = await uploadResponse.json()

      // Pass the image URL back to the parent component
      onSuccess?.(responseData.imageUrl)
    } catch (err: any) {
      console.error("Upload failed:", err)
      setError(err.message || "Upload failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const adjustZoom = (amount: number) => {
    setZoom((prev) => {
      const newZoom = prev + amount
      return Math.max(1, Math.min(3, newZoom)) // Clamp between 1 and 3
    })
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[95%] max-w-md mx-auto mt-24 overflow-hidden">
        {!imageSrc ? (
          <div className="p-6">
            <Dropzone onDrop={onDrop} accept={{ "image/*": [] }}>
              {({ getRootProps, getInputProps }) => (
                <div
                  {...getRootProps()}
                  className="border-2 border-dashed border-gray-300 p-8 rounded-md text-center cursor-pointer"
                >
                  <input {...getInputProps()} />
                  <p>Click or drag an image here to upload</p>
                </div>
              )}
            </Dropzone>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-[#5d5eee] text-white p-3 flex justify-between items-center">
              <button
                onClick={() => {
                  setImageSrc(null)
                  setError(null)
                }}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Cancel"
              >
                <X className="h-5 w-5" />
              </button>

             

              
            </div>

            {/* Cropper area */}
            <div className="relative w-full h-72 bg-gray-600">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
              />

              {/* Zoom controls on the right side */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col gap-1">
                <button
                  onClick={() => adjustZoom(0.1)}
                  disabled={zoom >= 3}
                  className="w-8 h-8 bg-white rounded-sm shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Zoom in"
                >
                  <Plus className="h-4 w-4 text-gray-700" />
                </button>
                <button
                  onClick={() => adjustZoom(-0.1)}
                  disabled={zoom <= 1}
                  className="w-8 h-8 bg-white rounded-sm shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Zoom out"
                >
                  <Minus className="h-4 w-4 text-gray-700" />
                </button>
              </div>

              {/* Confirm button */}
              <div className="absolute right-6 bottom-6">
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-12 h-12 rounded-full bg-[#5d5eee] text-white flex items-center justify-center hover:bg-[#4a4bd8] transition-colors disabled:opacity-50 shadow-lg"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
