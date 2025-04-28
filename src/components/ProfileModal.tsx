"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import api from "@/lib/api"
import { useDispatch } from "react-redux"
import { updateUser } from "@/lib/redux/slices/authSlice"
import ProfileImageUploader from "./ProfileImageUploader"
import { UserCircle } from "lucide-react"

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
  const [showUploader, setShowUploader] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState("/profile.png")

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="  bg-white rounded-lg w-[95%] max-w-md shadow-xl overflow-hidden">
        {/*  Close button on right corner */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-gray-500 text-2xl hover:text-gray-700"
        >
          × 
        </button>

        {/*  Colored Header */}
        <div className="relative bg-[#4F46E5] text-white text-center py-24 px-6">
          <h2 className="text-xl font-semibold">Edit Profile</h2>

          {/*  Profile Image */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
  <div
    onClick={() => setShowUploader(true)}
    className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden cursor-pointer ring-4 ring-white bg-gray-100"
  >
    {imageError ? (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
        <UserCircle size={56} />
      </div>
    ) : (
      <Image
        src={profileImageUrl || "/placeholder.svg"}
        alt="Profile"
        width={112}
        height={112}
        className="object-cover w-full h-full"
        onError={handleImageError}
        unoptimized
      />
    )}
  </div>
   <span className="text-[11px] mt-1 text-black/80">{form.email}</span> {/* ✨ added here! */}
</div>

        </div>

        {/*  Form */}
        <form onSubmit={handleSubmit} className="pt-20 px-6 pb-6 space-y-4">
       

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full mt-1 px-4 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone || ""}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={form.password || ""}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
              className="w-full mt-1 px-4 py-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#4F46E5] text-white font-medium py-2 rounded-md hover:bg-[#4338CA] transition disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>

          {successMsg && <p className="text-green-500 text-sm text-center">{successMsg}</p>}
          {errorMsg && <p className="text-red-500 text-sm text-center">{errorMsg}</p>}
        </form>

        {/*  Profile Image Uploader */}
        <ProfileImageUploader
          open={showUploader}
          onClose={() => setShowUploader(false)}
          onSuccess={async (imageUrl: string) => {
            try {
              const res = await api.get("/users/me")
              dispatch(updateUser(res.data))

              if (res.data.profile_img) {
                let finalImageUrl = "/profile.png"
                if (res.data.profile_img.startsWith("http")) {
                  finalImageUrl = res.data.profile_img
                } else {
                  finalImageUrl = res.data.profile_img.startsWith("/")
                    ? res.data.profile_img
                    : `/${res.data.profile_img}`
                }
                setProfileImageUrl(finalImageUrl)
                setImageError(false)
              }
            } catch (err) {
              console.error("Failed to refresh profile image", err)
            }
            setShowUploader(false)
          }}
        />
      </div>
    </div>
  )
}
