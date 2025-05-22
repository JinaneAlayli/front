"use client"

import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { FaRocket, FaUsersCog, FaCogs, FaShieldAlt } from "react-icons/fa"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import Link from "next/link"

export default function HomePage() {
  const { isAuthenticated, isAuthChecked } = useSelector((state: RootState) => state.auth)
  const router = useRouter()

  return (
    <>
      <Header />
      <main className="bg-[#FAF9F7] text-[#1E293B]">
        {/* Hero Section */}
        <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">HR Made Easy, Scalable, and Powerful</h1>
            <p className="text-lg text-gray-700 max-w-md">
              A modern platform to track time, manage leave, oversee training, and simplify HR tasks — all in one place.
            </p>
            {isAuthChecked && isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-block bg-[#4ADE80] text-black px-6 py-3 rounded-md font-medium shadow-sm hover:opacity-90 transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/about"
                className="inline-block bg-[#4ADE80] text-black px-6 py-3 rounded-md font-medium shadow-sm hover:opacity-90 transition"
              >
                see more
              </Link>
            )}
          </div>
          <div className="flex justify-center">
            <Image src="/hero-right.png" alt="HR dashboard" width={460} height={350} />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              {
                icon: <FaRocket className="text-3xl text-[#6148F4] mx-auto" />,
                title: "Boost Productivity",
                description: "Enable self-service tools and task management.",
              },
              {
                icon: <FaUsersCog className="text-3xl text-[#6148F4] mx-auto" />,
                title: "Support Every Team",
                description: "Role-based access and multi-company logic.",
              },
              {
                icon: <FaCogs className="text-3xl text-[#6148F4] mx-auto" />,
                title: "Automate & Grow",
                description: "Smart payroll and performance tracking.",
              },
              {
                icon: <FaShieldAlt className="text-3xl text-[#6148F4] mx-auto" />,
                title: "Ensure Compliance",
                description: "Streamline leave and attendance policies.",
              },
            ].map((feature, index) => (
              <div key={index} className="space-y-4">
                {feature.icon}
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Circle Network Section */}
        <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center md:justify-start">
            <Image src="/circle-network.png" alt="Connected teams" width={400} height={400} />
          </div>
          <div className="space-y-5">
            <h2 className="text-4xl font-bold">
              Work <span className="text-[#4ADE80]">together</span>
            </h2>
            <p className="text-lg text-gray-700 max-w-md">
              Foster seamless collaboration across teams with shared goals, real-time updates, and clear communication.
            </p>
            {isAuthChecked && isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-block bg-[#4ADE80] text-black px-6 py-3 rounded-md font-medium shadow-sm hover:opacity-90 transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/services"
                className="bg-[#4ADE80] text-black px-6 py-3 rounded-md font-medium shadow-sm hover:opacity-90 transition"
                
              >
                our services
               </Link>
            )}
          </div>
        </section>

        {/* map sec */}
        <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto relative">
          <div className="z-10 md:absolute md:top-10">
            <h2 className="text-4xl font-bold md:max-w-180">Improve Online Workforce Management</h2>
            <p className="text-lg text-gray-700 md:mt-4 md:max-w-150">
              Empower remote teams with real-time tracking, seamless communication, and smart performance tools all from
              one centralized HR platform.
            </p>
          </div>

          <div className="relative z-0">
            <Image
              src="/remote-map.png"
              alt="Remote team map"
              width={900}
              height={500}
              className="rounded-lg w-full object-contain md:object-cover"
            />

            <div className="block md:absolute md:bottom-6 md:right-6 bg-white/80 p-4 rounded-lg max-w-xs md:max-w-sm text-left shadow-md mt-6 md:mt-0">
              <h3 className="text-xl font-semibold mb-2">Track Your Remote Teams</h3>
              <p className="text-sm text-gray-700">
                View who's working, where, and when — all in real time, from any location.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
