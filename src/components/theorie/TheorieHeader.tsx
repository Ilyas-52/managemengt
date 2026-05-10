import { useState, useMemo } from 'react';
import { ChevronDown, UserPlus, Search, User, X } from 'lucide-react';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // 🔍 المسمار: فلترة اللائحة على حسب البحث (مع معالجة الأسماء الكاملة)
    const displayStudents = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return students;
        
        return students.filter(s => {
            const firstName = (s.first_name || '').toLowerCase();
            const lastName = (s.last_name || '').toLowerCase();
            const fullName = `${firstName} ${lastName}`;
            return firstName.includes(query) || lastName.includes(query) || fullName.includes(query);
        });
    }, [students, searchTerm]);

    const handleClearSearch = () => {
        setSearchTerm('');
        setIsSearchOpen(false);
    };

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

                {/* 2️⃣ الوسط: الـ Select النقي + البحث الذكي */}
                <div className="flex-1 max-w-md flex items-center gap-1 sm:gap-2 overflow-hidden">
                    
                    {/* 🔍 بوطون البحث المتطور */}
                    <div className={`relative flex items-center transition-all duration-300 ${isSearchOpen ? 'flex-[1.5] sm:flex-1' : 'w-10'}`}>
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shrink-0
                                ${isSearchOpen ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 bg-slate-100/50 hover:bg-emerald-50 hover:text-emerald-500'}`}
                        >
                            <Search size={18} />
                        </button>
                        
                        {isSearchOpen && (
                            <div className="absolute left-10 inset-y-0 right-0 flex items-center bg-slate-100/80 backdrop-blur-sm rounded-full pr-2 animate-in slide-in-from-left-2 duration-300 border border-emerald-500/20">
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="بحث..."
                                    className="flex-1 bg-transparent outline-none text-[11px] font-bold text-slate-700 px-1 min-w-0"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="p-1 text-slate-400 hover:text-rose-500 transition-colors">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 👤 القائمة المنسدلة (كتبقى ديما باينة باش يشوف النتائج) */}
                    <div className={`relative transition-all duration-300 ${isSearchOpen ? 'flex-1' : 'flex-[3]'}`}>
                        <select
                            value={selectedStudentId || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedStudentId(val === "" ? null : val);
                                // 🚀 مسمار: ملي يختار، يسد البحث باش يرجع الشكل العادي
                                if (isSearchOpen) setIsSearchOpen(false);
                            }}
                            className="w-full pl-2 pr-8 py-2.5 bg-slate-100/50 border border-transparent rounded-full text-[11px] sm:text-[12px] font-bold text-slate-700 outline-none appearance-none transition-all focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 cursor-pointer truncate"
                        >
                            <option value="" className="text-emerald-600 font-bold">
                                {isSearchOpen ? '➕' : '➕ إضافة مترشح جديد'}
                            </option>

                            {displayStudents.map((s) => (
                                <option key={s.id} value={s.id}>
                                    👤 {s.first_name} {s.last_name}
                                </option>
                            ))}
                            {displayStudents.length === 0 && searchTerm && (
                                <option disabled>❌ لا يوجد</option>
                            )}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <ChevronDown size={14} />
                        </div>
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