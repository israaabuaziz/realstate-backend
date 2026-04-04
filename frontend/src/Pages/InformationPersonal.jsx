import React from "react";

export default function InformationPersonal() {
    return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-start p-4" dir="rtl">
            <div className="w-full max-w-md bg-white rounded-lg shadow overflow-hidden">

                <div className="bg-blue-800 text-white p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                        👤
                    </div>
                    <div>
                        <h1 className="font-bold text-xl mb-1.5">أهلاً، محمد أحمد</h1>
                        <p className="text-xs opacity-90">مستخدم النظام العقاري</p>
                    </div>
                </div>

               
                <div className="p-5">

                   
                    <h2 className="text-sm font-bold text-blue-700 border-b pb-2 mb-4">
                        المعلومات الشخصية
                    </h2>

                    <div className="space-y-4">

                      
                        <div className="relative bg-gray-100 rounded-md p-3 pr-4">
                            <span className="absolute right-0 top-0 h-full w-1 bg-blue-500 rounded-tr-md rounded-br-md"></span>
                            <p className="text-xs text-gray-900 mb-1">الاسم بالكامل</p>
                            <p className="text-sm font-semibold text-gray-800">محمد أحمد</p>
                        </div>

                       <div className="relative bg-gray-100 rounded-md p-3 pr-4">
                  <span className="absolute right-0 top-0 h-full w-1 bg-blue-500 rounded-tr-md rounded-br-md"></span>

                 <p className="text-xs text-gray-900 mb-1">الجنسية</p>

              <div className="flex items-center gap-2">
    
             <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded">
               مصري
           </span>
          <p className="text-sm font-semibold text-gray-800">Egyptian</p>
          </div>
          </div>

                    
                        <div className="relative bg-gray-100 rounded-md p-3 pr-4">
                            <span className="absolute right-0 top-0 h-full w-1 bg-blue-500 rounded-tr-md rounded-br-md"></span>
                            <p className="text-xs text-gray-900 mb-1">الرقم القومي</p>
                            <p className="text-sm font-semibold text-gray-800">
                                29909011234567
                            </p>
                        </div>

                     
                        <div className="relative bg-gray-100 rounded-md p-3 pr-4">
                            <span className="absolute right-0 top-0 h-full w-1 bg-blue-500 rounded-tr-md rounded-br-md"></span>
                            <p className="text-xs text-gray-900 mb-1">رقم التليفون</p>
                            <p className="text-sm font-semibold text-gray-800">
                                +20 100 123 4567
                            </p>
                        </div>

                    </div>

                
                    <h2 className="text-sm font-bold text-blue-700 border-b pb-2 mt-6 mb-4">
                        معلومات الحساب
                    </h2>

                 
                    <div className="relative bg-gray-100 rounded-md p-3 pr-4 mb-6">
                        <span className="absolute right-0 top-0 h-full w-1 bg-blue-500 rounded-tr-md rounded-br-md"></span>
                        <p className="text-xs text-gray-900 mb-1">كلمة المرور</p>
                        <div className="flex items-center justify-between">
                            <span className="tracking-widest text-gray-500">••••••••</span>
                            <button className="text-xs text-blue-600 hover:underline">
                                إظهار
                            </button>
                        </div>
                    </div>

                    <button className="w-full bg-green-600 text-white py-2.5 rounded-md font-semibold hover:bg-green-700 transition">
                        ✏️ تعديل البيانات
                    </button>

                </div>
            </div>
        </div>
    );
}