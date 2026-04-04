import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'  
import API from '../api'

export default function Verification() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()  // 
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [storedOtp, setStoredOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timer, setTimer] = useState(300)
  const [canResend, setCanResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  
  const [showOtpChip, setShowOtpChip] = useState(false) 
  const [chipDisplayDelay, setChipDisplayDelay] = useState(15) 
  
  const { userId, phoneNumber, otp: initialOtp } = location.state || {}
  
  const inputsRef = useRef([])

  const ADMIN_PHONE = '01000000000'
  const ADMIN_PASSWORD = 'admin123'

  useEffect(() => {
    if (!userId || !phoneNumber) {
      navigate('/login', { replace: true })
    } else if (initialOtp) {
      setStoredOtp(initialOtp.toString())
      console.log('✅ OTP received from login:', initialOtp)
      
      setChipDisplayDelay(10)
      setShowOtpChip(false)
    }
  }, [userId, phoneNumber, initialOtp, navigate])

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setCanResend(true)
    }
  }, [timer])

  useEffect(() => {
    if (chipDisplayDelay > 0) {
      const interval = setInterval(() => {
        setChipDisplayDelay(prev => {
          if (prev <= 1) {
            setShowOtpChip(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [chipDisplayDelay])

  const handleFillOtp = () => {
    if (!storedOtp || storedOtp.length !== 6) {
      setError('رمز OTP غير متوفر')
      return
    }

    const otpDigits = storedOtp.split('')
    setOtp(otpDigits)
    
    if (inputsRef.current[5]) {
      inputsRef.current[5].focus()
    }
    
    setSuccess('تم تعبئة الرمز تلقائياً')
    setTimeout(() => setSuccess(''), 2000)
  }

  const handleHideOtp = () => {
    setShowOtpChip(false)
    setSuccess('تم إخفاء رمز التحقق')
    setTimeout(() => setSuccess(''), 2000)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      if (value && index < 5 && inputsRef.current[index + 1]) {
        inputsRef.current[index + 1].focus()
      }
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = inputsRef.current[index - 1]
      if (prevInput) {
        prevInput.focus()
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
      }
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1].focus()
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1].focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      
      if (inputsRef.current[5]) {
        inputsRef.current[5].focus()
      }
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await API.post('/users/verify-login-otp', {
        userId,
        otp: otpCode
      })

      const userData = response.data.user
      const token = response.data.token

      login(userData, token)

      setSuccess('تم التحقق بنجاح! يتم توجيهك الآن...')

      setTimeout(() => {
        if (phoneNumber === ADMIN_PHONE || userData.phoneNumber === ADMIN_PHONE) {
          console.log('Admin logged in - redirecting to dashboard')
          navigate('/admin/dashboard')
        } else {
          console.log('👤 User logged in - redirecting to profile')
          navigate('/services')
        }
      }, 1500)

    } catch (error) {
      console.error('❌ Verification error:', error)
      const message = error.response?.data?.message || 
                      'رمز التحقق غير صحيح أو انتهت صلاحيته'
      setError(message)
      
      setOtp(['', '', '', '', '', ''])
      if (inputsRef.current[0]) {
        inputsRef.current[0].focus()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!canResend) return
    
    setResendLoading(true)
    setError('')
    
    try {
      const response = await API.post('/users/login', { 
        phoneNumber,
        password: '' 
      })
      
      if (response.data.otp) {
        setStoredOtp(response.data.otp)
        
        setShowOtpChip(false)
        setChipDisplayDelay(15)
        
        setSuccess('تم إرسال رمز جديد')
        setTimeout(() => setSuccess(''), 3000)
      }
      
      setTimer(300)
      setCanResend(false)
      
    } catch (error) {
      console.error('Resend OTP error:', error)
      setError('حدث خطأ أثناء إعادة إرسال الرمز. الرجاء المحاولة مرة أخرى.')
    } finally {
      setResendLoading(false)
    }
  }

  const maskedPhoneNumber = phoneNumber ? 
    `****${phoneNumber.slice(-4)}` : 
    'الهاتف'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="w-full max-w-md px-6">
        
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          تأكيد الرمز
        </h1>
        
        <p className="text-center text-gray-600 mb-8">
          الرجاء إدخال الرمز الذي أرسلنا إلى الرقم
          <br />
          <span className="font-semibold text-gray-800">
            {maskedPhoneNumber}
          </span>
        </p>

        {phoneNumber === ADMIN_PHONE && (
          <div className="mb-4 p-2 bg-purple-100 border border-purple-300 text-purple-700 rounded-lg text-center">
            <span className="font-bold"> تسجيل دخول كأدمن</span>
          </div>
        )}

        {showOtpChip && storedOtp && (
          <div className="mb-6">
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={handleFillOtp}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full hover:bg-blue-100 transition-colors active:scale-95"
                title="انقر لملء الرمز تلقائياً"
              >
                <span className="text-sm">استخدم الرمز:</span>
                <span className="font-mono font-semibold tracking-wider">
                  {storedOtp}
                </span>
                <span className="text-xs opacity-70">(انقر للتعبئة)</span>
              </button>
              
              <button
                onClick={handleHideOtp}
                className="text-xs text-gray-500 hover:text-red-500 p-1"
                title="إخفاء الرمز"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>{success}</span>
            </div>
          </div>
        )}

        <div 
          className="flex justify-center gap-2 mb-8"
          onPaste={handlePaste}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={(e) => e.target.select()}
              className="w-12 h-12 text-center text-xl border-2 border-gray-300 rounded-lg focus:border-blue-800 outline-none transition-all"
              disabled={loading}
              inputMode="numeric"
              pattern="\d*"
              autoComplete="one-time-code"
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="text-center mb-8">
          <p className={`text-sm ${timer < 60 ? 'text-red-600' : 'text-gray-600'}`}>
            رمز التحقق صالح لمدة: {formatTime(timer)}
          </p>
        </div>

        {canResend ? (
          <div className="text-center mb-8">
            <button
              onClick={handleResendOtp}
              disabled={resendLoading}
              className="text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
            >
              {resendLoading ? 'جارِ الإرسال...' : 'لم يصلك الرمز؟ إعادة الإرسال'}
            </button>
          </div>
        ) : (
          <div className="text-center mb-8">
            <p className="text-gray-500">
              لم يصلك الرمز؟
              <br />
              <span className="text-gray-400">
                يمكنك طلب رمز جديد بعد انتهاء الوقت
              </span>
            </p>
          </div>
        )}
        
        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          className={`w-full ${
            phoneNumber === ADMIN_PHONE ? 'bg-purple-900 hover:bg-purple-800' : 'bg-blue-900 hover:bg-blue-800'
          } text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              جاري التحقق...
            </>
          ) : phoneNumber === ADMIN_PHONE ? 'تأكيد دخول الأدمن' : 'تأكيد'}
        </button>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← العودة لتسجيل الدخول
          </button>
        </div>

      </div>
    </div>
  )
}
