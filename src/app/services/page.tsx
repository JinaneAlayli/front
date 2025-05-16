"use client"

import { useState } from "react"
import {
  Calendar,
  DollarSign,
  Users,
  ClipboardCheck,
  BarChart3,
  UserPlus,
  Clock,
  Zap,
  Shield,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import Header from "@/components/Header"
import Footer from "@/components/Footer"

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("core-services")
  const [expandedSection, setExpandedSection] = useState<string>("workpulse")

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection("")
    } else {
      setExpandedSection(section)
    }
  }

  return (
    <>
      <Header />
      <main className="bg-[#FAF9F7] text-[#1E293B]">
         <section className="py-26 px-8 md:px-32 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">HR Services Tailored to Your Team</h1>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Discover a full suite of tools to manage attendance, payroll, leave, performance, and more —all designed
                to help your team thrive, whether in-office or remote.
              </p>
              <Link
                href="#"
                className="inline-flex items-center bg-[#4ADE80] text-black hover:opacity-90 px-6 py-3 rounded-md font-medium transition-colors"
              >
                Get Started <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="relative">
              <Image
                src="/services.png"
                width={500}
                height={400}
                alt="HR dashboard interface"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </section>

         <section className="py-16 px-8 md:px-32 max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12  ">
            Streamline Your HR Operations in One Central Hub
          </h2>

          {/* WorkPulse Section */}
          <div className="mb-8 border-b border-gray-200 pb-8">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("workpulse")}
            >
              <h3 className="text-2xl font-bold">WorkPulse</h3>
              {expandedSection === "workpulse" ? (
                <ChevronUp className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              )}
            </div>

            {expandedSection === "workpulse" && (
              <div className="mt-6 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 mb-2">Track time, attendance & activity instantly.</p>
                  <p className="text-gray-700 mb-2">Let your team clock in and out with one click.</p>
                  <p className="text-gray-700 mb-6">
                    Get real-time visibility on who's working, when, and for how long no spreadsheets needed
                  </p>
                  <Link
                    href="#"
                    className="inline-flex items-center bg-[#F3F4F6] text-gray-800 hover:bg-gray-200 px-6 py-2 rounded-md font-medium transition-colors text-sm"
                  >
                    View Demo
                  </Link>
                </div>
                <div className="relative">
                  <Image
                    src="/attendance-dashboard.png"
                    width={500}
                    height={300}
                    alt="Attendance tracking interface"
                    className="rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SmartLeave Section */}
          <div className="mb-8 border-b border-gray-200 pb-8">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("smartleave")}
            >
              <h3 className="text-2xl font-bold">SmartLeave</h3>
              {expandedSection === "smartleave" ? (
                <ChevronUp className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              )}
            </div>

            {expandedSection === "smartleave" && (
              <div className="mt-6 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 mb-2">
                    Simplify leave requests, approvals, and tracking with our intuitive leave management system.
                  </p>
                  <p className="text-gray-700 mb-6">
                    Automate leave balance calculations and ensure proper staffing levels at all times.
                  </p>
                  <Link
                    href="#"
                    className="inline-flex items-center bg-[#F3F4F6] text-gray-800 hover:bg-gray-200 px-6 py-2 rounded-md font-medium transition-colors text-sm"
                  >
                    View Demo
                  </Link>
                </div>
                <div className="relative">
                  <Image
                    src="/leave-requests.png"
                    width={500}
                    height={300}
                    alt="Leave management interface"
                    className="rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* TaskFlow Section */}
          <div className="mb-8 border-b border-gray-200 pb-8">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("trainflow")}
            >
              <h3 className="text-2xl font-bold">Task Flow</h3>
              {expandedSection === "trainflow" ? (
                <ChevronUp className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              )}
            </div>

            {expandedSection === "trainflow" && (
              <div className="mt-6 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 mb-2">Manage employee tasks .</p>
                  <p className="text-gray-700 mb-2">Assign tasks, set deadlines, and monitor completion rates.</p>
                  <p className="text-gray-700 mb-6">
                    Generate comprehensive reports on training effectiveness and compliance.
                  </p>
                  <Link
                    href="#"
                    className="inline-flex items-center bg-[#F3F4F6] text-gray-800 hover:bg-gray-200 px-6 py-2 rounded-md font-medium transition-colors text-sm"
                  >
                    View Demo
                  </Link>
                </div>
                <div className="relative">
                  <Image
                    src="/addTask.png"
                    width={500}
                    height={300}
                    alt="Training management interface"
                    className="rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payroll & Payslips Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("payroll")}>
              <h3 className="text-2xl font-bold">Payroll & Payslips</h3>
              {expandedSection === "payroll" ? (
                <ChevronUp className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              )}
            </div>

            {expandedSection === "payroll" && (
              <div className="mt-6 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 mb-2">
                    Process payroll, manage compensation, and generate salary reports with complete accuracy.
                  </p>
                  <p className="text-gray-700 mb-2">Automate tax calculations and deductions to ensure compliance.</p>
                  <p className="text-gray-700 mb-6">
                    Provide employees with digital payslips and payment history access.
                  </p>
                  <Link
                    href="#"
                    className="inline-flex items-center bg-[#F3F4F6] text-gray-800 hover:bg-gray-200 px-6 py-2 rounded-md font-medium transition-colors text-sm"
                  >
                    View Demo
                  </Link>
                </div>
                <div className="relative">
                  <Image
                    src="/salary-management.png"
                    width={500}
                    height={300}
                    alt="Payroll management interface"
                    className="rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        

        {/* Features Highlight Section - Simplified */}
        <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-12 shadow-sm">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose Beteamly</h2>
              <p className="text-lg text-gray-700">
                Our platform is designed with modern workplaces in mind, offering powerful features that adapt to your
                organization's unique needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-6">
                <div className="bg-[#4ADE80]/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-[#4ADE80]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Powerful Automation</h3>
                <p className="text-gray-600">Automate routine HR tasks and workflows to save time and reduce errors.</p>
              </div>

              <div className="p-6">
                <div className="bg-[#6148F4]/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-[#6148F4]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Enterprise Security</h3>
                <p className="text-gray-600">
                  Bank-level encryption and compliance with global data protection standards.
                </p>
              </div>

              <div className="p-6">
                <div className="bg-[#4ADE80]/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-[#4ADE80]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Team Collaboration</h3>
                <p className="text-gray-600">Foster seamless communication and collaboration across departments.</p>
              </div>

              <div className="p-6">
                <div className="bg-[#6148F4]/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-[#6148F4]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Advanced Analytics</h3>
                <p className="text-gray-600">
                  Gain insights with comprehensive reporting and data visualization tools.
                </p>
              </div>
            </div>
          </div>
        </section>
 
      </main>
      <Footer />
    </>
  )
}
