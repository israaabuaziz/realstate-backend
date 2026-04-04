// import React, { useState, useEffect } from 'react'
// import API from "../api";

// export default function WillSetup() {
//   const [approvedContracts, setApprovedContracts] = useState([]);
//   const [loadingContracts, setLoadingContracts] = useState(true);
//   const [familyTree, setFamilyTree] = useState(null);
//   const [inheritanceShares, setInheritanceShares] = useState([]);
//   const [selectedContract, setSelectedContract] = useState(null);
//   const [heirsList, setHeirsList] = useState([]);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     fetchApprovedContracts();
//     fetchFamilyTree();
//   }, []);

//   const fetchApprovedContracts = async () => {
//     try {
//       const res = await API.get("/contracts/my-contracts");
//       const approved = (res.data.contracts || []).filter(
//         (c) => c.status === "approved" || c.status === "completed"
//       );
//       setApprovedContracts(approved);
//     } catch (err) {
//       console.log("Error fetching contracts", err);
//     } finally {
//       setLoadingContracts(false);
//     }
//   };

//   const fetchFamilyTree = async () => {
//     try {
//       const user = JSON.parse(localStorage.getItem('user'));
//       const res = await API.get(`/inheritance/family-tree/${user.id}`);
//       setFamilyTree(res.data.tree);
      
//       const calcRes = await API.post('/inheritance/calculate', {
//         deceasedId: user.id
//       });
//       setInheritanceShares(calcRes.data.shares);
      
//       const heirs = calcRes.data.shares.map((share, index) => ({
//         id: index + 1,
//         fullName: share.name,
//         nationalId: share.nationalId,
//         percent: (share.share * 100).toFixed(1),
//           relation: share.relation === 'wife' ? 'زوجة' :
//                   share.relation === 'husband' ? 'زوج' :
//                   share.relation === 'son' ? 'ابن' :
//                   share.relation === 'daughter' ? 'ابنة' :
//                   share.relation === 'father' ? 'أب' :
//                   share.relation === 'mother' ? 'أم' : share.relation
//       }));
//       setHeirsList(heirs);
      
//     } catch (err) {
//       console.log("Error fetching family tree", err);
//     }
//   };

//   const saveWill = async () => {
//     setSaving(true);
//     try {
//       const willData = {
//         distributionMethod: 'sharia',
//         heirs: heirsList.map(heir => ({
//           fullName: heir.fullName,
//           nationalId: heir.nationalId,
//           relationType: heir.relation === 'زوجة' ? 'wife' :
//                         heir.relation === 'زوج' ? 'husband' :
//                         heir.relation === 'ابن' ? 'son' :
//                         heir.relation === 'ابنة' ? 'daughter' :
//                         heir.relation === 'أب' ? 'father' : 'mother',
//           share: parseFloat(heir.percent) / 100,
//           shareType: 'percentage'
//         })),
//         properties: approvedContracts.map(c => ({
//           contractId: c._id,
//           propertyNumber: c.propertyNumber,
//           ownershipPercentage: c.ownershipPercentage
//         }))
//       };
      
//       await API.post('/inheritance/will', willData);
//       alert('تم حفظ الوصية بنجاح');
//     } catch (err) {
//       console.log("Error saving will", err);
//       alert('حدث خطأ في حفظ الوصية');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const executeInheritance = async () => {
//     if (!window.confirm('هل أنت متأكد من تنفيذ الميراث؟')) return;
    
//     try {
//       const user = JSON.parse(localStorage.getItem('user'));
//       await API.post('/inheritance/execute', {
//         deceasedId: user.id,
//         heirs: heirsList.map(heir => ({
//           familyMemberId: null,
//           nationalId: heir.nationalId,
//           fullName: heir.fullName,
//           relation: heir.relation === 'زوجة' ? 'wife' :
//                     heir.relation === 'زوج' ? 'husband' :
//                     heir.relation === 'ابن' ? 'son' :
//                     heir.relation === 'ابنة' ? 'daughter' :
//                     heir.relation === 'أب' ? 'father' : 'mother',
//           share: parseFloat(heir.percent) / 100
//         })),
//         contractIds: approvedContracts.map(c => c._id)
//       });
      
