import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
    nationalId: '',
    phoneNumber: '',
    gender: '',
    nationality: 'مصري',
    region: '',
    religion: '',
    agreeToTerms: false,
    familyMembers: []
  });

  const [currentFamilyMember, setCurrentFamilyMember] = useState({
    fullName: '',
    nationalId: '',
    gender: '',
    relationType: '',
    phoneNumber: '',
    dateOfBirth: '',
    religion: '',
    region: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateFullName = (name) => {
    const nameRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s\-'\.]+$/;
    return nameRegex.test(name);
  };

  const validateNationalId = (id) => {
    return /^\d{14}$/.test(id);
  };

  const validatePhoneNumber = (phone) => {
    // رقم الهاتف: 10-15 رقمًا فقط، بدون علامة +
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFamilyMemberChange = (e) => {
    const { name, value } = e.target;
    setCurrentFamilyMember(prev => ({ ...prev, [name]: value }));
  };

  const addFamilyMember = async () => {
    if (!currentFamilyMember.fullName || !currentFamilyMember.nationalId ||
        !currentFamilyMember.gender || !currentFamilyMember.relationType ||
        !currentFamilyMember.religion || !currentFamilyMember.region) {
      alert('يرجى إكمال جميع بيانات فرد العائلة (الاسم، الرقم القومي، الجنس، الديانة، المنطقة، صلة القرابة)');
      return;
    }

    if (!validateFullName(currentFamilyMember.fullName)) {
      alert('الاسم يجب أن يحتوي على حروف عربية أو إنجليزية فقط ');
      return;
    }

    if (!validateNationalId(currentFamilyMember.nationalId)) {
      alert('الرقم القومي يجب أن يكون 14 رقمًا بالضبط');
      return;
    }

    if (currentFamilyMember.phoneNumber && !validatePhoneNumber(currentFamilyMember.phoneNumber)) {
      alert('رقم الهاتف يجب أن يحتوي على 10-15 رقمًا فقط (مثال: 01012345678)');
      return;
    }

    setLoading(true);
    try {
      await API.post('/users/check-civil-registry', {
        fullName: currentFamilyMember.fullName,
        nationalId: currentFamilyMember.nationalId,
        gender: currentFamilyMember.gender,
        religion: currentFamilyMember.religion,
        nationality: formData.nationality,
        region: currentFamilyMember.region
      });
      setFormData(prev => ({
        ...prev,
        familyMembers: [...prev.familyMembers, currentFamilyMember]
      }));
      setCurrentFamilyMember({
        fullName: '', nationalId: '', gender: '', relationType: '',
        phoneNumber: '', dateOfBirth: '', religion: '', region: ''
      });
    } catch (err) {
      const message = err.response?.data?.message || 'بيانات هذا الفرد غير صحيحة حسب السجل المدني';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const removeFamilyMember = (index) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  const handleNextStep = async () => {
    setError('');

    if (!formData.fullName || !formData.nationalId || !formData.phoneNumber ||
        !formData.gender || !formData.password || !formData.confirmPassword) {
      setError('جميع الحقول الأساسية مطلوبة');
      return;
    }

    if (!validateFullName(formData.fullName)) {
      setError('الاسم يجب أن يحتوي على حروف عربية أو إنجليزية فقط (مع مسافات وعلامات - أو \')');
      return;
    }

    if (!validateNationalId(formData.nationalId)) {
      setError('الرقم القومي يجب أن يكون 14 رقمًا بالضبط');
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('رقم الهاتف يجب أن يحتوي على 10-15 رقمًا فقط (مثال: 01012345678)');
      return;
    }

    if (!formData.religion) {
      setError('يرجى اختيار الديانة');
      return;
    }
    if (!formData.nationality) {
      setError('يرجى اختيار الجنسية');
      return;
    }
    if (!formData.region || !formData.region.trim()) {
      setError('يرجى إدخال المنطقة');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن لا تقل عن 6 أحرف');
      return;
    }

    setLoading(true);
    try {
      await API.post('/users/check-civil-registry', {
        fullName: formData.fullName,
        nationalId: formData.nationalId,
        gender: formData.gender,
        religion: formData.religion,
        nationality: formData.nationality,
        region: formData.region
      });
      setStep(2);
    } catch (err) {
      const message = err.response?.data?.message || 'حدث خطأ في التحقق من البيانات';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.agreeToTerms) {
      setError('يجب الموافقة على الشروط والأحكام');
      return;
    }

    setLoading(true);
    try {
      await API.post('/users/register', formData);
      setSuccess('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'حدث خطأ أثناء التسجيل';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const relationLabel = (rel) => ({
    father: 'أب', mother: 'أم', wife: 'زوجة', husband: 'زوج',
    son: 'ابن', daughter: 'ابنة', brother: 'أخ', sister: 'أخت', uncle: 'عم'
  }[rel] || rel);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans py-8" dir="rtl">
      <div className="w-full max-w-2xl px-6">
        <h1 className="text-2xl font-semibold text-center text-gray-800">إنشاء حساب جديد</h1>
        <p className="text-center text-gray-400 mt-2 mb-8">مرحباً! انضم إلينا وأدخل بيانات عائلتك.</p>

        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm flex items-center gap-2">
            <span>✅</span><span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold">المعلومات الأساسية</h2>

              <div>
                <label className="block text-sm text-gray-600 mb-1">الاسم بالكامل <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    className="w-full border rounded-lg py-3 pr-10 pl-3 outline-none focus:border-blue-600"
                    placeholder="أدخل اسمك بالكامل (حروف فقط)" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">الجنس <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleChange} />
                    <span>ذكر</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleChange} />
                    <span>أنثى</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">الديانة <span className="text-red-500">*</span></label>
                <select name="religion" value={formData.religion} onChange={handleChange}
                  className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-600" required>
                  <option value="">اختر الديانة</option>
                  <option value="مسلم">مسلم</option>
                  <option value="مسيحي">مسيحي</option>
                  <option value="يهودي">يهودي</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">الجنسية <span className="text-red-500">*</span></label>
                <select name="nationality" value={formData.nationality} onChange={handleChange}
                  className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-600" required>
                  <option value="مصري">مصري</option>
                  <option value="اجنبي">اجنبي</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">المنطقة <span className="text-red-500">*</span></label>
                <input type="text" name="region" value={formData.region} onChange={handleChange}
                  className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-600"
                  placeholder="أدخل المنطقة" required />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">الرقم القومي <span className="text-red-500">*</span></label>
                <input type="text" name="nationalId" value={formData.nationalId} onChange={handleChange}
                  className="w-full border rounded-lg py-3 px-3 outline-none focus:border-blue-600"
                  placeholder="أدخل الرقم القومي 14 رقم" maxLength="14" pattern="\d*" required />
                <p className="text-xs text-gray-500 mt-1">يجب أن يكون 14 رقمًا فقط</p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">رقم الهاتف <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                    className="w-full border rounded-lg py-3 pr-10 pl-3 outline-none focus:border-blue-600"
                    placeholder="مثال: 01012345678" required />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">📞</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">يجب أن يحتوي على 10-15 رقمًا فقط (مثال: 01012345678)</p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">كلمة المرور <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="password" name="password" value={formData.password} onChange={handleChange}
                    className="w-full border rounded-lg py-3 pr-10 pl-10 outline-none focus:border-blue-600"
                    placeholder="أدخل كلمة المرور" minLength="6" required />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔑</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    className="w-full border rounded-lg py-3 pr-10 pl-10 outline-none focus:border-blue-600"
                    placeholder="أعد إدخال كلمة المرور" required />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔑</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="button" onClick={handleNextStep} disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>جاري التحقق...</>
                  ) : 'التالي ←'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">أفراد العائلة (اختياري)</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium mb-3">إضافة فرد جديد</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" name="fullName" placeholder="الاسم الكامل (حروف فقط)"
                    value={currentFamilyMember.fullName} onChange={handleFamilyMemberChange}
                    className="border rounded-lg px-3 py-2" />
                  <input type="text" name="nationalId" placeholder="الرقم القومي 14 رقم"
                    value={currentFamilyMember.nationalId} onChange={handleFamilyMemberChange}
                    className="border rounded-lg px-3 py-2" maxLength="14" pattern="\d*" />
                  <select name="gender" value={currentFamilyMember.gender} onChange={handleFamilyMemberChange}
                    className="border rounded-lg px-3 py-2">
                    <option value="">الجنس</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                  <select name="religion" value={currentFamilyMember.religion} onChange={handleFamilyMemberChange}
                    className="border rounded-lg px-3 py-2">
                    <option value="">الديانة</option>
                    <option value="مسلم">مسلم</option>
                    <option value="مسيحي">مسيحي</option>
                    <option value="يهودي">يهودي</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                  <input type="text" name="region" placeholder="المنطقة"
                    value={currentFamilyMember.region} onChange={handleFamilyMemberChange}
                    className="border rounded-lg px-3 py-2" />
                  <select name="relationType" value={currentFamilyMember.relationType} onChange={handleFamilyMemberChange}
                    className="border rounded-lg px-3 py-2">
                    <option value="">صلة القرابة</option>
                    <option value="father">أب</option>
                    <option value="mother">أم</option>
                    <option value="wife">زوجة</option>
                    <option value="husband">زوج</option>
                    <option value="son">ابن</option>
                    <option value="daughter">ابنة</option>
                    <option value="brother">أخ</option>
                    <option value="sister">أخت</option>
                    <option value="uncle">عم</option>
                  </select>
                  <input type="tel" name="phoneNumber" placeholder="رقم الهاتف (مثال: 01012345678)"
                    value={currentFamilyMember.phoneNumber} onChange={handleFamilyMemberChange}
                    className="border rounded-lg px-3 py-2" />
                </div>
                <button type="button" onClick={addFamilyMember} disabled={loading}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-70">
                  {loading ? 'جاري التحقق...' : '+ إضافة'}
                </button>
              </div>

              {formData.familyMembers.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">أفراد العائلة المضافون:</h3>
                  <div className="space-y-2">
                    {formData.familyMembers.map((member, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div>
                          <p className="font-medium">{member.fullName}</p>
                          <p className="text-sm text-gray-500">
                            {relationLabel(member.relationType)} - {member.nationalId}
                            {member.region && ` - ${member.region}`}
                            {member.religion && ` - ${member.religion}`}
                          </p>
                        </div>
                        <button type="button" onClick={() => removeFamilyMember(index)} className="text-red-500 hover:text-red-700">حذف</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-6 text-sm">
                <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms}
                  onChange={handleChange} className="w-4 h-4" />
                <span>أوافق على{' '}<a href="#" className="text-blue-600 underline">الشروط والأحكام</a></span>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                  → السابق
                </button>
                <button type="submit" disabled={loading}
                  className={`${loading ? 'bg-blue-700' : 'bg-blue-900'} text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-70 flex items-center gap-2`}>
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>جاري الإنشاء...</>
                  ) : 'إنشاء حساب'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm mt-6 text-gray-600">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-blue-600 underline">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}