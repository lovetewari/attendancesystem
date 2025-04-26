import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { NavigationProvider } from "@/components/navigation-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NM DECOR Staff Tracker",
  description: "Staff Attendance and Expense Tracker for NM DECOR",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <NavigationProvider>
              {children}
              <Toaster />
            </NavigationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
