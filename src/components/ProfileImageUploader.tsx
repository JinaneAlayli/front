"use client"

import { useState, useCallback } from "react"
import Modal from "@mui/material/Modal"
import Cropper from "react-easy-crop"
import Dropzone from "react-dropzone"
import { getCroppedImg } from "@/utils/cropImage"
import Cookies from "js-cookie"

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
      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/upload-profile`, {
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

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-[95%] max-w-md mx-auto mt-24">
        {!imageSrc ? (
          <>
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
          </>
        ) : (
          <>
            <div className="relative w-full h-64 bg-gray-100 mb-4">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-600 block mb-1">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setImageSrc(null)
                  setError(null)
                }}
                className="text-sm text-gray-600 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
