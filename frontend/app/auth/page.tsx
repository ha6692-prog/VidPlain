"use client"

import { useState, useEffect, useCallback, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "../../src/supabase"

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getPasswordStrength(password: string): "weak" | "medium" | "strong" | null {
    if (password.length === 0) return null
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    if (strength <= 2) return "weak"
    if (strength <= 4) return "medium"
    return "strong"
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <AuthContent />
        </Suspense>
    )
}

function AuthContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [mode, setMode] = useState<"signin" | "signup">("signin")

    // Sign in state
    const [signinEmail, setSigninEmail] = useState("")
    const [signinPassword, setSigninPassword] = useState("")
    const [signinErrors, setSigninErrors] = useState<Record<string, string>>({})
    const [signinLoading, setSigninLoading] = useState(false)

    // Sign up state
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [signupEmail, setSignupEmail] = useState("")
    const [age, setAge] = useState("")
    const [signupPassword, setSignupPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [signupErrors, setSignupErrors] = useState<Record<string, string>>({})
    const [signupLoading, setSignupLoading] = useState(false)

    // Prevent double-submit refs
    const signinSubmitting = useRef(false)
    const signupSubmitting = useRef(false)

    useEffect(() => {
        if (searchParams.get("mode") === "signup") {
            setMode("signup")
        }
    }, [searchParams])

    const switchMode = useCallback((newMode: "signin" | "signup") => {
        setMode(newMode)
        setSigninEmail("")
        setSigninPassword("")
        setSigninErrors({})
        setFirstName("")
        setLastName("")
        setSignupEmail("")
        setAge("")
        setSignupPassword("")
        setConfirmPassword("")
        setSignupErrors({})
    }, [])

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault()

        // Prevent double submit
        if (signinSubmitting.current) return
        signinSubmitting.current = true

        const errors: Record<string, string> = {}

        if (!signinEmail) {
            errors.email = "Email is required"
        } else if (!isValidEmail(signinEmail)) {
            errors.email = "Please enter a valid email address"
        }

        if (!signinPassword) {
            errors.password = "Password is required"
        } else if (signinPassword.length < 6) {
            errors.password = "Password must be at least 6 characters"
        }

        setSigninErrors(errors)

        if (Object.keys(errors).length > 0) {
            signinSubmitting.current = false
            return
        }

        setSigninLoading(true)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: signinEmail,
                password: signinPassword,
            })

            if (error || !data.user) {
                // Common cause: email not confirmed. Show clear message.
                const msg =
                    error?.message === "Invalid login credentials"
                        ? "Invalid email or password. If you just signed up, please check your email for a confirmation link — or disable email confirmation in Supabase."
                        : error?.message || "Login failed"
                setSigninErrors({ email: msg })
                return
            }

            // Store user info
            localStorage.setItem(
                "user",
                JSON.stringify({
                    id: data.user.id,
                    email: data.user.email ?? signinEmail,
                    firstName: data.user.user_metadata?.firstName ?? "",
                    lastName: data.user.user_metadata?.lastName ?? "",
                    membership: "free",
                })
            )

            router.push("/dashboard")
        } catch (err) {
            console.error("Sign in error:", err)
            setSigninErrors({ email: "Network error. Please try again." })
        } finally {
            setSigninLoading(false)
            signinSubmitting.current = false
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()

        // Prevent double submit
        if (signupSubmitting.current) return
        signupSubmitting.current = true

        const errors: Record<string, string> = {}

        if (!firstName || firstName.trim().length < 2) {
            errors.firstName = "First name must be at least 2 characters"
        }
        if (!lastName || lastName.trim().length < 2) {
            errors.lastName = "Last name must be at least 2 characters"
        }
        if (!signupEmail || !isValidEmail(signupEmail)) {
            errors.email = "Please enter a valid email address"
        }
        if (!age || parseInt(age) < 13 || parseInt(age) > 120) {
            errors.age = "Please enter a valid age (13–120)"
        }
        if (!signupPassword || signupPassword.length < 6) {
            errors.password = "Password must be at least 6 characters"
        }
        if (!confirmPassword || signupPassword !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match"
        }

        setSignupErrors(errors)

        if (Object.keys(errors).length > 0) {
            signupSubmitting.current = false
            return
        }

        setSignupLoading(true)
        try {
            const { data, error } = await supabase.auth.signUp({
                email: signupEmail,
                password: signupPassword,
                options: {
                    data: {
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        age: parseInt(age),
                    },
                },
            })

            if (error) {
                // Handle "User already registered"
                const msg =
                    error.message.toLowerCase().includes("already registered")
                        ? "An account with this email already exists. Please sign in instead."
                        : error.message
                setSignupErrors({ email: msg })
                return
            }

            // If email confirmation is OFF in Supabase, data.session will exist → auto-login
            // If email confirmation is ON, data.session will be null → show message
            if (data.session && data.user) {
                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        id: data.user.id,
                        email: signupEmail,
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        membership: "free",
                    })
                )
                router.push("/dashboard")
            } else {
                // Email confirmation is still ON — tell the user
                setSignupErrors({
                    email:
                        "Account created! Please check your email to confirm your account, then sign in.",
                })
            }
        } catch (err) {
            console.error("Signup error:", err)
            setSignupErrors({ email: "Network error. Please try again." })
        } finally {
            setSignupLoading(false)
            signupSubmitting.current = false
        }
    }

    const passwordStrength = getPasswordStrength(signupPassword)

    return (
        <main className="relative min-h-screen flex items-center justify-center">
            <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

            {/* Logo */}
            <div className="absolute top-8 left-8 z-10">
                <Link
                    href="/"
                    className="font-[var(--font-bebas)] text-2xl tracking-wider text-foreground hover:text-accent transition-colors duration-200"
                >
                    VIDPLAIN
                </Link>
            </div>

            {/* Auth container */}
            <div className="relative z-10 w-full max-w-md px-6">
                {/* Sign In */}
                {mode === "signin" && (
                    <div className="border border-border bg-background/80 backdrop-blur-sm p-8 md:p-10">
                        <div className="text-center mb-8">
                            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-4">
                                Authentication
                            </span>
                            <h1 className="font-[var(--font-bebas)] text-4xl md:text-5xl tracking-tight mb-2">
                                WELCOME BACK
                            </h1>
                            <p className="font-mono text-xs text-muted-foreground">
                                Enter your details to access your account.
                            </p>
                        </div>

                        <form onSubmit={handleSignin} noValidate>
                            <div className="mb-4">
                                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={signinEmail}
                                    onChange={(e) => setSigninEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    className="w-full bg-secondary border border-border px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
                                />
                                {signinErrors.email && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">
                                        {signinErrors.email}
                                    </span>
                                )}
                            </div>

                            <div className="mb-2">
                                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={signinPassword}
                                    onChange={(e) => setSigninPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="w-full bg-secondary border border-border px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
                                />
                                {signinErrors.password && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">
                                        {signinErrors.password}
                                    </span>
                                )}
                            </div>

                            <div className="text-right mb-6">
                                <a
                                    href="#"
                                    className="font-mono text-[11px] text-accent hover:text-foreground transition-colors"
                                >
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={signinLoading}
                                className="w-full border border-foreground/20 bg-foreground text-background px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {signinLoading ? "Signing in..." : "Sign In"}
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1 h-px bg-border" />
                                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                    Or continue with
                                </span>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button
                                    type="button"
                                    className="flex items-center justify-center gap-2 border border-border bg-secondary px-4 py-3 font-mono text-xs text-foreground hover:border-accent hover:text-accent transition-all duration-200"
                                >
                                    Google
                                </button>
                                <button
                                    type="button"
                                    className="flex items-center justify-center gap-2 border border-border bg-secondary px-4 py-3 font-mono text-xs text-foreground hover:border-accent hover:text-accent transition-all duration-200"
                                >
                                    GitHub
                                </button>
                            </div>

                            <p className="text-center font-mono text-xs text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => switchMode("signup")}
                                    className="text-accent hover:text-foreground transition-colors bg-transparent border-none cursor-pointer font-mono text-xs"
                                >
                                    Sign up
                                </button>
                            </p>
                        </form>
                    </div>
                )}

                {/* Sign Up */}
                {mode === "signup" && (
                    <div className="border border-border bg-background/80 backdrop-blur-sm p-8 md:p-10">
                        <div className="text-center mb-8">
                            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-4">
                                Registration
                            </span>
                            <h1 className="font-[var(--font-bebas)] text-4xl md:text-5xl tracking-tight mb-2">
                                CREATE ACCOUNT
                            </h1>
                            <p className="font-mono text-xs text-muted-foreground">
                                Start your learning journey with Vidplain.
                            </p>
                        </div>

                        <form onSubmit={handleSignup} noValidate>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="First name"
                                        className="w-full bg-secondary border border-border px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
                                    />
                                    {signupErrors.firstName && (
                                        <span className="block font-mono text-[11px] text-destructive mt-1">
                                            {signupErrors.firstName}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Last name"
                                        className="w-full bg-secondary border border-border px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
                                    />
                                    {signupErrors.lastName && (
                                        <span className="block font-mono text-[11px] text-destructive mt-1">
                                            {signupErrors.lastName}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={signupEmail}
                                    onChange={(e) => setSignupEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    className="w-full bg-secondary border border-border px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
                                />
                                {signupErrors.email && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">
                                        {signupErrors.email}
                                    </span>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                    Age
                                </label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    placeholder="Your age"
                                    min={13}
                                    max={120}
                                    className="w-full bg-secondary border border-border px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
                                />
                                {signupErrors.age && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">
                                        {signupErrors.age}
                                    </span>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={signupPassword}
                                    onChange={(e) => setSignupPassword(e.target.value)}
                                    placeholder="Create a password"
                                    autoComplete="new-password"
                                    className="w-full bg-secondary border border-border px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
                                />
                                {passwordStrength && (
                                    <>
                                        <div className="mt-2 h-[3px] bg-border overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${passwordStrength === "weak"
                                                    ? "w-1/3 bg-destructive"
                                                    : passwordStrength === "medium"
                                                        ? "w-2/3 bg-accent"
                                                        : "w-full bg-green-500"
                                                    }`}
                                            />
                                        </div>
                                        <span
                                            className={`block font-mono text-[10px] mt-1 ${passwordStrength === "weak"
                                                ? "text-destructive"
                                                : passwordStrength === "medium"
                                                    ? "text-accent"
                                                    : "text-green-500"
                                                }`}
                                        >
                                            {passwordStrength === "weak"
                                                ? "Weak password"
                                                : passwordStrength === "medium"
                                                    ? "Medium password"
                                                    : "Strong password"}
                                        </span>
                                    </>
                                )}
                                {signupErrors.password && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">
                                        {signupErrors.password}
                                    </span>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
                                    className="w-full bg-secondary border border-border px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
                                />
                                {signupErrors.confirmPassword && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">
                                        {signupErrors.confirmPassword}
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={signupLoading}
                                className="w-full border border-foreground/20 bg-foreground text-background px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {signupLoading ? "Creating account..." : "Create Account"}
                            </button>

                            <p className="text-center font-mono text-xs text-muted-foreground">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => switchMode("signin")}
                                    className="text-accent hover:text-foreground transition-colors bg-transparent border-none cursor-pointer font-mono text-xs"
                                >
                                    Sign in
                                </button>
                            </p>
                        </form>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Vidplain &mdash; Elevating education through AI
                    </span>
                </div>
            </div>
        </main>
    )
}