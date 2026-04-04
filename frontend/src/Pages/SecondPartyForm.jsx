export default function SecondPartyForm() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 md:p-10">
        
        <h2 className="text-right text-lg font-semibold mb-8">
          طرف ثانٍ (المشتري)
        </h2>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-right text-sm mb-1">الاسم</label>
            <input type="text" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

        
          <div>
            <label className="block text-right text-sm mb-1">الرقم القومي</label>
            <input type="text" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          
          <div>
            <label className="block text-right text-sm mb-1">رقم الهاتف</label>
            <input type="tel" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

         
          <div>
            <label className="block text-right text-sm mb-1">
              نسبة العمولة (%)
            </label>
            <input type="number" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

         
          <div className="md:col-span-2 flex justify-start mt-4">
            <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-800 transition" >
              تسجيل المعاملة
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}