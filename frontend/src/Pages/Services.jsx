import React from 'react'
import { Link } from 'react-router-dom'

export default function Services() {
  return <>
  <section className="bg-gray-50 py-20" dir="rtl">
      <div className="max-w-6xl mx-auto px-6 text-center">

       
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          خدماتنا
        </h2>
        <p className="text-gray-400 mb-14">
          اختر الخدمة التي تريدها للبدء
        </p>

        
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
       
  <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col h-full">
    <div className="text-5xl mb-4">🔍</div>
    <h3 className="font-semibold text-lg mb-2">
      الاستعلام عن الكارت/العقار
    </h3>
    <p className="text-sm text-gray-500 mb-6">
      ابحث برقم الكارت أو كود العقار
      لعرض الملكية
    </p>
    
    <div className="mt-auto">
      <Link to="/searchRealEstate" className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition inline-block">
        ابدأ البحث
      </Link>
    </div>
  </div>

  <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col h-full">
    <div className="text-5xl mb-4">🤝</div>
    <h3 className="font-semibold text-lg mb-2">
      إتمام معاملة
    </h3>
    <p className="text-sm text-gray-500 mb-6">
      سجل عقد البيع إلكترونيًا لتحديث
      الملكية بشكل فوري وآمن
    </p>
   
    <div className="mt-auto">
      <Link to="/contractForm" className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition inline-block">
        ابدأ العملية
      </Link>
    </div>
  </div>

  <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col h-full">
    <div className="text-5xl mb-4">💳</div>
    <h3 className="font-semibold text-lg mb-2">
      كارت إثبات ملكية
    </h3>
    <p className="text-sm text-gray-500 mb-6">
      سجل بياناتك وارفق المستندات
      للحصول على الكارت العقاري الرقمي
    </p>
    
    <div className="mt-auto">
      <Link to="/requestrealestate" className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition inline-block">
        اطلب الكارت
      </Link>
    </div>
  </div>

</div>
      </div>
    </section>
  </>
}
