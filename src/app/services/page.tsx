"use client"

import { useState } from "react"
import { Users, BarChart3, Zap, Shield, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
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
                href="/pricing"
                target="_blank"
                rel="noopener noreferrer"
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
          <h2 className="text-3xl md:text-4xl font-bold mb-12  ">Streamline Your HR Operations in One Central Hub</h2>

          {/* WorkPulse Section */}
          <div className="mb-8 border-b border-gray-300 pb-8">
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
                    href="https://drive.google.com/file/d/1XCPZkCOKRmzYJPMO9Ac68FiYjQTmkS9u/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-[#4ADE80] text-black hover:bg-[#3AC070] px-6 py-2.5 rounded-md font-medium transition-colors text-sm"
                  >
                    See Demo <ChevronRight className="ml-1 h-4 w-4" />
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
          <div className="mb-8 border-b border-gray-300 pb-8">
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
                    href="https://drive.google.com/file/d/1r6R1-kaZ0dbgSG8ts9nHwCLPkD4Soo-F/view?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-[#4ADE80] text-black hover:bg-[#3AC070] px-6 py-2.5 rounded-md font-medium transition-colors text-sm"
                  >
                    See Demo <ChevronRight className="ml-1 h-4 w-4" />
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
          <div className="mb-8 border-b border-gray-300 pb-8">
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
                    href="https://drive.google.com/file/d/1C9dJ7FSkQto44ktyB-5cpuYrL1lnAdtI/view?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-[#4ADE80] text-black hover:bg-[#3AC070] px-6 py-2.5 rounded-md font-medium transition-colors text-sm"
                  >
                    See Demo <ChevronRight className="ml-1 h-4 w-4" />
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
          <div className="mb-8 border-b border-gray-300 pb-8">
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
                    href="https://drive.google.com/file/d/1yaMPCBFJ4kSvAL3hLE_dmS96X6c2JKD3/view?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-[#4ADE80] text-black hover:bg-[#3AC070] px-6 py-2.5 rounded-md font-medium transition-colors text-sm"
                  >
                    See Demo <ChevronRight className="ml-1 h-4 w-4" />
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

          {/* Team Management Section */}
          <div className="mb-8 border-b border-gray-300 pb-8">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("teammanagement")}
            >
              <h3 className="text-2xl font-bold">Team Management</h3>
              {expandedSection === "teammanagement" ? (
                <ChevronUp className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              )}
            </div>

            {expandedSection === "teammanagement" && (
              <div className="mt-6 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 mb-2">
                    Efficiently organize and manage your teams with our intuitive interface.
                  </p>
                  <p className="text-gray-700 mb-2">
                    Create team structures, assign roles, and monitor team performance.
                  </p>
                  <p className="text-gray-700 mb-6">
                    Facilitate better collaboration and communication between team members.
                  </p>
                  <Link
                    href="https://drive.google.com/file/d/1WYSpxdxB0OqGw6c8h65homX0vhibPRvZ/view?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-[#4ADE80] text-black hover:bg-[#3AC070] px-6 py-2.5 rounded-md font-medium transition-colors text-sm"
                  >
                    See Demo <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                <div className="relative">
                  <Image
                    src="/team.png"
                    width={500}
                    height={300}
                    alt="Team management interface"
                    className="rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Employee Management Section */}
          <div className="mb-8 border-b border-gray-300 pb-8">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("employeemanagement")}
            >
              <h3 className="text-2xl font-bold">Employee Management</h3>
              {expandedSection === "employeemanagement" ? (
                <ChevronUp className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              )}
            </div>

            {expandedSection === "employeemanagement" && (
              <div className="mt-6 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 mb-2">
                    Maintain comprehensive employee records in one centralized system.
                  </p>
                  <p className="text-gray-700 mb-2">Track employee performance, skills, and career development.</p>
                  <p className="text-gray-700 mb-6">
                    Streamline onboarding and offboarding processes with automated workflows.
                  </p>
                  <Link
                    href="https://drive.google.com/file/d/1YAI4Yr85i_0UXTEyCoYgAhBpJIBvi8N5/view?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-[#4ADE80] text-black hover:bg-[#3AC070] px-6 py-2.5 rounded-md font-medium transition-colors text-sm"
                  >
                    See Demo <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                <div className="relative">
                  <Image
                    src="/employees.png"
                    width={500}
                    height={300}
                    alt="Employee management interface"
                    className="rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Announcements Section */}
          <div className="mb-8 border-b border-gray-300 pb-8">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("announcements")}
            >
              <h3 className="text-2xl font-bold">Announcements</h3>
              {expandedSection === "announcements" ? (
                <ChevronUp className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              )}
            </div>

            {expandedSection === "announcements" && (
              <div className="mt-6 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 mb-2">
                    Keep your entire organization informed with company-wide announcements.
                  </p>
                  <p className="text-gray-700 mb-2">
                    Target specific departments or teams with tailored communications.
                  </p>
                  <p className="text-gray-700 mb-6">
                    Track readership and engagement to ensure important messages reach your team.
                  </p>
                  <Link
                    href="https://drive.google.com/file/d/1JAlknyiTEs0hT8Jh7cqr4Jyp_4zq9A8K/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-[#4ADE80] text-black hover:bg-[#3AC070] px-6 py-2.5 rounded-md font-medium transition-colors text-sm"
                  >
                    See Demo <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                <div className="relative">
                  <Image
                    src="/announcements.png"
                    width={500}
                    height={300}
                    alt="Announcements interface"
                    className="rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Analytics Section */}
          <div className="mb-8">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("analytics")}
            >
              <h3 className="text-2xl font-bold">Monthly Analytics</h3>
              {expandedSection === "analytics" ? (
                <ChevronUp className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              )}
            </div>

            {expandedSection === "analytics" && (
              <div className="mt-6 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 mb-2">
                    Gain valuable insights with comprehensive HR analytics and reporting.
                  </p>
                  <p className="text-gray-700 mb-2">
                    Track key metrics like attendance, performance, and employee satisfaction.
                  </p>
                  <p className="text-gray-700 mb-6">
                    Make data-driven decisions with customizable dashboards and visualizations.
                  </p>
                  <Link
                    href="https://drive.google.com/file/d/1pkSPH6TVXfLkasy6Gn3A3BFoEYTu0sCq/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-[#4ADE80] text-black hover:bg-[#3AC070] px-6 py-2.5 rounded-md font-medium transition-colors text-sm"
                  >
                    See Demo <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                <div className="relative">
                  <Image
                    src="/analytics.png"
                    width={500}
                    height={300}
                    alt="Analytics dashboard interface"
                    className="rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Why Choose Beteamly Section - Enhanced */}
        <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto bg-gradient-to-b from-white to-[#F5F9FF]">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 relative inline-block">
              Why Choose Beteamly
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[#4ADE80] rounded-full"></div>
            </h2>
            <p className="text-lg text-gray-700 mt-6">
              Our platform is designed with modern workplaces in mind, offering powerful features that adapt to your
              organization's unique needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#4ADE80]/30 group">
              <div className="bg-[#4ADE80]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-[#4ADE80]/20 transition-all duration-300">
                <Zap className="h-7 w-7 text-[#4ADE80]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Powerful Automation</h3>
              <p className="text-gray-600 leading-relaxed">
                Automate routine HR tasks and workflows to save time, reduce errors, and focus on what matters most—your
                people.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#6148F4]/30 group">
              <div className="bg-[#6148F4]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-[#6148F4]/20 transition-all duration-300">
                <Shield className="h-7 w-7 text-[#6148F4]" />
              </div>
              <h3 className="text-xl font-bold mb-3"> Enterprise-Grade Security</h3>
              <p className="text-gray-600 leading-relaxed">
               At Beteamly, we follow best practices to keep your company’s HR data secure
               to protecting sensitive employee information from unauthorized access.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#4ADE80]/30 group">
              <div className="bg-[#4ADE80]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-[#4ADE80]/20 transition-all duration-300">
                <Users className="h-7 w-7 text-[#4ADE80]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
              <p className="text-gray-600 leading-relaxed">
                Foster seamless communication and collaboration across departments with integrated tools designed for
                modern teams.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#6148F4]/30 group">
              <div className="bg-[#6148F4]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-[#6148F4]/20 transition-all duration-300">
                <BarChart3 className="h-7 w-7 text-[#6148F4]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Advanced Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Gain actionable insights with comprehensive reporting and data visualization tools to make informed HR
                decisions.
              </p>
            </div>
          </div>
 
        </section>
      </main>
      <Footer />
    </>
  )
}