//       alert('تم تنفيذ الميراث بنجاح');
//       navigate('/');
//     } catch (err) {
//       console.log("Error executing inheritance", err);
//       alert('حدث خطأ في تنفيذ الميراث');
//     }
//   };

//   const addHeir = () => {
//     setHeirsList([
//       ...heirsList,
//       {
//         id: heirsList.length + 1,
//         fullName: "",
//         nationalId: "",
//         percent: 0,
//         relation: "اختر صلة القرابة",
//       },
//     ]);
//   };

//   const removeHeir = (id) => {
//     if (heirsList.length > 1) {
//       setHeirsList(heirsList.filter(heir => heir.id !== id));
//     }
//   };

//   const updateHeir = (id, field, value) => {
//     setHeirsList(
//       heirsList.map(heir =>
//         heir.id === id ? { ...heir, [field]: value } : heir
//       )
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
//       <div className="w-full max-w-5xl mx-auto px-4">
//         <div className="bg-blue-900 text-white p-4 rounded-t-lg text-center">
//           <h2 className="text-xl font-semibold">إعداد الميراث</h2>
//           <p className="text-lg mt-1 mb-6">قم بتحديد كيفية توزيع الميراث على الورثة</p>
//         </div>

//         {familyTree && (
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
//             <h2 className="text-lg font-semibold text-gray-700 mb-4">شجرة العائلة</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {familyTree.spouse.length > 0 && (
//                 <div className="bg-gray-50 p-3 rounded">
//                   <span className="font-medium">الزوج/الزوجة:</span>
//                   {familyTree.spouse.map(s => (
//                     <div key={s._id} className="mr-4">{s.fullName}</div>
//                   ))}
//                 </div>
//               )}
//               {familyTree.parents.length > 0 && (
//                 <div className="bg-gray-50 p-3 rounded">
//                   <span className="font-medium">الوالدين:</span>
//                   {familyTree.parents.map(p => (
//                     <div key={p._id} className="mr-4">{p.fullName}</div>
//                   ))}
//                 </div>
//               )}
//               {familyTree.children.length > 0 && (
//                 <div className="bg-gray-50 p-3 rounded">
//                   <span className="font-medium">الأبناء:</span>
//                   {familyTree.children.map(c => (
//                     <div key={c._id} className="mr-4">{c.fullName}</div>
//                   ))}
//                 </div>
//               )}
//               {familyTree.siblings.length > 0 && (
//                 <div className="bg-gray-50 p-3 rounded">
//                   <span className="font-medium">الأخوة:</span>
//                   {familyTree.siblings.map(s => (
//                     <div key={s._id} className="mr-4">{s.fullName}</div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
//           <h2 className="text-lg font-semibold text-gray-700 mb-4 mt-4">
//             معلومات العقار
//           </h2>

