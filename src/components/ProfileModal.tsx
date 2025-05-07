"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import api from "@/lib/api"
import { useDispatch } from "react-redux"
import { updateUser } from "@/lib/redux/slices/authSlice"
import ProfileImageUploader from "./ProfileImageUploader"
import { UserCircle, X, User, Phone, Lock, Save } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  user: any
}

interface ProfileForm {
  name: string
  email: string
  phone: string
  password?: string
}

export default function ProfileModal({ isOpen, onClose, user }: Props) {
  const dispatch = useDispatch()
  const modalRef = useRef<HTMLDivElement>(null)
  const [showUploader, setShowUploader] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState("/profile.png")
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    password: "",
  })
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
      })
    }
  }, [user])

  useEffect(() => {
    if (user?.profile_img) {
      setImageError(false)
      if (user.profile_img.startsWith("http")) {
        setProfileImageUrl(user.profile_img)
      } else {
        setProfileImageUrl(user.profile_img.startsWith("/") ? user.profile_img : `/${user.profile_img}`)
      }
    } else {
      setProfileImageUrl("/profile.png")
    }
  }, [user])

  // This effect will refresh the profile image when upload is successful
  useEffect(() => {
    if (uploadSuccess) {
      const refreshProfileImage = async () => {
        try {
          const res = await api.get("/users/me")
          dispatch(updateUser(res.data))

          if (res.data.profile_img) {
            let finalImageUrl = "/profile.png"
            if (res.data.profile_img.startsWith("http")) {
              finalImageUrl = res.data.profile_img
            } else {
              finalImageUrl = res.data.profile_img.startsWith("/") ? res.data.profile_img : `/${res.data.profile_img}`
            }
            setProfileImageUrl(finalImageUrl)
            setImageError(false)
          }
        } catch (err) {
          console.error("Failed to refresh profile image", err)
        } finally {
          setUploadSuccess(false)
        }
      }

      refreshProfileImage()
    }
  }, [uploadSuccess, dispatch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg("")

    const formData = { ...form }
    if (!formData.password) {
      delete formData.password
    }

    try {
      const res = await api.patch("/users/me", formData)
      dispatch(updateUser(res.data))
      setSuccessMsg("Profile updated successfully!")
      setTimeout(() => setSuccessMsg(""), 3000)
    } catch (err: any) {
      console.error("Update failed", err)
      setErrorMsg(err.response?.data?.message || "Failed to update profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageError = () => {
    setImageError(true)
    setProfileImageUrl("/profile.png")
  }

  const handleImageUploadSuccess = (imageUrl: string) => {
    console.log("Image upload successful:", imageUrl)
    setShowUploader(false)
    setUploadSuccess(true)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop element itself
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200"
      >
        {/* Colored Header */}
        <div className="relative bg-gradient-to-r from-[#4F46E5] to-[#6366F1] px-6 py-20 text-center text-white">
          {/* Close button - moved to inside the card */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <h2 className="text-xl font-semibold">Edit Profile</h2>

          {/* Profile Image */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 text-center">
            <div
              onClick={() => setShowUploader(true)}
              className="relative h-28 w-28 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg ring-4 ring-white/30 transition-all hover:ring-[#4F46E5]/20"
              role="button"
              aria-label="Change profile picture"
            >
              {imageError ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                  <UserCircle size={56} />
                </div>
              ) : (
                <Image
                  src={profileImageUrl || "/placeholder.svg"}
                  alt="Profile"
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                  unoptimized
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <span className="text-xs font-medium text-white">Change Photo</span>
              </div>
            </div>
            <span className="mt-2 block text-xs font-medium text-gray-600">{form.email}</span>
          </div>
        </div>
 
        <form onSubmit={handleSubmit} className="space-y-5 p-6 pt-20">
           <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User size={16} className="text-gray-400" />
              </div>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-gray-900 shadow-sm transition-all focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
              />
            </div>
          </div>
 
          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Phone size={16} className="text-gray-400" />
              </div>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={form.phone || ""}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-gray-900 shadow-sm transition-all focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
              />
            </div>
          </div> 
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock size={16} className="text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password || ""}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-gray-900 shadow-sm transition-all focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
              />
            </div>
            <p className="text-xs text-gray-500">Leave blank to keep your current password</p>
          </div>
 
          {successMsg && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
              <p>{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              <p>{errorMsg}</p>
            </div>
          )}
 
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-[#4F46E5] py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </form>
 
        {showUploader && (
          <ProfileImageUploader
            open={showUploader}
            onClose={() => setShowUploader(false)}
            onSuccess={handleImageUploadSuccess}
          />
        )}
      </div>
    </div>
  )
}
