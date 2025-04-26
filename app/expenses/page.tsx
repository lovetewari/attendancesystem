"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { employeeApi, expenseApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function ExpensesPage() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [category, setCategory] = useState<string>("Materials")
  const [description, setDescription] = useState<string>("")

  const EXPENSE_CATEGORIES = ["Materials", "Transportation", "Tools", "Office Supplies", "Meals", "Other"]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Fetch employees
        const employeesData = await employeeApi.getAll()
        setEmployees(employeesData)

        // Fetch today's expenses
        const today = new Date().toISOString().split("T")[0]
        const expensesData = await expenseApi.getByDate(today)
        setExpenses(expensesData)
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
  }, [])

  const handleAddExpense = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive",
      })
      return
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (!description) {
      toast({
        title: "Error",
        description: "Please enter a description",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const today = new Date().toISOString().split("T")[0]

      const newExpense = {
        employeeId: Number.parseInt(selectedEmployee),
        date: today,
        amount: Number(amount),
        description,
        category,
      }

      const result = await expenseApi.create(newExpense)

      if (result) {
        // Refresh expenses
        const expensesData = await expenseApi.getByDate(today)
        setExpenses(expensesData)

        // Reset form
        setSelectedEmployee("")
        setAmount("")
        setCategory("Materials")
        setDescription("")

        toast({
          title: "Success",
          description: "Expense added successfully",
        })
      }
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await expenseApi.delete(id)

      // Refresh expenses
      const today = new Date().toISOString().split("T")[0]
      const expensesData = await expenseApi.getByDate(today)
      setExpenses(expensesData)

      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getEmployeeName = (id: number) => {
    const employee = employees.find((emp) => emp.id === id)
    return employee ? employee.name : "Unknown"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">Track and manage expenses for NM DECOR staff.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Expense</CardTitle>
            <CardDescription>Enter expense details for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter expense details"
                />
              </div>

              <Button onClick={handleAddExpense} disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Expenses</CardTitle>
            <CardDescription>
              {expenses.length === 0 ? "No expenses recorded for today" : `${expenses.length} expense(s) recorded`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                No expenses recorded for today
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{getEmployeeName(expense.employeeId)}</div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold">₹{expense.amount.toFixed(2)}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="h-8 w-8 rounded-full"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <span className="inline-block rounded-full bg-secondary px-2 py-1 text-xs">
                        {expense.category}
                      </span>
                    </div>
                    <div className="mt-2 text-sm">{expense.description}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
