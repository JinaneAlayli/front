 
import RoleGuard from "@/components/RoleGuard"
 

export default function AdminPage() {
   //<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
 
  return (
    <RoleGuard allowedRoles={[1]}>
    <div className="flex h-screen items-center justify-center">
      
      <h1>hi admin</h1>
    </div>
    </RoleGuard>
  )
}
