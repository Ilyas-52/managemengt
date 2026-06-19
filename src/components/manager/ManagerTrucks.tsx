'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
    AlertTriangle, Timer, Wallet, TrendingUp, CheckCircle2,
    Calendar, Truck, MapPin, Trash2, Save, Activity, User, CreditCard,
    Search, ChevronDown, UserPlus, X, GraduationCap, Trophy, AlertCircle, History
} from 'lucide-react';
import { generateWeeklyBilan } from './WeeklyTrucksReport';

import { Agency } from '@/types/dashboard';

// 🚀 المسمار 1: الـ Interface لضبط أنواع البيانات ومنع الأخطاء
interface TruckFormData {
    id?: string;
    firstName: string;
    lastName: string;
    registrationDate: string;
    examDate: string;
    licenseType: string;
    trainingLocation: string;
    totalPrice: string | number;
    paidTimbreIn: number;
    paidMedicalIn: number;
    // ✅ المسمار الجديد: الملاحظات
    notes: string;
    t1: string | number; t2: string | number; t3: string | number; t4: string | number; t5: string | number;
    t1_date: string; t2_date: string; t3_date: string; t4_date: string; t5_date: string;
    [key: string]: string | number | boolean | undefined;
}

interface HeavyExamData {
    theory_date: string;
    theory_result: 'admis' | 'echoue' | '';
    theory_result_2: 'admis' | 'echoue' | '';
    practical_date: string;
    practical_result: 'admis' | 'echoue' | '';
    practical_result_2: 'admis' | 'echoue' | '';
}

export function parseHeavyExamData(student: any): HeavyExamData {
    const defaultData: HeavyExamData = {
        theory_date: student.exam_date || '',
        theory_result: '',
        theory_result_2: '',
        practical_date: '',
        practical_result: '',
        practical_result_2: ''
    };
    if (!student.notes) return defaultData;
    const match = student.notes.match(/\[EXAM_DATA:({.*?})\]/);
    if (match) {
        try {
            const parsed = JSON.parse(match[1]);
            return {
                theory_date: parsed.theory_date || student.exam_date || '',
                theory_result: parsed.theory_result || '',
                theory_result_2: parsed.theory_result_2 || '',
                practical_date: parsed.practical_date || '',
                practical_result: parsed.practical_result || '',
                practical_result_2: parsed.practical_result_2 || ''
            };
        } catch (e) {
            console.error("Error parsing EXAM_DATA:", e);
        }
    }
    return defaultData;
}

interface Props {
    selectedAgency?: Agency | null;
    viewMode?: 'registration' | 'exams';
}

