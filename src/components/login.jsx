"use client"

import axios from "axios"
import { useState, useEffect, useRef } from "react"
import { FiMail, FiLock, FiEye, FiEyeOff, FiChevronRight, FiAlertCircle, FiCheckCircle } from "react-icons/fi"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"


export default function LoginPage() {
  const navigate = useNavigate()
  const backend_domain_name = import.meta.env.VITE_BACKEND_DOMAIN_NAME || "http://localhost:1500/";
  const admin_backend_domain_name = import.meta.env.ADMIN_BACKEND_DOMAIN_NAME || "http://localhost:2000/";
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const dispatch = useDispatch();
  const theme = {
    primary: "#5F9EA0",
    secondary: "#4682B4",
    accent: "#2E8B57",
    dark: "#2F4F4F",
    light: "#708090",
    background: "#F8FAFC",
    white: "#FFFFFF",
    lightGray: "#E2E8F0",
    gradient: "linear-gradient(135deg, #5F9EA0 0%, #4682B4 100%)",
  }
  const checkAuth = async () => {
    try {
      const response = await axios.get(`${admin_backend_domain_name}api/chat/me`, {
        withCredentials: true
      })
      console.log(response, 'is response')
      if (response.status === 200) {
        navigate("/")
      }
    } catch (error) {
      // Not logged in, stay on login page
      console.log("User not authenticated", error)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError("")
    
    if (!email.trim() || !password.trim()) {
      setLoginError("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.post(
        `${backend_domain_name}api/user/chatLogin`,
        { email: email.trim(), password },
        { withCredentials: true }
      )

      if (response.status === 200) {
        setShowSuccess(true);
        console.log(response, 'is reponse bro hee')
        // return;

        // dispatch(setCurrentUser(response.data))
        setTimeout(() => {
          navigate("/")
        }, 1000)
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoginError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Login failed. Please check your credentials."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn" style={{ backgroundColor: theme.background }}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.6s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
        .animate-bounceIn {
          animation: bounceIn 0.5s ease-out;
        }
        
        .input-focus-glow:focus-within {
          box-shadow: 0 0 0 3px ${theme.primary}20;
          border-color: ${theme.primary};
        }
        
        .button-hover-effect:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px ${theme.primary}40;
        }
      `}</style>

      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5" 
             style={{ background: theme.gradient, filter: 'blur(40px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5" 
             style={{ background: theme.gradient, filter: 'blur(40px)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slideIn">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 rounded-xl flex items-center justify-center mx-auto shadow-lg mb-4"
                 style={{ background: theme.gradient }}>
              <span className="text-2xl font-bold text-white">AE</span>
            </div>
            <div className="absolute -inset-3 rounded-xl opacity-0 hover:opacity-20 blur-sm transition-all duration-300" 
                 style={{ background: theme.gradient }} />
          </div>
          
          <h1 className="text-4xl font-bold orbitron mb-2" style={{ color: theme.dark }}>
            Aswedaul_edtalk
          </h1>
          <p className="text-gray-500 text-sm">
            Secure Messaging Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border" style={{ borderColor: `${theme.lightGray}` }}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.dark }}>
              Welcome Back
            </h2>
            <p className="text-gray-500">
              Sign in to continue to your chat dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold" style={{ color: theme.dark }}>
                Email Address
              </label>
              <div className={`relative group input-focus-glow transition-all duration-300 ${isInputFocused ? 'scale-[1.01]' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5" style={{ color: theme.light }} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  className="block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none transition-all duration-200"
                  style={{
                    backgroundColor: theme.white,
                    borderColor: theme.lightGray,
                    color: theme.dark,
                  }}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold" style={{ color: theme.dark }}>
                Password
              </label>
              <div className={`relative group input-focus-glow transition-all duration-300 ${isInputFocused ? 'scale-[1.01]' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5" style={{ color: theme.light }} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  className="block w-full pl-10 pr-10 py-3 border rounded-lg placeholder-gray-400 focus:outline-none transition-all duration-200"
                  style={{
                    backgroundColor: theme.white,
                    borderColor: theme.lightGray,
                    color: theme.dark,
                  }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center transition-all duration-200"
                  style={{ color: theme.light }}
                >
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="animate-bounceIn">
                <div className="flex items-center gap-2 p-3 rounded-lg border" 
                     style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}>
                  <FiAlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{loginError}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="animate-bounceIn">
                <div className="flex items-center gap-2 p-3 rounded-lg border" 
                     style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', color: theme.accent }}>
                  <FiCheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Login successful! Redirecting...</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`w-full py-3 px-4 font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed button-hover-effect ${isLoading ? 'cursor-wait' : ''}`}
              style={{
                background: theme.gradient,
                color: theme.white,
                boxShadow: `0 4px 15px ${theme.primary}40`,
              }}
            >
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <FiChevronRight className="h-5 w-5 transition-all duration-200" 
                      style={{ transform: isHovered ? 'translateX(5px)' : 'translateX(0)' }} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Security Info */}
          <div className="mt-8 pt-6 border-t text-center"
               style={{ borderColor: theme.lightGray }}>
            <p className="text-xs" style={{ color: theme.light }}>
              Secure login • Encrypted messaging • Your privacy is protected
            </p>
          </div>
        </div>

        {/* Demo Credentials (Optional - remove if not needed) */}
        <div className="mt-6 text-center">
          <div className="inline-block p-3 rounded-lg bg-gray-50 border" style={{ borderColor: theme.lightGray }}>
            <p className="text-xs" style={{ color: theme.light }}>
              <span className="font-semibold" style={{ color: theme.dark }}>Demo Credentials:</span><br/>
              Email: test@example.com • Password: password123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}