import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'  
import API from '../api'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth() 
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.phoneNumber || !formData.password) {
      setError('رقم الهاتف وكلمة المرور مطلوبان')
      return
    }

    setLoading(true)

    try {
      const response = await API.post('/users/login', {
        phoneNumber: formData.phoneNumber,
        password: formData.password
      })

      console.log('Login response:', response.data)
      
      if (response.data.userId && response.data.otp) {
        navigate('/login/verification', { 
          state: { 
            userId: response.data.userId,
            phoneNumber: formData.phoneNumber,
            otp: response.data.otp 
          } 
        })
      } else {
        setError('لم يتم استلام رمز التحقق من الخادم')
      }

    } catch (error) {
      console.error('Login error:', error)
      let message = error.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول';
  if (error.response?.status === 403)
    {message = '⚠️ تم إيقاف هذا الحساب. لا يمكن تسجيل الدخول.';}
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="w-full max-w-md px-6">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-10">
          تسجيل الدخول
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-gray-600 mb-1">
            رقم الهاتف
          </label>
          <div className="relative mb-5">
            <input 
              type="text" 
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg py-3 pr-10 pl-3 outline-none focus:border-blue-800"
              placeholder="مثال: 01012345678"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              📞
            </span>
          </div>

          <label className="block text-sm text-gray-600 mb-1">
            كلمة المرور
          </label>
          <div className="relative mb-5">
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg py-3 pr-10 pl-10 outline-none focus:border-blue-800"
              placeholder="أدخل كلمة المرور"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔑
            </span>
          </div>

          <div className="text-left mb-6">
            <Link to="/forgotPassword" className="text-sm text-gray-500 underline">
              هل نسيت كلمة المرور؟
            </Link>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full ${loading ? 'bg-blue-700' : 'bg-blue-900'} text-white py-3 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-70 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري التحقق...
              </>
            ) : 'تسجيل الدخول'}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600">
          ليس لديك حساب؟{" "}
          <Link to="/register" className="text-blue-600 underline">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  )
}
