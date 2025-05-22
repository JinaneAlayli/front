export interface ApiUser {
  id: number
  name: string
  position?: string
  team_id?: number
  company_id?: number
  role_id?: number
  email?: string
  profile_img?: string
}

// Updated to match task.entity.ts
export interface Task {
  id: number
  user_id: number // Who the task is assigned to
  created_by: number // Who created the task
  task: string // Task title (was previously 'title')
  note?: string // Task note (was previously 'description')
  completed: boolean // Boolean flag instead of status string
  created_at: string
  due_date?: string
  user?: ApiUser // The user the task is assigned to
  creator?: ApiUser // The user who created the task
}

// Updated to match attendance.entity.ts
export interface AttendanceRecord {
  id: number
  user_id: number
  date: string
  check_in: string // Was previously check_in_time
  check_out?: string // Was previously check_out_time
  location_lat?: number
  location_lng?: number
  ip_address?: string
  status?: string // e.g., 'present'
  worked_hours?: number
  user?: ApiUser
}

// Updated to match team.entity.ts
export interface Team {
  id: number
  company_id: number
  name: string
  description?: string
  department?: string
  leader_id?: number
  created_at: string
  updated_at: string
  leader?: ApiUser
  company?: any
}

export interface Salary {
  id: number
  user_id: number
  amount: number
  currency: string
  effective_date: string
  end_date?: string
  is_active: boolean
  base_salary?: number
  bonus?: number
  overtime?: number
  deductions?: number
  month?: number
  year?: number
  user?: {
    id: number
    name: string
    position?: string
  }
}

export interface BusinessSetting {
  id: number
  company_id: number
  salary_cycle: string
  workday_start: string
  workday_end: string
  annual_leave_days: number
  sick_leave_days: number
  overtime_rate: number
  currency: string
  created_at: Date
  updated_at: Date
}

// Define types for employee performance metrics
export interface EmployeePerformance {
  id: number
  name: string
  position: string
  avatar?: string
  tasksCompleted: number
  tasksTotal: number
  completionRate: number
  onTimeCompletion: number
  lateCompletion: number
  attendanceRate: number
  lateArrivals: number
  overallScore: number
}

// Define types for our analytics data
export interface AnalyticsSummary {
  totalEmployees?: number
  totalTasks?: number
  completedTasks?: number
  pendingTasks?: number
  attendanceRate?: number
  lateArrivals?: number
  totalTeams?: number
  avgTeamSize?: number
  totalSalaryBudget?: number
  avgSalary?: number
}

export interface AnalyticsData {
  summary: Partial<AnalyticsSummary>
  employeePerformance?: EmployeePerformance[]
  attendanceIssues?: {
    id: number
    name: string
    position: string
    avatar?: string
    lateCount: number
    absenceCount: number
    avgLateMinutes: number
  }[]
  teamPerformance?: {
    id: number
    name: string
    score: number
    taskCompletion: {
      assigned: number
      completed: number
    }
  }[]
  salaryDistribution?: {
    range: string
    count: number
  }[]
  businessSettings?: BusinessSetting
  salaryData?: {
    allSalaries: Salary[]
    departmentSalaries: {
      department: string
      avgSalary: number
      count: number
    }[]
    topEarners: Salary[]
    compensationBreakdown: {
      baseSalary: number
      bonus: number
      overtime: number
      deductions: number
      total: number
    }
    monthlySalaries?: {
      month: number
      year: number
      avgSalary: number
    }[]
  }
}

// Define type for task data map
export interface UserTaskData {
  completed: number
  pending: number
  late: number
  onTime: number
  total: number
  tasksCreated: number
  tasksCompleted: number
  completedBy?: { userId: number; name: string }[]
}

// Define type for attendance data map
export interface UserAttendanceData {
  lateCount: number
  absenceCount: number
  totalLateMinutes: number
  presentCount: number
  totalDays: number
}
