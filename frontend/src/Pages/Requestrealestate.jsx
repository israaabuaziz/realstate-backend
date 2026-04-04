import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Requestrealestate() {
  const navigate = useNavigate();
  const [propertyType, setPropertyType] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [zamamNumber, setZamamNumber] = useState('');
  const [zamamInfo, setZamamInfo] = useState(null);
  const [checkingZamam, setCheckingZamam] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    electricityMeter: '',
    phoneNumber: '',
    ownershipPercentage: '',
    propertyNumber: '',
    address: '',
    governorate: '',
    propertyType: '',
    floor: '',
    area: '',
    price: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await API.get('/users/profile');
      console.log('👤 User profile:', response.data);
      setUserProfile(response.data.user);
      setFormData(prev => ({
        ...prev,
        fullName: response.data.user.fullName || '',
        nationalId: response.data.user.nationalId || '',
        phoneNumber: response.data.user.phoneNumber || ''
      }));
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'propertyType') setPropertyType(value);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validateUserData = () => {
    if (!userProfile) {
      setError('لم يتم تحميل بيانات المستخدم');
      return false;
    }
    if (formData.fullName.trim() !== userProfile.fullName.trim()) {
      setError('الاسم المدخل لا يتطابق مع الاسم المسجل');
      return false;
    }
    if (formData.nationalId.trim() !== userProfile.nationalId) {
      setError('الرقم القومي المدخل لا يتطابق مع الرقم القومي المسجل');
      return false;
    }
    if (formData.phoneNumber.trim() !== userProfile.phoneNumber) {
      setError('رقم الهاتف المدخل لا يتطابق مع رقم الهاتف المسجل');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (propertyType === 'أرض زراعية' && zamamNumber) {
      const delayDebounce = setTimeout(() => {
        checkZamamNumber(zamamNumber);
      }, 500);
      return () => clearTimeout(delayDebounce);
    } else {
      setZamamInfo(null);
    }
  }, [zamamNumber, propertyType]);

  const checkZamamNumber = async (number) => {
    if (!number) {
      setZamamInfo(null);
      return;
    }
    setCheckingZamam(true);
    try {
      const response = await API.get(`/contracts/check-zamam/${number}`);
      setZamamInfo(response.data);
      setError('');
    } catch (err) {
      setZamamInfo(null);
      if (err.response?.status === 404) {
        setError('رقم الزمام غير موجود في قاعدة البيانات');
      } else {
        console.error('Error checking zamam:', err);
      }
    } finally {
      setCheckingZamam(false);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateUserData()) return;

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
    const formDataToSend = new FormData();

    const priceNum = parseFloat(formData.price);
    const areaNum = parseFloat(formData.area);
    const ownershipNum = parseFloat(formData.ownershipPercentage);

    formDataToSend.append('fullName', formData.fullName);
    formDataToSend.append('nationalId', formData.nationalId);
    formDataToSend.append('phoneNumber', formData.phoneNumber);
    formDataToSend.append('propertyNumber', formData.propertyNumber);
    formDataToSend.append('address', formData.address);
    formDataToSend.append('governorate', formData.governorate);
    formDataToSend.append('propertyType', formData.propertyType);
    formDataToSend.append('price', priceNum);
    formDataToSend.append('area', areaNum);

    const notes = `رقم عداد الكهرباء: ${formData.electricityMeter || 'غير موجود'}${formData.notes ? ' | ' + formData.notes : ''}`;
    formDataToSend.append('notes', notes);

    if (formData.floor) formDataToSend.append('floor', formData.floor);

    const category = getPropertyCategory(formData.propertyType);
    if (category) {
      formDataToSend.append('propertyCategory', category);
    } else {
      setError('نوع العقار غير صحيح');
      setLoading(false);
      return;
    }

    const isAgricultural = formData.propertyType === 'أرض زراعية';
    if (isAgricultural) {
      if (!zamamNumber) {
        setError('رقم الزمام مطلوب للأراضي الزراعية');
        setLoading(false);
        return;
      }
      if (!zamamInfo) {
        setError('يرجى التحقق من رقم الزمام أولاً');
        setLoading(false);
        return;
      }
      if (areaNum > zamamInfo.remainingArea) {
        setError(`المساحة المملوكة (${areaNum} فدان) تتجاوز المساحة المتبقية (${zamamInfo.remainingArea} فدان)`);
        setLoading(false);
        return;
      }
      formDataToSend.append('zamamNumber', zamamNumber);
      formDataToSend.append('zamamShare', areaNum);
      formDataToSend.append('ownershipPercentage', ownershipNum);
    } else {
      if (isNaN(ownershipNum) || ownershipNum <= 0 || ownershipNum > 100) {
        setError('نسبة الملكية مطلوبة ويجب أن تكون بين 1 و 100');
        setLoading(false);
        return;
      }
      formDataToSend.append('ownershipPercentage', ownershipNum);
    }

    if (selectedImage) {
      formDataToSend.append('contractImage', selectedImage);
    }

    console.log('📦 FormData contents:');
    for (let [key, value] of formDataToSend.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    const response = await API.post('/contracts/create', formDataToSend);
    setSuccessMessage('تم إرسال طلبك بنجاح. سيتم مراجعة الطلب والموافقة عليه قريباً');
    setTimeout(() => navigate('/services'), 2000);

  } catch (err) {
    console.error('❌ Error:', err);
    if (err.response?.status === 401 || err.response?.status === 403) {
      setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
      localStorage.removeItem('token');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(err.response?.data?.message || 'حدث خطأ في إرسال الطلب');
    }
  } finally {
    setLoading(false);
  }
};
const isFloorRequired = ["شقة", "دوبلكس", "ستوديو", "بنتهاوس", "مكتب إداري", "عيادة"].includes(propertyType);
const isAgricultural = formData.propertyType === 'أرض زراعية';
  return (
    <div className="min-h-screen bg-gray-50 py-10" dir="rtl">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-2xl font-semibold text-center text-gray-800">كارت إثبات ملكية</h1>
        <p className="text-center text-gray-400 mt-2 mb-10">من فضلك املأ البيانات التالية بدقة</p>

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

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-6">
            <div>
              <label className="block text-lg mb-1">الاسم</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800" />
              <p className="text-xs text-gray-500 mt-1">يجب أن يتطابق مع الاسم المسجل</p>
            </div>
            <div>
              <label className="block text-lg mb-1">الرقم القومي</label>
              <input type="text" name="nationalId" value={formData.nationalId} onChange={handleInputChange} required className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800" />
              <p className="text-xs text-gray-500 mt-1">يجب أن يتطابق مع الرقم القومي المسجل</p>
            </div>
            <div>
              <label className="block text-lg mb-1">رقم عداد (الكهرباء)</label>
              <input type="text" name="electricityMeter" value={formData.electricityMeter} onChange={handleInputChange} className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800" />
            </div>
            <div>
              <label className="block text-lg mb-1">رقم الهاتف</label>
              <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800" />
              <p className="text-xs text-gray-500 mt-1">يجب أن يتطابق مع رقم الهاتف المسجل</p>
            </div>

              <div>
                <label className="block text-lg mb-1">نسبة الملكية (%)</label>
                <input type="number" name="ownershipPercentage" value={formData.ownershipPercentage} onChange={handleInputChange} required min="0" max="100" className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800" />
              </div>

            <div>
              <label className="block text-lg mb-1">رقم العقار</label>
              <input type="text" name="propertyNumber" value={formData.propertyNumber} onChange={handleInputChange} required className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800" />
            </div>
            <div>
              <label className="block text-lg mb-1">العنوان</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} required className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800" />
            </div>
            <div>
              <label className="block text-lg mb-1">المحافظة</label>
            <select
              name="governorate"
              value={formData.governorate}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
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
              <select name="propertyType" value={formData.propertyType} onChange={handleInputChange} required className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800 text-gray-900">
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

            {isAgricultural && (
            <div>
              <label className="block text-lg mb-1">رقم الزمام</label>
              <input
                type="text"
                value={zamamNumber}
                onChange={(e) => setZamamNumber(e.target.value)}
                required
                className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"/>
              <p className="text-xs text-gray-500 mt-1">
                رقم الزمام حسب السجل الزراعي
              </p>

              {checkingZamam && (
                <div className="text-gray-500 text-sm mt-1">جاري التحقق...</div>
              )}


              </div>
            )}

            {isFloorRequired && (
              <div>
                <label className="block text-lg mb-1">رقم الطابق</label>
                <input type="text" name="floor" value={formData.floor} onChange={handleInputChange} required className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800" />
              </div>
            )}

            {isAgricultural ? (
            <div>
                <label className="block text-lg mb-1">
                المساحة المملوكة (فدان)
                </label>
                <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
                />
                <p className="text-xs text-gray-500 mt-1">
                أدخل المساحة التي تمتلكها بالفدان
                </p>
            </div>
            ) : (
            <div>
                <label className="block text-lg mb-1">
                المساحة (م²)
                </label>
                <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                required
                min="0"
                step="1"
                className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800"
                />
            </div>
            )}

            <div>
              <label className="block text-lg mb-1">السعر المتوقع (جنيه)</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-800" />
            </div>

            <div>
              <label className="block text-lg mb-1">صورة العقد</label>
              <div className="flex items-center gap-4">
                <input type="file" onChange={handleImageChange} accept="image/*,.pdf" className="w-full border rounded-lg py-3 px-3 outline-none bg-white" />
                {imagePreview && (
                  <div className="w-16 h-16 border rounded-lg overflow-hidden flex-shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">الحد الأقصى 5 ميجابايت</p>
            </div>
          </div>

          <div className="mt-10">
            <button type="submit" disabled={loading} className={`bg-blue-900 text-white px-10 py-3 rounded-lg hover:bg-blue-800 transition cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {loading ? 'جاري الإرسال...' : 'إرسال'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}