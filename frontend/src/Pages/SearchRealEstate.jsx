import React, { useState } from 'react';
import API from '../api';

export default function SearchRealEstate() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('card'); 

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('يرجى إدخال رقم الكارت أو رقم العقار');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      console.log('🔍 Searching for:', searchTerm);
      
      const response = await API.get(`/search/search?q=${searchTerm}`);
      
      console.log('✅ Search response:', response.data);

      if (response.data.results && response.data.results.length > 0) {
        if (response.data.results.length === 1) {
          setResults(response.data.results[0]);
        } else {
          setResults(response.data.results[0]);
          console.log(`تم العثور على ${response.data.results.length} نتائج`);
        }
      } else {
        setError('لا توجد نتائج للبحث');
      }
    } catch (err) {
      console.error('❌ Search error:', err);
      
      if (err.response?.status === 404) {
        setError('لا توجد نتائج للبحث');
      } else {
        setError(err.response?.data?.message || 'حدث خطأ في البحث');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">قيد المراجعة</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">تم الموافقة</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">مرفوض</span>;
      case 'completed':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">مكتمل</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20" dir="rtl">
      <div className="max-w-6xl mx-auto px-6">
        
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          الاستعلام عن الكارت أو عقار
        </h1>
        <p className="text-gray-400 mb-10">
          أدخل رقم الكارت أو رقم العقار لمعرفة المالك والمعاملات
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <span className="ml-2 text-xl">❌</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 items-center">
          <input   
            className="flex-1 border rounded-lg py-4 px-4 bg-gray-100 outline-none focus:border-blue-800 focus:bg-white transition" 
            placeholder="أدخل رقم الكارت هنا..."  
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}  
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button   
            className={`bg-blue-900 text-white px-10 py-3 rounded-lg cursor-pointer hover:bg-blue-800 transition ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}  
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'جاري البحث...' : 'بحث'}
          </button>
        </div>

        {results && (
          <div className="mt-10 animate-fadeIn">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    نتائج البحث
                  </h2>
                  <p className="text-blue-100 mt-2">
                    تم العثور على العقار بنجاح
                  </p>
                </div>
                {getStatusBadge(results.status)}
              </div>
            </div>
            
            <div className="bg-white rounded-b-2xl shadow-2xl overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">رقم الكارت</span>
                    <p className="text-lg font-bold text-blue-900">{results.cardNumber}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-sm text-gray-500">رقم العقار</span>
                    <p className="text-lg font-bold text-gray-800">{results.propertyNumber}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center ml-4 flex-shrink-0">
                        <span className="text-blue-600 text-xl">👤</span>
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500 font-medium">المالك</h3>
                        <p className="text-xl font-bold text-gray-800 mt-1">{results.ownerName}</p>
                        <p className="text-sm text-gray-600 mt-1">الرقم القومي: {results.ownerNationalId}</p>
                        <p className="text-sm text-gray-600">الهاتف: {results.ownerPhone}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center ml-4 flex-shrink-0">
                        <span className="text-green-600 text-xl">🏠</span>
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500 font-medium">العنوان</h3>
                        <p className="text-lg text-gray-800 mt-1">{results.propertyAddress}</p>
                        <p className="text-sm text-gray-600 mt-1">المحافظة: {results.propertyGovernorate}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center ml-4 flex-shrink-0">
                        <span className="text-purple-600 text-xl">📊</span>
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500 font-medium">نسبة الملكية</h3>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{results.ownershipPercentage}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center ml-4 flex-shrink-0">
                        <span className="text-yellow-600 text-xl">💰</span>
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500 font-medium">القيمة</h3>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{results.propertyPrice}</p>
                      </div>
                    </div>

                    
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center ml-4 flex-shrink-0">
                        <span className="text-indigo-600 text-xl">📐</span>
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500 font-medium">المساحة</h3>
                        <p className="text-xl font-bold text-gray-800 mt-1">{results.propertyArea}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center ml-4 flex-shrink-0">
                        <span className="text-red-600 text-xl">🏢</span>
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500 font-medium">نوع العقار</h3>
                        <p className="text-xl font-bold text-gray-800 mt-1">{results.propertyType}</p>
                        {results.floor && (
                          <p className="text-sm text-gray-600 mt-1">الطابق: {results.floor}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                <p className="text-gray-500 text-sm">
                  تاريخ العقد: {formatDate(results.contractDate)} | آخر تحديث: {formatDate(results.lastUpdated)}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
