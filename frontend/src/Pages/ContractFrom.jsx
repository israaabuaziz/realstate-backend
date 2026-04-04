import { useNavigate } from "react-router-dom";
import React, { useState } from 'react';
import API from '../api';

export default function ContractForm() {
  const navigate = useNavigate();
  const [propertyType, setPropertyType] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [contractNumber, setContractNumber] = useState(""); 
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phoneNumber: '',
    propertyNumber: '',
    ownershipPercentage: '',
    address: '',
    governorate: '',
    propertyType: '',
    floor: '',
    price: '',
    area: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [checkingContract, setCheckingContract] = useState(false);
  const getPropertyCategory = (type) => {
    const categories = {
      'شقة': 'سكني',
      'فيلا': 'سكني',
      'دوبلكس': 'سكني',
      'ستوديو': 'سكني',
      'شاليه': 'سكني',
      'تاون هاوس': 'سكني',
      'بنتهاوس': 'سكني',
      'محل': 'تجاري / إداري',
      'مكتب إداري': 'تجاري / إداري',
      'عيادة': 'تجاري / إداري',
      'مقر شركة': 'تجاري / إداري',
      'معرض': 'تجاري / إداري',
      'أرض زراعية': 'أراضي',
      'أرض مباني': 'أراضي',
      'أرض صناعية': 'أراضي',
      'أرض تجارية': 'أراضي',
      'مصنع': 'صناعي',
      'مخزن': 'صناعي',
      'ورشة': 'صناعي'
    };
    return categories[type] || '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'propertyType') {
      setPropertyType(value);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

const checkExistingContract = async () => {
  if (!contractNumber.trim()) {
    setError('يرجى إدخال رقم العقد');
    return;
  }

  setCheckingContract(true);
  setError('');

  try {
    const response = await API.get(`/contracts/check/${contractNumber}`);
    console.log('🔍 Contract check response:', response.data);
    
    if (response.data.exists) {
      const contract = response.data.contract;
      
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr);
      console.log('👤 Current user:', user);
      console.log('📄 Contract userId:', contract.userId);
      console.log('📄 Contract userId._id:', contract.userId._id);
      console.log('📄 Contract status:', contract.status);
      
      const contractUserId = contract.userId._id || contract.userId;
      const currentUserId = user.id || user._id;
      
      console.log('🔍 Comparing:', { contractUserId, currentUserId });
      
      if (contractUserId !== currentUserId) {
        setError('هذا العقد لا يتبع لك');
        setCheckingContract(false);
        return;
      }

      if (contract.status !== 'approved' && contract.status !== 'completed' && contract.status !== 'for_sale') {
        setError('العقد غير متاح للبيع. يجب أن يكون بحالة مقبول أو مكتمل');
        setCheckingContract(false);
        return;
      }

      setFormData({
        fullName: contract.fullName || '',
        nationalId: contract.nationalId || '',
        phoneNumber: contract.phoneNumber || '',
        propertyNumber: contract.propertyNumber || '',
        ownershipPercentage: contract.ownershipPercentage || '',
        address: contract.address || '',
        governorate: contract.governorate || '',
        propertyType: contract.propertyType || '',
        floor: contract.floor || '',
        price: contract.price || '',
        area: contract.area || '',
        notes: contract.notes || ''
      });
      setPropertyType(contract.propertyType || '');

      setSuccessMessage('✅ تم العثور على العقد بنجاح');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  } catch (err) {
    console.error('❌ Error checking contract:', err);
    if (err.response?.status === 404) {
      setError('لم يتم العثور على العقد. يرجى إنشاء عقد إثبات ملكية أولاً');
    } else {
      setError(err.response?.data?.message || 'حدث خطأ في التحقق من العقد');
    }
  } finally {
    setCheckingContract(false);
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccessMessage('');

  const token = localStorage.getItem('token');
  if (!token) {
    setError('يجب تسجيل الدخول أولاً');
    setLoading(false);
    navigate('/login');
    return;
  }

  try {
    if (!contractNumber.trim()) {
      setError('يرجى إدخال رقم العقد أولاً');
      setLoading(false);
      return;
    }

    const checkResponse = await API.get(`/contracts/check/${contractNumber}`);
    const contract = checkResponse.data.contract;
    const contractId = contract._id;

    const response = await API.put(`/contracts/${contractId}/for-sale`, {
      salePrice: formData.price
    });

    setSuccessMessage('✅ تم تحديث حالة العقد وجعله متاح للبيع بنجاح');
    
    localStorage.setItem('currentContract', JSON.stringify(response.data.contract));
    
    setTimeout(() => {
      navigate('/sendContract', { 
        state: { 
          contract: response.data.contract,
          message: response.data.message 
        } 
      });
    }, 1500);

  } catch (err) {
    console.error('❌ Error:', err);
    if (err.response?.status === 404) {
      setError('لم يتم العثور على العقد. يرجى إنشاء عقد إثبات ملكية أولاً');
    } else {
      setError(err.response?.data?.message || 'حدث خطأ في تحديث العقد');
    }
  } finally {
    setLoading(false);
  }
};

  const isFloorRequired = ["شقة", "دوبلكس", "ستوديو", "بنتهاوس", "مكتب إداري", "عيادة"].includes(propertyType);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-md p-6 md:p-10">
        <h2 className="text-center text-2xl font-bold mb-8">بيع عقار</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <span className="ml-2 text-xl">❌</span>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
            <span className="ml-2 text-xl">✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-lg mb-2 font-semibold">رقم العقد</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="أدخل رقم العقد (مثال: CON-2602-000001)"
              className="flex-1 border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
              disabled={checkingContract}
            />
            <button
              type="button"
              onClick={checkExistingContract}
              disabled={checkingContract}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {checkingContract ? 'جاري البحث...' : 'بحث'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">أدخل رقم العقد للتحقق من وجوده قبل البيع</p>
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-lg mb-1">الاسم</label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
              readOnly 
            />
          </div>

          <div>
            <label className="block text-lg mb-1">الرقم القومي</label>
            <input 
              type="text"
              name="nationalId"
              value={formData.nationalId}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
              readOnly
            />
          </div>

          <div>
            <label className="block text-lg mb-1">رقم الهاتف</label>
            <input 
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
              readOnly
            />
          </div>

          <div>
            <label className="block text-lg mb-1">رقم العقار</label>
            <input 
              type="text"
              name="propertyNumber"
              value={formData.propertyNumber}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
              readOnly
            />
          </div>

          <div>
            <label className="block text-lg mb-1">نسبة الملكية (%)</label>
            <input 
              type="number"
              name="ownershipPercentage"
              value={formData.ownershipPercentage}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
              className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
              readOnly
            />
          </div>

          <div>
            <label className="block text-lg mb-1">العنوان</label>
            <input 
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
              readOnly
            />
          </div>

          <div>
            <label className="block text-lg mb-1">المحافظة</label>
            <select 
              name="governorate"
              value={formData.governorate}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg py-3 px-3 outline-none bg-white"
              disabled
            >
              <option value="">اختر المحافظة</option>
              <option value="القاهرة">القاهرة</option>
              <option value="الجيزة">الجيزة</option>
              <option value="الإسكندرية">الإسكندرية</option>
              <option value="الدقهلية">الدقهلية</option>
              <option value="البحر الأحمر">البحر الأحمر</option>
              <option value="البحيرة">البحيرة</option>
              <option value="الفيوم">الفيوم</option>
              <option value="الغربية">الغربية</option>
              <option value="الإسماعيلية">الإسماعيلية</option>
              <option value="المنوفية">المنوفية</option>
              <option value="المنيا">المنيا</option>
              <option value="القليوبية">القليوبية</option>
              <option value="الوادي الجديد">الوادي الجديد</option>
              <option value="السويس">السويس</option>
              <option value="اسوان">اسوان</option>
              <option value="اسيوط">اسيوط</option>
              <option value="بني سويف">بني سويف</option>
              <option value="بورسعيد">بورسعيد</option>
              <option value="دمياط">دمياط</option>
              <option value="الشرقية">الشرقية</option>
              <option value="جنوب سيناء">جنوب سيناء</option>
              <option value="كفر الشيخ">كفر الشيخ</option>
              <option value="مطروح">مطروح</option>
              <option value="الأقصر">الأقصر</option>
              <option value="قنا">قنا</option>
              <option value="شمال سيناء">شمال سيناء</option>
              <option value="سوهاج">سوهاج</option>
            </select>
          </div>

          <div>
            <label className="block text-lg mb-1">نوع العقار</label>
            <select 
              name="propertyType"
              value={formData.propertyType}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg py-3 px-3 outline-none bg-white"
              disabled
            >
              <option value="">اختر نوع العقار</option>
              <optgroup label="سكني">
                <option value="شقة">شقة</option>
                <option value="فيلا">فيلا</option>
                <option value="دوبلكس">دوبلكس</option>
                <option value="ستوديو">ستوديو</option>
                <option value="شاليه">شاليه</option>
                <option value="تاون هاوس">تاون هاوس</option>
                <option value="بنتهاوس">بنتهاوس</option>
              </optgroup>
              <optgroup label="تجاري / إداري">
                <option value="محل">محل</option>
                <option value="مكتب إداري">مكتب إداري</option>
                <option value="عيادة">عيادة</option>
                <option value="مقر شركة">مقر شركة</option>
                <option value="معرض">معرض</option>
              </optgroup>
              <optgroup label="أراضي">
                <option value="أرض زراعية">أرض زراعية</option>
                <option value="أرض مباني">أرض مباني</option>
                <option value="أرض صناعية">أرض صناعية</option>
                <option value="أرض تجارية">أرض تجارية</option>
              </optgroup>
              <optgroup label="صناعي">
                <option value="مصنع">مصنع</option>
                <option value="مخزن">مخزن</option>
                <option value="ورشة">ورشة</option>
              </optgroup>
            </select>
          </div>

          {isFloorRequired && (
            <div>
              <label className="block text-lg mb-1">رقم الطابق</label>
              <input 
                type="text"
                name="floor"
                value={formData.floor}
                onChange={handleInputChange}
                required
                className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
                readOnly
              />
            </div>
          )}

          <div>
            <label className="block text-lg mb-1">سعر البيع (جنيه)</label>
            <input 
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
            />
          </div>

          <div>
            <label className="block text-lg mb-1">المساحة (م²)</label>
            <input 
              type="number"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
              readOnly
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-lg mb-1">صورة العقد (اختياري)</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                name="contractImage"
                onChange={handleImageChange}
                accept="image/*,.pdf"
                className="w-full border rounded-lg py-2 px-3 outline-none bg-white"
              />
              {imagePreview && (
                <div className="w-16 h-16 border rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">الحد الأقصى 5 ميجابايت</p>
          </div>

          <div className="mt-8 flex justify-start md:col-span-3">
            <button
              type="submit"
              disabled={loading || !contractNumber}
              className={`bg-blue-900 text-white px-8 py-2 rounded-md hover:bg-blue-800 transition ${
                loading || !contractNumber ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'جاري التحديث...' : 'التالي'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
