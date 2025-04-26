"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const { login, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Only redirect if authenticated and not in loading state
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const success = await login(password)

    if (success) {
      setIsSuccess(true)
      toast({
        title: "Login successful",
        description: "Welcome to NM DECOR Staff Tracker",
      })

      // Redirect after a short delay to show success state
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } else {
      toast({
        title: "Login failed",
        description: "Invalid password. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">NM DECOR</h1>
        <p className="text-xl text-gray-600">Staff Attendance & Expense Tracker</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Admin Login</h2>
            {isSuccess && (
              <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-500" />
              </div>
            )}
          </div>

          <p className="text-gray-500 text-sm mb-6">Enter your password to access the staff tracker</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="••••••••••"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Use password: nmdecor2025</p>
            </div>

            <button
              type="submit"
              className={`w-full py-2 rounded-md text-white font-medium flex items-center justify-center ${
                isSuccess ? "bg-green-500" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={isSuccess}
            >
              {isSuccess ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Success!
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
