"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { employeeApi, attendanceApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { TimelockLoader } from "@/components/timelock-loader"
import { SuccessNotification } from "@/components/ui/success-notification"
import { Check, X, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"

export default function AttendancePage() {
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [employees, setEmployees] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [attendanceDates, setAttendanceDates] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [employeeAttendance, setEmployeeAttendance] = useState<Record<number, boolean | null>>({})
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Fetch employees
        const employeesData = await employeeApi.getAll()
        setEmployees(employeesData)

        // Fetch all attendance to mark dates in calendar
        const allAttendance = await attendanceApi.getAll()
        const dates = new Set(allAttendance.map((record) => record.date))
        setAttendanceDates(dates)

        // Fetch attendance for selected date
        if (date) {
          const formattedDate = formatDate(date)
          const attendanceData = await attendanceApi.getByDate(formattedDate)
          setAttendance(attendanceData)

          // Initialize employee attendance state
          const initialState: Record<number, boolean | null> = {}
          employeesData.forEach((emp) => {
            const record = attendanceData.find((a) => a.employeeId === emp.id)
            initialState[emp.id] = record ? record.present : null
          })
          setEmployeeAttendance(initialState)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, []) // Load data once on mount

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleDateChange = async (newDate: Date) => {
    // Check for unsaved changes
    if (unsavedChanges) {
      const confirm = window.confirm("You have unsaved changes. Do you want to continue without saving?")
      if (!confirm) return
    }

    setIsLoading(true)
    setDate(newDate)
    const formattedDate = formatDate(newDate)

    try {
      const attendanceData = await attendanceApi.getByDate(formattedDate)
      setAttendance(attendanceData)

      // Reset employee attendance state
      const initialState: Record<number, boolean | null> = {}
      employees.forEach((emp) => {
        const record = attendanceData.find((a) => a.employeeId === emp.id)
        initialState[emp.id] = record ? record.present : null
      })
      setEmployeeAttendance(initialState)
      setUnsavedChanges(false)
    } catch (error) {
      console.error("Error fetching attendance for date:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance data for selected date.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAttendanceChange = (employeeId: number, present: boolean) => {
    // If the current value is the same as what we're setting it to, unmark it (set to null)
    const currentValue = employeeAttendance[employeeId]
    if (currentValue === present) {
      setEmployeeAttendance((prev) => ({
        ...prev,
        [employeeId]: null,
      }))
    } else {
      setEmployeeAttendance((prev) => ({
        ...prev,
        [employeeId]: present,
      }))
    }
    setUnsavedChanges(true)
  }

  // Add a dedicated function to handle double-click
  const handleDoubleClick = (employeeId: number) => {
    setEmployeeAttendance((prev) => ({
      ...prev,
      [employeeId]: null,
    }))
    setUnsavedChanges(true)
  }

  const saveAllAttendance = async () => {
    try {
      setIsSubmitting(true)
      const formattedDate = formatDate(date)
      const updatedRecords = []

      // Create attendance records for all employees
      for (const employeeId in employeeAttendance) {
        const status = employeeAttendance[Number(employeeId)]
        if (status !== null) {
          const record = {
            employeeId: Number(employeeId),
            date: formattedDate,
            present: status,
          }

          // Save to API
          await attendanceApi.mark(record)
          updatedRecords.push(record)
        }
      }

      // Update local state
      setAttendance(updatedRecords)

      // Add this date to the set of dates with attendance
      setAttendanceDates((prev) => new Set([...prev, formattedDate]))

      setUnsavedChanges(false)

      // Format date for display in notification
      const displayDate = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })

      // Show success notification
      setSuccessMessage(`Attendance marked successfully for ${displayDate}`)
      setShowSuccessNotification(true)
      setTimeout(() => setShowSuccessNotification(false), 3000)

      toast({
        title: "Success",
        description: `Attendance saved successfully for ${formattedDate}`,
      })
    } catch (error) {
      console.error("Error saving attendance:", error)
      toast({
        title: "Error",
        description: "Failed to save attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get attendance summary
  const getAttendanceSummary = () => {
    const presentCount = Object.values(employeeAttendance).filter((status) => status === true).length
    const absentCount = Object.values(employeeAttendance).filter((status) => status === false).length
    const totalCount = employees.length
    const unmarkedCount = totalCount - (presentCount + absentCount)

    return { presentCount, absentCount, totalCount, unmarkedCount }
  }

  const summary = getAttendanceSummary()

  // Calendar navigation
  const prevMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setCurrentMonth(newMonth)
  }

  const nextMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    setCurrentMonth(newMonth)
  }

  // Generate calendar days
  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate total days to show (including days from prev/next month)
    const totalDays = 42 // 6 rows of 7 days

    // Generate array of dates
    const dates = []

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i
      dates.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
        isToday: false,
      })
    }

    // Add days from current month
    const currentDate = new Date()
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      dates.push({
        date,
        isCurrentMonth: true,
        isToday: i === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear(),
        isSelected: i === date.getDate() && month === date.getMonth() && year === date.getFullYear(),
      })
    }

    // Add days from next month
    const remainingDays = totalDays - dates.length
    for (let i = 1; i <= remainingDays; i++) {
      dates.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      })
    }

    return dates
  }

  const calendarDays = generateCalendar()
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  const monthYear = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  if (isLoading) {
    return <TimelockLoader />
  }

  return (
    <div className="max-w-6xl mx-auto">
      <SuccessNotification show={showSuccessNotification} message={successMessage} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Attendance Tracker</h1>
        </div>
        <Button onClick={saveAllAttendance} disabled={isSubmitting || !unsavedChanges}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>Choose a date to mark attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Calendar header with month navigation */}
                <div className="flex items-center justify-between">
                  <button onClick={prevMonth} className="p-1 hover:bg-gray-100">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="text-xl font-medium">{monthYear}</div>
                  <button onClick={nextMonth} className="p-1 hover:bg-gray-100">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 text-center">
                  {weekdays.map((day) => (
                    <div key={day} className="text-sm font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    const formattedDay = formatDate(day.date)
                    const hasAttendance = attendanceDates.has(formattedDay)
                    const isSelected =
                      day.date.getDate() === date.getDate() &&
                      day.date.getMonth() === date.getMonth() &&
                      day.date.getFullYear() === date.getFullYear()

                    return (
                      <div key={index} className="p-0.5 flex justify-center">
                        <button
                          onClick={() => handleDateChange(day.date)}
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center text-sm",
                            !day.isCurrentMonth && "text-muted-foreground/50",
                            day.isToday && "font-bold",
                            isSelected && "bg-primary text-primary-foreground",
                            hasAttendance && !isSelected && "bg-primary/10 text-primary font-medium",
                            !isSelected && "hover:bg-muted/50",
                          )}
                        >
                          {day.date.getDate()}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 border shadow-sm">
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>
                {date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-md text-center">
                  <div className="text-3xl font-bold text-green-600">{summary.presentCount}</div>
                  <div className="text-green-600">Present</div>
                </div>
                <div className="bg-red-50 p-4 rounded-md text-center">
                  <div className="text-3xl font-bold text-red-600">{summary.absentCount}</div>
                  <div className="text-red-600">Absent</div>
                </div>
                <div className="bg-gray-100 p-4 rounded-md text-center">
                  <div className="text-3xl font-bold text-gray-600">{summary.unmarkedCount}</div>
                  <div className="text-gray-600">Unmarked</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
              <CardDescription>
                Date:{" "}
                {date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No employees found.</div>
              ) : (
                <div className="space-y-1">
                  {employees.map((employee) => {
                    const status = employeeAttendance[employee.id]
                    const isPresent = status === true
                    const isAbsent = status === false

                    return (
                      <div
                        key={employee.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-md",
                          isPresent ? "bg-green-50" : isAbsent ? "bg-red-50" : "bg-white",
                        )}
                      >
                        <div className="font-medium">{employee.name}</div>

                        <div className="flex items-center gap-4">
                          {isPresent && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              <Check className="h-4 w-4" /> Present
                            </div>
                          )}
                          {isAbsent && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                              <X className="h-4 w-4" /> Absent
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full border flex items-center justify-center",
                                  isPresent ? "bg-primary border-primary text-white" : "border-gray-300 bg-white",
                                )}
                                onDoubleClick={() => handleDoubleClick(employee.id)}
                              >
                                {isPresent && <div className="w-2 h-2 rounded-full bg-white"></div>}
                              </div>
                              <span>Present</span>
                              <input
                                type="radio"
                                name={`attendance-${employee.id}`}
                                checked={isPresent}
                                onChange={() => handleAttendanceChange(employee.id, true)}
                                className="sr-only"
                              />
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full border flex items-center justify-center",
                                  isAbsent ? "bg-red-500 border-red-500 text-white" : "border-gray-300 bg-white",
                                )}
                                onDoubleClick={() => handleDoubleClick(employee.id)}
                              >
                                {isAbsent && <div className="w-2 h-2 rounded-full bg-white"></div>}
                              </div>
                              <span>Absent</span>
                              <input
                                type="radio"
                                name={`attendance-${employee.id}`}
                                checked={isAbsent}
                                onChange={() => handleAttendanceChange(employee.id, false)}
                                className="sr-only"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
