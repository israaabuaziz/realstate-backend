import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from '../api';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [transaction, setTransaction] = useState(null);
  const [contract, setContract] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    cardHolderName: '',
    cardNumber: '',
    bankName: '',
    accountNumber: '',
    securityCode: '',
    expiryDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cashMessage, setCashMessage] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const transactionId = searchParams.get('transactionId') || localStorage.getItem('currentTransactionId');
    
    if (transactionId) {
      fetchTransaction(transactionId);
    } else {
      setContract({
        propertyType: "شقة سكنية",
        area: 120,
        governorate: "القاهرة",
        address: "مدينة نصر",
        ownershipPercentage: 100,
        floor: "الدور الثالث",
        price: 2000000,
        formattedPrice: "2,000,000 جنيه"
      });
    }
  }, [location]);

  const fetchTransaction = async (transactionId) => {
    try {
      setLoading(true);
      const response = await API.get(`/transactions/${transactionId}`);
      setTransaction(response.data.transaction);
      setContract(response.data.transaction.contractId);
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError('حدث خطأ في تحميل بيانات المعاملة');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setError('');
    setCashMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCashPayment = async () => {
    if (!transaction) {
      setError('بيانات المعاملة غير موجودة');
      return;
    }

    setCashMessage('✅ تم اختيار الدفع نقدًا. جاري تأكيد العملية...');
    setLoading(true);
    
    try {
      const response = await API.post(`/transactions/${transaction._id}/pay`, {
        paymentMethod: 'cash',
        paymentDetails: {}
      });
      
      setSuccessMessage('✅ تم تأكيد الدفع النقدي بنجاح');
      console.log('📨 Cash payment notification sent to seller');
      
      setStep(3);
      
      setTimeout(() => {
        navigate('/realEstate', { 
          state: { message: 'تم تأكيد الدفع النقدي. سيتم التواصل معك قريبًا.' }
        });
      }, 3000);
      
    } catch (err) {
      console.error('Cash payment error:', err);
      setError(err.response?.data?.message || 'حدث خطأ في تأكيد الدفع النقدي');
    } finally {
      setLoading(false);
      setCashMessage('');
    }
  };

  const handleBankTransferContinue = () => {
    setStep(2);
  };

  const handleContinue = () => {
    if (!paymentMethod) {
      setError('يرجى اختيار طريقة الدفع');
      return;
    }
    
    setError('');
    
    if (paymentMethod === 'cash') {
      handleCashPayment(); 
      return;
    }
    
    handleBankTransferContinue();
  };

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'bank_transfer') {
      if (!paymentDetails.cardHolderName || !paymentDetails.cardNumber || !paymentDetails.bankName) {
        setError('يرجى إدخال جميع بيانات الدفع');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (transaction) {
        const response = await API.post(`/transactions/${transaction._id}/pay`, {
          paymentMethod,
          paymentDetails
        });
        setSuccessMessage('✅ تم الدفع بنجاح');
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSuccessMessage('✅ تم الدفع بنجاح (وضع الاختبار)');
      }
      
      setStep(3);
      
      setTimeout(() => {
        navigate('/realEstate', { 
          state: { message: 'تمت عملية الشراء بنجاح' }
        });
      }, 3000);

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'حدث خطأ في عملية الدفع');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !contract) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات الدفع...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f3f4f6] flex justify-center px-4 py-6">
      <div className="w-full max-w-[1100px] bg-white rounded-lg shadow">

        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${step >= 1 ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"}`}>
                1
              </div>
              <span className="text-xl hidden sm:block">اختيار الدفع</span>
            </div>

            <div className="w-10 h-px bg-gray-300" />

            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${step >= 2 && paymentMethod === 'bank_transfer' ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"}`}>
                2
              </div>
              <span className="text-xl hidden sm:block">الدفع</span>
            </div>

            <div className="w-10 h-px bg-gray-300" />

            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${step >= 3 ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"}`}>
                3
              </div>
              <span className="text-xl hidden sm:block">التأكيد</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 px-6 py-6">

          <div className="border rounded-lg p-6">

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <span className="ml-2">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
                <span className="ml-2">✅</span>
                <span>{successMessage}</span>
              </div>
            )}

            {cashMessage && (
              <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
                <span className="ml-2">💰</span>
                <span>{cashMessage}</span>
              </div>
            )}

            {step === 1 && (
              <>
                <h3 className="text-[20px] font-bold mb-5">
                  اختر طريقة الدفع
                </h3>

                <label className="flex items-center gap-3 border rounded-md px-4 py-3 mb-3 cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={() => handlePaymentMethodChange('bank_transfer')}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-xl">تحويل بنكي</span>
                </label>

                <label className="flex items-center gap-3 border rounded-md px-4 py-3 mb-3 cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'cash'}
                    onChange={() => handlePaymentMethodChange('cash')}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-xl">الدفع نقدًا</span>
                </label>

                <button 
                  onClick={handleContinue} 
                  disabled={loading}
                  className="mt-6 w-full h-[44px] bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'جاري المعالجة...' : 'استمرار'}
                </button>
              </>
            )}

            {step === 2 && paymentMethod === 'bank_transfer' && (
              <>
                <h3 className="text-[16px] font-bold mb-5">
                  بيانات الدفع
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <label className="text-sm text-gray-700">اسم مالك البطاقة البنكية</label>
                    <input 
                      name="cardHolderName"
                      value={paymentDetails.cardHolderName}
                      onChange={handleInputChange}
                      className="w-full h-[42px] border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition" 
                      placeholder="الاسم على البطاقة"
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <label className="text-sm text-gray-700">رقم البطاقة</label>
                    <input 
                      name="cardNumber"
                      value={paymentDetails.cardNumber}
                      onChange={handleInputChange}
                      className="w-full h-[42px] border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition" 
                      placeholder="0000 0000 0000 0000"
                      maxLength="19"
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <label className="text-sm text-gray-700">اسم البنك</label>
                    <select 
                      name="bankName"
                      value={paymentDetails.bankName}
                      onChange={handleInputChange}
                      className="w-full h-[42px] border border-gray-300 rounded-lg px-3 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    >
                      <option value="">اختر اسم البنك</option>
                      <option value="nbe">البنك الأهلي المصري</option>
                      <option value="banque-misr">بنك مصر</option>
                      <option value="cib">البنك التجاري الدولي (CIB)</option>
                      <option value="alex">بنك الإسكندرية</option>
                      <option value="qnb">QNB الأهلي</option>
                      <option value="hsbc">HSBC</option>
                      <option value="aaib">البنك العربي الأفريقي</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <label className="text-sm text-gray-700">رقم الحساب</label>
                    <input 
                      name="accountNumber"
                      value={paymentDetails.accountNumber}
                      onChange={handleInputChange}
                      className="w-full h-[42px] border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition" 
                      placeholder="رقم الحساب"
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-sm text-gray-700">المبلغ (بالجنيه المصري)</label>
                    <input 
                      className="w-full h-[42px] border border-gray-300 rounded-lg px-3 text-sm bg-gray-50 text-gray-700 font-medium" 
                      value={contract?.price?.toLocaleString() + ' جنيه' || '2,000,000 جنيه'}
                      readOnly
                    />
                  </div>

                  <div className="flex gap-3 col-span-2">
                    <div className="flex flex-col gap-1 w-1/2">
                      <label className="text-sm text-gray-700">كود الأمان</label>
                      <input 
                        name="securityCode"
                        value={paymentDetails.securityCode}
                        onChange={handleInputChange}
                        className="w-full h-[42px] border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition" 
                        placeholder="CVV"
                        maxLength="4"
                      />
                    </div>

                    <div className="flex flex-col gap-1 w-1/2">
                      <label className="text-sm text-gray-700">تاريخ الانتهاء</label>
                      <input 
                        name="expiryDate"
                        value={paymentDetails.expiryDate}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        className="w-full h-[42px] border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition" 
                        maxLength="5"
                      />
                    </div>
                  </div>

                </div>

                <button 
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="mt-6 w-full h-[44px] bg-green-600 text-white rounded-md text-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري المعالجة...
                    </div>
                  ) : 'تأكيد الدفع'}
                </button>
              </>
            )}

            {step === 3 && (
              <div className="text-center py-10">
                <div className="text-7xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-600 mb-3">
                  {paymentMethod === 'cash' ? 'تم تأكيد الدفع النقدي' : 'تم الدفع بنجاح'}
                </h3>
                <p className="text-gray-800">
                  {paymentMethod === 'cash' 
                    ? 'سيتم إشعار البائع وإتمام عملية النقل'
                    : 'شكرًا لك، تم تأكيد عملية الدفع'}
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  جاري تحويلك للصفحة الرئيسية...
                </p>
              </div>
            )}

          </div>

          <div className="bg-[#f9fafb] rounded-lg p-6 h-fit sticky top-6">
            <h3 className="text-2xl font-bold text-blue-800 mb-4 text-center border-b pb-3">
              تفاصيل الطلب
            </h3>

            <div className="space-y-3">
              {contract ? (
                <>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">نوع العقار</span>
                    <span className="font-medium text-gray-900">{contract.propertyType}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">المساحة</span>
                    <span className="font-medium text-gray-900">{contract.area} م²</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">الموقع</span>
                    <span className="font-medium text-gray-900">{contract.governorate}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">العنوان</span>
                    <span className="font-medium text-gray-900">{contract.address}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">نسبة الملكية</span>
                    <span className="font-medium text-green-600">{contract.ownershipPercentage}%</span>
                  </div>

                  {contract.floor && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="text-gray-600">الطابق</span>
                      <span className="font-medium text-gray-900">{contract.floor}</span>
                    </div>
                  )}

                  <div className="mt-4 pt-3">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-700">سعر العقار</span>
                      <span className="font-bold text-gray-900">{contract.price?.toLocaleString()} جنيه</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-gray-500">رسوم المعاملة</span>
                      <span className="text-gray-700">300 جنيه</span>
                    </div>
                  </div>

                  <div className="mt-4 bg-gradient-to-l from-blue-50 to-indigo-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">الإجمالي النهائي</span>
                      <span className="text-2xl font-bold text-blue-800">
                        {(contract.price + 300).toLocaleString()} جنيه
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p>جاري تحميل البيانات...</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
