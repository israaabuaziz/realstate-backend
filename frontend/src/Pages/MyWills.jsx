import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';

export default function MyWills() {
const navigate = useNavigate();
const [wills, setWills] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [selectedWill, setSelectedWill] = useState(null);
const [showDetails, setShowDetails] = useState(false);

useEffect(() => {
fetchWills();
}, []);

const fetchWills = async () => {
try {
    setLoading(true);
    const response = await API.get('/inheritance/wills');
    console.log('📬 Wills:', response.data);
    setWills(response.data.wills || []);
} catch (err) {
    console.error('Error fetching wills:', err);
    setError('حدث خطأ في تحميل الوصايا');
} finally {
    setLoading(false);
}
};

const getStatusBadge = (status) => {
switch (status) {
    case 'active':
    return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">✅ نشطة</span>;
    case 'executed':
    return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">📋 منفذة</span>;
    case 'cancelled':
    return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">❌ ملغية</span>;
    default:
    return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">{status}</span>;
}
};

const getReligionText = (religion) => {
return religion === 'muslim' ? '🕌 مسلم' : '✝️ مسيحى';
};

const getMethodText = (method) => {
return method === 'automatic' ? 'توزيع تلقائي' : 'توزيع يدوي';
};

if (loading) {
return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">جاري تحميل الوصايا...</p>
    </div>
    </div>
);
}

return (
<div className="min-h-screen bg-gray-50 py-8" dir="rtl">
    <div className="max-w-6xl mx-auto px-4">
    <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">الوصايا الخاصة بي</h1>
        <Link
        to="/willMethod"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
        + وصية جديدة
        </Link>
    </div>

    {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
        </div>
    )}

    {wills.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">📜</div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">لا توجد وصايا</h3>
        <p className="text-gray-500 mb-4">لم تقم بإنشاء أي وصية بعد</p>
        <Link
            to="/willMethod"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
            إنشاء وصية جديدة
        </Link>
        </div>
    ) : (
        <div className="space-y-4">
        {wills.map((will) => {
            console.log('عرض الوصية:', will._id, 'الورثة:', will.heirs);
            return (
            <div
                key={will._id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition"
            >
                <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold">وصية #{will._id.slice(-6)}</span>
                    {getStatusBadge(will.status)}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500">
                    <span>{getReligionText(will.religion)}</span>
                    <span>•</span>
                    <span>{getMethodText(will.distributionMethod)}</span>
                    <span>•</span>
                    <span>{new Date(will.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-600">عدد العقارات</p>
                    <p className="text-xl font-bold text-blue-800">{will.selectedProperties?.length || 0}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-600">إجمالي النسب</p>
                    <p className="text-xl font-bold text-purple-800">
                    {will.summary?.totalShares ? (will.summary.totalShares * 100).toFixed(1) : '100'}%
                    </p>
                </div>
                </div>

                <div className="border-t pt-4">


                <p className="font-semibold mb-2">العقارات:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {will.selectedProperties?.slice(0, 2).map((prop, idx) => (
                    <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                        {prop.propertyDisplay || 'عقار'}
                    </div>
                    ))}
                    {will.selectedProperties?.length > 2 && (
                    <p className="text-sm text-gray-500">+{will.selectedProperties.length - 2} آخرون</p>
                    )}
                </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                    onClick={() => {
                    setSelectedWill(will);
                    setShowDetails(true);
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                    عرض التفاصيل
                </button>
                </div>
            </div>
            );
        })}
        </div>
    )}
    </div>

    {showDetails && selectedWill && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">تفاصيل الوصية</h3>
            <button
            onClick={() => setShowDetails(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            >
            ✕
            </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
                <div>
                <p className="text-sm text-gray-500">الحالة</p>
                {getStatusBadge(selectedWill.status)}
                </div>
                <div>
                <p className="text-sm text-gray-500">تاريخ الإنشاء</p>
                <p className="font-medium">{new Date(selectedWill.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
                <div>
                <p className="text-sm text-gray-500">الديانة</p>
                <p className="font-medium">{getReligionText(selectedWill.religion)}</p>
                </div>
                <div>
                <p className="text-sm text-gray-500">طريقة التوزيع</p>
                <p className="font-medium">{getMethodText(selectedWill.distributionMethod)}</p>
                </div>
            </div>
            </div>



            <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">العقارات</h4>
            <div className="space-y-3">
                {selectedWill.selectedProperties?.map((prop, idx) => (
                <div key={idx} className="border-b border-green-100 pb-2">
                    <p className="font-medium">{prop.propertyDisplay}</p>
                    {prop.propertyDetails && (
                    <div className="text-sm text-gray-600 mt-1">
                        <p>📍 {prop.propertyDetails.location}</p>
                        <p>💰 {prop.propertyDetails.formattedPrice}</p>
                    </div>
                    )}
                </div>
                ))}
            </div>
            </div>

            {selectedWill.notes && (
            <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">ملاحظات</h4>
                <p className="text-gray-700">{selectedWill.notes}</p>
            </div>
            )}
        </div>

        <div className="mt-6 flex justify-end">
            <button
            onClick={() => setShowDetails(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
            إغلاق
            </button>
        </div>
        </div>
    </div>
    )}
</div>
);
}