//           {loadingContracts ? (
//             <p>جاري تحميل العقارات...</p>
//           ) : approvedContracts.length === 0 ? (
//             <p className="text-gray-500">لا يوجد عقارات مقبولة</p>
//           ) : (
//             approvedContracts.map((contract) => (
//               <div key={contract._id} className="space-y-2 mb-4 border-b pb-3">
//                 <div className="flex">
//                   <span className="text-gray-600 w-40">النوع:</span>
//                   <span className="text-gray-800 font-medium">
//                     {contract.propertyType} - {contract.area} متر مربع
//                   </span>
//                 </div>
//                 <div className="flex">
//                   <span className="text-gray-600 w-40">الموقع:</span>
//                   <span className="text-gray-800 font-medium">
//                     {contract.governorate}، {contract.address}
//                   </span>
//                 </div>
//                 <div className="flex">
//                   <span className="text-gray-600 w-40">نسبة ملكيتك:</span>
//                   <span className="text-green-600 font-bold">
//                     %{contract.ownershipPercentage}
//                   </span>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         <div className="my-6">
//           <div className="bg-[#dff4f7] rounded-2xl p-6 shadow-sm">
//             <div className="flex items-center mb-4">
//               <span className="text-2xl">⚠️</span>
//               <h2 className="text-xl font-bold text-gray-800">
//                 ملاحظة هامة:
//               </h2>
//             </div>
//             <ul className="list-disc pr-4 space-y-2 text-gray-700">
//               <li>هذه الأنصبة محسوبة آلياً حسب الشريعة الإسلامية.</li>
//               <li>يمكنك تعديل النسب يدوياً إذا لزم الأمر.</li>
//               <li>يجب أن يكون مجموع النسب = 100% بالضبط.</li>
//             </ul>
//           </div>
//         </div>

//         <div className="p-4">
//           {heirsList.map((heir, index) => (
//             <div key={heir.id} className="mb-6">
//               {heirsList.length > 1 && (
//                 <div className="flex justify-between mb-3">
//                   <h3 className="text-lg font-semibold">وريث #{index + 1}</h3>
//                   <button
//                     onClick={() => removeHeir(heir.id)}
//                     className="bg-red-500 text-white px-3 py-1 rounded-md"
//                   >
//                     حذف
//                   </button>
//                 </div>
//               )}

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <input
//                   type="text"
//                   placeholder="الرقم القومي"
//                   className="border rounded-md px-3 py-2"
//                   value={heir.nationalId}
//                   onChange={(e) => updateHeir(heir.id, 'nationalId', e.target.value)}
//                 />

//                 <input
//                   type="text"
//                   placeholder="الاسم الكامل"
//                   className="border rounded-md px-3 py-2"
//                   value={heir.fullName}
//                   onChange={(e) => updateHeir(heir.id, 'fullName', e.target.value)}
//                 />

//                 <input
//                   type="number"
//                   placeholder="النسبة %"
//                   className="border rounded-md px-3 py-2"
//                   value={heir.percent}
//                   onChange={(e) => updateHeir(heir.id, 'percent', e.target.value)}
//                 />

//                 <select
//                   className="border rounded-md px-3 py-2"
//                   value={heir.relation}
//                   onChange={(e) => updateHeir(heir.id, 'relation', e.target.value)}
//                 >
//                   <option>اختر صلة القرابة</option>
//                   <option>ابن</option>
//                   <option>ابنة</option>
//                   <option>زوج</option>
//                   <option>زوجة</option>
//                   <option>أب</option>
//                   <option>أم</option>
//                   <option>أخ</option>
//                 </select>
//               </div>
//             </div>
//           ))}

//           <button
//             onClick={addHeir}
//             className="mt-4 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
//           >
//             + إضافة وريث جديد
//           </button>
//         </div>

//         <div className="p-4 border-t">
//           <h3 className="font-semibold mb-3 text-right">قائمة الورثة</h3>
//           {heirsList.map((heir) => (
//             <div key={heir.id} className="flex justify-between border rounded-md p-3 mb-2">
//               <div className="text-right">
//                 <p className="font-semibold">{heir.fullName || "بدون اسم"}</p>
//                 <p className="text-sm text-gray-500">{heir.relation} — {heir.phone || "بدون رقم"}</p>
//               </div>
//               <span className="text-sm font-semibold text-blue-700">%{heir.percent}</span>
//             </div>
//           ))}
//         </div>

//         <div className="flex gap-4 mt-6">
//           <button
//             onClick={saveWill}
//             disabled={saving}
//             className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
//           >
//             {saving ? 'جاري الحفظ...' : 'حفظ الوصية'}
//           </button>
//           <button
//             onClick={executeInheritance}
//             className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
//           >
//             تنفيذ الميراث
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }