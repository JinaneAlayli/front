export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="bg-[#FAF9F7] min-h-screen flex items-center justify-center">
        {children}
      </div>
    )
  }
  