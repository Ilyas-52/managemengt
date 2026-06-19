'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import NotificationDropdown, { Notification } from '@/components/NotificationDropdown';
import { useNotifications } from '@/hooks/useNotifications';
import ManagerGPRS from '@/components/manager/ManagerGPRS';
import ManagerTrucks from '@/components/manager/ManagerTrucks';
import { Search, ShieldCheck, Truck, Scale, Menu, X, Calendar, ClipboardCheck, Wallet, Car, GraduationCap, Coins, ChevronDown, Gauge, FileText, LogOut } from 'lucide-react';

// استيراد الشقوف
import ManagerFinance from '@/components/manager/ManagerFinance';
import ManagerSuivi from '@/components/manager/ManagerSuivi';
import ManagerPlanning from '@/components/manager/ManagerPlanning';
import ManagerVehicle from '@/components/manager/ManagerVehicle';
import ManagerCash from '@/components/manager/ManagerCash';
import ManagerExams from '@/components/manager/ManagerExams';
import HolidaysTracker from '@/components/manager/HolidaysTracker';
import ManagerFleet from '@/components/manager/ManagerFleet';
import ManagerPenalties from '@/components/manager/ManagerPenalties';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { Agency, Student, ScheduleData, ExamResult, AttendanceRecord, CashRecord, VehicleLog } from '@/types/dashboard';

// ✅ المسمار الحقيقي: شحن الصفحة فقط فالمتصفح وبلا SSR
const GlobalReports = dynamic(() => import('@/components/manager/GlobalReports'), {
    ssr: false,
    loading: () => <div className="p-20 text-center font-black animate-pulse text-slate-300">جاري تحميل نظام الأرشيف...</div>
});

const getMonday = (date: string | Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 للأحد، 1 للاثنين ... 6 للسبت

    // 🚀 اللوجيك الجديد: السبت كيرجع لور، والأحد كيزيد لـ القدام
    if (day === 0) {
        // الأحد بوحدو اللي كيزيد نهار باش يبدأ سيمانة جديدة (الاثنين الجاي)
        d.setDate(d.getDate() + 1);
    } else {
        // السبت (6) ووسط السيمانة (1-5) كيرجعوا للاثنين ديال هاد السيمانة
        const diff = d.getDate() - day + 1;
        d.setDate(diff);
    }

    return d.toISOString().split('T')[0];
};

const days = [
    { id: 'monday', label: 'الاثنين' },
    { id: 'tuesday', label: 'الثلاثاء' },
    { id: 'wednesday', label: 'الأربعاء' },
    { id: 'thursday', label: 'الخميس' },
    { id: 'friday', label: 'الجمعة' },
    { id: 'saturday', label: 'السبت' }
];

// ✅ Helper: Read persisted dashboard state from localStorage safely
const readPersistedState = () => {
    try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('mgr_dashboard_state') : null;
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
};

// ✅ Helper: Write state to localStorage
const writePersistedState = (patch: Record<string, any>) => {
    try {
        const current = readPersistedState();
        window.localStorage.setItem('mgr_dashboard_state', JSON.stringify({ ...current, ...patch }));
    } catch { /* silent */ }
};

