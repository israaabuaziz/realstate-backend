import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';

export default function SendContract() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contract, setContract] = useState(null);
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerPhone: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

useEffect(() => {
  if (location.state?.contract) {
    setContract(location.state.contract);
    setFormData(prev => ({
      ...prev,
      amount: location.state.contract.price || ''
    }));
  } else {
    const savedContract = localStorage.getItem('currentContract');
    if (savedContract) {
      const parsed = JSON.parse(savedContract);
      setContract(parsed);
      setFormData(prev => ({
        ...prev,
        amount: parsed.price || ''
      }));
    } else {
      setError('لم يتم العثور على بيانات العقد');
    }
  }
}, [location.state]);

const canSell = () => {
  return contract && (contract.status === 'approved' || contract.status === 'for_sale');
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contract) {
      setError('بيانات العقد غير موجودة');
      return;
    }

    if (!formData.buyerName || !formData.buyerPhone) {
      setError('جميع الحقول مطلوبة');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await API.post(`/contracts/${contract._id}/initiate-sale`, {
        buyerName: formData.buyerName,
        buyerPhone: formData.buyerPhone,
        amount: formData.amount || contract.price
      });

      setSuccessMessage('✅ تم إرسال طلب الشراء للمشتري بنجاح');
      
      localStorage.setItem('currentTransaction', JSON.stringify(response.data.transaction));
      
      setTimeout(() => {
        navigate('/realEstate');
      }, 2000);

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.message || 'حدث خطأ في إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6 md:p-10 text-center">
          <p className="text-gray-600">جاري تحميل بيانات العقد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 md:p-10">
        
        <h2 className="text-right text-xl font-semibold mb-6">
          إرسال العقد إلى المشتري
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <span className="ml-2">❌</span>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
            <span className="ml-2">✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">تفاصيل العقار:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>📌 رقم العقد: {contract.contractNumber}</div>
            <div>🏠 نوع العقار: {contract.propertyType}</div>
            <div>📍 الموقع: {contract.governorate}</div>
            <div>📏 المساحة: {contract.formattedArea}</div>
            <div>💰 السعر: {contract.formattedPrice}</div>
            <div>📊 نسبة الملكية: {contract.ownershipPercentage}%</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-right text-sm mb-1">اسم المشتري</label>
            <input 
              type="text"
              name="buyerName"
              value={formData.buyerName}
              onChange={handleInputChange}
              required
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل اسم المشتري"
            />
          </div>

          <div>
            <label className="block text-right text-sm mb-1">رقم هاتف المشتري</label>
            <input 
              type="tel"
              name="buyerPhone"
              value={formData.buyerPhone}
              onChange={handleInputChange}
              required
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل رقم الهاتف"
            />
            <p className="text-xs text-gray-500 mt-1">سيتم إرسال إشعار للمشتري بهذا الرقم</p>
          </div>

          <div>
            <label className="block text-right text-sm mb-1">المبلغ (جنيه)</label>
            <input 
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="السعر النهائي"
            />
            <p className="text-xs text-gray-500 mt-1">اتركه فارغاً لاستخدام السعر الأصلي: {contract.formattedPrice}</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded-md hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري الإرسال...
              </>
            ) : 'إرسال طلب الشراء'}
          </button>

        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/realEstate')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← العودة للعقارات
          </button>
        </div>
      </div>
    </div>
  );
}
