"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, ArrowUp } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">Beteamly</h3>
            <p className="text-gray-400 max-w-md">
              Simplifying HR management for businesses of all sizes with our comprehensive suite of tools.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <div className="flex flex-col space-y-2">
              <Link
                href="/about"
                className="text-gray-400 hover:text-[#6148F4] transition-colors inline-flex items-center"
              >
                <span className="border-b border-transparent hover:border-[#6148F4]">About</span>
              </Link>
              <Link
                href="/pricing"
                className="text-gray-400 hover:text-[#6148F4] transition-colors inline-flex items-center"
              >
                <span className="border-b border-transparent hover:border-[#6148F4]">Pricing</span>
              </Link>
              <Link
                href="/login"
                className="text-gray-400 hover:text-[#6148F4] transition-colors inline-flex items-center"
              >
                <span className="border-b border-transparent hover:border-[#6148F4]">Login</span>
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact Us</h4>
            <div className="flex flex-col space-y-3">
              <a
                href="mailto:jinanealayli@gmail.com"
                className="text-gray-400 hover:text-[#6148F4] transition-colors flex items-center gap-2 group"
              >
                <Mail className="h-5 w-5 text-[#6148F4] group-hover:text-[#4ADE80] transition-colors" />
                <span>jinanealayli@gmail.com</span>
              </a>
              <a
                href="tel:+96170298529"
                className="text-gray-400 hover:text-[#6148F4] transition-colors flex items-center gap-2 group"
              >
                <Phone className="h-5 w-5 text-[#6148F4] group-hover:text-[#4ADE80] transition-colors" />
                <span>+96170298529</span>
              </a>
              <div className="text-gray-400 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#6148F4]" />
                <span>Lebanon</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Beteamly. All rights reserved.</p>

          {/* Back to top button */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="mt-4 md:mt-0 flex items-center gap-1 text-sm text-gray-400 hover:text-[#6148F4] transition-colors group"
          >
            <span>Back to top</span>
            <ArrowUp className="h-4 w-4 group-hover:transform group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  )
}
