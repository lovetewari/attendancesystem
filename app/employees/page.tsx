"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { employeeApi } from "@/lib/api"
import { Pencil, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Employee {
  id: number
  name: string
  position: string
  email: string
  phone: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null)
  const { toast } = useToast()

  const defaultEmployee = {
    id: 0,
    name: "",
    position: "",
    email: "",
    phone: "",
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await employeeApi.getAll()
      setEmployees(data)
    } catch (err) {
      console.error("Error fetching employees:", err)
      setError("Failed to load employees. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (employee: Employee | null = null) => {
    setCurrentEmployee(employee || { ...defaultEmployee })
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setCurrentEmployee(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentEmployee) return

    setCurrentEmployee({
      ...currentEmployee,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentEmployee) return

    try {
      setIsSubmitting(true)

      if (currentEmployee.id === 0) {
        // Create new employee
        const newEmployee = await employeeApi.create({
          name: currentEmployee.name,
          position: currentEmployee.position,
          email: currentEmployee.email,
          phone: currentEmployee.phone,
        })

        if (newEmployee) {
          setEmployees((prev) => [...prev, newEmployee])
          toast({
            title: "Success",
            description: "Employee created successfully",
            variant: "default",
          })
        } else {
          throw new Error("Failed to create employee")
        }
      } else {
        // Update existing employee
        const updatedEmployee = await employeeApi.update(currentEmployee.id, currentEmployee)

        if (updatedEmployee) {
          setEmployees((prev) => prev.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp)))
          toast({
            title: "Success",
            description: "Employee updated successfully",
            variant: "default",
          })
        } else {
          throw new Error("Failed to update employee")
        }
      }

      handleCloseDialog()
    } catch (err) {
      console.error("Error saving employee:", err)
      toast({
        title: "Error",
        description: "Failed to save employee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(id)
      const success = await employeeApi.delete(id)

      if (success) {
        setEmployees((prev) => prev.filter((emp) => emp.id !== id))
        toast({
          title: "Success",
          description: "Employee deleted successfully",
          variant: "default",
        })
      } else {
        throw new Error("Failed to delete employee")
      }
    } catch (err) {
      console.error("Error deleting employee:", err)
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const confirmDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      handleDelete(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage staff members for NM DECOR.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentEmployee?.id === 0 ? "Add Employee" : "Edit Employee"}</DialogTitle>
              <DialogDescription>Fill in the details for the employee.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={currentEmployee?.name || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    value={currentEmployee?.position || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={currentEmployee?.email || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" value={currentEmployee?.phone || ""} onChange={handleInputChange} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>View and manage all employees.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No employees found. Add your first employee to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(employee)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(employee.id)}
                          disabled={isDeleting === employee.id}
                        >
                          {isDeleting === employee.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
