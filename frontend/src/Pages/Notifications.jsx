import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Notifications() {
const navigate = useNavigate();
const [notifications, setNotifications] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [unreadCount, setUnreadCount] = useState(0);
const [confirmLoading, setConfirmLoading] = useState(false);
const [userRole, setUserRole] = useState('user');

const getPaidTransactions = () => {
const paid = localStorage.getItem('paidTransactions');
return paid ? new Set(JSON.parse(paid)) : new Set();
};

const savePaidTransactions = (paidSet) => {
localStorage.setItem('paidTransactions', JSON.stringify([...paidSet]));
};

const [paidNotifications, setPaidNotifications] = useState(getPaidTransactions);

useEffect(() => {
fetchNotifications();
checkUserRole();
}, []);

const checkUserRole = async () => {
try {
const userStr = localStorage.getItem('user');
if (userStr) {
const user = JSON.parse(userStr);
console.log('📦 User from localStorage:', user);
if (user.role) {
    setUserRole(user.role);
    return;
}
}

const response = await API.get('/users/profile');

if (response.data.user) {
const userData = response.data.user;
setUserRole(userData.role || 'user');
localStorage.setItem('user', JSON.stringify(userData));
}
} catch (err) {
console.error('❌ Error checking user role:', err);
}
};

const fetchNotifications = async () => {
try {
setLoading(true);
const response = await API.get('/users/notifications');
console.log('📬 Notifications response:', response.data);
setNotifications(response.data.notifications);
setUnreadCount(response.data.unreadCount);
} catch (err) {
console.error('❌ Error fetching notifications:', err);
setError('حدث خطأ في تحميل الإشعارات');
} finally {
setLoading(false);
}
};

const markAsRead = async (notificationId) => {
try {
await API.put(`/users/notifications/${notificationId}/read`);
setNotifications(prev =>
prev.map(notif =>
    notif._id === notificationId ? { ...notif, isRead: true } : notif
)
);
setUnreadCount(prev => Math.max(0, prev - 1));
} catch (err) {
console.error('❌ Error marking notification as read:', err);
}
};

const markAllAsRead = async () => {
try {
await API.put('/users/notifications/read-all');
setNotifications(prev =>
prev.map(notif => ({ ...notif, isRead: true }))
);
setUnreadCount(0);
} catch (err) {
console.error('❌ Error marking all as read:', err);
}
};

const deleteNotification = async (notificationId) => {
if (!window.confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
return;
}

try {
await API.delete(`/users/notifications/${notificationId}`);

setNotifications(prev => prev.filter(n => n._id !== notificationId));

const deletedNotif = notifications.find(n => n._id === notificationId);
if (deletedNotif && !deletedNotif.isRead) {
setUnreadCount(prev => Math.max(0, prev - 1));
}

console.log('✅ Notification deleted');

} catch (err) {
console.error('❌ Error deleting notification:', err);
setError('حدث خطأ في حذف الإشعار');
}
};

const handleConfirmPayment = async (transactionId) => {
if (!window.confirm('هل أنت متأكد من استلام المبلغ؟')) {
return;
}

setConfirmLoading(true);
try {
const response = await API.put(`/transactions/${transactionId}/confirm`);

alert('✅ تم تأكيد استلام الدفع بنجاح');

const updatedPaid = new Set(paidNotifications).add(transactionId);
setPaidNotifications(updatedPaid);
savePaidTransactions(updatedPaid);

fetchNotifications();

} catch (err) {
console.error('❌ Error confirming payment:', err);
setError(err.response?.data?.message || 'حدث خطأ في تأكيد الدفع');
} finally {
setConfirmLoading(false);
}
};

const handlePayment = async (transactionId) => {
try {
navigate(`/paymentPage?transactionId=${transactionId}`);
} catch (err) {
console.error('Error handling payment:', err);
}
};

useEffect(() => {
const handlePaymentSuccess = () => {
const paidTransaction = localStorage.getItem('paidTransaction');
if (paidTransaction) {
const updatedPaid = new Set(paidNotifications).add(paidTransaction);
setPaidNotifications(updatedPaid);
savePaidTransactions(updatedPaid);
localStorage.removeItem('paidTransaction');
}
};

handlePaymentSuccess();
}, []);

const getNotificationIcon = (type, title) => {
if (title === 'تنفيذ الميراث') {
return '📜';
}
switch(type) {
case 'contract_approved':
return '✅';
case 'contract_rejected':
return '❌';
case 'reminder':
return '⏰';
case 'alert':
return '⚠️';
default:
return '📢';
}
};

const getNotificationColor = (type, title) => {
if (title === 'تنفيذ الميراث') {
return 'bg-purple-50 border-purple-200';
}
switch(type) {
case 'contract_approved':
return 'bg-green-50 border-green-200';
case 'contract_rejected':
return 'bg-red-50 border-red-200';
case 'reminder':
return 'bg-blue-50 border-blue-200';
case 'alert':
return 'bg-yellow-50 border-yellow-200';
default:
return 'bg-gray-50 border-gray-200';
}
};

const formatDate = (dateString) => {
const date = new Date(dateString);
const now = new Date();
const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

if (diffHours < 24) {
if (diffHours < 1) {
const diffMinutes = Math.floor((now - date) / (1000 * 60));
return `منذ ${diffMinutes} دقيقة`;
}
return `منذ ${diffHours} ساعة`;
} else {
return date.toLocaleDateString('ar-EG');
}
};

const handleViewContractDetails = (notification) => {
const contractId = notification.contractId._id || notification.contractId;

console.log('🎯 handleViewContractDetails called');
console.log('📋 User role:', userRole);
console.log('📄 Contract ID:', contractId);

if (userRole === 'admin') {
navigate('/admin/dashboard', { 
state: { 
    selectedContractId: contractId,
    openContractModal: true 
}
});
} else {
navigate(`/realEstate?contract=${contractId}`);
}
};


if (loading) {
return (
<div className="min-h-screen bg-gray-50 flex items-center justify-center">
<div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
    <p className="mt-4 text-gray-600">جاري تحميل الإشعارات...</p>
</div>
</div>
);
}

return (
<div className="min-h-screen bg-gray-50 py-8" dir="rtl">
<div className="max-w-4xl mx-auto px-4">
<div className="flex justify-between items-center mb-6">
    <div>
    <h1 className="text-2xl font-bold text-gray-800">الإشعارات</h1>
    <p className="text-gray-500 mt-1">
        {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : 'لا توجد إشعارات غير مقروءة'}
    </p>
    </div>
    {unreadCount > 0 && (
    <button
        onClick={markAllAsRead}
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
    >
        تحديد الكل كمقروء
    </button>
    )}
</div>

{error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
    {error}
    </div>
)}

{notifications.length === 0 ? (
    <div className="bg-white rounded-lg shadow p-8 text-center">
    <div className="text-6xl mb-4">🔔</div>
    <h3 className="text-xl font-medium text-gray-700 mb-2">لا توجد إشعارات</h3>
    <p className="text-gray-500">سيتم إشعارك عند حدوث أي تحديث على عقودك</p>
    </div>
) : (
    <div className="space-y-3">
    {notifications.map((notification) => {
        const transactionId = notification.data?.transactionId;
        const isPaid = paidNotifications.has(transactionId);
        const isInheritance = notification.title === 'تنفيذ الميراث';
        
        return (
        <div
            key={notification._id}
            className={`border rounded-lg p-4 transition-all hover:shadow-md ${
            getNotificationColor(notification.type, notification.title)
            } ${!notification.isRead ? 'border-r-4 border-r-blue-600' : ''}`}
            onClick={() => !notification.isRead && markAsRead(notification._id)}
        >
            <div className="flex items-start gap-3">
            <div className="text-2xl">
                {getNotificationIcon(notification.type, notification.title)}
            </div>

            <div className="flex-1">
                <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                    {notification.title}
                    {!notification.isRead && (
                        <span className="mr-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                    </h3>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    
                    {notification.data?.amount && (
                    <p className="text-sm text-green-600 font-bold mt-1">
                        المبلغ: {notification.data.amount.toLocaleString()} جنيه
                    </p>
                    )}
                    {notification.data?.sellerName && (
                    <p className="text-sm text-blue-600 mt-1">
                        البائع: {notification.data.sellerName}
                        {notification.data.sellerPhone && (
                        <span className="text-gray-500 mr-2">({notification.data.sellerPhone})</span>
                        )}
                    </p>
                    )}
                    
                    {notification.data?.paymentLink && !isPaid && (
                    <div className="mt-3">
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePayment(notification.data.transactionId);
                        }}
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
                        >
                        <span>💳</span>
                        إتمام الدفع الآن
                        </button>
                    </div>
                    )}
                    
                    {notification.data?.paymentLink && isPaid && (
                    <div className="mt-3">
                        <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm">
                        <span>✅</span>
                        تم الدفع مسبقاً
                        </span>
                    </div>
                    )}
                    
                    {notification.data?.transactionId && notification.title === 'تم الدفع' && (
                    <div className="mt-3">
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmPayment(notification.data.transactionId);
                        }}
                        disabled={confirmLoading}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
                        >
                        {confirmLoading ? (
                            <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            جاري التأكيد...
                            </>
                        ) : (
                            <>
                            <span>✅</span>
                            تم الاستلام
                            </>
                        )}
                        </button>
                    </div>
                    )}

                    {notification.contractId && !notification.data?.paymentLink && notification.title !== 'تم الدفع' && !isInheritance && (
                    <div className="mt-2">
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewContractDetails(notification);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                        >
                        عرض تفاصيل العقد ←
                        </button>
                    </div>
                    )}
                </div>

                <div className="flex items-center gap-2 mr-4">
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(notification.createdAt)}
                    </span>
                    <button
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                    }}
                    className="text-gray-400 hover:text-red-600 transition p-1"
                    title="حذف"
                    >
                    ✕
                    </button>
                </div>
                </div>
            </div>
            </div>
        </div>
        );
    })}
    </div>
)}
</div>
</div>
);
}