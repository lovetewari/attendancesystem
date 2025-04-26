"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, DollarSign } from "lucide-react"
import { employeeApi, attendanceApi, expenseApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

export default function DashboardPage() {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    totalExpensesToday: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)

        // Get all employees
        const employees = await employeeApi.getAll()

        // Get today's attendance
        const today = new Date().toISOString().split("T")[0]
        const attendance = await attendanceApi.getByDate(today)

        // Get today's expenses
        const expenses = await expenseApi.getByDate(today)

        // Calculate stats
        const presentCount = attendance.filter((a) => a.present).length
        const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

        setStats({
          totalEmployees: employees.length,
          presentToday: presentCount,
          absentToday: attendance.length - presentCount,
          totalExpensesToday: totalExpenses,
        })

        // Generate recent activity
        const allAttendance = await attendanceApi.getAll()
        const allExpenses = await expenseApi.getAll()

        const activities = [
          ...allAttendance.map((record) => ({
            type: "attendance",
            date: record.date,
            employeeId: record.employeeId,
            status: record.present ? "present" : "absent",
            timestamp: new Date(record.date).getTime(),
          })),
          ...allExpenses.map((expense) => ({
            type: "expense",
            date: expense.date,
            employeeId: expense.employeeId,
            amount: expense.amount,
            category: expense.category,
            timestamp: new Date(expense.date).getTime(),
          })),
        ]

        // Add some mock lending activities
        const lendingActivities = [
          {
            type: "lending",
            date: new Date().toISOString().split("T")[0],
            employeeId: 1,
            item: "Ladder",
            returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            timestamp: Date.now() - 2 * 60 * 60 * 1000,
          },
          {
            type: "lending",
            date: new Date().toISOString().split("T")[0],
            employeeId: 3,
            item: "Power Drill",
            returnDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            timestamp: Date.now() - 5 * 60 * 60 * 1000,
          },
        ]

        activities.push(...lendingActivities)

        // Sort by timestamp (most recent first)
        activities.sort((a, b) => b.timestamp - a.timestamp)

        // Take the 5 most recent activities
        setRecentActivity(activities.slice(0, 5))
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        // Add a slight delay to show the loading animation
        setTimeout(() => {
          setIsLoading(false)
        }, 800)
      }
    }

    fetchDashboardData()
  }, [])

  // Format activity message
  const formatActivityMessage = (activity: any) => {
    const employeeName = getEmployeeName(activity.employeeId)

    if (activity.type === "attendance") {
      return `${employeeName} was marked ${activity.status} on ${formatDate(activity.date)}`
    } else if (activity.type === "expense") {
      return `${employeeName} submitted a ${activity.category} expense of $${activity.amount.toFixed(2)}`
    } else if (activity.type === "lending") {
      return `${employeeName} borrowed ${activity.item} (due: ${formatDate(activity.returnDate)})`
    }
    return ""
  }

  const getEmployeeName = (id: number) => {
    const mockEmployees = [
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Smith" },
      { id: 3, name: "Michael Johnson" },
      { id: 4, name: "Emily Davis" },
      { id: 5, name: "Robert Wilson" },
    ]
    return mockEmployees.find((emp) => emp.id === id)?.name || "Unknown"
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  if (isLoading) {
    return <LoadingSpinner size="large" />
  }

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of staff attendance and expenses for NM DECOR.</p>
      </div>

      <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" variants={container}>
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalExpensesToday.toFixed(2)}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div className="col-span-4" variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity to display.</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 border-b last:border-0"
                    >
                      <div
                        className={`rounded-full p-2 flex-shrink-0 ${
                          activity.type === "attendance"
                            ? activity.status === "present"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                            : activity.type === "expense"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {activity.type === "attendance" ? (
                          activity.status === "present" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )
                        ) : activity.type === "expense" ? (
                          <span className="text-xs font-bold">$</span>
                        ) : (
                          <span className="text-xs font-bold">!</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{formatActivityMessage(activity)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="col-span-3" variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/attendance" className="block">
                <motion.div
                  className="rounded-md border p-3 text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.02)" }}
                >
                  Mark Today's Attendance
                </motion.div>
              </a>
              <a href="/expenses" className="block">
                <motion.div
                  className="rounded-md border p-3 text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.02)" }}
                >
                  Add New Expense
                </motion.div>
              </a>
              <a href="/employees" className="block">
                <motion.div
                  className="rounded-md border p-3 text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.02)" }}
                >
                  Add New Employee
                </motion.div>
              </a>
              <a href="/reports" className="block">
                <motion.div
                  className="rounded-md border p-3 text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.02)" }}
                >
                  View Reports
                </motion.div>
              </a>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
