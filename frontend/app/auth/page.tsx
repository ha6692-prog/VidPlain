"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

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

        if (Object.keys(errors).length === 0) {
            setSigninLoading(true)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: signinEmail, password: signinPassword }),
                })
                const data = await res.json()
                console.log("Login response:", res.status, data)

                if (res.ok && data.email) {
                    const userData = {
                        email: data.email || signinEmail,
                        username: data.username || signinEmail,
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        membership: data.membership || "free",
                    }
                    console.log("Storing user data:", userData)
                    localStorage.setItem("user", JSON.stringify(userData))

                    // Use Next.js router for proper navigation
                    console.log("Redirecting to dashboard...")
                    router.push("/dashboard")
                } else {
                    const errorMsg = data?.error || data?.message || "Invalid credentials"
                    console.error("Login failed:", errorMsg, data)
                    setSigninErrors({ email: errorMsg })
                }
            } catch (err) {
                console.error("Sign in error:", err)
                setSigninErrors({ email: "Network error. Is the server running?" })
            } finally {
                setSigninLoading(false)
            }
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        const errors: Record<string, string> = {}

        if (!firstName || firstName.length < 2) {
            errors.firstName = "First name must be at least 2 characters"
        }
        if (!lastName || lastName.length < 2) {
            errors.lastName = "Last name must be at least 2 characters"
        }
        if (!signupEmail || !isValidEmail(signupEmail)) {
            errors.email = "Please enter a valid email address"
        }
        if (!age || parseInt(age) < 13 || parseInt(age) > 120) {
            errors.age = "Please enter a valid age (13-120)"
        }
        if (!signupPassword || signupPassword.length < 6) {
            errors.password = "Password must be at least 6 characters"
        }
        if (!confirmPassword || signupPassword !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match"
        }

        setSignupErrors(errors)

        if (Object.keys(errors).length === 0) {
            setSignupLoading(true)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email: signupEmail,
                        age: parseInt(age),
                        password: signupPassword,
                    }),
                })
                const data = await res.json()
                if (res.ok) {
                    // Auto-login after registration
                    localStorage.setItem("user", JSON.stringify({
                        email: signupEmail,
                        username: signupEmail,
                        firstName,
                        lastName,
                        membership: "free",
                    }))
                    console.log("Registration successful, redirecting to dashboard...")
                    router.push("/dashboard")
                } else {
                    const errMsg = typeof data === "object"
                        ? Object.values(data).flat().join(", ")
                        : "Registration failed"
                    setSignupErrors({ email: errMsg })
                }
            } catch {
                setSignupErrors({ email: "Network error. Is the server running?" })
            } finally {
                setSignupLoading(false)
            }
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
                            <h1 className="font-[var(--font-bebas)] text-4xl md:text-5xl tracking-tight mb-2">WELCOME BACK</h1>
                            <p className="font-mono text-xs text-muted-foreground">
                                Enter your details to access your account.
                            </p>
                        </div>

                        <form onSubmit={handleSignin}>
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
                                    suppressHydrationWarning
                                />
                                {signinErrors.email && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">{signinErrors.email}</span>
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
                                    suppressHydrationWarning
                                />
                                {signinErrors.password && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">{signinErrors.password}</span>
                                )}
                            </div>

                            <div className="text-right mb-6">
                                <a href="#" className="font-mono text-[11px] text-accent hover:text-foreground transition-colors">
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                className="w-full border border-foreground/20 bg-foreground text-background px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200 mb-6"
                                suppressHydrationWarning
                            >
                                Sign In
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1 h-px bg-border" />
                                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Or continue with</span>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button
                                    type="button"
                                    className="flex items-center justify-center gap-2 border border-border bg-secondary px-4 py-3 font-mono text-xs text-foreground hover:border-accent hover:text-accent transition-all duration-200"
                                    suppressHydrationWarning
                                >
                                    Google
                                </button>
                                <button
                                    type="button"
                                    className="flex items-center justify-center gap-2 border border-border bg-secondary px-4 py-3 font-mono text-xs text-foreground hover:border-accent hover:text-accent transition-all duration-200"
                                    suppressHydrationWarning
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
                                    suppressHydrationWarning
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
                            <h1 className="font-[var(--font-bebas)] text-4xl md:text-5xl tracking-tight mb-2">CREATE ACCOUNT</h1>
                            <p className="font-mono text-xs text-muted-foreground">
                                Start your learning journey with Vidplain.
                            </p>
                        </div>

                        <form onSubmit={handleSignup}>
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
                                        suppressHydrationWarning
                                    />
                                    {signupErrors.firstName && (
                                        <span className="block font-mono text-[11px] text-destructive mt-1">{signupErrors.firstName}</span>
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
                                        suppressHydrationWarning
                                    />
                                    {signupErrors.lastName && (
                                        <span className="block font-mono text-[11px] text-destructive mt-1">{signupErrors.lastName}</span>
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
                                    suppressHydrationWarning
                                />
                                {signupErrors.email && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">{signupErrors.email}</span>
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
                                    suppressHydrationWarning
                                />
                                {signupErrors.age && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">{signupErrors.age}</span>
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
                                    suppressHydrationWarning
                                />
                                {/* Password strength bar */}
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
                                            {passwordStrength === "weak" ? "Weak password" : passwordStrength === "medium" ? "Medium password" : "Strong password"}
                                        </span>
                                    </>
                                )}
                                {signupErrors.password && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">{signupErrors.password}</span>
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
                                    suppressHydrationWarning
                                />
                                {signupErrors.confirmPassword && (
                                    <span className="block font-mono text-[11px] text-destructive mt-1">{signupErrors.confirmPassword}</span>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full border border-foreground/20 bg-foreground text-background px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200 mb-6"
                                suppressHydrationWarning
                            >
                                Create Account
                            </button>

                            <p className="text-center font-mono text-xs text-muted-foreground">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => switchMode("signin")}
                                    className="text-accent hover:text-foreground transition-colors bg-transparent border-none cursor-pointer font-mono text-xs"
                                    suppressHydrationWarning
                                >
                                    Sign in
                                </button>
                            </p>
                        </form>
                    </div>
                )}

                {/* Bottom tag */}
                <div className="mt-6 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Vidplain &mdash; Elevating education through AI
                    </span>
                </div>
            </div>
        </main>
    )
}
