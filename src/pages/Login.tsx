import { useState, FormEvent } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const LOGIN_API = "/api/security/login"

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username || !password) {
      setError("Please enter username and password.")
      return
    }

    setIsSubmitting(true)

    try {
      const body = new URLSearchParams({ username, password })
      const response = await fetch(LOGIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body,
      })

      if (!response.ok) {
        const message = (await response.json().catch(() => ({})))?.message
        setError(message || "Invalid username or password.")
        return
      }

      const data = await response.json().catch(() => ({}))
      if (data.token) localStorage.setItem("token", data.token)
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("isLoggedIn", "true")

      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(from || "/pos", { replace: true })
    } catch {
      setError("Login failed. Please check credentials and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-800 bg-slate-900/80 backdrop-blur">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-slate-50">Sign in to POS</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login

