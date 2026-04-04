    import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import API from '../api';

    export default function Transactions() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, pending, paid, completed, cancelled

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
        setLoading(true);
        const response = await API.get('/transactions/my-transactions');
        console.log('📦 Transactions:', response.data);
        setTransactions(response.data.transactions || []);
        } catch (err) {
        console.error('❌ Error fetching transactions:', err);
        setError('حدث خطأ في تحميل المعاملات');
        if (err.response?.status === 401) {
            navigate('/login');
        }
        } finally {
        setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
        case 'pending':
            return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">⏳ في انتظار الدفع</span>;
        case 'paid':
            return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">💰 تم الدفع</span>;
        case 'completed':
            return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">✅ مكتملة</span>;
        case 'cancelled':
            return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">❌ ملغية</span>;
        default:
            return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">{status}</span>;
        }
    };

    const getPaymentMethodText = (method) => {
        switch(method) {
        case 'bank_transfer':
            return 'تحويل بنكي';
        case 'cash':
            return 'نقدي';
        default:
            return 'غير محدد';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
        });
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        return t.status === filter;
    });

    if (loading) {
        return (
        <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
            <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل المعاملات...</p>
            </div>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
        <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">المعاملات</h1>
            <p className="text-gray-500 mb-6">جميع عمليات البيع والشراء الخاصة بك</p>

            {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
            </div>
            )}

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
                filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                📋 الكل ({transactions.length})
            </button>
            <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
                filter === 'pending' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                ⏳ في انتظار الدفع ({transactions.filter(t => t.status === 'pending').length})
            </button>
            <button
                onClick={() => setFilter('paid')}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
                filter === 'paid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                💰 تم الدفع ({transactions.filter(t => t.status === 'paid').length})
            </button>
            <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
                filter === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                ✅ مكتملة ({transactions.filter(t => t.status === 'completed').length})
            </button>
            <button
                onClick={() => setFilter('cancelled')}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
                filter === 'cancelled' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                ❌ ملغية ({transactions.filter(t => t.status === 'cancelled').length})
            </button>
            </div>

            {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">لا توجد معاملات</h3>
                <p className="text-gray-500">لم تقم بأي عملية بيع أو شراء بعد</p>
            </div>
            ) : (
            <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                <div
                    key={transaction._id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {transaction.contractId?.propertyType || 'عقار'}
                        </h3>
                        {getStatusBadge(transaction.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-gray-500">رقم العقد:</span>
                            <span className="mr-2 font-medium text-gray-800">
                            {transaction.contractId?.contractNumber || 'غير محدد'}
                            </span>
                        </div>
                        
                        <div>
                            <span className="text-gray-500">تاريخ المعاملة:</span>
                            <span className="mr-2 font-medium text-gray-800">
                            {formatDate(transaction.createdAt)}
                            </span>
                        </div>
                        
                        <div>
                            <span className="text-gray-500">البائع:</span>
                            <span className="mr-2 font-medium text-gray-800">
                            {transaction.sellerId?.fullName || 'غير محدد'}
                            </span>
                        </div>
                        
                        <div>
                            <span className="text-gray-500">المشتري:</span>
                            <span className="mr-2 font-medium text-gray-800">
                            {transaction.buyerId?.fullName || 'غير محدد'}
                            </span>
                        </div>
                        
                        <div>
                            <span className="text-gray-500">طريقة الدفع:</span>
                            <span className="mr-2 font-medium text-gray-800">
                            {getPaymentMethodText(transaction.paymentMethod)}
                            </span>
                        </div>
                        
                        <div>
                            <span className="text-gray-500">الموقع:</span>
                            <span className="mr-2 font-medium text-gray-800">
                            {transaction.contractId?.governorate || 'غير محدد'}
                            </span>
                        </div>
                        </div>
                    </div>

                    <div className="md:text-left bg-gray-50 p-4 rounded-lg min-w-[200px]">
                        <p className="text-sm text-gray-500 mb-1">المبلغ</p>
                        <p className="text-2xl font-bold text-blue-800">
                        {transaction.totalAmount?.toLocaleString()} جنيه
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                        (شامل 300 جنيه رسوم)
                        </p>
                        
                        {transaction.paidAt && (
                        <p className="text-xs text-green-600 mt-2">
                            تم الدفع: {formatDate(transaction.paidAt)}
                        </p>
                        )}
                        {transaction.completedAt && (
                        <p className="text-xs text-green-600">
                            تم التأكيد: {formatDate(transaction.completedAt)}
                        </p>
                        )}
                    </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <button
                        onClick={() => navigate(`/realEstate?contract=${transaction.contractId?._id}`)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        عرض تفاصيل العقار ←
                    </button>
                    
                    {transaction.status === 'pending' && transaction.buyerId?._id === JSON.parse(localStorage.getItem('user'))?.id && (
                        <button
                        onClick={() => navigate(`/paymentPage?transactionId=${transaction._id}`)}
                        className="text-sm bg-green-600 text-white px-4 py-1 rounded-lg hover:bg-green-700 mr-auto"
                        >
                        إتمام الدفع
                        </button>
                    )}
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>
        </div>
    );
    }