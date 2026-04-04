import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import API from '../api';

export default function AdminDashboard() {
const navigate = useNavigate();
const location = useLocation();
const [stats, setStats] = useState(null);
const [pendingContracts, setPendingContracts] = useState([]);
const [recentContracts, setRecentContracts] = useState([]);
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);
const [initialLoad, setInitialLoad] = useState(true);
const [error, setError] = useState('');
const [successMessage, setSuccessMessage] = useState('');
const [activeTab, setActiveTab] = useState('dashboard');
const [selectedContract, setSelectedContract] = useState(null);
const [rejectionReason, setRejectionReason] = useState('');
const [showRejectModal, setShowRejectModal] = useState(false);
const [showContractModal, setShowContractModal] = useState(false);
const [showImageModal, setShowImageModal] = useState(false);
const [selectedImage, setSelectedImage] = useState(null);
const [statusLoading, setStatusLoading] = useState(false);

const [selectedUserFamily, setSelectedUserFamily] = useState([]);
const [showFamilyModal, setShowFamilyModal] = useState(false);
const [selectedUserForFamily, setSelectedUserForFamily] = useState(null);
const [familyLoading, setFamilyLoading] = useState(false);

const CACHE_KEY = 'admin_dashboard_cache';
const CACHE_DURATION = 5 * 60 * 1000;

const fetchDashboardData = useCallback(async (forceRefresh = false) => {
try {
setLoading(true);

if (!forceRefresh && !initialLoad) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('📦 Using cached data');
        setStats(data.statistics);
        setPendingContracts(data.pendingContracts || []);
        setRecentContracts(data.recentContracts || []);
        setUsers(data.users || []);
        setLoading(false);
        setInitialLoad(false);
        return;
    }
    }
}

const response = await API.get('/admin/dashboard');
console.log('Dashboard data:', response.data);

localStorage.setItem(CACHE_KEY, JSON.stringify({
    data: response.data,
    timestamp: Date.now()
}));

setStats(response.data.statistics);
setPendingContracts(response.data.pendingContracts || []);
setRecentContracts(response.data.recentContracts || []);
setUsers(response.data.users || []);
} catch (err) {
console.error('Error fetching dashboard:', err);
if (err.response?.status === 403) {
    navigate('/login');
}
} finally {
setLoading(false);
setInitialLoad(false);
}
}, [navigate, initialLoad]);

const fetchUserFamily = async (userId) => {
setFamilyLoading(true);
try {
const response = await API.get(`/admin/users/${userId}/family-members`);
setSelectedUserFamily(response.data.familyMembers);
} catch (err) {
console.error('Error fetching family members:', err);
setError('حدث خطأ في تحميل أفراد العائلة');
} finally {
setFamilyLoading(false);
}
};

const handleToggleFamilyMemberStatus = async (memberId, currentStatus) => {
try {
const response = await API.put(`/admin/family-members/${memberId}/status`, {
    isAlive: !currentStatus
});

setSelectedUserFamily(prev =>
    prev.map(member =>
    member._id === memberId ? { ...member, isAlive: !currentStatus } : member
    )
);

setSuccessMessage(`✅ تم تحديث حالة ${response.data.familyMember.fullName}`);
setTimeout(() => setSuccessMessage(''), 3000);
} catch (err) {
console.error('Error updating family member:', err);
setError('حدث خطأ في تحديث حالة فرد العائلة');
}
};

const handleShowFamily = (user) => {
setSelectedUserForFamily(user);
fetchUserFamily(user._id);
setShowFamilyModal(true);
};

useEffect(() => {
fetchDashboardData();
}, [fetchDashboardData]);

useEffect(() => {
if (location.state?.selectedContractId && location.state?.openContractModal) {
const contractId = location.state.selectedContractId;

let foundContract = pendingContracts.find(c => c._id === contractId);

if (!foundContract) {
    foundContract = recentContracts.find(c => c._id === contractId);
}

if (foundContract) {
    setSelectedContract(foundContract);
    setShowContractModal(true);
    
    window.history.replaceState({}, document.title);
}
}
}, [location.state, pendingContracts, recentContracts]);

