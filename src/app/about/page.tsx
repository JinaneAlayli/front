import { Target, Users, Shield, Grid3x3, Lock, BarChart3, Globe } from "lucide-react"

import Header from "@/components/Header"
import Footer from "@/components/Footer"
export default function AboutPage() {
  return (
    <>
    <Header />
    <main className="bg-[#FAF9F7] text-[#1E293B]">
      {/* Hero Section */}
      <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold leading-tight mb-6">About us</h1>
        <p className="text-lg text-gray-700 max-w-3xl leading-relaxed">
          Beteamly is an HR management software designed to simplify employee management by streamlining attendance,
          leave tracking, performance monitoring, training management, and internal communication.
        </p>
      </section>

      {/* Values Section */}
      <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mission */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="bg-emerald-100 p-3 rounded-full mr-4">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-600">
              To provide an intuitive platform that simplifies HR processes for organizations of all sizes, enabling
              them to focus on what matters most - their people.
            </p>
          </div>

          {/* Team */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="bg-[#6148F4]/10 p-3 rounded-full mr-4">
                <Users className="h-6 w-6 text-[#6148F4]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Our Team</h2>
            </div>
            <p className="text-gray-600">
              A dedicated team of professionals who are passionate about creating effective solutions that transform how
              organizations manage their workforce.
            </p>
          </div>

          {/* Values */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="bg-emerald-100 p-3 rounded-full mr-4">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Our Values</h2>
            </div>
            <p className="text-gray-600">
              Integrity, Innovation, Transparency, and Empowerment guide everything we do, ensuring we deliver solutions
              that truly make a difference.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">HR software that fits your business</h2>
        <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto mb-16">
          Designed to scale with your organization and adapt to your unique needs
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Modules */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 p-6 text-center border border-gray-100">
            <div className="bg-[#6148F4]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Grid3x3 className="h-8 w-8 text-[#6148F4]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">5+ HR Modules</h3>
            <p className="text-gray-600">
              Attendance, payroll, performance management, recruitment, and more in one integrated platform.
            </p>
          </div>

          {/* GDPR */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 p-6 text-center border border-gray-100">
            <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">GDPR Compliant</h3>
            <p className="text-gray-600">
              We protect your data with enterprise-grade security and ensure compliance with global privacy standards.
            </p>
          </div>

          {/* Uptime */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 p-6 text-center border border-gray-100">
            <div className="bg-[#6148F4]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-[#6148F4]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">99.9% Uptime</h3>
            <p className="text-gray-600">
              Reliability you can trust, anytime you need it. Access your HR system without interruptions.
            </p>
          </div>

          {/* Worldwide */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 p-6 text-center border border-gray-100">
            <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Worldwide Access</h3>
            <p className="text-gray-600">
              Empower your workforce, wherever they are. Cloud-based solution accessible from any device.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#6148F4] to-[#5040D9] rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your HR management?</h2>
          <p className="text-[#6148F4]/80 text-white mb-8 max-w-2xl mx-auto">
            Join thousands of companies that trust Beteamly to streamline their HR processes and enhance employee
            experience.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-[#6148F4] hover:bg-[#F7F7FB] px-6 py-3 rounded-md font-medium transition-colors">
              Request a Demo
            </button>
            <button className="bg-[#4ADE80] text-black hover:opacity-90 px-6 py-3 rounded-md font-medium transition-colors shadow-sm">
              Get Started
            </button>
          </div>
        </div>
      </section>
    </main>
    
         <Footer />
            </>
  )
}
