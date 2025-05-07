// Define types for the leave request system
export interface User {
    id: number
    name: string
    role_id?: number
  }
  
  export interface LeaveRequest {
    id: number
    user_id: number
    manager_id?: number
    type: LeaveType
    start_date: string
    end_date: string
    status: LeaveStatus
    reason: string
    created_at: string
    user?: User
    manager?: User
  }
  
  export type LeaveType = "vacation" | "sick" | "personal" | "maternity" | "paternity" | "bereavement" | "unpaid"
  
  export type LeaveStatus = "pending" | "approved" | "refused" | "canceled"
  
  export interface LeaveTypeOption {
    value: LeaveType
    label: string
  }
  
  export interface StatusOption {
    value: LeaveStatus | "all"
    label: string
  }
  
  export interface FilterOptions {
    status: string
    startDate: string | null
    endDate: string | null
    type: string
  }
  
  export interface FormData {
    type: LeaveType | ""
    start_date: Date
    end_date: Date
    reason: string
    user_id: number | null
  }
  
  export interface FormErrors {
    type?: string
    start_date?: string
    end_date?: string
    reason?: string
    user_id?: string
  }
  