export default function ManagerTerminal() {
    const [loading, setLoading] = useState(false);
    const [activeStaff, setActiveStaff] = useState<string | null>(() => readPersistedState().activeStaff ?? null);
    const [activeSubTab, setActiveSubTab] = useState<string>(() => readPersistedState().activeSubTab ?? 'emploi');
    const [isIntroLoading, setIsIntroLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showHamzaSub, setShowHamzaSub] = useState(false);
    const [activeNathariTab, setActiveNathariTab] = useState<string>(() => readPersistedState().activeNathariTab ?? 'auto');
    const [showNathariSub, setShowNathariSub] = useState(false);
    const [showExamsSubMenu, setShowExamsSubMenu] = useState(false);
    const [showAgenciesMenu, setShowAgenciesMenu] = useState(false);
    // ✅ NEW: Tracks which agency folder is expanded (can differ from selectedAgency — allows collapsing)
    const [expandedAgencyId, setExpandedAgencyId] = useState<string | null>(() => readPersistedState().expandedAgencyId ?? null);

    const [students, setStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [hamzaSchedule, setHamzaSchedule] = useState<ScheduleData | null>(null);
    const [examResults, setExamResults] = useState<ExamResult[]>([]);
    const [hamzaAttendance, setHamzaAttendance] = useState<AttendanceRecord[]>([]);
    const [hamzaLedger, setHamzaLedger] = useState<CashRecord[]>([]);
    const [previousBalance, setPreviousBalance] = useState<number>(0);
    const [hamzaLogistics, setHamzaLogistics] = useState<Partial<VehicleLog>>({ mileage_start: 0, mileage_end: 0, fuel_expense: 0 });
    const lastFetchedAgencyId = useRef<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [agencies, setAgencies] = useState<Agency[]>([]);
    // Bootstrap selectedAgency from persisted state — will be replaced with full object once agencies load
    const [selectedAgency, setSelectedAgency] = useState<Agency | null>(() => readPersistedState().selectedAgency ?? null);

    // ✅ مسمار 01: منطق المدرسين ديال التطبيقي (Pratique)
    const practicalInstructor = useMemo(() => {
        const agencyName = (selectedAgency?.name || '').toUpperCase();
        if (agencyName === 'KRONA') return 'Bilal';
        if (agencyName === 'AZGHAR') return 'Ismail';
        if (agencyName === 'TAZAGHINE') return 'Belkassmi';
        return 'Hamza'; // Default لـ Boudinar وأي وكالة أخرى
    }, [selectedAgency]);

    const theoreticalInstructor = useMemo(() => {
        const agencyName = (selectedAgency?.name || '').toUpperCase();
        if (agencyName === 'KRONA') return 'Mohammed';
        if (agencyName === 'AZGHAR') return 'Brahim';
        if (agencyName === 'TAZAGHINE') return 'Zakaria/Wafae'; // ركز فـ هاد السمية خاصها تكون مطابقة للي فـ الداتابيز
        return 'Youssef'; // Default لـ Boudinar
    }, [selectedAgency]);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            window.localStorage.clear();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const { notifications, unreadCount, markAllAsRead, markSingleAsRead, deleteNotification } = useNotifications(selectedAgency?.name || 'Boudinar');
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchData = async () => {
        if (!selectedAgency?.id) return; // الحصار الذكي المصلح لعدم الكراش
        try {
            setLoading(true);
            const mondayStr = getMonday(selectedDate);

            // 1️⃣ جلب التلاميذ - هادي ناضية
            const { data: st, error: stErr } = await supabase
                .from('students')
                .select('*')
                .eq('agence_id', selectedAgency.id)
                .order('created_at', { ascending: false });

            if (stErr) throw stErr;
            if (st) setStudents(st);

            // 2️⃣ جلب الجدول الزمني (النسخة القارة Master Template)
            // ✅ مسمار الذكاء: كنجيبو السكاجول إيلا تبدلات الوكالة أوباقي ماعمرش ف الـ State كاع
            if (lastFetchedAgencyId.current !== selectedAgency.id || !hamzaSchedule) {
                const { data: sched } = await supabase
                    .from('weekly_schedules')
                    .select('*')
                    .eq('agence_id', selectedAgency.id)
                    .eq('week_start_date', '2000-01-01')
                    .maybeSingle();

                let finalSchedule = sched?.schedule_data || null;

                if (!finalSchedule) {
                    const { data: lastSch } = await supabase
                        .from('weekly_schedules')
                        .select('*')
                        .eq('agence_id', selectedAgency.id)
                        .order('week_start_date', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    finalSchedule = lastSch?.schedule_data || null;
                }
                setHamzaSchedule(finalSchedule);
                lastFetchedAgencyId.current = selectedAgency.id;
            }

            // 3️⃣ جلب نتائج الامتحانات
            const { data: res } = await supabase
                .from('exam_results')
                .select('*')
                .eq('agence_id', selectedAgency.id);

            // 4️⃣ جلب الحضور
            const { data: att } = await supabase
                .from('lesson_attendance')
                .select('*')
                .eq('agence_id', selectedAgency.id);

            // 5️⃣ جلب مصاريف السيارة
            const { data: vLog } = await supabase
                .from('vehicle_logs')
                .select('*')
                .eq('agence_id', selectedAgency.id)
                .eq('week_start_date', mondayStr)
                .maybeSingle();

            // 6️⃣ جلب الكاش (Petty Cash)
            const { data: pCash } = await supabase
                .from('petty_cash_ledger')
                .select('*')
                .eq('agence_id', selectedAgency.id)
                .order('created_at', { ascending: false });

            // 7️⃣ تحديث الـ State (كولشي كيعمر دقة وحدة)
            if (pCash) {
                const currentWeekEntries = pCash.filter(e => e.week_start_date === mondayStr);
                setHamzaLedger(currentWeekEntries);

                const prevBal = pCash
                    .filter(e => e.week_start_date && e.week_start_date < mondayStr)
                    .reduce((acc, entry) => entry.type === 'recette' ? acc + entry.amount : acc - entry.amount, 0);
                setPreviousBalance(prevBal);

                const bal = pCash.reduce((acc: number, curr: CashRecord) =>
                    curr.type === 'recette' ? acc + curr.amount : acc - curr.amount, 0
                ) || 0;

                setHamzaLogistics({
                    balance: bal,
                    mileage_start: vLog?.mileage_start || 0,
                    mileage_end: vLog?.mileage_end || 0,
                    fuel_expense: vLog?.fuel_expense || 0
                });
            } else {
                setHamzaLedger([]);
                setPreviousBalance(0);
                setHamzaLogistics({
                    balance: 0,
                    mileage_start: vLog?.mileage_start || 0,
                    mileage_end: vLog?.mileage_end || 0,
                    fuel_expense: vLog?.fuel_expense || 0
                });
            }

            setExamResults(res || []);
            setHamzaAttendance(att || []);

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("❌ Error fetching:", error.message);
            }
        } finally {
            setLoading(false);
        }
    };
    // 1️⃣ المسمار الأول: جلب الوكالات (هادي ناضية)
    // 1️⃣ جلب الوكالات من الداتابيز عند أول دخول وتثبيت بودينار كـ اختيار بدئي ذكي
    useEffect(() => {
        const fetchAgencies = async () => {
            const { data } = await supabase.from('agencies').select('*');
            if (data && data.length > 0) {
                setAgencies(data);

                const persisted = readPersistedState();
                // إذا كان هناك وكالة مخزنة سابقاً في الـ localStorage ولها وجود حقيقي
                if (persisted.selectedAgency?.id) {
                    const match = data.find((a: any) => a.id === persisted.selectedAgency.id);
                    if (match) {
                        setSelectedAgency(match);
                        setExpandedAgencyId(persisted.expandedAgencyId ?? null);
                        setIsIntroLoading(false); // نطلق التحميل فوراً
                        return;
                    }
                }

                // fallback ذكي: يفتش على بودينار بالاسم ويعينها كـ Default بلا تبلبوك
                const boudinarMatch = data.find((a: any) => a.name.includes('Boudinar') || a.name.includes('بودينار'));
                setSelectedAgency(boudinarMatch || data[0]);
            }
            setIsIntroLoading(false);
        };
        fetchAgencies();
    }, []);

    // 2️⃣ جلب الداتا (التحكم السريع): تفعيل الـ Fetch بمجرد شحن الـ selectedAgency بلا سباق وقت
    useEffect(() => {
        if (!isIntroLoading && selectedAgency?.id) {
            fetchData();
        }
    }, [selectedDate, isIntroLoading, selectedAgency?.id]); // الاعتماد على الـ id لمنع الـ Loops

    // 3️⃣ حفظ الحالة في الـ localStorage والـ History بذكاء وبلا تكرار وثقل
    useEffect(() => {
        if (isIntroLoading || !selectedAgency) return;

        const state = {
            activeStaff,
            activeSubTab,
            activeNathariTab,
            selectedAgency,
            expandedAgencyId,
        };
        writePersistedState(state);

        // مسمار الأمان: كنسجلو فـ الـ History غير إيلا تبدلات الصفحة الحقيقية ماشي غي فتح المينيو
        const historyState = { activeStaff, activeSubTab, activeNathariTab, agencyId: selectedAgency.id, expandedAgencyId };

        // منع الـ Push العشوائي إذا كانت الحالة متطابقة تماماً لتخفيف التلفون 100%
        if (window.history.state?.agencyId !== selectedAgency.id || window.history.state?.activeSubTab !== activeSubTab) {
            window.history.pushState(historyState, '');
        }
    }, [activeStaff, activeSubTab, activeNathariTab, selectedAgency?.id, expandedAgencyId, isIntroLoading]);

    // 4️⃣ الاستماع لـ سهم الرجوع (الخلف) وتحديث الواجهة بسلاسة
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            const s = e.state;
            if (!s) return;
            if (s.activeStaff !== undefined) setActiveStaff(s.activeStaff);
            if (s.activeSubTab) setActiveSubTab(s.activeSubTab);
            if (s.activeNathariTab) setActiveNathariTab(s.activeNathariTab);
            if (s.expandedAgencyId !== undefined) setExpandedAgencyId(s.expandedAgencyId);
            if (s.agencyId && agencies.length > 0) {
                const match = agencies.find(a => a.id === s.agencyId);
                if (match) setSelectedAgency(match);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [agencies]);

    const financialStats = useMemo(() => {
        return students.reduce((acc, s) => {
            const totalPrice = Number(s.total_price || 0);
            const paid = Number(s.tranche_1 || 0) + Number(s.tranche_2 || 0) + Number(s.tranche_3 || 0) + Number(s.tranche_4 || 0);
            return {
                totalRevenue: acc.totalRevenue + totalPrice,
                totalCollected: acc.totalCollected + paid,
                totalOutstanding: acc.totalOutstanding + (totalPrice - paid),
            };
        }, { totalRevenue: 0, totalCollected: 0, totalOutstanding: 0 });
    }, [students]);

    const filteredStudents = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return students;
        return students.filter(s => {
            const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
            return fullName.includes(term);
        });
    }, [students, searchTerm]);


    if (!isMounted) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-900 font-black">
                جاري التحميل...
            </div>
        );
    }

    return (
        <div className="min-h-screen !w-screen !flex bg-[#F3F4F6] font-black italic uppercase tracking-tighter overflow-x-hidden" dir="rtl">

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed right-0 top-0 w-[280px] h-full bg-white border-l border-slate-200 flex-col p-8 z-[50] overflow-y-auto custom-scrollbar">
                <h1 className="text-3xl text-[#0F5A3E] mb-6 italic font-black tracking-tighter leading-none">Younnes<br />.BO</h1>

                <div className="mb-8 space-y-4">
                    {/* 1. 🏢 المدرسة (Collapsible Agency Selector) */}
                    <div>
                        <button
                            onClick={() => setShowAgenciesMenu(!showAgenciesMenu)}
                            className={`w-full text-right p-5 rounded-[25px] border-2 font-black italic transition-all flex items-center justify-between ${showAgenciesMenu ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
                        >
                            <span className="flex items-center gap-2">🏢 المدرسة</span>
                            <ChevronDown size={16} className={`transition-transform duration-300 ${showAgenciesMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showAgenciesMenu && (
                            <div className="mr-4 pr-4 border-r-2 border-slate-100 flex flex-col gap-2 py-2 mt-2">
                                {agencies.map(agency => (
                                    <div key={agency.id} className="flex flex-col gap-1">
                                        <button
                                            onClick={() => {
                                                // ✅ Toggle: clicking the same agency again collapses it
                                                if (expandedAgencyId === agency.id) {
                                                    setExpandedAgencyId(null);
                                                    setShowNathariSub(false);
                                                    setShowHamzaSub(false);
                                                    return;
                                                }
                                                setStudents([]); setHamzaLedger([]); setHamzaSchedule(null);
                                                setHamzaAttendance([]); setExamResults([]);
                                                setHamzaLogistics({ balance: 0, mileage_start: 0, mileage_end: 0, fuel_expense: 0 });
                                                setSelectedAgency(agency);
                                                setExpandedAgencyId(agency.id);
                                                setActiveStaff(null); setShowNathariSub(false); setShowHamzaSub(false);
                                            }}
                                            className={`p-4 rounded-xl text-[11px] font-black italic transition-all text-right flex items-center justify-between ${expandedAgencyId === agency.id ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                        >
                                            <span>🏢 {agency.name === 'Boudinar' ? 'بودينار' : agency.name}</span>
                                            <ChevronDown size={12} className={`transition-transform duration-300 ${expandedAgencyId === agency.id ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Dropdown Folders ONLY for the expanded agency */}
                                        {expandedAgencyId === agency.id && (
                                            <div className="mr-4 pr-4 border-r-2 border-slate-200 flex flex-col gap-2 py-2">

                                                {/* A. 📝 النظري */}
                                                <div className="space-y-1">
                                                    <button
                                                        onClick={() => {
                                                            setActiveStaff(theoreticalInstructor);
                                                            setShowNathariSub(!showNathariSub);
                                                            setShowHamzaSub(false);
                                                        }}
                                                        className={`w-full text-right p-3 rounded-xl border font-black italic transition-all flex items-center justify-between ${(activeStaff?.trim().toLowerCase() === theoreticalInstructor.toLowerCase()) ? 'bg-[#0F5A3E] text-white border-[#0F5A3E]' : 'bg-slate-50 text-slate-500 border-transparent'}`}
                                                    >
                                                        <span className="flex items-center gap-2">📝 النظري</span>
                                                        <ChevronDown size={12} className={`transition-transform duration-300 ${showNathariSub ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {showNathariSub && (
                                                        <div className="mr-3 pr-3 border-r-2 border-emerald-100 flex flex-col gap-1 py-1">
                                                            <button onClick={() => { setActiveNathariTab('auto'); setActiveStaff(theoreticalInstructor); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeNathariTab === 'auto' ? 'bg-[#0F5A3E]/10 text-[#0F5A3E]' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                🚗 السيارات
                                                            </button>
                                                            {selectedAgency?.name === 'Boudinar' && (
                                                                <button onClick={() => { setActiveNathariTab('truck'); setActiveStaff(theoreticalInstructor); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeNathariTab === 'truck' ? 'bg-[#0F5A3E]/10 text-[#0F5A3E]' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                    🚛 الشاحنات
                                                                </button>
                                                            )}
                                                            <button onClick={() => { setActiveNathariTab('archive'); setActiveStaff(theoreticalInstructor); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeNathariTab === 'archive' ? 'bg-[#0F5A3E]/10 text-[#0F5A3E]' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                🗂️ الأرشيف
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* B. 🏎️ التطبيقي */}
                                                <div className="space-y-1">
                                                    <button
                                                        onClick={() => {
                                                            setActiveStaff(practicalInstructor);
                                                            setShowHamzaSub(!showHamzaSub);
                                                            setShowNathariSub(false);
                                                            if (activeSubTab === 'theorie' || activeSubTab === 'gprs' || activeSubTab === 'exams-truck') {
                                                                setActiveSubTab('emploi');
                                                            }
                                                        }}
                                                        className={`w-full flex items-center justify-between p-3 rounded-xl border font-black italic transition-all ${(activeStaff?.trim().toLowerCase() === practicalInstructor.toLowerCase()) ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-transparent'}`}
                                                    >
                                                        <span className="flex items-center gap-2">🏎️ التطبيقي</span>
                                                        <ChevronDown size={12} className={`transition-transform duration-300 ${showHamzaSub ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {showHamzaSub && (
                                                        <div className="mr-3 pr-3 border-r-2 border-slate-200 flex flex-col gap-1 py-1">
                                                            <button onClick={() => { setActiveSubTab('emploi'); setActiveStaff(practicalInstructor); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeSubTab === 'emploi' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                📅 البرنامج
                                                            </button>
                                                            <button onClick={() => { setActiveSubTab('vehicule'); setActiveStaff(practicalInstructor); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeSubTab === 'vehicule' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                🚗 السيارة
                                                            </button>
                                                            <button onClick={() => { setActiveSubTab('cash'); setActiveStaff(practicalInstructor); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeSubTab === 'cash' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                💰 الصندوق
                                                            </button>
                                                            <button onClick={() => { setActiveSubTab(selectedAgency?.name === 'Boudinar' ? 'exams-car' : 'exams'); setActiveStaff(practicalInstructor); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${(activeSubTab === 'exams' || activeSubTab === 'exams-car') ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                📝 الامتحانات
                                                            </button>
                                                            <button onClick={() => { setActiveSubTab('suivi'); setActiveStaff(practicalInstructor); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeSubTab === 'suivi' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                📊 التتبع
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. 🚛 امتحانات الوزن الثقيل (Global Master Tracking) */}
                    <button
                        onClick={() => {
                            const boudinar = agencies.find(a => a.name === 'Boudinar');
                            if (boudinar) setSelectedAgency(boudinar);
                            setActiveStaff('Hamza');
                            setActiveSubTab('exams-truck');
                            setShowNathariSub(false);
                            setShowHamzaSub(false);
                            setShowAgenciesMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
                            ${activeSubTab === 'exams-truck' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
                    >
                        <span className="flex items-center gap-2">🚛 امتحانات الوزن الثقيل</span>
                    </button>

                    {/* 3. 🛰️ GPRS */}
                    <button
                        onClick={() => {
                            const boudinar = agencies.find(a => a.name === 'Boudinar');
                            if (boudinar) setSelectedAgency(boudinar);
                            setActiveStaff('Hamza');
                            setActiveSubTab('gprs');
                            setShowNathariSub(false);
                            setShowHamzaSub(false);
                            setShowAgenciesMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
                            ${activeSubTab === 'gprs' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-blue-50'}`}
                    >
                        <span className="flex items-center gap-2">🛰️ GPRS</span>
                        <Gauge size={16} />
                    </button>

                    {/* 4. 📅 تتبع العطل */}
                    <button
                        onClick={() => {
                            setActiveStaff('holidays');
                            setShowNathariSub(false);
                            setShowHamzaSub(false);
                            setShowAgenciesMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
                            ${activeStaff === 'holidays' ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-orange-50'}`}
                    >
                        <span className="flex items-center gap-2">📅 تتبع العطل</span>
                        <Calendar size={16} />
                    </button>
                    {/* 🚗 تسيير سيارات ومصاريف المدرسة */}
                    <button
                        onClick={() => {
                            setActiveStaff('fleet'); // مسمار التوجيه للقسم الجديد
                            setShowNathariSub(false);
                            setShowHamzaSub(false);
                            setShowAgenciesMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
        ${activeStaff === 'fleet' ? 'bg-[#0F5A3E] text-white border-[#0F5A3E] shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-emerald-50'}`}
                    >
                        <span className="flex items-center gap-2">  تسيير مصاريف الصيانة للسيارات </span>
                        <Car size={16} />
                    </button>
                    {/* 🛑 بوطون نظام العقوبات الجديد تحت الصيانة ديريكت */}
                    {/* 🛑 نظام عقوبات الخدامة - مسمار الحزم والتحكم الصارم */}
                    <button
                        onClick={() => {
                            setActiveStaff('penalties'); // 🟢 التوجيه للقسم الجديد ديال العقوبات بنجاح!
                            setShowNathariSub(false);
                            setShowHamzaSub(false);
                            setShowAgenciesMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all mt-2
        ${activeStaff === 'penalties'
                                ? 'bg-[#ef4444] text-white border-[#ef4444] shadow-lg shadow-red-500/20'
                                : 'bg-slate-50 text-slate-500 border-transparent hover:bg-red-50'}`}
                    >
                        <span className="flex items-center gap-2">   نضام عقوبات العاملين  </span>
                        <Scale size={16} />
                    </button>
                    {/* 🗂️ مراقبة أسطول السيارات */}
                    <button
                        onClick={() => {
                            setActiveStaff('fleetOperations');
                            setShowNathariSub(false);
                            setShowHamzaSub(false);
                            setShowAgenciesMenu(false);
                            setIsSidebarOpen(false); // For mobile
                        }}
                        className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all mt-2
                            ${activeStaff === 'fleetOperations' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
                    >
                        <span className="flex items-center gap-2">🗂️   طلبات تسليم وارجاع السيارات</span>
                    </button>
                </div>
                <div className="mt-auto pt-10 text-[9px] text-slate-300 font-bold text-center italic uppercase">v2.0 • Powered by Mahamran</div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col w-full lg:pr-[280px] min-h-screen relative overflow-x-hidden pb-80 sm:pb-20">
                <header className="sticky top-0 w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-3 lg:px-10 lg:py-6 border-b border-slate-200 bg-white z-[1000] shadow-sm">
                    <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden text-slate-900 bg-slate-100 p-2.5 rounded-xl relative z-50 animate-pulse"
                        >
                            <Menu size={20} />
                        </button>

                        {/* ✅ مسمار 1: البحث يبان عند أي مدرس نظري أو في التابات المحددة */}
                        {(activeStaff?.trim().toLowerCase() === theoreticalInstructor.toLowerCase() || activeSubTab === 'suivi' || activeSubTab === 'exams' || activeSubTab === 'exams-car' || activeSubTab === 'exams-truck') ? (
                            <div className="relative flex-1 max-w-md w-full sm:w-auto">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="بـحث..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-100/80 border border-slate-200 rounded-xl py-2.5 pr-9 outline-none text-xs font-black text-slate-900"
                                    style={{ color: '#0f172a', fontWeight: 900, caretColor: '#0F5A3E' }}
                                />
                            </div>
                        ) : <div className="hidden sm:block text-[10px] text-slate-300 italic font-black uppercase">Auto Ecole {selectedAgency?.name || 'Boudinar'} Terminal</div>}
                    </div>

                    <div className="flex flex-row items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-black transition-colors border border-rose-100"
                        >
                            <LogOut size={14} />
                            <span className="hidden sm:inline">تسجيل الخروج</span>
                        </button>
                        <div className="flex items-center gap-3 px-4 py-2 border-2 border-slate-900 rounded-2xl bg-white shadow-sm transition-all hover:border-emerald-500 group w-full sm:w-auto justify-between sm:justify-start">
                            <Calendar size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col">
                                <span className="text-[7px] text-slate-400 font-bold uppercase leading-none mb-0.5">تحديد الأسبوع</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent text-slate-900 font-black outline-none text-xs cursor-pointer text-right"
                                    style={{ direction: 'ltr' }}
                                />
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <NotificationDropdown notifications={notifications} unreadCount={unreadCount} onMarkAllRead={markAllAsRead} onMarkSingleRead={markSingleAsRead} onDeleteNotification={deleteNotification} onNavigate={fetchData} />
                        </div>
                    </div>
                </header>

                <main className="p-4 lg:p-10 text-right" dir="rtl">
                    {!activeStaff ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                            <ShieldCheck size={60} className="text-[#0F5A3E] animate-pulse" />
                            <h2 className="text-xl font-black italic">مرحباً يونس... اختر طاقم العمل</h2>
                        </div>
                    ) : activeStaff === 'holidays' ? (
                        <div className="max-w-[1600px] mx-auto">
                            <HolidaysTracker />
                        </div>
                    ) : activeStaff === 'fleet' ? (
                        <div className="max-w-[1600px] mx-auto">
                            <ManagerFleet />
                        </div>
                    ) : activeStaff === 'penalties' ? ( // 🟢 المسمار الجديد: عزل وقراءة صفحة العقوبات فوريّاً
                        <div className="max-w-[1600px] mx-auto">
                            <ManagerPenalties />
                        </div>
                    ) : activeStaff === 'fleetOperations' ? (
                        <div className="max-w-[1600px] mx-auto">
                            <ManagerFleetOperations />
                        </div>
                    ) : ( // ⬅️ هنا كـيـتـكـمّـل الـ شرط للـ الأقسام لي باقة عندك تـحـت فـ الـ كود
                        <div className="max-w-[1600px] mx-auto space-y-8">
                            {/* ✅ مسمار 2: النظري يخدم مع أي مدرس نظري (براهيم، يوسف، محمد، زكرياء...) */}
                            {activeStaff?.trim().toLowerCase() === theoreticalInstructor.toLowerCase() ? (
                                <div className="space-y-8">
                                    {activeNathariTab === 'auto' && <ManagerFinance filteredStudents={filteredStudents} financialStats={financialStats} highlightedName={null} highlightExpiry={0} selectedAgency={selectedAgency} />}
                                    {activeNathariTab === 'truck' && selectedAgency?.name === 'Boudinar' && <ManagerTrucks selectedAgency={selectedAgency} />}
                                    {activeNathariTab === 'archive' && <GlobalReports selectedAgency={selectedAgency} />}
                                </div>
                            ) : (
                                /* ✅ مسمار 3: التطبيقي يخدم مع (حمزة، بلال، إسماعيل، بلقاسمي...) */
                                /* ✅ مسمار 01: توحيد لغة البرمجة لداخل */
                                <div className="space-y-8">
                                    {activeSubTab === 'emploi' && <ManagerPlanning hamzaSchedule={hamzaSchedule} days={days} selectedAgency={selectedAgency} instructorName={practicalInstructor} />}
                                    {activeSubTab === 'suivi' && <ManagerSuivi students={filteredStudents} hamzaAttendance={hamzaAttendance} selectedAgency={selectedAgency} instructorName={practicalInstructor} />}
                                    {activeSubTab === 'vehicule' && <ManagerVehicle mileage_start={hamzaLogistics.mileage_start || 0} mileage_end={hamzaLogistics.mileage_end || 0} fuel_expense={hamzaLogistics.fuel_expense || 0} selectedAgency={selectedAgency} instructorName={practicalInstructor} />}
                                    {activeSubTab === 'cash' && <ManagerCash balance={hamzaLogistics.balance || 0} ledger={hamzaLedger} previousBalance={previousBalance} selectedAgency={selectedAgency} instructorName={practicalInstructor} />}
                                    {(activeSubTab === 'exams-car' || activeSubTab === 'exams') && <ManagerExams students={filteredStudents} examResults={examResults} highlightedName={null} highlightExpiry={0} selectedAgency={selectedAgency} instructorName={practicalInstructor} selectedDate={selectedDate} />}
                                    {activeSubTab === 'exams-truck' && selectedAgency?.name === 'Boudinar' && <ManagerTrucks selectedAgency={selectedAgency} viewMode="exams" />}
                                    {activeSubTab === 'gprs' && selectedAgency?.name === 'Boudinar' && <ManagerGPRS weekDate={selectedDate} selectedAgency={selectedAgency} />}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-[5000] lg:hidden">
                    {/* Background Overlay - هادا هو اللي كيدير الضبابة وكيخليك تسد المينيو */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />

                    <aside className="absolute right-0 top-0 bottom-0 w-[300px] bg-white p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black italic">الـقـائـمـة</h2>
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-8 space-y-4">
                            {/* 1. 🏢 المدرسة (Collapsible Agency Selector) */}
                            <div>
                                <button
                                    onClick={() => setShowAgenciesMenu(!showAgenciesMenu)}
                                    className={`w-full text-right p-5 rounded-[25px] border-2 font-black italic flex items-center justify-between ${showAgenciesMenu ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
                                >
                                    <span className="flex items-center gap-2">🏢 المدرسة</span>
                                    <ChevronDown size={16} className={`transition-transform duration-300 ${showAgenciesMenu ? 'rotate-180' : ''}`} />
                                </button>
                                {showAgenciesMenu && (
                                    <div className="mr-4 pr-4 border-r-2 border-slate-100 flex flex-col gap-2 py-2 mt-2">
                                        {agencies.map(agency => (
                                            <div key={agency.id} className="flex flex-col gap-1">
                                                <button
                                                    onClick={() => {
                                                        // ✅ Toggle: clicking the same agency again collapses it
                                                        if (expandedAgencyId === agency.id) {
                                                            setExpandedAgencyId(null);
                                                            setShowNathariSub(false);
                                                            setShowHamzaSub(false);
                                                            return;
                                                        }
                                                        setStudents([]); setHamzaLedger([]); setHamzaSchedule(null);
                                                        setHamzaAttendance([]); setExamResults([]);
                                                        setHamzaLogistics({ balance: 0, mileage_start: 0, mileage_end: 0, fuel_expense: 0 });
                                                        setSelectedAgency(agency);
                                                        setExpandedAgencyId(agency.id);
                                                        setActiveStaff(null); setShowNathariSub(false); setShowHamzaSub(false);
                                                    }}
                                                    className={`p-4 rounded-xl text-[11px] font-black italic transition-all text-right flex items-center justify-between ${expandedAgencyId === agency.id ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                                >
                                                    <span>🏢 {agency.name === 'Boudinar' ? 'بودينار' : agency.name}</span>
                                                    <ChevronDown size={12} className={`transition-transform duration-300 ${expandedAgencyId === agency.id ? 'rotate-180' : ''}`} />
                                                </button>

                                                {/* Dropdown Folders ONLY for the expanded agency */}
                                                {expandedAgencyId === agency.id && (
                                                    <div className="mr-4 pr-4 border-r-2 border-slate-200 flex flex-col gap-2 py-2">

                                                        {/* A. 📝 النظري */}
                                                        <div className="space-y-1">
                                                            <button
                                                                onClick={() => {
                                                                    setActiveStaff(theoreticalInstructor);
                                                                    setShowNathariSub(!showNathariSub);
                                                                    setShowHamzaSub(false);
                                                                }}
                                                                className={`w-full text-right p-3 rounded-xl border font-black italic transition-all flex items-center justify-between ${(activeStaff?.trim().toLowerCase() === theoreticalInstructor.toLowerCase()) ? 'bg-[#0F5A3E] text-white border-[#0F5A3E]' : 'bg-slate-50 text-slate-500 border-transparent'}`}
                                                            >
                                                                <span className="flex items-center gap-2">📝 النظري</span>
                                                                <ChevronDown size={12} className={`transition-transform duration-300 ${showNathariSub ? 'rotate-180' : ''}`} />
                                                            </button>
                                                            {showNathariSub && (
                                                                <div className="mr-3 pr-3 border-r-2 border-emerald-100 flex flex-col gap-1 py-1">
                                                                    <button onClick={() => { setActiveNathariTab('auto'); setActiveStaff(theoreticalInstructor); setIsSidebarOpen(false); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeNathariTab === 'auto' ? 'bg-[#0F5A3E]/10 text-[#0F5A3E]' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                        🚗 السيارات
                                                                    </button>
                                                                    {selectedAgency?.name === 'Boudinar' && (
                                                                        <button onClick={() => { setActiveNathariTab('truck'); setActiveStaff(theoreticalInstructor); setIsSidebarOpen(false); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeNathariTab === 'truck' ? 'bg-[#0F5A3E]/10 text-[#0F5A3E]' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                            🚛 الشاحنات
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => { setActiveNathariTab('archive'); setActiveStaff(theoreticalInstructor); setIsSidebarOpen(false); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeNathariTab === 'archive' ? 'bg-[#0F5A3E]/10 text-[#0F5A3E]' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                        🗂️ الأرشيف
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* B. 🏎️ التطبيقي */}
                                                        <div className="space-y-1">
                                                            <button
                                                                onClick={() => {
                                                                    setActiveStaff(practicalInstructor);
                                                                    setShowHamzaSub(!showHamzaSub);
                                                                    setShowNathariSub(false);
                                                                    if (activeSubTab === 'theorie' || activeSubTab === 'gprs' || activeSubTab === 'exams-truck') {
                                                                        setActiveSubTab('emploi');
                                                                    }
                                                                }}
                                                                className={`w-full flex items-center justify-between p-3 rounded-xl border font-black italic transition-all ${(activeStaff?.trim().toLowerCase() === practicalInstructor.toLowerCase()) ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-transparent'}`}
                                                            >
                                                                <span className="flex items-center gap-2">🏎️ التطبيقي</span>
                                                                <ChevronDown size={12} className={`transition-transform duration-300 ${showHamzaSub ? 'rotate-180' : ''}`} />
                                                            </button>
                                                            {showHamzaSub && (
                                                                <div className="mr-3 pr-3 border-r-2 border-slate-200 flex flex-col gap-1 py-1">
                                                                    <button onClick={() => { setActiveSubTab('emploi'); setActiveStaff(practicalInstructor); setIsSidebarOpen(false); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeSubTab === 'emploi' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                        📅 البرنامج
                                                                    </button>
                                                                    <button onClick={() => { setActiveSubTab('vehicule'); setActiveStaff(practicalInstructor); setIsSidebarOpen(false); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeSubTab === 'vehicule' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                        🚗 السيارة
                                                                    </button>
                                                                    <button onClick={() => { setActiveSubTab('cash'); setActiveStaff(practicalInstructor); setIsSidebarOpen(false); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeSubTab === 'cash' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                        💰 الصندوق
                                                                    </button>
                                                                    <button onClick={() => { setActiveSubTab(selectedAgency?.name === 'Boudinar' ? 'exams-car' : 'exams'); setActiveStaff(practicalInstructor); setIsSidebarOpen(false); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${(activeSubTab === 'exams' || activeSubTab === 'exams-car') ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                        📝 الامتحانات
                                                                    </button>
                                                                    <button onClick={() => { setActiveSubTab('suivi'); setActiveStaff(practicalInstructor); setIsSidebarOpen(false); }} className={`flex items-center gap-2 p-3 rounded-lg text-[10px] font-black transition-all ${activeSubTab === 'suivi' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                                        📊 التتبع
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 2. 🚛 امتحانات الوزن الثقيل (Global Master Tracking) */}
                            <button
                                onClick={() => {
                                    const boudinar = agencies.find(a => a.name === 'Boudinar');
                                    if (boudinar) setSelectedAgency(boudinar);
                                    setActiveStaff('Hamza');
                                    setActiveSubTab('exams-truck');
                                    setShowNathariSub(false);
                                    setShowHamzaSub(false);
                                    setShowAgenciesMenu(false);
                                    setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
                                    ${activeSubTab === 'exams-truck' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
                            >
                                <span className="flex items-center gap-2">🚛 امتحانات الوزن الثقيل</span>
                            </button>

                            {/* 3. 🛰️ GPRS */}
                            <button
                                onClick={() => {
                                    const boudinar = agencies.find(a => a.name === 'Boudinar');
                                    if (boudinar) setSelectedAgency(boudinar);
                                    setActiveStaff('Hamza');
                                    setActiveSubTab('gprs');
                                    setShowNathariSub(false);
                                    setShowHamzaSub(false);
                                    setShowAgenciesMenu(false);
                                    setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
                                    ${activeSubTab === 'gprs' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-blue-50'}`}
                            >
                                <span className="flex items-center gap-2">🛰️ GPRS</span>
                                <Gauge size={16} />
                            </button>

                            {/* 4. 📅 تتبع العطل */}
                            <button
                                onClick={() => {
                                    setActiveStaff('holidays');
                                    setShowNathariSub(false);
                                    setShowHamzaSub(false);
                                    setShowAgenciesMenu(false);
                                    setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
                                    ${activeStaff === 'holidays' ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-orange-50'}`}
                            >
                                <span className="flex items-center gap-2">📅 تتبع العطل</span>
                                <Calendar size={16} />
                            </button>
                            {/* 🚗 تسيير سيارات ومصاريف المدرسة (تلفون) */}
                            <button
                                onClick={() => {
                                    setActiveStaff('fleet');
                                    setShowNathariSub(false);
                                    setShowHamzaSub(false);
                                    setShowAgenciesMenu(false);
                                    setIsSidebarOpen(false); // كيسد المينيو فـ التلفون فـ البلاصة
                                }}
                                className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all
        ${activeStaff === 'fleet' ? 'bg-[#0F5A3E] text-white border-[#0F5A3E] shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-emerald-50'}`}
                            >
                                <span className="flex items-center gap-2">  تسيير مصاريف الصيانة للسيارات </span>
                                <Car size={16} />
                            </button>
                            {/* 🛑 نظام عقوبات الخدامة (تلفون) - مسمار الحزم الصارم مع قفل المنيو التلقائي */}
                            <button
                                onClick={() => {
                                    setActiveStaff('penalties'); // التوجيه لقسم العقوبات
                                    setShowNathariSub(false);
                                    setShowHamzaSub(false);
                                    setShowAgenciesMenu(false);
                                    setIsSidebarOpen(false); // 🟢 المسمار الحاسم: كيسد المنيو فـ التلفون فـ البلاصة باش ما يغطيش الصفحة
                                }}
                                className={`w-full flex items-center justify-between p-5 rounded-[25px] border-2 font-black italic transition-all mt-2
        ${activeStaff === 'penalties'
                                        ? 'bg-[#ef4444] text-white border-[#ef4444] shadow-lg shadow-red-500/20'
                                        : 'bg-slate-50 text-slate-500 border-transparent hover:bg-red-50'}`}
                            >
                                <span className="flex items-center gap-2">  نضام عقوبات العاملين </span>
                                <Scale size={16} />
                            </button>
                            {/* 🗂️ مراقبة أسطول السيارات (Mobile) */}
                            <button
                                onClick={() => {
                                    setActiveStaff('fleetOperations');
                                    setShowNathariSub(false);
                                    setShowHamzaSub(false);
                                    setShowAgenciesMenu(false);
                                    setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-4 rounded-[25px] border-2 font-black italic transition-all mt-2 text-xs md:text-sm
        ${activeStaff === 'fleetOperations' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
                            >
                                {/* 🗂️ الـ أَيْقُونَة دِيعْمَا بَايْنَة فـ الـجَنْبْ فـ كَاع الـشَّاشَاتْ */}
                                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-200/50 text-slate-700 shrink-0">
                                    <Car size={16} />
                                </span>

                                {/* 📝 الـكِتَابَة دَابَا مَأْمَّنَة وغَاتِطْلَعْ فـ الـتِّيلِيفُونْ والـ PC بـزُوجْ بـ تَنَاسُقْ عَالَمِي */}
                                <span className="block text-right whitespace-nowrap overflow-hidden text-ellipsis">
                                    طلبات تسليم وارجاع السيارات
                                </span>
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}

// ==========================================
// Fleet Control Panel (Fleet Operations)
// ==========================================
function ManagerFleetOperations() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // 1️⃣ التعديل: البداية التلقائية ديريكت بـ Clio 4 ف البلاصة د الكل
    const [vehicleFilter, setVehicleFilter] = useState('Clio 4');

    const fetchRecords = async (filter: string) => {
        setLoading(true);

        // غانـاخدو غي الكلمة الأولى د الطوموبيل (مثلاً Peugeot أو Mercedes) باش نطابقو مع الداتابيز
        const cleanFilter = filter.split(' ')[0].trim();

        const { data } = await supabase
            .from('fleet_operations')
            .select('*')
            .ilike('vehicle_name', `%${cleanFilter}%`) // فلتر ذكي كيجيب الكلمة وخا تكون جزء من النص
            .order('created_at', { ascending: false });

        if (data) setRecords(data);
        setLoading(false);
    };

    useEffect(() => { fetchRecords(vehicleFilter); }, [vehicleFilter]);

    const handleVehicleChange = (val: string) => {
        setVehicleFilter(val);
    };

    const handleSave = async (id: string, max_vitesse: string, manager_notes: string) => {
        const { error } = await supabase
            .from('fleet_operations')
            .update({ max_vitesse, manager_notes })
            .eq('id', id);
        if (!error) {
            alert('✅ تم تحديث بيانات المراقبة بنجاح');
            fetchRecords(vehicleFilter);
        } else {
            alert('Error: ' + error.message);
        }
    };

    // 🗑️ دالة حذف عملية من الأسطول بالكامل مأمنة 100% بلا خط أحمر
    const handleDeleteFleet = async (id: string) => {
        try {
            const { error } = await supabase
                .from('fleet_operations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('✅ تم حذف العملية بنجاح');
            window.location.reload();

        } catch (error: any) {
            alert('❌ خطأ في الحذف: ' + error.message);
        }
    };

    const handleEditFleet = (row: any) => {
        console.log("📝 Editing row:", row);
        alert('خاصية التعديل السريع قيد التطوير.');
    };

    const getDriverBadge = () => {
        if (vehicleFilter === 'Clio 4') return "👤 السائق: بلال • وكالة كرونا";
        if (vehicleFilter === 'Peugeot 208') return "👤 السائق: حمزة • وكالة بودينار";
        if (vehicleFilter === 'Opel Corsa') return "👤    السائق: بلقاسمي  • وكالة تازغين";
        if (vehicleFilter === 'Dacia Logan') return "👤   السائق: إسماعيل  • وكالة ازغار";
        // 🌟 مسمار البادج: ضبط السائق والوكالة لـ Mercedes 190 تابعة لـ بودينار
        if (vehicleFilter === 'Mercedes 190') return "👤 السائق: يونس (المدير)   ";
        return "🗂️ سيارة الأسطول الحالية";
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-[35px] shadow-sm border border-slate-200 w-full" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                <div className="text-right">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-2 flex items-center gap-2 justify-start">
                        <Car size={22} className="text-slate-700" />   طلبات تسليم وارجاع السيارات
                    </h2>
                    <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">
                        {getDriverBadge()}
                    </span>
                </div>
                <div className="w-full md:w-56 text-right">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">تصفية حسب السيارة</label>
                    <select
                        value={vehicleFilter}
                        onChange={(e) => handleVehicleChange(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-slate-300 cursor-pointer"
                    >
                        <option value="Clio 4">Clio 4</option>
                        <option value="Peugeot 208">Peugeot 208</option>
                        <option value="Opel Corsa">Opel Corsa</option>
                        <option value="Dacia Logan">Dacia Logan</option>
                        {/* 🌟 مسمار الفلتر: إضافة خيار الـ Mercedes 190 ف الـ Select د المانجر */}
                        <option value="Mercedes 190">Mercedes 190 </option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
                <table className="w-full text-right border-collapse text-xs font-black" style={{ minWidth: '1300px' }}>
                    <thead>
                        <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-400 text-[11px] uppercase">
                            <th className="p-3 rounded-tr-xl">الحالة</th>
                            <th className="p-3">السيارة</th>
                            <th className="p-3">من</th>
                            <th className="p-3">الى</th>
                            <th className="p-3">📥 تسليم (KM / تاريخ)</th>
                            <th className="p-3">📤 إرجاع (KM / تاريخ)</th>
                            <th className="p-3">مسافة</th>
                            <th className="p-3">البنزين</th>
                            <th className="p-3 text-center">📸 صور التسليم</th>
                            <th className="p-3 text-center">📸 صور الإرجاع</th>
                            <th className="p-3">السرعة القصوى</th>
                            <th className="p-3">ملاحظات</th>
                            <th className="p-3 text-center rounded-tl-xl">🛠️ الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                        {records.map(row => (
                            <FleetRow key={row.id} row={row} onSave={handleSave} onDelete={handleDeleteFleet} onEdit={handleEditFleet} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function FleetRow({ row, onSave, onDelete, onEdit }: { row: any; onSave: (id: string, max_vitesse: string, manager_notes: string) => void; onDelete?: (id: string) => void; onEdit?: (row: any) => void }) {
    const [maxVitesse, setMaxVitesse] = useState(row.max_vitesse || '');
    const [managerNotes, setManagerNotes] = useState(row.manager_notes || '');

    // 🔒 ساروت التحكم: واش الخانات مفتوحين للتعديل أو مقفولين
    const [isEditable, setIsEditable] = useState(false);

    const isClosed = row.status === 'closed';

    // تفكيك النص الطويل وتحويله لمصفوفة
    let images: any[] = [];
    if (row.images_urls) {
        if (typeof row.images_urls === 'string') {
            try {
                const firstParse = JSON.parse(row.images_urls);
                if (Array.isArray(firstParse)) images = firstParse;
                else images = [row.images_urls];
            } catch (e) { images = [row.images_urls]; }
        } else if (Array.isArray(row.images_urls)) {
            images = row.images_urls;
        }
    }

    const handleConfirmSave = () => {
        // عيط للدالة د الحفظ الأصلية ديالك وصيفط ليها الداتا
        onSave(row.id, maxVitesse, managerNotes);
        setIsEditable(false); // قفل الخانات عاوتاني مورا الحفظ
    };

    return (
        <tr className={`hover:bg-slate-50/60 transition-colors align-top border-b border-slate-100 ${isEditable ? 'bg-amber-50/20' : ''}`}>
            {/* Status Badge */}
            <td className="p-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide whitespace-nowrap ${isClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {isClosed ? '✅ مغلق' : '🟡 مفتوح'}
                </span>
            </td>
            {/* Vehicle */}
            <td className="p-3 text-slate-700 whitespace-nowrap font-black">{row.vehicle_name || '---'}</td>
            {/* Operator */}
            <td className="p-3 text-slate-700 whitespace-nowrap">{row.operator_name || '---'}</td>
            {/* Counterparty */}
            <td className="p-3 text-slate-600 whitespace-nowrap">{row.counterparty_name || '---'}</td>
            {/* Handover */}
            <td className="p-3" dir="ltr">
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-bold text-slate-900">{row.km_reading ?? '---'} km</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{row.log_date} {row.log_time}</span>
                </div>
            </td>
            {/* Return */}
            <td className="p-3" dir="ltr">
                {isClosed ? (
                    <div className="flex flex-col items-end gap-0.5">
                        <span className="font-bold text-slate-900">{row.km_reading_return ?? '---'} km</span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{row.log_date_return} {row.log_time_return}</span>
                    </div>
                ) : (
                    <span className="text-slate-300 italic text-[10px] whitespace-nowrap">لم يُرجع بعد</span>
                )}
            </td>
            {/* Distance */}
            <td className="p-3">
                {isClosed && row.distance_traveled != null ? (
                    <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap">
                        {row.distance_traveled} km
                    </span>
                ) : <span className="text-slate-300">---</span>}
            </td>
            {/* Fuel */}
            <td className="p-3">
                {isClosed && row.fuel_expenses != null ? (
                    <span className="bg-orange-50 text-orange-800 px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap">
                        {row.fuel_expenses} DH
                    </span>
                ) : <span className="text-slate-300">---</span>}
            </td>

            {/* 📥 صور التسليم */}
            <td className="p-3 border-b text-center align-middle">
                <div className="grid grid-cols-2 gap-1 mx-auto w-[84px]">
                    {images.map((imgStr: any, i: number) => {
                        try {
                            const parsed = typeof imgStr === 'string' ? JSON.parse(imgStr) : imgStr;
                            if (parsed && parsed.type === 'handover') {
                                return (
                                    <img key={i} src={parsed.url} alt="تسليم" className="w-10 h-10 object-cover rounded-xl border-2 border-emerald-100 shadow-sm cursor-pointer hover:scale-110 transition-transform shrink-0" onClick={() => window.open(parsed.url, '_blank')} />
                                );
                            }
                        } catch (e) {
                            if (typeof imgStr === 'string' && !imgStr.includes('"type"')) {
                                return (
                                    <img key={i} src={imgStr} alt="قديم" className="w-10 h-10 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:scale-110 transition-transform shrink-0" onClick={() => window.open(imgStr, '_blank')} />
                                );
                            }
                        }
                        return null;
                    }).filter(Boolean)}
                    {images.filter(imgStr => {
                        try {
                            const p = typeof imgStr === 'string' ? JSON.parse(imgStr) : imgStr;
                            return p.type === 'handover' || (typeof imgStr === 'string' && !imgStr.includes('"type"'));
                        } catch { return true; }
                    }).length === 0 && <span className="text-slate-300 font-bold col-span-2 text-center">—</span>}
                </div>
            </td>

            {/* 📤 صور الإرجاع */}
            <td className="p-3 border-b text-center align-middle">
                <div className="grid grid-cols-2 gap-1 mx-auto w-[84px]">
                    {images.map((imgStr: any, i: number) => {
                        try {
                            const parsed = typeof imgStr === 'string' ? JSON.parse(imgStr) : imgStr;
                            if (parsed && parsed.type === 'return') {
                                return (
                                    <img key={i} src={parsed.url} alt="إرجاع" className="w-10 h-10 object-cover rounded-xl border-2 border-blue-100 shadow-sm cursor-pointer hover:scale-110 transition-transform shrink-0" onClick={() => window.open(parsed.url, '_blank')} />
                                );
                            }
                        } catch (e) { return null; }
                        return null;
                    }).filter(Boolean)}
                    {images.filter(imgStr => {
                        try {
                            const p = typeof imgStr === 'string' ? JSON.parse(imgStr) : imgStr;
                            return p.type === 'return';
                        } catch { return false; }
                    }).length === 0 && <span className="text-slate-300 font-bold col-span-2 text-center">—</span>}
                </div>
            </td>

            {/* 🏎️ السرعة القصوى: مقفولة أوتوماتيك ومفتوحة غي بـ زر تعديل */}
            <td className="p-3">
                <input
                    type="text"
                    disabled={!isEditable} // 🔒 قفل صارم هنا
                    value={maxVitesse}
                    onChange={e => setMaxVitesse(e.target.value)}
                    placeholder="km/h"
                    className={`w-16 border-2 rounded-lg px-2 py-1.5 outline-none text-center text-xs font-bold transition-colors ${isEditable ? 'bg-white border-amber-400 focus:border-amber-500' : 'bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed'}`}
                />
            </td>
            {/* 📝 الملاحظات: مقفولة أوتوماتيك ومفتوحة غي بـ زر تعديل */}
            <td className="p-3">
                <input
                    type="text"
                    disabled={!isEditable} // 🔒 قفل صارم هنا
                    value={managerNotes}
                    onChange={e => setManagerNotes(e.target.value)}
                    placeholder="ملاحظات..."
                    className={`w-36 border-2 rounded-lg px-2 py-1.5 outline-none text-xs font-bold transition-colors ${isEditable ? 'bg-white border-amber-400 focus:border-amber-500' : 'bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed'}`}
                />
            </td>

            {/* 🛠️ الإجراءات الفنية الصافية */}
            <td className="p-3 text-center">
                <div className="flex flex-col items-center gap-1 min-w-[120px]">
                    {/* بوطون الحفظ كيبان غي إيلا برك على تعديل وفتح الخانات */}
                    {isEditable ? (
                        <button
                            type="button"
                            onClick={handleConfirmSave}
                            className="w-full px-2 py-1 text-[10px] font-black text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors shadow-sm"
                        >
                            💾 حفظ التغييرات
                        </button>
                    ) : (
                        <div className="w-full text-center text-[10px] font-bold text-slate-400 py-1 bg-slate-50 rounded-md border border-slate-100 select-none">
                            🔒 السطر مقفول
                        </div>
                    )}
                    <div className="flex gap-1 w-full">
                        <button
                            type="button"
                            onClick={() => setIsEditable(!isEditable)}
                            className={`flex-1 py-0.5 text-[10px] font-black rounded-md transition-colors border ${isEditable ? 'text-slate-700 bg-slate-100 border-slate-300 hover:bg-slate-200' : 'text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'}`}
                        >
                            {isEditable ? 'إلغاء' : 'تعديل'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm('واش بصح باغي تمسح هاد السطر؟')) {
                                    onDelete?.(row.id);
                                }
                            }}
                            className="flex-1 py-0.5 text-[10px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border border-rose-100"
                        >
                            حذف
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
}