export default function ManagerTrucks({ selectedAgency, viewMode = 'registration' }: Props) {
    const [fetching, setFetching] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
    const [showArchiveMenu, setShowArchiveMenu] = useState(false);

    // 📥 1. جلب البيانات من Supabase مع الفلترة حسب الوكالة النشطة
    const fetchStudents = async () => {
        if (!selectedAgency?.id) return;
        setFetching(true);

        let query = supabase.from('truck_students').select('*');

        // المقر الرئيسي (بودينار): تجاوز الفلترة الصارمة لرؤية جميع الطلبة من جميع الوكالات
        if (selectedAgency.name !== 'Boudinar') {
            query = query.eq('agence_id', selectedAgency.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) setStudents(data);
        setFetching(false);
    };

    useEffect(() => {
        const fetchAgencies = async () => {
            const { data, error } = await supabase.from('agencies').select('id, name');
            if (!error && data) setAgencies(data);
        };
        fetchAgencies();
    }, []);

    const getAgencyName = (agenceId: string | null | undefined) => {
        if (!agenceId) return 'مؤسسة يونس ';
        const agency = agencies.find(a => String(a.id) === String(agenceId));
        return agency ? agency.name : 'مؤسسة يونس ';
    };

    // 🚀 المسمار المطرّق: real-time subscription لـ truck_students
    useEffect(() => {
        if (!selectedAgency?.id) return;
        fetchStudents();

        const channel = supabase.channel(`truck-students-sync-${selectedAgency.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'truck_students',
                filter: selectedAgency.name !== 'Boudinar' ? `agence_id=eq.${selectedAgency.id}` : undefined
            }, () => {
                fetchStudents();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedAgency]);

    const handleDelete = async (id: string) => {
        if (!confirm("واش بصح باغي تمسح هاد التسجيل؟")) return;
        const { error } = await supabase.from('truck_students').delete().eq('id', id);
        if (!error) fetchStudents();
    };
    // 🖨️ دالة توليد وطباعة PDF أرشيف الوزن الثقيل حسب الصنف (C, D, E, A)
   // 🖨️ دالة توليد وطباعة PDF أرشيف الوزن الثقيل المؤمنة ضد الـ Crashes
    // 🖨️ دالة توليد وطباعة PDF أرشيف الوزن الثقيل المؤمنة ضد الـ Crashes
    // 🖨️ دالة توليد وطباعة PDF أرشيف الوزن الثقيل الموجهة بالمنيو (C, D, E, A)
    // 🖨️ دالة توليد وطباعة PDF أرشيف الوزن الثقيل مع الـ Console.log الذكي لتتبع العطب
    // 🖨️ دالة توليد وطباعة PDF أرشيف الوزن الثقيل بالفورمات الصارمة A4 لمنع تنقاز السطور
    const handlePrintArchiveReport = (licenseClass: string) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const printWindow = iframe.contentWindow;
        if (!printWindow) return;

        // الفرز الصارم: كيجيب غي المترشحين لي مؤرشفين + الصنف لي تختار من المنيو
        const targetStudents = students.filter(s => {
            const sType = s.license_type || s.licenseType || 'C';
            return s.status === 'archived' && String(sType).trim().toUpperCase() === licenseClass.toUpperCase();
        });

        if (targetStudents.length === 0) {
            alert(`🔍 ما كاين حتى تلميذ مؤرشف حالياً فـ صنف (${licenseClass})`);
            return;
        }

        try {
            const rows = targetStudents.map((s, index) => {
                const name = `${s.first_name || ''} ${s.last_name || ''}`;
                const paid = [1, 2, 3, 4, 5].reduce((sum, n) => sum + (Number(s[`t${n}`]) || 0), 0);
                const rest = (Number(s.total_price) || 0) - paid;
                
                let isWinner = false;
                if (s && s.notes) {
                    try {
                        const examData = parseHeavyExamData(s);
                        const isTheoryPassed = examData.theory_result === 'admis' || examData.theory_result_2 === 'admis';
                        const isPracticalPassed = examData.practical_result === 'admis' || examData.practical_result_2 === 'admis';
                        isWinner = isTheoryPassed && isPracticalPassed;
                    } catch (examError) {
                        // تفادي أي بلكسة بسبب خطأ فردي ف الملاحظات
                    }
                }

                const resultBadge = isWinner 
                    ? '<span style="color: #16a34a; font-weight: 900;">✅ ناجح</span>' 
                    : '<span style="color: #ca8a04; font-weight: 900;">🟡 مؤرشف</span>';

                return `
                    <tr>
                        <td style="width: 40px; font-weight: 700; text-align: center;">${index + 1}</td>
                        <td class="student-name">${name}</td>
                        <td style="text-align: center; color: #475569;">${s.registration_date || '---'}</td>
                        <td style="text-align: center; font-weight: 700; color: #2563eb;">${s.exam_date || '---'}</td>
                        <td style="text-align: center; font-size: 12px;">${resultBadge}</td>
                        <td style="text-align: center; font-weight: 700; color: #0f172a;">${s.total_price || 0} DH</td>
                        <td style="text-align: center; color: #16a34a; font-weight: 700;">${paid} DH</td>
                        <td style="text-align: center; font-weight: 900; color: ${rest === 0 ? '#16a34a' : '#dc2626'}; background-color: ${rest === 0 ? '#f0fdf4' : '#fef2f2'}; font-size: 12px;">
                            ${rest === 0 ? 'خالص ✓' : `${rest} DH`}
                        </td>
                    </tr>
                `;
            }).join('');

            const agencyName = selectedAgency?.name || 'مؤسسة بودينار';

            printWindow.document.write(`
                <html dir="rtl">
                <head>
                    <title>أرشيف الوزن الثقيل - صنف (${licenseClass})</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
                        
                        /* 📐 محاصرة قياس الـ A4 ومحاربة الهوامش العشوائية */
                        @page { 
                            size: A4 portrait; 
                            margin: 10mm 15mm 15mm 15mm; 
                        }
                        
                        * { box-sizing: border-box; }
                        body { 
                            font-family: 'Tajawal', sans-serif; 
                            direction: rtl; 
                            padding: 0; 
                            margin: 0; 
                            background: white; 
                            color: #1e293b;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        
                        .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #0f172a; padding-bottom: 12px; }
                        .header h1 { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
                        .agency-badge { display: inline-block; padding: 4px 14px; background-color: #f1f5f9; color: #334155; border-radius: 8px; font-size: 12px; font-weight: 900; margin-top: 8px; border: 1px solid #cbd5e1; }
                        
                        /* 📊 حصر الجدول لمنع الخروج عن الإطار */
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: auto; }
                        th, td { border: 1px solid #0f172a; padding: 8px 6px; font-size: 12px; vertical-align: middle; }
                        th { background-color: #f8fafc; font-weight: 900; color: #0f172a; text-align: center; }
                        
                        /* 🛡️ منع تشتيت أو قطع السطور عشوائياً */
                        tr { page-break-inside: avoid; page-break-after: auto; }
                        
                        .student-name { text-align: right; font-weight: 700; padding-right: 8px; color: #0f172a; font-size: 13px; }
                        .summary-info { margin-top: 20px; font-size: 12px; color: #475569; font-weight: 700; display: flex; justify-content: space-between; }
                        .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 5px; background: white; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🗂️ أرشيف الوزن الثقيل - صنف (${licenseClass})</h1>
                        <div class="agency-badge">${agencyName}</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40px;">#</th>
                                <th>الاسم الكامل للمترشح</th>
                                <th style="width: 85px;">تاريخ التسجيل</th>
                                <th style="width: 85px;">تاريخ الامتحان</th>
                                <th style="width: 100px;">النتيجة النهائية</th>
                                <th style="width: 85px;">الثمن الإجمالي</th>
                                <th style="width: 85px;">المبلغ المدفوع</th>
                                <th style="width: 100px;">المبلغ المتبقي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>

                    <div class="summary-info">
                        <span>إجمالي ملفات الأرشيف (صنف ${licenseClass}): ${targetStudents.length} مترشح</span>
                        <span>تاريخ الاستخراج المباشر: ${new Date().toLocaleDateString('ar-MA')}</span>
                    </div>

                    <div class="footer">
                        نظام إدارة أوتو إيكول بودينار - تقرير أرشيف الوزن الثقيل
                    </div>

                    <script>
                        window.onload = () => { setTimeout(() => { window.print(); }, 300); };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        } catch (globalError) {
            console.error("❌ خطأ أثناء توليد الطباعة:", globalError);
        }
    };

    // 📊 حساب الحصيلة
    const stats = students.reduce((acc, s) => {
        const total = Number(s.total_price) || 0;
        const paid = [1, 2, 3, 4, 5].reduce((sum, n) => sum + (Number(s[`t${n}`]) || 0), 0);
        acc.exp += total; acc.coll += paid; acc.rem += (total - paid);
        return acc;
    }, { exp: 0, coll: 0, rem: 0 });

    const filteredStudents = students.filter(s => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;
        const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
        const licenseType = (s.license_type || '').toLowerCase();
        return fullName.includes(query) || licenseType.includes(query);
    });

    const examStudents = useMemo(() => {
        return students
            .filter(s => {
                const examData = parseHeavyExamData(s);
                const hasDate = (examData.theory_date && examData.theory_date.trim() !== '') ||
                    (examData.practical_date && examData.practical_date.trim() !== '');
                return hasDate;
            })
            .sort((a, b) => {
                const dateA = a.exam_date || '';
                const dateB = b.exam_date || '';
                if (!dateA) return 1;
                if (!dateB) return -1;
                return new Date(dateA).getTime() - new Date(dateB).getTime();
            });
    }, [students]);

    const filteredExamStudents = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return examStudents;
        return examStudents.filter(s => {
            const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
            const licenseType = (s.license_type || '').toLowerCase();
            return fullName.includes(query) || licenseType.includes(query);
        });
    }, [examStudents, searchTerm]);

    if (viewMode === 'exams') {
        const examStats = examStudents.reduce((acc, s) => {
            acc.scheduled++;
            const examData = parseHeavyExamData(s);

            const isTheory1Failed = examData.theory_result === 'echoue';
            const isTheory2Passed = examData.theory_result_2 === 'admis';
            const isTheory2Failed = examData.theory_result_2 === 'echoue';
            const isEliminatedTheory = isTheory1Failed && isTheory2Failed;
            const usedLifeInTheory = isTheory1Failed && isTheory2Passed;
            const isTheoryPassed = examData.theory_result === 'admis' || isTheory2Passed;
            const isPracticalPassed = examData.practical_result === 'admis' || examData.practical_result_2 === 'admis';
            const isEliminatedPractical = usedLifeInTheory && examData.practical_result === 'echoue';
            const isWinner = isTheoryPassed && isPracticalPassed;
            const isTotalFailure = isEliminatedTheory || isEliminatedPractical;

            if (isWinner) {
                acc.passed++;
            } else if (isTotalFailure) {
                acc.failed++;
            }
            return acc;
        }, { scheduled: 0, passed: 0, failed: 0 });
  

        return (
            <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-4 space-y-10 pb-40 font-black italic text-right uppercase tracking-tighter overflow-x-hidden" dir="rtl">
                {/* Header */}
                <div className="sticky top-0 z-[150] w-full pt-2">
                    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-[2.5rem] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0">
                                <GraduationCap size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black italic uppercase leading-none">{selectedAgency?.name || 'وكالة'}</span>
                                <h1 className="text-lg font-black text-slate-900 mt-1">تتبع امتحانات الوزن الثقيل</h1>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="w-full md:flex-1 md:max-w-md relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={16} /></div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="بحث عن مترشح (الاسم أو الصنف)..."
                                className="w-full pl-11 pr-10 py-3 bg-slate-100/80 border border-slate-200 rounded-full text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-[#0F5A3E] transition-all text-right"
                                style={{ color: '#0f172a', fontWeight: 900, caretColor: '#0F5A3E' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Exam Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-700">
                    <div className="bg-white border-2 border-slate-100 rounded-[25px] p-6 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[9px] text-slate-400">الامتحانات المبرمجة</p>
                            <h2 className="text-2xl text-slate-900 leading-none">{examStats.scheduled} مترشح</h2>
                        </div>
                        <Calendar size={24} className="text-slate-200" />
                    </div>
                    <div className="bg-white border-2 border-emerald-100 rounded-[25px] p-6 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[9px] text-emerald-600">الناجحون</p>
                            <h2 className="text-2xl text-emerald-600 leading-none">{examStats.passed} ناجح</h2>
                        </div>
                        <CheckCircle2 size={24} className="text-emerald-500" />
                    </div>
                    <div className="bg-white border-2 border-rose-100 rounded-[25px] p-6 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[9px] text-rose-400">الراسبون</p>
                            <h2 className="text-2xl text-rose-600 leading-none">{examStats.failed} راسب</h2>
                        </div>
                        <AlertTriangle size={24} className="text-rose-500" />
                    </div>
                </div>

                {/* ── شبكة النتائج المفلترة (Twin of ManagerExams.tsx) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-1000">
                    {filteredStudents.map(s => {
                        const examData = parseHeavyExamData(s);

                        const isTheory1Failed = examData.theory_result === 'echoue';
                        const isTheory2Passed = examData.theory_result_2 === 'admis';
                        const isTheory2Failed = examData.theory_result_2 === 'echoue';
                        const isTheoryPassed = examData.theory_result === 'admis' || isTheory2Passed;
                        const usedLifeInTheory = isTheory1Failed && isTheory2Passed;
                        const isEliminatedTheory = isTheory1Failed && isTheory2Failed;
                        const isEliminatedPractical = usedLifeInTheory && examData.practical_result === 'echoue';
                        const isTotalFailure = isEliminatedTheory || isEliminatedPractical;
                        const isWinner = isTheoryPassed && (examData.practical_result === 'admis' || examData.practical_result_2 === 'admis');

                        const name = `${s.first_name} ${s.last_name}`;

                        return (
                            <div key={s.id}
                                className={`group relative border-2 transition-all duration-500 rounded-[35px] bg-white overflow-hidden 
                                    ${isWinner ? 'border-emerald-500 shadow-xl' :
                                        isTotalFailure ? 'border-red-500 opacity-90' : 'border-slate-100 shadow-sm'}`}
                            >
                                {/* ── HEADER ── */}
                                <div className={`px-6 py-5 flex flex-col gap-3 border-b transition-colors 
                                    ${isWinner ? 'bg-emerald-50' : isTotalFailure ? 'bg-red-50' : 'bg-slate-50'}`}>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${isWinner ? 'bg-emerald-500 text-white' : isTotalFailure ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                <User size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{name}</span>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded-md font-black uppercase italic">
                                                        Permis {s.license_type || 'C'}
                                                    </span>
                                                    <span className="bg-orange-500 text-white text-[9px] px-2 py-0.5 rounded-md font-black shadow-sm">
                                                        الوكالة: {getAgencyName(s.agence_id)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {isWinner ? (
                                            <Trophy size={14} className="text-emerald-500 animate-pulse" />
                                        ) : isTotalFailure ? (
                                            <AlertCircle size={14} className="text-red-500" />
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-2 bg-white/60 w-fit px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                        <Calendar size={12} className="text-[#0F5A3E]" />
                                        <span className="text-[10px] font-black text-slate-700">موعد الامتحان: {examData.theory_date || 'غير محدد'}</span>
                                    </div>
                                </div>

                                <div className="p-5 space-y-4">
                                    {/* 1. نتائج النظري */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 text-[9px] uppercase font-black text-slate-400 px-1">
                                            <History size={10} /> مسار النظري
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className={`p-2 rounded-2xl border text-center ${examData.theory_result === 'admis' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : examData.theory_result === 'echoue' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                                <p className="text-[10px] font-black">{examData.theory_result === 'admis' ? 'ناجح' : examData.theory_result === 'echoue' ? 'راسب' : '---'}</p>
                                            </div>
                                            <div className={`p-2 rounded-2xl border text-center ${examData.theory_result_2 === 'admis' ? 'bg-blue-50 border-blue-200 text-blue-700' : examData.theory_result_2 === 'echoue' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                                <p className="text-[10px] font-black">{examData.theory_result_2 === 'admis' ? 'ناجح' : examData.theory_result_2 === 'echoue' ? 'راسب' : '---'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. نتائج التطبيقي */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 text-[9px] uppercase font-black text-slate-400 px-1">
                                            <History size={10} /> مسار التطبيقي
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className={`p-2 rounded-2xl border text-center ${examData.practical_result === 'admis' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : examData.practical_result === 'echoue' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                                <p className="text-[10px] font-black">{examData.practical_result === 'admis' ? 'ناجح' : examData.practical_result === 'echoue' ? 'راسب' : '---'}</p>
                                            </div>
                                            <div className={`p-2 rounded-2xl border text-center ${examData.practical_result_2 === 'admis' ? 'bg-blue-50 border-blue-200 text-blue-700' : examData.practical_result_2 === 'echoue' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                                <p className="text-[10px] font-black">{examData.practical_result_2 === 'admis' ? 'ناجح' : examData.practical_result_2 === 'echoue' ? 'راسب' : '---'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredExamStudents.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 italic">لا يوجد امتحانات مبرمجة حالياً</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    const activeStudentsOnly = filteredStudents.filter(s => s.status !== 'archived');

    return (
        /* ✅ التعديل: نقصنا الـ Padding فـ الشاشات الكبيرة وزدنا max-w باش يبقى الوسط */
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-4 space-y-10 pb-40 font-black italic text-right uppercase tracking-tighter overflow-x-hidden" dir="rtl">
            {/* 🛰️ 4. الـ HEADER بـ الـ SEARCH النقي */}
            <div className="sticky top-0 z-[150] w-full pt-2">
                <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-[2.5rem] px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* 1. اللوغو والزر - مجموعين فـ صف واحد فـ الموبيل */}
                    {/* 🚛 الهيدر المعدل: جامع اللوغو + بوطون الأرشيف الجديد وبوطون التقرير الأسبوعي فـ صف واحد منظم */}
                    <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0">
                                <Truck size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black italic uppercase leading-none">{selectedAgency?.name || 'وكالة'}</span>
                            </div>
                        </div>

                        {/* 🌟 تجمع الأزرار: بوطون الأرشيف والتقرير مستفين جنبا إلى جنب */}
                        {/* 🌟 بوطونات الإدارة الموحدة مع المنيو المنسدل للأصناف الكبيرة */}
                    <div className="flex items-center gap-2 relative">
                        {/* 🗂️ بوطون الأرشيف مع القائمة المنسدلة الذكية */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowArchiveMenu(!showArchiveMenu)}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-[15px] text-[10px] font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 border-none cursor-pointer"
                            >
                                <History size={14} className="text-slate-400" />
                                <span>🗂️ استخراج أرشيف صنف</span>
                                <ChevronDown size={12} className={`transition-transform duration-200 ${showArchiveMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showArchiveMenu && (
                                <div className="absolute left-0 mt-2 w-52 bg-white border-2 border-slate-900 rounded-2xl shadow-xl z-[200] overflow-hidden text-right animate-in slide-in-from-top-2 duration-150">
                                    <p className="p-3 text-[8px] font-black text-slate-400 bg-slate-50 border-b border-slate-100 select-none">اختر صنف الوزن الثقيل:</p>
                                    {[
                                        { key: 'C', label: '🚛 صنف C (الشاحنات)' },
                                        { key: 'D', label: '🚌 صنف D (الحافلات)' },
                                        { key: 'E', label: '🚛 صنف E (الرموك)' },
                                        { key: 'A', label: '🏍️ صنف A (الدراجات)' }
                                    ].map(item => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => {
                                                handlePrintArchiveReport(item.key); // 👈 دابا غاتخدم بـ الفن وبلا خط أحمر حيت الدالة الفوق واجدة تـقـبـلـها
                                                setShowArchiveMenu(false);
                                            }}
                                            className="w-full text-right px-4 py-3 hover:bg-slate-50 text-xs font-black text-slate-800 transition-colors border-none bg-transparent cursor-pointer block"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 🟢 بوطون التقرير الأسبوعي الأصلي ديالك (بقا كيم كان بـ المليلمتر) */}
                        <button
                            type="button"
                            onClick={() => generateWeeklyBilan(students, selectedAgency?.name || 'Boudinar')}
                            className="bg-[#0F5A3E] hover:bg-emerald-800 text-white px-4 py-2.5 rounded-[15px] text-[10px] font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 border-b-2 border-emerald-900 cursor-pointer"
                        >
                            <Calendar size={14} className="text-emerald-300" />
                            <span>التقرير الأسبوعي</span>
                        </button>
                    </div>
                    </div>

                    {/* 2. البحث - كاياخد العرض كامل فـ الموبيل */}
                    <div className="w-full md:flex-1 md:max-w-md relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={16} /></div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="بحث عن مترشح (الاسم أو صنف الرخصة)..."
                            className="w-full pl-11 pr-10 py-3 bg-slate-100/80 border border-slate-200 rounded-full text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-[#0F5A3E] transition-all text-right"
                            style={{ color: '#0f172a', fontWeight: 900, caretColor: '#0F5A3E' }}
                        />
                    </div>

                    {/* 3. پروفيل المستخدم - مخفي فـ الموبيل باش يخلي التيساع */}
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-[11px] font-black italic">يونس بودينار</span>
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border-2 border-white shadow-sm"><User size={20} /></div>
                    </div>
                </div>
            </div>

            {/* 🔝 STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-700">
                <div className="bg-white border-2 border-slate-100 rounded-[25px] p-6 flex items-center justify-between shadow-sm">
                    <div><p className="text-[9px] text-slate-400">إجمالي المداخيل</p><h2 className="text-2xl text-slate-900 leading-none">{stats.exp} DH</h2></div>
                    <TrendingUp size={24} className="text-slate-200" />
                </div>
                <div className="bg-white border-2 border-emerald-100 rounded-[25px] p-6 flex items-center justify-between shadow-sm">
                    <div><p className="text-[9px] text-emerald-600">المبلغ المحصل عليه</p><h2 className="text-2xl text-emerald-600 leading-none">{stats.coll} DH</h2></div>
                    <Wallet size={24} className="text-emerald-500" />
                </div>
                <div className="bg-white border-2 border-rose-100 rounded-[25px] p-6 flex items-center justify-between shadow-sm">
                    <div><p className="text-[9px] text-rose-400">الديون العالقة</p><h2 className="text-2xl text-rose-600 leading-none">{stats.rem} DH</h2></div>
                    <AlertTriangle size={24} className="text-rose-500 animate-pulse" />
                </div>
            </div>

            {/* 📱 نسخة التليفون: Cards ناضيين */}
            <div className="grid grid-cols-1 gap-4 sm:hidden animate-in slide-in-from-bottom-4 duration-1000">
                {activeStudentsOnly.map(s => {
                    const paid = [1, 2, 3, 4, 5].reduce((sum, n) => sum + (Number(s[`t${n}`]) || 0), 0);
                    const rest = (s.total_price || 0) - paid;

                    return (
                        <div key={s.id} className="bg-white border-2 border-slate-900 rounded-[35px] p-6 space-y-4 shadow-xl relative overflow-hidden">

                            {/* 👤 الجزء العلوي */}
                            <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                                <div className="space-y-2">
                                    {/* ✅ السمية + أيقونة الملاحظة */}
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg text-slate-900 font-black leading-none uppercase italic">
                                            {s.first_name} {s.last_name}
                                        </p>

                                        {/* 💡 مسمار الملاحظة فـ التليفون */}
                                        {s.notes && (
                                            <div className="bg-emerald-100 text-emerald-700 p-1 rounded-lg animate-bounce">
                                                <Activity size={12} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                        <span className="bg-slate-900 text-white text-[10px] px-3 py-1 rounded-lg font-black tracking-tighter uppercase italic">
                                            Permis {s.license_type || 'C'}
                                        </span>
                                        <span className="bg-[#0F5A3E] text-white text-[9px] px-2 py-1 rounded-md font-black shadow-sm">
                                            {s.training_location === 'lboubsi' ? 'البوبسي' :
                                                s.training_location === 'YOUNESS' ? 'مؤسسة يونس' :
                                                    s.training_location === 'sa3lity' ? 'السعليتي' :
                                                        (s.training_location || 'السعليتي')}
                                        </span>
                                        <span className="bg-orange-500 text-white text-[9px] px-2 py-1 rounded-md font-black shadow-sm">
                                            الوكالة: {getAgencyName(s.agence_id)}
                                        </span>
                                    </div>
                                    {/* 📅 تواريخ التسجيل والامتحان فـ التليفون */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                                            <Calendar size={10} className="text-slate-500" />
                                            <span className="text-[9px] font-black text-slate-700 italic">سجل فـ: {s.registration_date}</span>
                                        </div>

                                        {s.exam_date && (
                                            <div className="flex items-center gap-1.5 bg-amber-100 px-2 py-1 rounded-lg border border-amber-200">
                                                <Timer size={10} className="text-amber-600" />
                                                <span className="text-[9px] font-black text-amber-800 italic">الامتحان: {s.exam_date}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-left font-black italic">
                                    <p className="text-[14px] text-slate-900 leading-none">{s.total_price} DH</p>
                                    <p className="text-[7px] text-slate-400 uppercase">الإجمالي</p>
                                </div>
                            </div>

                            {/* ✅ عرض الملاحظة إيلا كانت كاينة (كتطلع تحت السمية فـ التليفون) */}
                            {s.notes && (
                                <div className="mt-2 bg-slate-900 text-white p-3 rounded-[20px] border-b-4 border-emerald-500 shadow-lg animate-in slide-in-from-right-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity size={10} className="text-emerald-400" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">ملاحظة المدير يونس</span>
                                    </div>
                                    <p className="text-[10px] font-bold italic leading-tight text-slate-100">
                                        {s.notes}
                                    </p>
                                </div>
                            )}

                            {/* 💳 الدفعات (T1-T5) */}
                            <div className="grid grid-cols-5 gap-1.5">
                                {[1, 2, 3, 4, 5].map(n => {
                                    const amount = s[`t${n}`];
                                    const dateRaw = s[`t${n}_date`];
                                    const isPaid = Number(amount) > 0;

                                    // ✅ مسمار التفكيك الذكي
                                    let cleanDate = '';
                                    let cleanTime = '';
                                    if (isPaid && dateRaw) {
                                        const parts = dateRaw.split('T');
                                        cleanDate = parts[0].substring(5); // كياخد غير "الشهر-اليوم" (مثلا 05-07) باش يجي صغير
                                        if (parts[1]) cleanTime = parts[1].substring(0, 5); // كياخد "13:45"
                                    }

                                    return (
                                        <div key={n} className="flex flex-col gap-1">
                                            {/* 💰 مربع الدفعة (بقا صغير باش يقدنا السطر) */}
                                            <div className={`h-11 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${isPaid ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                <span className={`text-[6px] font-bold italic ${isPaid ? 'text-emerald-400' : ''}`}>T{n}</span>
                                                <span className="text-[9px] font-black">{amount || '--'}</span>
                                            </div>

                                            {/* 🕒 التاريخ والوقت (كيبانو غير إيلا كاين الخلاص) */}
                                            {isPaid && dateRaw && (
                                                <div className="flex flex-col items-center leading-none bg-slate-100/50 rounded-xl py-1.5 border border-slate-200 mt-1 shadow-sm">
                                                    {/* ✅ مسمار التاريخ الكامل: كيهز من 0 تال 10 يعني (2026-05-07) */}
                                                    <span className="text-[7.5px] font-black text-slate-900 mb-1 tracking-tighter">
                                                        {dateRaw.substring(0, 10)}
                                                    </span>

                                                    {/* ✅ الوقت بستايل نقي ومفصول */}
                                                    <div className="flex items-center gap-0.5">
                                                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                                        <span className="text-[7px] font-bold text-slate-500 tabular-nums uppercase">
                                                            {dateRaw.split('T')[1]?.substring(0, 5) || '--:--'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* الدوائر والوضعية المالية (بقا كولشي هو هاداك) */}
                            <div className="flex justify-between items-center mt-3 border-t border-slate-100 pt-3">
                                <div className="flex gap-2">
                                    <div className={`w-10 h-10 rounded-full border-2 flex flex-col items-center justify-center ${s.paid_timbre_in ? 'bg-orange-500 border-orange-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                        <span className="text-[8px] font-black">TB</span>
                                        <span className="text-[6px]">{s.paid_timbre_in || ''}</span>
                                    </div>
                                    <div className={`w-10 h-10 rounded-full border-2 flex flex-col items-center justify-center ${s.paid_medical_in ? 'bg-blue-50 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                        <span className="text-[8px] font-black">VM</span>
                                        <span className="text-[6px]">{s.paid_medical_in || ''}</span>
                                    </div>
                                </div>

                                {/* 🚨 تنبيه الامتحان فـ التليفون */}
                                {(s.exam_date && rest > 0) && (
                                    <div className="bg-orange-500 text-white p-3 rounded-2xl flex items-center justify-center gap-3 shadow-lg border-b-4 border-orange-700 mb-2 animate-bounce">
                                        <AlertTriangle size={18} strokeWidth={3} />
                                        <p className="text-[11px] font-black italic uppercase">🚨 خطر: المترشح عندو امتحان ومازال ماتخلصناش!</p>
                                    </div>
                                )}

                                {/* 🚩 الوضعية المالية (اللي كانت عندك ديجا) */}
                                <div className={`p-4 rounded-2xl text-center font-black text-[13px] ${rest === 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                    {rest === 0 ? '✓ حساب خالص' : `الباقي : ${rest} DH`}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 💻 نسخة الـ PC: Tableau احترافي */}
            <div className="hidden sm:block bg-white border-2 border-slate-100 rounded-[45px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-right border-separate border-spacing-0">
                        <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase italic">
                            <tr>
                                {/* 👤 الاسم بوحدو */}
                                <th className="p-8 sticky right-0 bg-white z-40 border-l border-slate-100 w-[200px] text-slate-900 font-black">المترشح</th>
                                {/* 🚚 الصنف بوحدو */}
                                <th className="text-center font-black w-[150px]"> الصنف / المكان</th>
                                {/* 🏦 الوكالة */}
                                <th className="text-center font-black w-[130px]">الوكالة</th>
                                <th className="text-center font-black">الثمن الكلي</th>
                                <th className="text-center font-black">الدفعات (T1-T5)</th>
                                <th className="text-center w-[80px] font-black">TB</th>
                                <th className="text-center w-[80px] font-black">VM</th>
                                <th className="text-center font-black">التواريخ</th>
                                <th className="text-left pl-8 font-black">الوضعية المالية</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fetching ? (
                                <tr><td colSpan={8} className="p-20 text-center animate-pulse font-black text-slate-300">جاري جلب البيانات...</td></tr>
                            ) : activeStudentsOnly.map(s => {
                                const paid = [1, 2, 3, 4, 5].reduce((sum, n) => sum + (Number(s[`t${n}`]) || 0), 0);
                                const rest = (s.total_price || 0) - paid;
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer">

                                        {/* 👤 1. الاسم (بوحدو ناضي) */}
                                        {/* 👤 1. الاسم (مع مسمار الملاحظة الذكية) */}
                                        <td className="p-8 sticky right-0 bg-white group-hover:bg-slate-50 border-l-2 border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <p className="font-black text-slate-900 text-base leading-none uppercase italic">
                                                    {s.first_name} {s.last_name}
                                                </p>

                                                {/* 💡 مسمار الملاحظة بـ ديزاين جديد وهيبة */}
                                                {s.notes && (
                                                    <div className="relative group/note">
                                                        {/* الأيقونة بستايل زوين */}
                                                        <div className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center cursor-help hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm border border-amber-200">
                                                            <Activity size={12} strokeWidth={3} />
                                                        </div>

                                                        {/* 🎈 البلونة الذكية */}
                                                        <div className="absolute bottom-full right-0 mb-3 hidden group-hover/note:block z-[100] w-72 bg-white border-2 border-slate-900 rounded-[25px] shadow-2xl animate-in fade-in zoom-in duration-300">
                                                            <div className="p-4 relative">
                                                                {/* العنوان بـ هيبة المدير */}
                                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                                    <span className="text-[10px] font-black text-slate-900 uppercase">ملاحظات من يونس: مدير المؤسسة</span>
                                                                </div>

                                                                {/* النص ديال الملاحظة */}
                                                                <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed pr-2">
                                                                    "{s.notes}"
                                                                </p>

                                                                {/* مسمار المثلث */}
                                                                <div className="absolute top-[100%] right-5 w-4 h-4 bg-white border-r-2 border-b-2 border-slate-900 rotate-45 -translate-y-2"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        {/* 🚚 2. الصنف والحالة (فـ خانة بوحدهم وبـ العربية) */}
                                        {/* 🚀 الترجمة الفورية للعربية فـ الجدول (PC) */}
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="bg-slate-900 text-white text-[10px] px-3 py-1 rounded-lg font-black tracking-tighter shadow-sm border border-slate-800 uppercase italic">
                                                    Permis {s.license_type || 'C'}
                                                </span>
                                                <span className="bg-[#0F5A3E] text-white text-[11px] px-3 py-1 rounded-lg font-black shadow-sm border border-emerald-900">
                                                    {s.training_location === 'lboubsi' ? 'البوبسي' :
                                                        s.training_location === 'YOUNESS' ? 'مؤسسة يونس' :
                                                            s.training_location === 'sa3lity' ? 'السعليتي' :
                                                                (s.training_location || 'السعليتي')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* 🏦 الوكالة */}
                                        <td className="p-4 text-center">
                                            <span className="bg-orange-500 text-white text-[10px] px-3 py-1 rounded-lg font-black tracking-tighter shadow-sm border border-orange-600">
                                                {getAgencyName(s.agence_id)}
                                            </span>
                                        </td>

                                        <td className="text-center text-slate-500 font-black italic">DH {s.total_price}</td>

                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {[1, 2, 3, 4, 5].map(n => {
                                                    const amount = s[`t${n}`];
                                                    const dateRaw = s[`t${n}_date`]; // التاريخ اللي جاي من Supabase

                                                    let cleanDate = '--';
                                                    let cleanTime = '';

                                                    if (dateRaw) {
                                                        // ✅ مسمار التفكيك: كنفرقو التاريخ على الوقت
                                                        const parts = dateRaw.split('T');
                                                        cleanDate = parts[0]; // كيهز: 2026-05-07
                                                        if (parts[1]) {
                                                            cleanTime = parts[1].substring(0, 5); // كيهز: 13:45 (كيطير الثواني و UTC)
                                                        }
                                                    }

                                                    const isPaid = Number(amount) > 0;

                                                    return (
                                                        <div key={n} className="flex flex-col items-center gap-1.5">
                                                            {/* 💰 مربع الدفعة */}
                                                            <div className={`w-16 h-14 rounded-[20px] border-2 flex flex-col items-center justify-center transition-all ${isPaid ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                                <span className={`text-[7px] font-black uppercase ${isPaid ? 'text-emerald-400' : 'text-slate-400'}`}>T{n}</span>
                                                                <span className="text-[12px] font-black italic">{amount || '--'}</span>
                                                            </div>

                                                            {/* 🕒 مسمار التاريخ والوقت الذكي */}
                                                            {isPaid && cleanDate !== '--' ? (
                                                                <div className="flex flex-col items-center leading-none">
                                                                    {/* التاريخ بالبونت العريض */}
                                                                    <span className="text-[10px] font-black text-slate-900 tracking-tighter mb-0.5">
                                                                        {cleanDate}
                                                                    </span>

                                                                    {/* الوقت بستايل خفيف (Minimalist) */}
                                                                    <div className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                                                                        <span className="text-[8px] font-black text-slate-400 italic">T</span>
                                                                        <span className="text-[9px] font-black text-slate-500 tabular-nums">
                                                                            {cleanTime}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="h-[30px]"></div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        <td className="p-2 text-center italic">
                                            <div className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center mx-auto transition-all ${s.paid_timbre_in ? 'bg-orange-500 border-orange-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                <span className="text-[10px] font-black">TB</span>
                                                <span className="text-[7px]">{s.paid_timbre_in || ''}</span>
                                            </div>
                                        </td>

                                        <td className="p-2 text-center italic">
                                            <div className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center mx-auto transition-all ${s.paid_medical_in ? 'bg-blue-500 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                <span className="text-[10px] font-black">VM</span>
                                                <span className="text-[7px]">{s.paid_medical_in || ''}</span>
                                            </div>
                                        </td>

                                        <td className="text-center text-[11px]">
                                            <div className="flex flex-col items-center gap-2 py-2">
                                                {/* 📅 تاريخ التسجيل */}
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                                    <span className="text-[8px] text-slate-400 font-black uppercase italic">سجل في:</span>
                                                    <span className="text-slate-900 font-black">{s.registration_date || '--/--/--'}</span>
                                                </div>

                                                {/* 🏁 تاريخ الامتحان */}
                                                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                                    <span className="text-[8px] text-amber-600 font-black uppercase italic">الامتحان:</span>
                                                    <span className="text-amber-900 font-black">{s.exam_date || '--/--/--'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-8 text-left pl-8">
                                            <div className="flex items-center gap-3 justify-end">
                                                {/* 🚨 مسمار التنبيه الذكي */}
                                                {(s.exam_date && rest > 0) && (
                                                    <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-xl border border-orange-200 animate-pulse">
                                                        <AlertTriangle size={14} strokeWidth={3} />
                                                        <span className="text-[9px] font-black uppercase italic">رد البال: امتحان بلا خلاص!</span>
                                                    </div>
                                                )}

                                                <span className={`px-5 py-2.5 rounded-2xl text-[12px] font-black shadow-sm ${rest === 0 ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-50 text-rose-600 border-2 border-rose-100'}`}>
                                                    {rest === 0 ? 'خ خالص ✓' : `${rest} DH`}
                                                </span>

                                                {/* بوطون الحذف */}
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-3 bg-rose-50 text-rose-300 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}