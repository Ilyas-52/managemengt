'use client';
import { useState } from 'react';
import { Save, Activity, Calendar, Search, X } from 'lucide-react';

export interface FormData {
    firstName: string;
    lastName: string;
    totalPrice: string | number;
    pratiqueNote: string;
    registrationDate: string;
    examDate: string | null;
    t1: string | number;
    t2: string | number;
    t3: string | number;
    t4: string | number;
    t5: string | number;
    t1_date?: string | null;
    t2_date?: string | null;
    t3_date?: string | null;
    t4_date?: string | null;
    t5_date?: string | null;
    t1_timbre: number;
    t2_timbre: number;
    t3_timbre: number;
    t4_timbre: number;
    t5_timbre: number;
    t1_medical: string;
    t2_medical: string;
    t3_medical: string;
    t4_medical: string;
    t5_medical: string;
    licenseType?: string;
    trainingLocation?: string;
    paidTimbreIn?: number;
    paidMedicalIn?: number;
    notes?: string;
    status?: string;
    [key: string]: any;
}

interface TheorieFormProps {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    loading: boolean;
    students?: any[];
    setSelectedStudentId?: (id: string | null) => void;
}

export default function TheorieForm({
    formData,
    setFormData,
    handleSubmit,
    loading,
    students,
    setSelectedStudentId
}: TheorieFormProps) {
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [archiveSearchTerm, setArchiveSearchTerm] = useState('');

    const handleInputChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value;

        setFormData((prev) => {
            const newData = { ...prev, [key]: value };

            if (['t1', 't2', 't3', 't4', 't5'].includes(key) && value !== '' && !newData[`${key}_date`]) {
                newData[`${key}_date`] = new Date().toISOString().split('T')[0];
            }

            if (key === 'licenseType') {
                if (value === 'A') {
                    newData.trainingLocation = 'YOUNESS';
                } else if (['C', 'D', 'E'].includes(value)) {
                    if (prev.trainingLocation === 'YOUNESS') {
                        newData.trainingLocation = 'lboubsi';
                    }
                }
            }

            return newData;
        });
    };

    const currentRest = (Number(formData.totalPrice) || 0) - (
        (Number(formData.t1) || 0) + (Number(formData.t2) || 0) +
        (Number(formData.t3) || 0) + (Number(formData.t4) || 0) +
        (Number(formData.t5) || 0)
    );

    return (
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-16" dir="rtl">

            {/* ================= BASIC INFO ================= */}
            <div className="bg-white rounded-[30px] p-6 sm:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-slate-100 space-y-10">
                <h2 className="text-sm text-slate-400 font-bold tracking-widest">معلومات التلميذ</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-500">الاسم الشخصي</label>
                        <input type="text" value={formData.firstName} onChange={handleInputChange('firstName')} className="w-full h-14 px-4 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none text-center font-bold text-slate-900 text-lg" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-500">الاسم العائلي</label>
                        <input type="text" value={formData.lastName} onChange={handleInputChange('lastName')} className="w-full h-14 px-4 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none text-center font-bold text-slate-900 text-lg" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-500">صنف الرخصة</label>
                        <select value={formData.licenseType || 'B'} onChange={handleInputChange('licenseType')} className="w-full h-14 px-4 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none text-center font-bold text-slate-900 text-base">
                            <option value="B">السيارات (Permis B)</option>
                            <option value="C">الشاحنات (Permis C)</option>
                            <option value="D">الحافلات (Permis D)</option>
                            <option value="E">الرموك (Permis E)</option>
                            <option value="A">الدراجات (Permis A)</option>
                        </select>
                    </div>
                    {(formData.licenseType && formData.licenseType !== 'B' && formData.licenseType !== 'A') ? (
                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-sm font-bold text-slate-500">مكان التدريب</label>
                            <select value={formData.trainingLocation || 'lboubsi'} onChange={handleInputChange('trainingLocation')} className="w-full h-14 px-4 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none text-center font-bold text-slate-900 text-base">
                                <option value="lboubsi">البوبسي</option>
                                <option value="sa3lity">السعليتي</option>
                            </select>
                        </div>
                    ) : (
                        <div className="hidden md:block"></div>
                    )}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-500">تاريخ التسجيل</label>
                        <input type="date" value={formData.registrationDate} onChange={handleInputChange('registrationDate')} className="w-full h-14 px-4 border border-slate-300 rounded-xl outline-none text-right font-bold" style={{ direction: 'ltr' }} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-500">تاريخ الامتحان</label>
                        <input type="date" value={formData.examDate || ''} onChange={handleInputChange('examDate')} className="w-full h-14 px-4 border border-slate-300 rounded-xl outline-none text-right font-bold" style={{ direction: 'ltr' }} />
                    </div>
                    <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-500">حالة الملف</label>
                            <button 
                                type="button" 
                                onClick={() => setIsArchiveModalOpen(true)}
                                className="text-[11px] font-black text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                                🔍 فتح أرشيف المترشحين
                            </button>
                        </div>
                        <select
                            value={formData.status || 'active'}
                            onChange={handleInputChange('status')}
                            className={`w-full h-14 px-4 rounded-xl outline-none text-center font-bold text-lg transition-all border ${
                                formData.status === 'archived' 
                                    ? 'bg-rose-50 text-rose-600 border-rose-300' 
                                    : 'bg-white text-slate-900 border-slate-300 focus:border-emerald-500'
                            }`}
                        >
                            <option value="active">🟢 ملف جاري ونشط</option>
                            <option value="archived">🗂️ مؤرشف منتهي</option>
                        </select>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
                    <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-inner">
                        <label className="text-xs text-slate-400 font-bold tracking-widest">المبلغ الإجمالي</label>
                        <input type="number" value={formData.totalPrice} onChange={handleInputChange('totalPrice')} onWheel={(e) => e.currentTarget.blur()} placeholder="0" className="w-full mt-3 h-20 bg-transparent text-5xl font-black text-center text-emerald-600 outline-none" />
                        <span className="text-slate-400 text-sm font-bold">درهم</span>
                    </div>

                    <div className={`w-full max-w-md mt-6 p-4 rounded-2xl border-2 transition-all duration-500 flex justify-between items-center ${currentRest === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">المبلغ المتبقي</p>
                            <p className={`text-2xl font-black ${currentRest === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currentRest} <span className="text-xs">DH</span></p>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${currentRest === 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
                            {currentRest === 0 ? '✓' : '!'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= TRANCHES ================= */}
            <div className="mt-10 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center max-w-6xl mx-auto px-4 gap-2">
                    <h2 className="text-sm text-slate-400 font-bold tracking-widest">الدفعات والرسوم</h2>
                    {(formData.licenseType && formData.licenseType !== 'B') && (
                        <div className={`px-6 py-2 rounded-full border-2 text-[11px] font-black ${currentRest === 0 ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'}`}>الباقي: {currentRest} DH</div>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                    {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 text-center relative overflow-hidden">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">الدفعة {n}</span>

                            <input
                                type="number"
                                value={formData[`t${n}`] as number || ''}
                                placeholder="0"
                                onChange={handleInputChange(`t${n}`)}
                                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-lg outline-none focus:border-emerald-500 text-slate-900 shadow-inner"
                            />

                            <div className="relative">
                                <input
                                    type="date"
                                    value={formData[`t${n}_date`] ? formData[`t${n}_date`].split('T')[0] : ''}
                                    onChange={(e) => {
                                        const dateVal = e.target.value;
                                        setFormData(prev => ({ ...prev, [`t${n}_date`]: dateVal }));
                                    }}
                                    className="w-full h-8 text-[10px] font-black text-emerald-600 bg-emerald-50/50 rounded-lg border-none outline-none text-center cursor-pointer"
                                    style={{ direction: 'ltr' }}
                                />
                            </div>

                            {formData.licenseType === 'B' ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] font-bold text-slate-400">التمبر (Tb)</label>
                                        <select
                                            // 🚀 ربط كل سيلكت بالخانة الخاصة بالدفعة (t1_timbre, t2_timbre...)
                                            value={formData[`t${n}_timbre`] || 0}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setFormData(prev => ({ ...prev, [`t${n}_timbre`]: val }));
                                            }}
                                            className={`h-9 rounded-lg text-[10px] font-bold border transition-all outline-none text-center ${formData[`t${n}_timbre`] > 0 ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-200'
                                                }`}
                                        >
                                            <option value={0}>0 DH</option>
                                            <option value={700}>700 DH (كامل)</option>
                                            <option value={600}>600 DH</option>
                                            <option value={500}>500 DH</option>
                                            <option value={400}>400 DH</option>
                                            <option value={300}>300 DH</option>
                                            <option value={200}>200 DH</option>
                                            <option value={100}>100 DH</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-[8px] font-black text-slate-400 block pr-1">الفحص (Vm)</label>
                                        <select
                                            value={formData[`t${n}_medical`] || ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData(prev => ({ ...prev, [`t${n}_medical`]: val }));
                                            }}
                                            className={`w-full h-9 rounded-lg text-[10px] font-black border-2 transition-all text-center outline-none ${formData[`t${n}_medical`]
                                                ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                                : 'bg-white text-slate-400 border-slate-200'
                                                }`}
                                        >
                                            <option value="" className="text-slate-400 bg-white">بدون فحص</option>
                                            <option value="د. إكرام" className="text-slate-900 bg-white">د. إكرام</option>
                                            <option value="د. نبيل" className="text-slate-900 bg-white">د. نبيل</option>
                                            <option value="د. جمعة" className="text-slate-900 bg-white">د. جمعة</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-1 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, paidTimbreIn: prev.paidTimbreIn === n ? 0 : n }))}
                                        className={`flex-1 h-9 rounded-xl text-[10px] font-black border-2 transition-all ${formData.paidTimbreIn === n ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-slate-300'}`}
                                    >
                                        Tb
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, paidMedicalIn: prev.paidMedicalIn === n ? 0 : n }))}
                                        className={`flex-1 h-9 rounded-xl text-[10px] font-black border-2 transition-all ${formData.paidMedicalIn === n ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-slate-300'}`}
                                    >
                                        Vm
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-12 bg-amber-50 rounded-[30px] p-6 sm:p-10 border border-amber-100 shadow-inner">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3">
                        <span className="font-black text-xl">!</span>
                    </div>
                    <div>
                        <h2 className="text-lg text-amber-900 font-black tracking-tight"> ملاحضات  </h2>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <textarea
                        value={formData.licenseType === 'B' ? formData.pratiqueNote : (formData.notes || '')}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                                if (prev.licenseType === 'B') {
                                    return { ...prev, pratiqueNote: val };
                                } else {
                                    return { ...prev, notes: val };
                                }
                            });
                        }}
                        placeholder="مثال: التلميذ غايب هاد السيمانة، غايجي غير الثلاثاء مع 10:00..."
                        className="w-full min-h-[140px] p-6 bg-white border-2 border-amber-100 rounded-2xl outline-none focus:border-amber-400 text-slate-800 font-bold text-lg shadow-sm transition-all resize-none placeholder:text-slate-300 placeholder:font-normal"
                    />

                </div>
            </div>

            <div className="mt-10 flex justify-center">

                <button disabled={loading} className="w-full md:w-[450px] h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95">
                    {loading ? <Activity className="animate-spin" size={28} /> : <Save size={28} />}
                    {loading ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
            </div>
            
            {isArchiveModalOpen && students && setSelectedStudentId && (
                <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                🗂️ أرشيف المترشحين
                            </h3>
                            <button type="button" onClick={() => setIsArchiveModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="relative">
                                <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="بحث في الأرشيف..."
                                    value={archiveSearchTerm}
                                    onChange={(e) => setArchiveSearchTerm(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3 bg-slate-100 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/20"
                                />
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {students.filter(s => s.status === 'archived' && (`${s.first_name} ${s.last_name}`).toLowerCase().includes(archiveSearchTerm.toLowerCase())).map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedStudentId(s.id);
                                            setIsArchiveModalOpen(false);
                                        }}
                                        className="w-full text-right p-3 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all group flex justify-between items-center"
                                    >
                                        <span className="font-bold text-slate-700 group-hover:text-emerald-600 text-sm">{s.first_name} {s.last_name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">{s.license_type || 'B'}</span>
                                    </button>
                                ))}
                                {students.filter(s => s.status === 'archived').length === 0 && (
                                    <div className="text-center py-6 text-slate-400 text-sm font-bold">لا يوجد مترشحين في الأرشيف</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}