import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../api";

export default function WillMethod() {
  const navigate = useNavigate();
  const [approvedContracts, setApprovedContracts] = useState([]);
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [userReligion, setUserReligion] = useState(null);
  const [heirsList, setHeirsList] = useState([]);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [distributionMethod, setDistributionMethod] = useState(null);
  const [showHeirsSection, setShowHeirsSection] = useState(false);
  const [familyMembersList, setFamilyMembersList] = useState([]);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState('');
  const [manualPercentage, setManualPercentage] = useState('');

  // New states for optional will
  const [automaticHeirs, setAutomaticHeirs] = useState([]); // original shares from sharia calculation
  const [optionalHeirs, setOptionalHeirs] = useState([]); // optional heirs added
  const [showOptionalSection, setShowOptionalSection] = useState(false); // to show/hide optional section

  const fetchUserReligion = async () => {
    try {
      const response = await API.get('/users/profile');
      const user = response.data.user;
      setUserReligion(user.religion || 'مسلم');
    } catch (err) {
      console.error('Error fetching user religion:', err);
      setUserReligion('مسلم');
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const userId = user.id || user._id;
      const response = await API.get(`/inheritance/family-tree/${userId}`);
      if (response.data.success && response.data.tree) {
        const tree = response.data.tree;
        const members = [];

        tree.spouse?.forEach(sp => members.push({
          nationalId: sp.nationalId,
          fullName: sp.fullName,
          relationType: sp.relationType,
          relationArabic: sp.relationType === 'wife' ? 'زوجة' : 'زوج'
        }));
        tree.parents?.forEach(p => members.push({
          nationalId: p.nationalId,
          fullName: p.fullName,
          relationType: p.relationType,
          relationArabic: p.relationType === 'father' ? 'أب' : 'أم'
        }));
        tree.children?.forEach(c => members.push({
          nationalId: c.nationalId,
          fullName: c.fullName,
          relationType: c.relationType,
          relationArabic: c.relationType === 'son' ? 'ابن' : 'ابنة'
        }));
        tree.siblings?.forEach(s => members.push({
          nationalId: s.nationalId,
          fullName: s.fullName,
          relationType: s.relationType,
          relationArabic: s.relationType === 'brother' ? 'أخ' : 'أخت'
        }));

        setFamilyMembersList(members);
      }
    } catch (err) {
      console.error('Error fetching family members:', err);
      setError('حدث خطأ في تحميل أفراد العائلة. يرجى التأكد من إضافة أفراد العائلة أولاً.');
    }
  };

  useEffect(() => {
    fetchUserReligion();
    fetchApprovedContracts();
    fetchFamilyMembers();
  }, []);

  const fetchApprovedContracts = async () => {
    try {
      const res = await API.get("/contracts/my-contracts");
      const approved = (res.data.contracts || []).filter(
        (c) => c.status === "approved" || c.status === "completed"
      );
      setApprovedContracts(approved);
    } catch (err) {
      console.log("Error fetching contracts", err);
    } finally {
      setLoadingContracts(false);
    }
  };

  const toggleContractSelection = (contract) => {
    setSelectedContracts(prev => {
      const exists = prev.find(c => c._id === contract._id);
      if (exists) {
        return prev.filter(c => c._id !== contract._id);
      } else {
        return [...prev, contract];
      }
    });
  };

  const calculateInheritance = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('لم يتم العثور على بيانات المستخدم');
        return;
      }
      const user = JSON.parse(userStr);
      const deceasedId = user.id || user._id;

      const response = await API.post('/inheritance/calculate', { deceasedId });
      
      if (response.data.shares && response.data.shares.length > 0) {
        const heirs = response.data.shares.map((share, index) => ({
          id: Date.now() + index,
          nationalId: share.nationalId || '',
          fullName: share.name || share.fullName || '',
          percent: ((share.share || 0) * 100),
          relation:
            share.relation === 'wife' ? 'زوجة' :
            share.relation === 'husband' ? 'زوج' :
            share.relation === 'son' ? 'ابن' :
            share.relation === 'daughter' ? 'ابنة' :
            share.relation === 'father' ? 'أب' :
            share.relation === 'mother' ? 'أم' :
            share.relation === 'brother' ? 'أخ' :
            share.relation === 'sister' ? 'أخت' : ''
        }));
        setAutomaticHeirs(heirs);
        setHeirsList(heirs); // keep for compatibility
        setDistributionMethod('sharia');
        setShowHeirsSection(true);
        setStep(2);
      } else {
        setError('لم يتم العثور على ورثة');
      }
    } catch (err) {
      console.error('Error calculating inheritance:', err);
      setError('حدث خطأ في حساب الميراث. تأكد من إضافة أفراد العائلة أولاً.');
    }
  };
  
  // Manual distribution functions
  const addManualHeir = () => {
    if (!selectedFamilyMember) {
      setError('يرجى اختيار أحد أفراد العائلة أولاً');
      return;
    }
    const member = familyMembersList.find(m => m.nationalId === selectedFamilyMember);
    if (!member) {
      setError('فرد العائلة غير موجود');
      return;
    }

    let percentage = parseFloat(manualPercentage);
    if (isNaN(percentage) || percentage <= 0) {
      setError('النسبة المئوية يجب أن تكون أكبر من 0');
      return;
    }
    if (percentage > 100) {
      setError('النسبة المئوية لا يمكن أن تتجاوز 100%');
      return;
    }

    if (heirsList.some(h => h.nationalId === member.nationalId)) {
      setError('هذا الفرد مضاف بالفعل');
      return;
    }

    setHeirsList(prev => [
      ...prev,
      {
        id: Date.now(),
        nationalId: member.nationalId,
        fullName: member.fullName,
        percent: percentage,
        relation: member.relationArabic,
        relationType: member.relationType
      }
    ]);
    setSelectedFamilyMember('');
    setManualPercentage('');
    setError('');
  };

  const removeHeir = (id) => {
    setHeirsList(heirsList.filter(heir => heir.id !== id));
  };

  const updateManualHeirPercentage = (id, newPercent) => {
    let percent = parseFloat(newPercent);
    if (isNaN(percent)) percent = 0;
    if (percent > 100) percent = 100;
    if (percent < 0) percent = 0;
    setHeirsList(prev =>
      prev.map(heir =>
        heir.id === id ? { ...heir, percent: percent } : heir
      )
    );
  };

  const calculateTotalPercentage = () => {
    return heirsList.reduce((sum, heir) => sum + (parseFloat(heir.percent) || 0), 0);
  };

  // Optional will functions
  const addOptionalHeir = () => {
    if (!selectedFamilyMember) {
      setError('يرجى اختيار أحد أفراد العائلة أولاً');
      return;
    }
    const member = familyMembersList.find(m => m.nationalId === selectedFamilyMember);
    if (!member) {
      setError('فرد العائلة غير موجود');
      return;
    }

    let percentage = parseFloat(manualPercentage);
    if (isNaN(percentage) || percentage <= 0) {
      setError('النسبة المئوية يجب أن تكون أكبر من 0');
      return;
    }
    if (percentage > 33.33) {
      setError('النسبة المئوية لا يمكن أن تتجاوز 33.33% للوصية الاختيارية');
      return;
    }

    if (optionalHeirs.some(h => h.nationalId === member.nationalId)) {
      setError('هذا الفرد مضاف بالفعل في الوصية الاختيارية');
      return;
    }

    const newTotal = optionalHeirs.reduce((sum, h) => sum + parseFloat(h.percent), 0) + percentage;
    if (newTotal > 33.33) {
      setError(`لا يمكن إضافة هذه النسبة لأن المجموع سيتجاوز 33.33% (المجموع الحالي: ${newTotal.toFixed(2)}%)`);
      return;
    }

    setOptionalHeirs(prev => [
      ...prev,
      {
        id: Date.now(),
        nationalId: member.nationalId,
        fullName: member.fullName,
        percent: percentage,
        relation: member.relationArabic,
        relationType: member.relationType
      }
    ]);
    setSelectedFamilyMember('');
    setManualPercentage('');
    setError('');
  };

  const removeOptionalHeir = (id) => {
    setOptionalHeirs(prev => prev.filter(heir => heir.id !== id));
  };

  const updateOptionalHeirPercentage = (id, newPercent) => {
    let percent = parseFloat(newPercent);
    if (isNaN(percent)) percent = 0;
    if (percent > 33.33) percent = 33.33;
    if (percent < 0) percent = 0;

    const updatedList = optionalHeirs.map(heir =>
      heir.id === id ? { ...heir, percent: percent} : heir
    );
    const total = updatedList.reduce((sum, h) => sum + parseFloat(h.percent), 0);
    if (total > 33.33) {
      setError(`المجموع لا يمكن أن يتجاوز 33.33% (المجموع الحالي: ${total.toFixed(2)}%)`);
      return;
    }
    setOptionalHeirs(updatedList);
    setError('');
  };

  const computeOptionalTotal = () => {
    return optionalHeirs.reduce((sum, h) => sum + (parseFloat(h.percent) || 0), 0);
  };

  const computeFinalHeirs = () => {
    if (!automaticHeirs.length) return [];
    const optionalTotal = computeOptionalTotal();
    const remainingFactor = (100 - optionalTotal) / 100; // percentage factor for original heirs

    // Scale original heirs
    const final = automaticHeirs.map(heir => ({
      ...heir,
      percent: (parseFloat(heir.percent) * remainingFactor),
    }));

    // Add optional heirs
    for (const opt of optionalHeirs) {
      const existing = final.find(h => h.nationalId === opt.nationalId);
      if (existing) {
        existing.percent = (parseFloat(existing.percent) + parseFloat(opt.percent));
      } else {
        final.push({ ...opt, percent: opt.percent });
      }
    }

    // Ensure total is 100% (fix floating point rounding)
    const total = final.reduce((sum, h) => sum + parseFloat(h.percent), 0);
    if (Math.abs(total - 100) > 0.01 && final.length > 0) {
      const diff = 100 - total;
      final[0].percent = (parseFloat(final[0].percent) + diff);
    }
    return final;
  };

  const handleSaveWill = async () => {
    if (selectedContracts.length === 0) {
      alert('يرجى اختيار عقار واحد على الأقل');
      return;
    }

    let finalHeirs;
    if (distributionMethod === 'sharia') {
      finalHeirs = computeFinalHeirs();
    } else {
      finalHeirs = heirsList;
    }

    if (finalHeirs.length === 0) {
      alert('يرجى إضافة وريث واحد على الأقل');
      return;
    }

    const total = finalHeirs.reduce((sum, h) => sum + parseFloat(h.percent), 0);
    if (Math.abs(total - 100) > 0.01) {
      setError(`مجموع النسب يجب أن يكون 100% (المجموع الحالي: ${total.toFixed(2)}%)`);
      return;
    }

    setSaving(true);
    try {
      const willData = {
        religion: userReligion === 'مسلم' ? 'muslim' : 'non-muslim',
        distributionMethod: distributionMethod === 'sharia' ? 'automatic' : 'manual',
        selectedProperties: selectedContracts.map(c => ({
          contractId: c._id,
          propertyNumber: c.propertyNumber,
          propertyType: c.propertyType,
          ownershipPercentage: c.ownershipPercentage,
          includeInWill: true
        })),
        heirs: finalHeirs.map(heir => ({
          fullName: heir.fullName,
          nationalId: heir.nationalId,
          relationType: heir.relationType || (heir.relation === 'زوجة' ? 'wife' :
            heir.relation === 'زوج' ? 'husband' :
            heir.relation === 'ابن' ? 'son' :
            heir.relation === 'ابنة' ? 'daughter' :
            heir.relation === 'أب' ? 'father' :
            heir.relation === 'أم' ? 'mother' :
            heir.relation === 'أخ' ? 'brother' :
            heir.relation === 'أخت' ? 'sister' : 'other'),
          share: (parseFloat(heir.percent) || 0) / 100,
          shareType: 'percentage'
        }))
      };
      await API.post('/inheritance/will', willData);
      alert('تم حفظ الوصية بنجاح');
      navigate('/');
    } catch (err) {
      console.error('Error saving will:', err);
      alert('حدث خطأ في حفظ الوصية');
    } finally {
      setSaving(false);
    }
  };

  const isTotalValid = () => {
    const total = calculateTotalPercentage();
    return Math.abs(total - 100) < 0.01;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">إنشاء وصية جديدة</h1>
          <Link
            to="/my-wills"
            className="text-blue-600 hover:text-blue-800 border border-blue-600 px-4 py-2 rounded-lg"
          >
            عرض وصاياي
          </Link>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>1</div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>2</div>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">اختر العقارات التي تشملها الوصية</h2>
            {loadingContracts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : approvedContracts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا يوجد عقارات مقبولة حالياً</p>
            ) : (
              <div className="space-y-3">
                {approvedContracts.map((contract) => (
                  <div
                    key={contract._id}
                    onClick={() => toggleContractSelection(contract)}
                    className={`border rounded-lg p-4 cursor-pointer transition ${
                      selectedContracts.some(c => c._id === contract._id)
                        ? 'border-green-500 bg-green-50'
                        : 'hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{contract.propertyType} - {contract.area} م²</p>
                        <p className="text-sm text-gray-600">{contract.governorate}، {contract.address}</p>
                        <p className="text-sm text-green-600 font-bold">نسبة ملكيتك: %{contract.ownershipPercentage}</p>
                      </div>
                      {selectedContracts.some(c => c._id === contract._id) && (
                        <span className="text-green-600 text-2xl">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => navigate('/')}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (selectedContracts.length === 0) {
                    alert('يرجى اختيار عقار واحد على الأقل');
                    return;
                  }
                  setShowHeirsSection(true);
                }}
                disabled={selectedContracts.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {step === 1 && showHeirsSection && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">اختر طريقة التوزيع</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div
                onClick={calculateInheritance}
                className="cursor-pointer border rounded-xl p-6 text-center hover:shadow-lg transition hover:border-blue-600"
              >
                <div className="text-4xl mb-3">📖</div>
                <h4 className="font-bold text-lg">حسب الشريعة</h4>
                <p className="text-gray-500 mt-2 text-sm">
                  حساب تلقائي للذكر مثل حظ الأنثيين
                </p>
              </div>

              {userReligion !== 'مسلم' && (
                <div
                  onClick={() => {
                    setDistributionMethod('manual');
                    setHeirsList([]);
                    setStep(2);
                  }}
                  className="cursor-pointer border rounded-xl p-6 text-center hover:shadow-lg transition hover:border-blue-600"
                >
                  <div className="text-4xl mb-3">✍️</div>
                  <h4 className="font-bold text-lg">توزيع يدوي</h4>
                  <p className="text-gray-500 mt-2 text-sm">
                    أنت تحدد النسب بنفسك
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">
              {distributionMethod === 'sharia' ? 'الأنصبة حسب الشريعة' : 'توزيع يدوي'}
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {distributionMethod === 'sharia' ? (
              <>
                {/* Original shares (before optional will) */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">الأنصبة الأصلية حسب الشريعة</h3>
                  {automaticHeirs.map((heir, index) => (
                    <div key={heir.id} className="mb-2 p-3 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-gray-600">الاسم:</span> {heir.fullName}</div>
                        <div><span className="text-gray-600">النسبة:</span> {heir.percent.toFixed(1)}%</div>
                        <div><span className="text-gray-600">العلاقة:</span> {heir.relation}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optional will section */}
                <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">وصية اختيارية (تصل إلى 33.33%)</h3>
                    <button
                      onClick={() => setShowOptionalSection(!showOptionalSection)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {showOptionalSection ? 'إخفاء' : 'إظهار'}
                    </button>
                  </div>
                  
                  {showOptionalSection && (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        يمكنك إضافة نسب إضافية لبعض الورثة (أو غير الورثة) بشرط ألا يتجاوز مجموع النسب 33.33% من التركة.
                      </p>

                      {/* List of optional heirs */}
                      {optionalHeirs.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium">الورثة المضافون في الوصية:</h4>
                          <div className="space-y-2 mt-2">
                            {optionalHeirs.map(heir => (
                              <div key={heir.id} className="flex justify-between items-center bg-white p-2 rounded">
                                <div className="flex-1">{heir.fullName} - {heir.relation}</div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={heir.percent}
                                    onChange={(e) => updateOptionalHeirPercentage(heir.id, e.target.value)}
                                    className="w-20 border rounded px-2 py-1 text-center"
                                    step="0.1"
                                    min="0"
                                    max="33.33"
                                  />
                                  <span>%</span>
                                  <button
                                    onClick={() => removeOptionalHeir(heir.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    حذف
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add optional heir */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <select
                          value={selectedFamilyMember}
                          onChange={(e) => setSelectedFamilyMember(e.target.value)}
                          className="border rounded-lg px-3 py-2"
                        >
                          <option value="">اختر فرد العائلة</option>
                          {familyMembersList.map(member => (
                            <option key={member.nationalId} value={member.nationalId}>
                              {member.fullName} - {member.relationArabic}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="النسبة % (حد أقصى 33.33%)"
                          value={manualPercentage}
                          onChange={(e) => setManualPercentage(e.target.value)}
                          step="0.1"
                          min="0"
                          max="33.33"
                          className="border rounded-lg px-3 py-2"
                        />
                        <button
                          onClick={addOptionalHeir}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          إضافة وريث اختياري
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        إجمالي النسب الاختيارية: 
                        <span className={`font-bold mr-1 ${computeOptionalTotal() > 33.33 ? 'text-red-600' : 'text-green-600'}`}>
                          {computeOptionalTotal().toFixed(2)}%
                        </span>
                        (الحد الأقصى 33.33%)
                      </div>
                    </>
                  )}
                </div>

                {/* Final shares after optional will - displayed only if optional heirs exist */}
                {optionalHeirs.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">الأنصبة النهائية بعد الوصية الاختيارية</h3>
                    {computeFinalHeirs().map((heir, index) => (
                      <div key={heir.id} className="mb-2 p-3 border rounded-lg">
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-gray-600">الاسم:</span> {heir.fullName}</div>
                          <div><span className="text-gray-600">النسبة:</span> {heir.percent.toFixed(1)}%</div>
                          <div><span className="text-gray-600">العلاقة:</span> {heir.relation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Manual distribution (unchanged)
              <>
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-3">إضافة وريث جديد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={selectedFamilyMember}
                      onChange={(e) => setSelectedFamilyMember(e.target.value)}
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="">اختر فرد العائلة</option>
                      {familyMembersList.map(member => (
                        <option key={member.nationalId} value={member.nationalId}>
                          {member.fullName} - {member.relationArabic}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="النسبة %"
                      value={manualPercentage}
                      onChange={(e) => setManualPercentage(e.target.value)}
                      step="0.1"
                      min="0"
                      max="100"
                      className="border rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={addManualHeir}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      إضافة
                    </button>
                  </div>
                </div>

                {heirsList.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">الورثة المضافون:</h3>
                    <div className="space-y-2">
                      {heirsList.map(heir => (
                        <div key={heir.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{heir.fullName}</p>
                            <p className="text-sm text-gray-500">{heir.relation}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={heir.percent}
                              onChange={(e) => updateManualHeirPercentage(heir.id, e.target.value)}
                              className="w-24 border rounded-lg px-2 py-1 text-center"
                              step="0.1"
                              min="0"
                              max="100"
                            />
                            <span className="text-gray-600">%</span>
                            <button
                              onClick={() => removeHeir(heir.id)}
                              className="text-red-500 hover:text-red-700 px-2"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {heirsList.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                    <span className="font-semibold">مجموع النسب:</span>
                    <span className={`font-bold ${isTotalValid() ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateTotalPercentage().toFixed(2)}%
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep(1);
                  setShowHeirsSection(true);
                  setError('');
                }}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
              >
                السابق
              </button>
              <button
                onClick={handleSaveWill}
                disabled={saving || (distributionMethod === 'sharia' ? computeFinalHeirs().length === 0 : heirsList.length === 0)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ الوصية'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}