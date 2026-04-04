import React from 'react'

export default function Footer() {
  return <>
    <footer className="bg-blue-900 text-gray-200 pt-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white-700">

          <div>
            <h2 className="text-2xl font-bold mb-4">
              النظام العقاري الذكي
            </h2>
            <p className="text-base leading-7 text-gray-300">
              منظومة إلكترونية متكاملة لإدارة وتوثيق الملكيات العقارية،
              تهدف إلى تحويل المعاملات العقارية إلى تجربة رقمية آمنة وسريعة.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-3 text-base text-gray-300">
              <li>الرئيسية</li>
              <li>المميزات</li>
              <li>كيف يعمل</li>
              <li>الأسئلة الشائعة</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">الخدمات</h3>
            <ul className="space-y-3 text-base text-gray-300">
              <li>إثبات ملكية</li>
              <li>بيع وشراء</li>
              <li>بحث عن عقار</li>
              <li>إدارة المزادات</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">تواصل معنا</h3>
            <ul className="space-y-4 text-base text-gray-300">
              <li className="flex items-center gap-2">
                <span>📧</span>
                info@estste-system.gov.eg
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span>
                19019
              </li>
              <li className="flex items-center gap-2">
                <span>📍</span>
                القاهرة، مصر
              </li>
            </ul>
          </div>

        </div>

        <div className="text-center text-base text-gray-300 py-6">
          © 2026 منظومة الكارت العقاري الذكي - وزارة الإسكان - جمهورية مصر العربية
        </div>

      </div>
    </footer>
  </>
}
