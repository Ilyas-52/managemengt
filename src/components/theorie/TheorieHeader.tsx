import { useState, useMemo } from 'react';
import { ChevronDown, UserPlus, Search, User, X, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    license_type?: string;
    status?: string;
}

interface HeaderProps {
    students: Student[];
    selectedStudentId: string | null;
    setSelectedStudentId: (id: string | null) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
}

export default function TheorieHeader({
    students,
    selectedStudentId,
    setSelectedStudentId,
    selectedDate,
    setSelectedDate
}: HeaderProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

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

    const groupedStudents = useMemo(() => {
        const groups: { [key: string]: Student[] } = {
            B: [],
            C: [],
            D: [],
            E: [],
            A: [],
        };

        displayStudents.forEach(s => {
            if (s.status !== 'archived') {
                const type = s.license_type || 'B';
                if (groups[type]) {
                    groups[type].push(s);
                } else {
                    groups['B'].push(s);
                }
            }
        });

        return groups;
    }, [displayStudents]);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            window.localStorage.clear();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <header className="sticky top-4 z-[150] w-full px-2 md:px-8">
            <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[2rem] sm:rounded-[2.5rem] px-2 sm:px-4 py-2 flex items-center justify-between gap-1 sm:gap-4">

                {/* 1️⃣ اليسار: الـ Logo + التاريخ */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0">
                        <UserPlus size={14} />
                    </div>
                    <input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="bg-slate-100/80 px-1.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold outline-none w-20 sm:w-auto"
                    />
                </div>

                {/* 2️⃣ الوسط: البحث والـ Select (الخدمة هنا) */}
                <div className="flex-1 flex items-center gap-1 relative min-w-0">

                    {/* بوطون البحث */}
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all shrink-0
                            ${isSearchOpen ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 bg-slate-100/50'}`}
                    >
                        <Search size={16} />
                    </button>

                    {/* خانة البحث - ولات كطلع فوق الـ Select فاش كتحل */}
                    {isSearchOpen && (
                        <div className="absolute left-9 right-0 inset-y-0 z-20 flex items-center bg-white border border-emerald-500/30 rounded-full px-3 shadow-sm animate-in slide-in-from-left-1">
                            <input
                                autoFocus
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && displayStudents.length > 0) {
                                        setSelectedStudentId(displayStudents[0].id);
                                        setSearchTerm('');
                                        setIsSearchOpen(false);
                                    }
                                }}
                                placeholder="بحث عن تلميذ..."
                                className="flex-1 bg-transparent outline-none text-[11px] font-bold text-slate-700 min-w-0"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="p-1 text-rose-500">
                                    <X size={14} />
                                </button>
                            )}
                            <button onClick={() => setIsSearchOpen(false)} className="ml-1 text-slate-400 p-1">
                                <ChevronDown size={14} className="rotate-90" />
                            </button>

                            {/* 🚀 القائمة المنبثقة للنتائج (جديد) */}
                            {searchTerm && (
                                <div className="absolute top-[calc(100%+10px)] left-0 right-0 bg-white border border-slate-100 rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[300] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="max-h-60 overflow-y-auto">
                                        {displayStudents.map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    setSelectedStudentId(s.id);
                                                    setSearchTerm('');
                                                    setIsSearchOpen(false);
                                                }}
                                                className="w-full text-right px-4 py-3 hover:bg-emerald-50 flex items-center justify-between group transition-all border-b border-slate-50 last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700">{s.first_name} {s.last_name}</span>
                                                </div>
                                                <ChevronDown size={12} className="-rotate-90 text-slate-300 group-hover:text-emerald-400" />
                                            </button>
                                        ))}
                                        {displayStudents.length === 0 && (
                                            <div className="px-4 py-6 text-center text-slate-400 text-[10px] font-bold">
                                                ❌ لا يوجد نتائج
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* الـ Select - نقصنا ليه العرض ف التلفون */}
                    <div className="relative flex-1 min-w-0">
                        <select
                            value={selectedStudentId || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedStudentId(val === "" ? null : val);
                                if (isSearchOpen) setIsSearchOpen(false);
                            }}
                            className="w-full pl-2 pr-7 py-2 bg-slate-100/50 border border-transparent rounded-full text-[10px] sm:text-[12px] font-bold text-slate-700 outline-none appearance-none truncate"
                        >
                            <option value="">{isSearchOpen ? '➕' : '➕ مترشح جديد'}</option>

                            {groupedStudents.B.length > 0 && (
                                <optgroup label="🚗 صنف السيارات (Permis B)">
                                    {groupedStudents.B.map(s => (
                                        <option key={s.id} value={s.id}>
                                            👤 {s.first_name} {s.last_name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {groupedStudents.C.length > 0 && (
                                <optgroup label="🚛 صنف الشاحنات (Permis C)">
                                    {groupedStudents.C.map(s => (
                                        <option key={s.id} value={s.id}>
                                            👤 {s.first_name} {s.last_name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {groupedStudents.D.length > 0 && (
                                <optgroup label="🚌 صنف الحافلات (Permis D)">
                                    {groupedStudents.D.map(s => (
                                        <option key={s.id} value={s.id}>
                                            👤 {s.first_name} {s.last_name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {groupedStudents.E.length > 0 && (
                                <optgroup label="🛞 صنف الرموك (Permis E)">
                                    {groupedStudents.E.map(s => (
                                        <option key={s.id} value={s.id}>
                                            👤 {s.first_name} {s.last_name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {groupedStudents.A.length > 0 && (
                                <optgroup label="🏍️ صنف الدراجات (Permis A)">
                                    {groupedStudents.A.map(s => (
                                        <option key={s.id} value={s.id}>
                                            👤 {s.first_name} {s.last_name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>

                {/* 3️⃣ اليمين: Profile (مخبي ف التلفون باش يخلي المساحة) */}
                <div className="flex items-center shrink-0 gap-2">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full text-xs font-black transition-colors"
                    >
                        <LogOut size={14} />
                        <span className="hidden sm:inline">تسجيل الخروج</span>
                    </button>
                    <div className="hidden sm:flex w-10 h-10 rounded-full border-2 border-slate-100 p-0.5">
                        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <User size={18} />
                        </div>
                    </div>
                </div>

            </div>
        </header>
    );
}