const statsCards = useMemo(() => {
if (!stats) return [];
return [
{ icon: '📄', color: 'blue', label: 'إجمالي العقود', value: stats.totalContracts },
{ icon: '⏳', color: 'yellow', label: 'قيد المراجعة', value: stats.pendingContracts },
{ icon: '✅', color: 'green', label: 'مقبولة', value: stats.approvedContracts },
{ icon: '❌', color: 'red', label: 'مرفوضة', value: stats.rejectedContracts }
];
}, [stats]);

const userStatsCards = useMemo(() => {
if (!stats) return [];
return [
{ icon: '👥', color: 'purple', label: 'إجمالي المستخدمين', value: stats.totalUsers },
{ icon: '✅', color: 'green', label: 'المستخدمين النشطين', value: stats.activeUsers, percentage: stats.activePercentage },
{ icon: '⚠️', color: 'yellow', label: 'المستخدمين الغير نشطين', value: stats.inactiveUsers, percentage: stats.inactivePercentage }
];
}, [stats]);

const handleAcceptContract = async (contractId) => {
try {
await API.put(`/admin/contracts/${contractId}/accept`, {
    notes: 'تم الموافقة على العقد'
});

setSuccessMessage(`✅ تم قبول العقد بنجاح`);
fetchDashboardData(true); 

setTimeout(() => setSuccessMessage(''), 3000);
} catch (err) {
console.error('Error accepting contract:', err);
setError('حدث خطأ في قبول العقد');
}
};

const handleRejectContract = async () => {
if (!rejectionReason.trim()) {
setError('يرجى إدخال سبب الرفض');
return;
}

try {
await API.put(`/admin/contracts/${selectedContract._id}/reject`, {
    reason: rejectionReason
});

setSuccessMessage(`✅ تم رفض العقد بنجاح`);
setShowRejectModal(false);
setSelectedContract(null);
setRejectionReason('');
fetchDashboardData(true);

setTimeout(() => setSuccessMessage(''), 3000);
} catch (err) {
console.error('Error rejecting contract:', err);
setError('حدث خطأ في رفض العقد');
}
};

const handleDeleteInactiveUsers = async () => {
if (!window.confirm('هل أنت متأكد من حذف المستخدمين الغير نشطين (أكثر من 30 يوم)؟')) {
return;
}

try {
const response = await API.delete('/admin/delete-inactive-users');
setSuccessMessage(`✅ تم حذف ${response.data.deletedCount} مستخدم غير نشط`);
fetchDashboardData(true);

setTimeout(() => setSuccessMessage(''), 3000);
} catch (err) {
console.error('Error deleting inactive users:', err);
setError('حدث خطأ في حذف المستخدمين');
}
};

const handleDeleteUser = async (userId, userName) => {
if (!window.confirm(`هل أنت متأكد من حذف المستخدم ${userName} وجميع عقوده؟`)) {
return;
}

try {
await API.delete(`/admin/user/${userId}`);
setSuccessMessage(`✅ تم حذف المستخدم بنجاح`);
fetchDashboardData(true);

setTimeout(() => setSuccessMessage(''), 3000);
} catch (err) {
console.error('Error deleting user:', err);
setError('حدث خطأ في حذف المستخدم');
}
};

const handleToggleUserStatus = async (userId, currentStatus) => {
setStatusLoading(true);
try {
const newStatus = !currentStatus;
await API.put(`/admin/user/${userId}/status`, { isALive: newStatus });

setSuccessMessage(`✅ تم تغيير حالة المستخدم إلى ${newStatus ? 'نشط' : 'غير نشط'}`);
fetchDashboardData(true);

setTimeout(() => setSuccessMessage(''), 3000);
} catch (err) {
console.error('Error toggling user status:', err);
setError('حدث خطأ في تغيير حالة المستخدم');
} finally {
setStatusLoading(false);
}
};

