'use client';
import { ChevronDown, UserPlus, Search, User } from 'lucide-react';

interface Student {
    id: string;
    first_name: string;
    last_name: string;
}

interface HeaderProps {
    students: Student[];
    selectedStudentId: string | null;
    setSelectedStudentId: (id: string | null) => void;
    // 🚀 المسامير الجداد ديال التاريخ:
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
}

export default function TheorieHeader({
    students,
    selectedStudentId,
    setSelectedStudentId,
    selectedDate, // 🚀 مسمار التاريخ
    setSelectedDate // 🚀 مسمار التحكم
}: HeaderProps) {

    // الترتيب الزمني ديجا مخدوم فـ الـ Page الكبيرة
    const displayStudents = [...students];

    return (
        <header className="sticky top-4 z-[150] w-full px-4 md:px-8">
            <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2.5rem] px-4 py-2.5 flex items-center justify-between gap-4">

                {/* 1️⃣ اليسار: الـ Logo */}
                {/* 1️⃣ اليسار: الـ Logo + الكاليندريي (التحكم في الأرشيف) */}
                <div className="flex items-center gap-2 pr-2">
                    {/* اللوغو خليه صغيور باش يخلي البلاصة */}
                    <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-200">
                        <UserPlus size={16} />
                    </div>

                    {/* 📅 مسمار التاريخ: حطيناه بلاصة السمية د المنيجر */}
                    <div className="flex flex-col">
                        <input
                            type="date"
                            value={selectedDate.toISOString().split('T')[0]}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="bg-slate-100/80 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-bold outline-none transition-all cursor-pointer text-slate-700 shadow-inner"
                        />
                    </div>
                </div>

                {/* 2️⃣ الوسط: الـ Select النقي */}
                <div className="flex-1 max-w-md relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search size={16} />
                    </div>
                    <select
                        value={selectedStudentId || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            // 🚀 إيلا اختار القيمة الخاوية، كنعطيو null باش يرجع الفورم جديد
                            setSelectedStudentId(val === "" ? null : val);
                        }}
                        className="w-full pl-11 pr-10 py-2.5 bg-slate-100/50 border border-transparent rounded-full text-sm font-medium text-slate-700 outline-none appearance-none transition-all focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 cursor-pointer"
                    >
                        {/* ✨ هادا هو "الساروت": دابا ولا كيبان ف القائمة كخيار أول */}
                        <option value="" className="text-emerald-600 font-bold">
                            ➕ إضافة مترشح جديد
                        </option>

                        {displayStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                                👤 {s.first_name} {s.last_name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown size={14} />
                    </div>
                </div>

                {/* 3️⃣ اليمين: Profile */}
                <div className="flex items-center gap-2 pl-1">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[11px] font-bold text-slate-800 leading-none">يوسف بودينار</span>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-100 p-0.5 shadow-sm">
                        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <User size={20} />
                        </div>
                    </div>
                </div>

            </div>
        </header>
    );
}