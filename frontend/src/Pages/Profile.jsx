import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext'
import API from '../api'

export default function Profile() {
  const [tab, setTab] = useState("profile");
  const [userData, setUserData] = useState({
    fullName: "",
    phoneNumber: "",
    nationalId: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [notifications, setNotifications] = useState({
    appNotifications: true,
    smsNotifications: false
  });
  
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (user) {
          setUserData(prev => ({
            ...prev,
            fullName: user.fullName || "",
            phoneNumber: user.phoneNumber || "",
            nationalId: user.nationalId || ""
          }));
        }

        const response = await API.get('/users/profile');

        if (response.data.user) {
          setUserData(prev => ({
            ...prev,
            fullName: response.data.user.fullName || "",
            phoneNumber: response.data.user.phoneNumber || "",
            nationalId: response.data.user.nationalId || ""
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
        }
      }
    };

    fetchUserProfile();
  }, [user, navigate, logout]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationToggle = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleUpdateProfile = async () => {
    if (!userData.fullName.trim()) {
      setMessage({ type: "error", text: "الاسم الكامل مطلوب" });
      return;
    }

    if (userData.phoneNumber.trim() && !/^[0-9]{10,15}$/.test(userData.phoneNumber.trim())) {
      setMessage({ type: "error", text: "رقم الهاتف غير صحيح." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await API.put('/users/update-profile', {
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber.trim()
      });

      updateUser({
        fullName: response.data.user.fullName,
        phoneNumber: response.data.user.phoneNumber
      });

      setMessage({ type: "success", text: response.data.message || "تم تحديث البيانات بنجاح" });
      
      setUserData(prev => ({
        ...prev,
        fullName: response.data.user.fullName || "",
        phoneNumber: response.data.user.phoneNumber || "",
        nationalId: response.data.user.nationalId || ""
      }));
      
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "حدث خطأ أثناء تحديث البيانات" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = userData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "جميع الحقول مطلوبة" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "كلمة المرور غير متطابقة" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await API.put('/users/change-password', {
        currentPassword,
        newPassword
      });

      setMessage({ type: "success", text: "تم تغيير كلمة المرور بنجاح" });
      setUserData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error('Change password error:', error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "حدث خطأ أثناء تغيير كلمة المرور" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await API.put('/users/update-notifications', {
        notifications
      });

      setMessage({ type: "success", text: "تم تحديث الإشعارات بنجاح" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error('Update notifications error:', error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "حدث خطأ أثناء تحديث الإشعارات" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setUserData(prev => ({
        ...prev,
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        nationalId: user.nationalId || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    }
    setMessage({ type: "", text: "" });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitial = () => {
    return userData.fullName ? userData.fullName.charAt(0) : "أ";
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f6f7fb] flex justify-center py-4 sm:py-6 md:py-10 px-4 sm:px-6">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-4 sm:gap-6">

        <div className="w-full lg:w-[260px] space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="w-12 h-12 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg sm:text-base">
              {getInitial()}
            </div>
            <p className="font-bold text-sm sm:text-base">أهلاً, {userData.fullName}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 text-sm space-y-3">
            <p className="font-bold mb-2 text-sm sm:text-base">إعدادات الحساب</p>
            <p 
              className="text-gray-600 text-sm sm:text-base cursor-pointer hover:text-blue-600 transition"
              onClick={() => navigate('/realEstate')} >
            عقاراتي
            </p>
            <p 
              className="text-gray-600 text-sm sm:text-base cursor-pointer hover:text-blue-600 transition"
              onClick={() => navigate('/transactions')} >
            معاملات
            </p>
              <p 
              className="text-gray-600 text-sm sm:text-base cursor-pointer hover:text-blue-600 transition"
              onClick={() => navigate('/my-wills')} >
            الوصية
            </p>
            <p 
              className="text-gray-600 text-sm sm:text-base cursor-pointer hover:text-blue-600 transition"
              onClick={() => navigate('/notifications')} >
            إشعارات
            </p>
            <p className="text-red-500 text-sm sm:text-base cursor-pointer">مساعدة</p>
            <p 
              className="text-gray-600 text-sm sm:text-base cursor-pointer hover:text-red-500"
              onClick={handleLogout}
            >
              تسجيل الخروج
            </p>
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">إعدادات الحساب</h1>
          <p className="text-sm text-gray-500 mb-4 sm:mb-6">
            يمكنك تعديل بياناتك الشخصية وإعدادات الحساب
          </p>

          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === "success" 
                ? "bg-green-50 text-green-600 border border-green-200" 
                : "bg-red-50 text-red-600 border border-red-200"
            }`}>
              <div className="flex items-center gap-2">
                <span>{message.type === "success" ? "✅" : "⚠️"}</span>
                <span>{message.text}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 mb-4 sm:mb-6">
            {[
              { id: "profile", label: "البيانات الشخصية" },
              { id: "security", label: "الأمان" },
              { id: "notifications", label: "الإشعارات" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`px-4 py-2 sm:px-5 sm:py-2 rounded-full text-sm border flex-shrink-0
                  ${
                    tab === item.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600"
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8 w-full">

            {tab === "security" && (
              <>
                <h2 className="font-bold mb-4 sm:mb-6">الأمان</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="password"
                    name="currentPassword"
                    value={userData.currentPassword}
                    onChange={handleInputChange}
                    className="input w-full p-3 border rounded-lg" 
                    placeholder="كلمة المرور الحالية" 
                  />
                  <input 
                    type="password"
                    name="newPassword"
                    value={userData.newPassword}
                    onChange={handleInputChange}
                    className="input w-full p-3 border rounded-lg" 
                    placeholder="كلمة المرور الجديدة" 
                  />
                  <input 
                    type="password"
                    name="confirmPassword"
                    value={userData.confirmPassword}
                    onChange={handleInputChange}
                    className="input w-full p-3 border rounded-lg sm:col-span-2" 
                    placeholder="تأكيد كلمة المرور" 
                  />
                </div>
              </>
            )}

            {tab === "profile" && (
              <>
                <h2 className="font-bold mb-4 sm:mb-6">البيانات الشخصية</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="text"
                    name="fullName"
                    value={userData.fullName}
                    onChange={handleInputChange}
                    className="input w-full p-3 border rounded-lg" 
                    placeholder="الاسم الكامل" 
                  />
                  <input 
                    type="text"
                    name="phoneNumber"
                    value={userData.phoneNumber}
                    onChange={handleInputChange}
                    className="input w-full p-3 border rounded-lg bg-gray-50" 
                    placeholder="رقم الهاتف" 
                  />
                  <input 
                    type="text"
                    name="nationalId"
                    value={userData.nationalId}
                    readOnly
                    className="input w-full p-3 border rounded-lg sm:col-span-2 bg-gray-50" 
                    placeholder="الرقم القومي" 
                  />
                </div>
              </>
            )}

            {tab === "notifications" && (
              <>
                <h2 className="font-bold mb-4 sm:mb-6">الإشعارات</h2>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between p-3 sm:p-0">
                    <span className="text-sm sm:text-base">الإشعارات على التطبيق</span>
                    <div 
                      className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full cursor-pointer transition-all ${
                        notifications.appNotifications ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      onClick={() => handleNotificationToggle('appNotifications')}
                    >
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white transform transition-transform ${
                        notifications.appNotifications ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                      }`} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-0">
                    <span className="text-sm sm:text-base">رسائل SMS</span>
                    <div 
                      className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full cursor-pointer transition-all ${
                        notifications.smsNotifications ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      onClick={() => handleNotificationToggle('smsNotifications')}
                    >
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white transform transition-transform ${
                        notifications.smsNotifications ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                      }`} />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => {
                  if (tab === "profile") handleUpdateProfile();
                  else if (tab === "security") handleChangePassword();
                  else if (tab === "notifications") handleUpdateNotifications();
                }}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 sm:px-8 sm:py-2 rounded w-full sm:w-auto cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : "حفظ التغييرات"}
              </button>
              <button 
                onClick={handleCancel}
                className="border px-6 py-3 sm:px-8 sm:py-2 rounded text-gray-600 w-full sm:w-auto cursor-pointer hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