const handleViewContract = (contract) => {
setSelectedContract(contract);
setShowContractModal(true);
};

const handleViewImage = (contractImage) => {
setSelectedImage(contractImage);
setShowImageModal(true);
};

const handleShowRejectModal = (contract) => {
setSelectedContract(contract);
setShowRejectModal(true);
};

const getStatusBadge = (status) => {
const badges = {
pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'قيد المراجعة' },
approved: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'مقبول' },
rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'مرفوض' },
completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🏆', label: 'مكتمل' }
};

const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '', label: status };

return (
<span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-sm font-medium`}>
    {badge.icon} {badge.label}
</span>
);
};

const getLiveStatusBadge = (isALive) => {
return isALive ? (
<span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">نشط</span>
) : (
<span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">غير نشط</span>
);
};

const getRelationTypeArabic = (relation) => {
const relations = {
father: 'أب',
mother: 'أم',
wife: 'زوجة',
husband: 'زوج',
son: 'ابن',
daughter: 'ابنة',
brother: 'أخ',
sister: 'أخت',
uncle: 'عم'
};
return relations[relation] || relation;
};

const SkeletonLoader = () => (
<div className="min-h-screen bg-gray-100" dir="rtl">
<div className="bg-white shadow">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center py-6">
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <div className="bg-gray-200 h-10 w-40 animate-pulse rounded-lg"></div>
    </div>
    <div className="flex space-x-8 space-x-reverse border-b">
        {[1,2,3].map(i => (
        <div key={i} className="pb-4 px-1">
            <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
        </div>
        ))}
    </div>
    </div>
</div>

<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {[1,2,3,4].map(i => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
            <div className="bg-gray-200 rounded-full p-3 ml-4 w-12 h-12 animate-pulse"></div>
            <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
        </div>
        </div>
    ))}
    </div>
</div>
</div>
);

if (loading && initialLoad) {
return <SkeletonLoader />;
}

return (
<div className="min-h-screen bg-gray-100" dir="rtl">
<div className="bg-white shadow">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center py-6">
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <button
        onClick={handleDeleteInactiveUsers}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
        >
        <span>🗑️</span>
        حذف المستخدمين الغير نشطين
        </button>
    </div>

    <div className="flex space-x-8 space-x-reverse border-b">
        <button
        onClick={() => setActiveTab('dashboard')}
        className={`pb-4 px-1 ${activeTab === 'dashboard' ? 'border-b-2 border-blue-900 text-blue-900 font-medium' : 'text-gray-500'}`}
        >
        الرئيسية
        </button>
        <button
        onClick={() => setActiveTab('contracts')}
        className={`pb-4 px-1 ${activeTab === 'contracts' ? 'border-b-2 border-blue-900 text-blue-900 font-medium' : 'text-gray-500'}`}
        >
        العقود {pendingContracts.length > 0 && `(${pendingContracts.length} جديدة)`}
        </button>
        <button
        onClick={() => setActiveTab('users')}
        className={`pb-4 px-1 ${activeTab === 'users' ? 'border-b-2 border-blue-900 text-blue-900 font-medium' : 'text-gray-500'}`}
        >
        المستخدمين
        </button>
    </div>
    </div>
</div>

<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    {error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
        <span className="ml-2 text-xl">❌</span>
        <span>{error}</span>
        <button onClick={() => setError('')} className="mr-auto text-red-700">✕</button>
    </div>
    )}

    {successMessage && (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center">
        <span className="ml-2 text-xl">✅</span>
        <span>{successMessage}</span>
    </div>
    )}
</div>

<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {activeTab === 'dashboard' && (
    <div className="space-y-6">
        {stats && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {statsCards.map((card, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className={`bg-${card.color}-100 rounded-full p-3 ml-4`}>
                    <span className={`text-${card.color}-600 text-2xl`}>{card.icon}</span>
                    </div>
                    <div>
                    <p className="text-sm text-gray-600">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    </div>
                </div>
                </div>
            ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userStatsCards.map((card, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className={`bg-${card.color}-100 rounded-full p-3 ml-4`}>
                    <span className={`text-${card.color}-600 text-2xl`}>{card.icon}</span>
                    </div>
                    <div>
                    <p className="text-sm text-gray-600">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    {card.percentage && (
                        <p className="text-xs text-gray-500">{card.percentage}%</p>
                    )}
                    </div>
                </div>
                </div>
            ))}
            </div>
        </>
        )}

        {pendingContracts.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
            <h2 className="text-xl font-semibold text-yellow-800 flex items-center gap-2">
                <span>⏳</span>
                عقود في انتظار المراجعة ({pendingContracts.length})
            </h2>
            </div>
            <div className="divide-y divide-gray-200">
            {pendingContracts.map((contract) => (
                <div key={contract._id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                        <span className="font-bold text-blue-900">{contract.contractNumber}</span>
                        {getStatusBadge(contract.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                        <span className="text-gray-500">المالك:</span>
                        <span className="mr-2 font-medium">{contract.fullName}</span>
                        </div>
                        <div>
                        <span className="text-gray-500">نوع العقار:</span>
                        <span className="mr-2 font-medium">{contract.propertyType}</span>
                        </div>
                        <div>
                        <span className="text-gray-500">السعر:</span>
                        <span className="mr-2 font-medium">{contract.formattedPrice}</span>
                        </div>
                        <div>
                        <span className="text-gray-500">المساحة:</span>
                        <span className="mr-2 font-medium">
                            {contract.isZamamContract 
                                ? `${contract.zamamShare} فدان` 
                                : contract.formattedArea
                            }
                        </span>
                        </div>
                        {contract.isZamamContract && contract.zamamId && (
                            <div className="col-span-2">
                                <span className="text-gray-500">نسبة الزمام:</span>
                                <span className="mr-2 font-medium text-green-700">
                                    {((contract.zamamShare / contract.zamamId.totalArea) * 100).toFixed(2)}%
                                    {' '}من زمام {contract.zamamId.zamamNumber} 
                                    {' '}(إجمالي {contract.zamamId.totalArea} فدان)
                                </span>
                            </div>
                        )}
                    </div>
                    {contract.contractImage && (
                        <div className="mt-2">
                        <button
                            onClick={(e) => {
                            e.stopPropagation();
                            handleViewImage(contract.contractImage);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            <span>📷</span>
                            عرض صورة العقد
                        </button>
                        </div>
                    )}
                    </div>
                    <div className="flex gap-2 mr-4">
                    <button
                        onClick={() => handleViewContract(contract)}
                        className="px-3 py-1 text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg text-sm"
                    >
                        عرض
                    </button>
                    <button
                        onClick={() => handleAcceptContract(contract._id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                        قبول
                    </button>
                    <button
                        onClick={() => handleShowRejectModal(contract)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                        رفض
                    </button>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>
        )}
    </div>
    )}

    {activeTab === 'contracts' && (
    <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">جميع العقود</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم العقد</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المالك</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع العقار</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">صورة العقد</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {recentContracts.map((contract) => (
                <tr key={contract._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{contract.contractNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{contract.userId?.fullName || 'غير معروف'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{contract.propertyType}</td>
                <td className="px-6 py-4 whitespace-nowrap">{contract.formattedPrice}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(contract.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {contract.contractImage ? (
                    <button
                        onClick={() => handleViewImage(contract.contractImage)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        عرض الصورة
                    </button>
                    ) : (
                    <span className="text-gray-400 text-sm">لا توجد</span>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(contract.createdAt).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <button
                    onClick={() => handleViewContract(contract)}
                    className="text-blue-600 hover:text-blue-900 ml-3"
                    >
                    عرض
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </div>
    )}

    {activeTab === 'users' && (
    <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">المستخدمين</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الهاتف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم القومي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد العقود</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">آخر نشاط</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">حالة النشاط</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">حالة الحياة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
                return (
                <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{user.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.nationalId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.contractCount || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(user.lastActivity).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    {getLiveStatusBadge(user.isALive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={user.isALive}
                            onChange={() => handleToggleUserStatus(user._id, user.isALive)}
                            disabled={statusLoading}
                        />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                            user.isALive ? 'peer-checked:bg-green-600' : 'peer-checked:bg-red-600'
                        }`}></div>
                        <span className="mr-3 text-sm font-medium text-gray-900">
                            {user.isALive ? 'نشط' : 'غير نشط'}
                        </span>
                        </label>
                    </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <button
                        onClick={() => handleShowFamily(user)}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                        العائلة
                        </button>
                        <button
                        onClick={() => handleDeleteUser(user._id, user.fullName)}
                        className="text-red-600 hover:text-red-900 text-xs"
                        >
                        حذف
                        </button>
                    </div>
                    </td>
                </tr>
                );
            })}
            </tbody>
        </table>
        </div>
    </div>
    )}
