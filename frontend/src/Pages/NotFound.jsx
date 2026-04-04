import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return<>
   <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
   
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        
      
        <div className="text-9xl font-bold text-blue-900 mb-4">
          404
        </div>
        
      
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          الصفحة غير موجودة
        </h1>
        
      
        <p className="text-center text-gray-400 mb-10 max-w-md">
          عذرًا، لا يمكن العثور على الصفحة التي تبحث عنها. 
          قد تكون الصفحة قد تم نقلها أو حذفها أو أن العنوان غير صحيح.
        </p>
        
      
        <div className="text-8xl mb-10">
          🏡
        </div>
        
       
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/"
            className="bg-blue-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-800 transition text-center"
          >
            العودة للرئيسية
          </Link>
          
          <Link 
            to="/services"
            className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition text-center"
          >
            تصفح الخدمات
          </Link>
        </div>
        
        
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-600 mb-2">
            هل تحتاج مساعدة؟
          </p>
          <Link
            to="/contact"
            className="text-blue-600 underline text-sm"
          >
            تواصل مع الدعم الفني
          </Link>
        </div>
        
      </div>
      </div>
  </>
}
