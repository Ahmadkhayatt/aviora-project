"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { BRAND_NAME } from "@/shared/constants"

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { confirmPassword, ...signupData } = data

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        // Auto-login and redirect to home page
        router.push("/")
      } else {
        setError(result.error || "Signup failed")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold text-charcoal-900 mb-2">
              {BRAND_NAME}
            </h1>
            <p className="text-charcoal-600 text-sm">Create your luxury jewelry account</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">Account created successfully! Redirecting...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-charcoal-700 mb-2">
                  First Name
                </label>
                <input
                  {...register("firstName")}
                  type="text"
                  id="firstName"
                  placeholder="John"
                  className="w-full px-4 py-3 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-colors text-charcoal-900 placeholder-charcoal-400"
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-charcoal-700 mb-2">
                  Last Name
                </label>
                <input
                  {...register("lastName")}
                  type="text"
                  id="lastName"
                  placeholder="Doe"
                  className="w-full px-4 py-3 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-colors text-charcoal-900 placeholder-charcoal-400"
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 mb-2">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                id="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-colors text-charcoal-900 placeholder-charcoal-400"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Fields */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 mb-2">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                id="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-colors text-charcoal-900 placeholder-charcoal-400"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal-700 mb-2">
                Confirm Password
              </label>
              <input
                {...register("confirmPassword")}
                type="password"
                id="confirmPassword"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-colors text-charcoal-900 placeholder-charcoal-400"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full py-3 px-4 bg-charcoal-900 text-white font-medium rounded-lg hover:bg-charcoal-800 focus:ring-2 focus:ring-charcoal-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-charcoal-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-charcoal-500">Already have an account?</span>
              </div>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-charcoal-600 text-sm">
              Sign in to your existing account.{' '}
              <a href="/auth/login" className="font-medium text-gold-600 hover:text-gold-500 transition-colors">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}