</div>

{showFamilyModal && selectedUserForFamily && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">
            أفراد عائلة {selectedUserForFamily.fullName}
        </h3>
        <button
            onClick={() => setShowFamilyModal(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
        >
            ✕
        </button>
        </div>
        
        {familyLoading ? (
        <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
        </div>
        ) : selectedUserFamily.length === 0 ? (
        <p className="text-gray-500 text-center py-8">لا يوجد أفراد عائلة</p>
        ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedUserFamily.map((member) => (
            <div key={member._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                <div>
                    <p className="font-semibold">{member.fullName}</p>
                    <p className="text-sm text-gray-500">
                    {getRelationTypeArabic(member.relationType)} - {member.nationalId}
                    {member.phoneNumber && ` - ${member.phoneNumber}`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                    member.isAlive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                    {member.isAlive ? 'حي' : 'متوفى'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={member.isAlive}
                        onChange={() => handleToggleFamilyMemberStatus(member._id, member.isAlive)}
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                        member.isAlive ? 'peer-checked:bg-green-600' : 'peer-checked:bg-red-600'
                    }`}></div>
                    </label>
                </div>
                </div>
            </div>
            ))}
        </div>
        )}
    </div>
    </div>
)}

{showContractModal && selectedContract && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">تفاصيل العقد</h3>
        <button
            onClick={() => setShowContractModal(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
        >
            ✕
        </button>
        </div>
        
        <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">رقم العقد: <span className="font-bold text-blue-900">{selectedContract.contractNumber}</span></p>
            <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">الحالة:</span>
            {getStatusBadge(selectedContract.status)}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
            <p className="text-sm text-gray-500">المالك</p>
            <p className="font-medium">{selectedContract.fullName}</p>
            </div>
            <div>
            <p className="text-sm text-gray-500">رقم الهاتف</p>
            <p className="font-medium">{selectedContract.phoneNumber}</p>
            </div>
            <div>
            <p className="text-sm text-gray-500">الرقم القومي</p>
            <p className="font-medium">{selectedContract.nationalId}</p>
            </div>
            <div>
            <p className="text-sm text-gray-500">رقم العقار</p>
            <p className="font-medium">{selectedContract.propertyNumber}</p>
            </div>
            <div>
            <p className="text-sm text-gray-500">نوع العقار</p>
            <p className="font-medium">{selectedContract.propertyType}</p>
            </div>
            <div>
            <p className="text-sm text-gray-500">نسبة الملكية</p>
            <p className="font-medium">{selectedContract.ownershipPercentage}%</p>
            </div>
            <div>
            <p className="text-sm text-gray-500">السعر</p>
            <p className="font-medium">{selectedContract.formattedPrice}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">المساحة</p>
                <p className="font-medium">
                    {selectedContract.isZamamContract
                        ? `${selectedContract.zamamShare} فدان`
                        : selectedContract.formattedArea
                    }
                </p>
            </div>

            {selectedContract.isZamamContract && selectedContract.zamamId && (
                <div>
                    <p className="text-sm text-gray-500">تفاصيل الزمام</p>
                    <p className="font-medium">رقم الزمام: {selectedContract.zamamId.zamamNumber}</p>
                    <p className="font-medium text-green-700">
                        النسبة: {((selectedContract.zamamShare / selectedContract.zamamId.totalArea) * 100).toFixed(2)}%
                        {' '}من إجمالي {selectedContract.zamamId.totalArea} فدان
                    </p>
                    <p className="text-sm text-gray-500">
                        المتبقي: {(selectedContract.zamamId.totalArea - (selectedContract.zamamId.ownedArea / 100 * selectedContract.zamamId.totalArea)).toFixed(2)} فدان
                    </p>
                </div>
            )}
        </div>

        <div>
            <p className="text-sm text-gray-500">العنوان</p>
            <p className="font-medium">{selectedContract.address}</p>
            <p className="text-sm text-gray-600">المحافظة: {selectedContract.governorate}</p>
        </div>

        {selectedContract.floor && (
            <div>
            <p className="text-sm text-gray-500">الطابق</p>
            <p className="font-medium">{selectedContract.floor}</p>
            </div>
        )}

        {selectedContract.notes && (
            <div>
            <p className="text-sm text-gray-500">ملاحظات</p>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedContract.notes}</p>
            </div>
        )}

        {selectedContract.contractImage && (
            <div>
            <p className="text-sm text-gray-500 mb-2">صورة العقد</p>
            <div 
                className="cursor-pointer"
                onClick={() => handleViewImage(selectedContract.contractImage)}
            >
                <img 
                src={selectedContract.contractImage} 
                alt="Contract" 
                className="max-w-full h-48 object-contain rounded-lg border mx-auto hover:opacity-90 transition"
                />
                <p className="text-center text-sm text-blue-600 mt-1">اضغط للتكبير</p>
            </div>
            </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
            {selectedContract.status === 'pending' && (
            <>
                <button
                onClick={() => {
                    handleAcceptContract(selectedContract._id);
                    setShowContractModal(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                قبول
                </button>
                <button
                onClick={() => {
                    setShowContractModal(false);
                    handleShowRejectModal(selectedContract);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                رفض
                </button>
            </>
            )}
            <button
            onClick={() => setShowContractModal(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
            إغلاق
            </button>
        </div>
        </div>
    </div>
    </div>
)}

{showImageModal && selectedImage && (
    <div 
    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
    onClick={() => setShowImageModal(false)}
    >
    <div className="relative max-w-5xl max-h-full">
        <button
        onClick={() => setShowImageModal(false)}
        className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition z-10"
        >
        إغلاق ✕
        </button>
        <img 
        src={selectedImage} 
        alt="Contract Large" 
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
    </div>
    </div>
)}

{showRejectModal && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">رفض العقد</h3>
        
        <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
            سبب الرفض
        </label>
        <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows="4"
            className="w-full border rounded-lg p-3 focus:outline-none focus:border-blue-800"
            placeholder="اكتب سبب رفض العقد..."
        />
        </div>

        <div className="flex justify-end gap-3">
        <button
            onClick={() => {
            setShowRejectModal(false);
            setSelectedContract(null);
            setRejectionReason('');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
            إلغاء
        </button>
        <button
            onClick={handleRejectContract}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
            تأكيد الرفض
        </button>
        </div>
    </div>
    </div>
)}
</div>
);
}