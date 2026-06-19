'use client';
import { useState } from 'react';
import { AlertTriangle, Timer, Wallet, TrendingUp, UserCircle, FolderArchive, CheckCircle2, Calendar, FileText } from 'lucide-react';

import { Student, Agency } from '@/types/dashboard';

interface Props {
    filteredStudents: Student[];
    financialStats: {
        totalRevenue: number;
        totalCollected: number;
        totalOutstanding: number;
    };
    highlightedName?: string | null;
    highlightExpiry?: number;
    selectedAgency?: Agency | null;
}

export default function ManagerFinance({
    filteredStudents,
    financialStats,
    highlightedName = null,
    highlightExpiry = 0,
    selectedAgency
}: Props) {
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [showArchiveMenu, setShowArchiveMenu] = useState(false);

    const matchDoctor = (dbValue: any, targetDoctor: string) => {
        if (typeof dbValue !== 'string') return false;
        return dbValue.trim() === targetDoctor.trim();
    };

    const getMedicalCheckDate = (s: Student, doctorName: string) => {
        for (let n = 1; n <= 5; n++) {
            const val = s[`t${n}_medical_paid`];
            if (matchDoctor(val, doctorName)) {
                const dateVal = s[`t${n}_date`];
                if (dateVal) {
                    const d = new Date(dateVal);
                    if (!isNaN(d.getTime())) {
                        return d.toLocaleDateString('fr-FR');
                    }
                }
            }
        }
        const fallbackDate = s.registration_date || s.created_at;
        if (fallbackDate) {
            const d = new Date(fallbackDate);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('fr-FR');
            }
        }
        return '---';
    };

    const getDoctorName = (s: Student) => {
        const isB = !s.license_type || s.license_type === 'B' || s.licenseType === 'B';
        if (!isB) return null;
        for (let n = 1; n <= 5; n++) {
            const val = s[`t${n}_medical_paid`];
            if (typeof val === 'string' && val.trim() !== '') {
                return val;
            }
        }
        return null;
    };

    const handlePrintDoctorReport = (doctorName: string) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const printWindow = iframe.contentWindow;
        if (!printWindow) return;

        const matchingStudents = filteredStudents.filter(s => {
            const isB = !s.license_type || s.license_type === 'B' || s.licenseType === 'B';
            if (!isB) return false;
            return matchDoctor(s.t1_medical_paid, doctorName) ||
                matchDoctor(s.t2_medical_paid, doctorName) ||
                matchDoctor(s.t3_medical_paid, doctorName) ||
                matchDoctor(s.t4_medical_paid, doctorName) ||
                matchDoctor(s.t5_medical_paid, doctorName);
        });

        const rows = matchingStudents.map((s, index) => {
            const name = `${s.first_name} ${s.last_name}`;
            const medicalDate = getMedicalCheckDate(s, doctorName);

            return `
                <tr>
                    <td style="width: 50px; font-weight: 700;">${index + 1}</td>
                    <td class="student-name">${name}</td>
                    <td>${medicalDate}</td>
                    <td style="font-weight: 700; color: #1e3a8a;">100 DH</td>
                </tr>
            `;
        }).join('');

        const agencyName = selectedAgency?.name || 'مؤسسة بودينار';

        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>تقرير الفحص الطبي - ${doctorName}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
                    @page { size: A4 portrait; margin: 20mm; }
                    body { font-family: 'Tajawal', sans-serif; direction: rtl; padding: 20px; background: white; color: #1e293b; }
                    .header { text-align: center; margin-bottom: 40px; }
                    .header h1 { font-size: 24px; font-weight: 900; color: #1e3a8a; margin: 0; }
                    .header p { font-size: 13px; color: #64748b; margin-top: 8px; font-weight: 700; }
                    .agency-badge { display: inline-block; padding: 6px 16px; background-color: #eff6ff; color: #1e40af; border-radius: 9999px; font-size: 12px; font-weight: 900; margin-top: 12px; border: 1px solid #bfdbfe; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                    th, td { border: 1.5px solid #cbd5e1; padding: 12px 8px; text-align: center; font-size: 13px; }
                    th { background-color: #f8fafc; font-weight: 900; color: #334155; }
                    td { color: #475569; }
                    .student-name { text-align: right; font-weight: 700; padding-right: 15px; color: #0f172a; }
                    
                    .summary-info { margin-top: 30px; font-size: 12px; color: #64748b; font-weight: 700; display: flex; justify-content: space-between; }
                    .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                    @media print { 
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>تقرير الفحص الطبي الخاص بـ: ${doctorName}</h1>
                    <p>قائمة المترشحين المسجلين بـ رخصة السياقة من الصنف (B)</p>
                    <div class="agency-badge">${agencyName}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 60px;">#</th>
                            <th>الاسم الكامل للمترشح</th>
                            <th>تاريخ الفحص</th>
                            <th style="width: 150px;">الثمن</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.length > 0 ? rows : '<tr><td colspan="4" style="padding: 20px; color: #94a3b8; font-style: italic;">لا يوجد مترشحون مسجلون مع هذا الطبيب حالياً</td></tr>'}
                    </tbody>
                    ${matchingStudents.length > 0 ? `
                    <tfoot>
                        <tr style="background-color: #f1f5f9; font-weight: 900; font-size: 14px;">
                            <td colspan="3" style="text-align: right; padding-right: 15px; color: #1e293b;">المجموع الكلي:</td>
                            <td style="color: #1e3a8a; text-align: center;">${matchingStudents.length * 100} DH</td>
                        </tr>
                    </tfoot>
                    ` : ''}
                </table>

                <div class="summary-info">
                    <span>مجموع المترشحين: ${matchingStudents.length}</span>
                    <span>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-MA')}</span>
                </div>

                <div class="footer">
                    نظام إدارة مؤسسة تعليم السياقة - ${agencyName}
                </div>

                <script>
                    window.onload = () => {
                        setTimeout(() => { 
                            window.print(); 
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };
    // 🖨️ دالة توليد وطباعة PDF الأرشيف التفصيلي لأي صنف بيرمي (أوتوماتيك 100%)
    // 🖨️ دالة توليد تقرير أرشيف خفيف، مفرز ومفهوم 100% لجميع الأصناف
    // 🖨️ دالة توليد تقرير أرشيف خفيف وصارم بصنف B (السيارات) مع جلب النتيجة من سيسيتيم الامتحانات
    const handlePrintArchiveReport = () => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const printWindow = iframe.contentWindow;
        if (!printWindow) return;

        // 🚀 الفرز الصارم: مؤرشفين + صنف B فقط
        const targetStudents = filteredStudents.filter(s => {
            const sType = s.license_type || s.licenseType || 'B';
            return s.status === 'archived' && String(sType).trim().toUpperCase() === 'B';
        });

        const rows = targetStudents.map((s, index) => {
            const name = `${s.first_name} ${s.last_name}`;
            const paid = (s.tranche_1 || 0) + (s.tranche_2 || 0) + (s.tranche_3 || 0) + (s.tranche_4 || 0) + (s.tranche_5 || 0);
            const rest = (s.total_price || 0) - paid;

            // 🎯 جلب النتيجة من سيستم الامتحانات
            const result = (window as any).examResults?.find((r: any) => r.student_name === name) || {};
            const isTheoryPassed = result.theory_result === 'admis' || result.theory_result_2 === 'admis';
            const isWinner = isTheoryPassed && (result.practical_result === 'admis' || result.practical_result_2 === 'admis');

            const resultBadge = isWinner
                ? '<span style="color: #16a34a; font-weight: 900;">✅ ناجح</span>'
                : '<span style="color: #ca8a04; font-weight: 900;">🟡 مؤرشف</span>';

            return `
                <tr>
                    <td style="width: 40px; font-weight: 700; text-align: center;">${index + 1}</td>
                    <td class="student-name">${name}</td>
                    <td style="text-align: center; color: #475569;">${s.registration_date ? new Date(s.registration_date).toLocaleDateString('fr-FR') : '---'}</td>
                    <td style="text-align: center; font-weight: 700; color: #2563eb;">${s.exam_date || '---'}</td>
                    <td style="text-align: center; font-size: 13px;">${resultBadge}</td>
                    <td style="text-align: center; font-weight: 700; color: #0f172a;">${s.total_price} DH</td>
                    <td style="text-align: center; color: #16a34a; font-weight: 700;">${paid} DH</td>
                    <td style="text-align: center; font-weight: 900; color: ${rest === 0 ? '#16a34a' : '#dc2626'}; background-color: ${rest === 0 ? '#f0fdf4' : '#fef2f2'}; font-size: 13px;">
                        ${rest === 0 ? 'خالص ✓' : `${rest} DH`}
                    </td>
                </tr>
            `;
        }).join('');

        const agencyName = selectedAgency?.name || 'مؤسسة بودينار';

        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>أرشيف الناجحين - صنف (B)</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
                    
                    /* 📐 المسمار الصارم للفورمات A4 الميتة لمنع التنقاز العشوائي */
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
                    
                    /* 📊 ضبط عرض الجدول ومحاصرة السطور لعدم القفز */
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: auto; }
                    th, td { border: 1px solid #0f172a; padding: 8px 6px; font-size: 12px; vertical-align: middle; }
                    th { background-color: #f8fafc; font-weight: 900; color: #0f172a; text-align: center; }
                    
                    /* 🛡️ منع تقطيع السطور وسط الخلايا */
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    
                    .student-name { text-align: right; font-weight: 700; padding-right: 8px; color: #0f172a; font-size: 13px; }
                    .summary-info { margin-top: 20px; font-size: 12px; color: #475569; font-weight: 700; display: flex; justify-content: space-between; }
                    .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 5px; background: white; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🗂️ أرشيف المترشحين - صنف B (السيارات)</h1>
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
                        ${rows.length > 0 ? rows : '<tr><td colspan="8" style="padding: 25px; color: #94a3b8; font-style: italic; font-size: 13px; text-align: center;">لا يوجد مترشحون مؤرشفون في صنف السيارات حالياً بذمة هذه الوكالة</td></tr>'}
                    </tbody>
                </table>

                <div class="summary-info">
                    <span>إجمالي الملفات المؤرشفة (صنف B): ${targetStudents.length} مترشح</span>
                    <span>تاريخ الاستخراج المباشر: ${new Date().toLocaleDateString('ar-MA')}</span>
                </div>

                <div class="footer">
                    نظام إدارة أوتو إيكول بودينار - تقرير أرشيف صنف B
                </div>

                <script>
                    window.onload = () => { setTimeout(() => { window.print(); }, 300); };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };
    const activeStudentsOnly = filteredStudents.filter(s => s.status !== 'archived');
    return (
        <div className="px-2 lg:px-8 space-y-8 font-black italic uppercase tracking-tighter" dir="rtl">

            {/* 🔝 Action Header مدموج فيه بوطون الأرشيف الجديد بـ الفن بلا ما يخسر القديم */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-slate-100 rounded-[25px] p-5 shadow-sm italic not-uppercase text-right">
                <div>
                    <h2 className="text-lg text-slate-900 font-black leading-none">إدارة الفحص الطبي (VM) والأرشيف</h2>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold">طباعة تقارير الفحص الطبي وتتبع أطباء المترشحين واستخراج أرشيف الأصناف</p>
                </div>

                <div className="flex items-center gap-3 relative">
                    {/* 🗂️ بوطون أرشيف الناجحين الجديد مع القائمة المنسدلة الذكية */}
                    <div className="relative">
                        <button
    type="button"
    onClick={handlePrintArchiveReport} // 👈 كيعيط للدالة لي مأمنة على صنف B نيشان بلا مشاكل
    className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 border-none cursor-pointer"
>
    <FolderArchive size={16} />
    <span>🗂️ استخراج أرشيف صنف B</span>
</button>

                        {/* 📊 القائمة المنسدلة د الأصناف (كتطلع غي إيلا برك على البوطون) */}
                       {/* 🗂️ بوطون استخراج أرشيف صنف B مباشر وصافي بلا منيو منسدل */}

                    </div>

                    {/* 🔵 بوطون الفحص الطبي ديالك الأصلي (بقا كيم كان بـ المليلمتر) */}
                    <button
                        type="button"
                        onClick={() => setShowDoctorModal(true)}
                        className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 border-none cursor-pointer"
                    >
                        <FileText size={16} />
                        <span>طباعة تقرير الفحص الطبي</span>
                    </button>
                </div>
            </div>

            {/* 🔝 STATS - (بقا كيم كان بـ الضبط) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border-2 border-slate-100 rounded-[25px] p-5 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[9px] text-slate-400">المداخيل الإجمالية</p>
                        <h2 className="text-xl text-slate-900 leading-none">{financialStats?.totalRevenue || 0} DH</h2>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-xl">
                        <TrendingUp size={20} className="text-slate-900" />
                    </div>
                </div>
                <div className="bg-white border-2 border-emerald-100 rounded-[25px] p-5 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[9px] text-emerald-600 uppercase tracking-widest">المبلغ المستخلص</p>
                        <h2 className="text-xl text-emerald-600 leading-none">{financialStats?.totalCollected || 0} DH</h2>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl">
                        <Wallet size={20} className="text-emerald-500" />
                    </div>
                </div>
                <div className="bg-white border-2 border-rose-100 rounded-[25px] p-5 flex items-center justify-between shadow-sm text-rose-600">
                    <div>
                        <p className="text-[9px] text-slate-400">الديون العالقة</p>
                        <h2 className="text-xl leading-none">{financialStats?.totalOutstanding || 0} DH</h2>
                    </div>
                    <div className="bg-rose-50 p-2 rounded-xl">
                        <AlertTriangle size={20} />
                    </div>
                </div>
            </div>

            {/* 📱 نسخة التليفون: Cards (معدلة بـ تواريخ الدفعات) */}
            <div className="grid grid-cols-1 gap-6 sm:hidden" dir="rtl">
                {activeStudentsOnly.map(s => {
                    const paid = (s.tranche_1 || 0) + (s.tranche_2 || 0) + (s.tranche_3 || 0) + (s.tranche_4 || 0) + (s.tranche_5 || 0);
                    const rest = (s.total_price || 0) - paid;
                    const hasExam = s.exam_date && s.exam_date !== '';
                    const totalTimbre = (s.t1_timbre_amount || 0) + (s.t2_timbre_amount || 0) + (s.t3_timbre_amount || 0) + (s.t4_timbre_amount || 0) + (s.t5_timbre_amount || 0);
                    const isMedicalPaid = s.t1_medical_paid || s.t2_medical_paid || s.t3_medical_paid || s.t4_medical_paid || s.t5_medical_paid;

                    return (
                        <div key={s.id} className="bg-white border-2 border-slate-900 rounded-[35px] p-6 shadow-sm space-y-4 text-right">
                            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                                <div className="space-y-1">
                                    <p className="text-base text-slate-900 font-black leading-none mb-1">{s.first_name} {s.last_name}</p>
                                    {hasExam ? (
                                        <p className="text-[10px] text-blue-600 font-black flex items-center gap-1 mt-1">
                                            <Timer size={11} strokeWidth={3} /> موعد الامتحان: {new Date(s.exam_date).toLocaleDateString('fr-FR')}
                                        </p>
                                    ) : (
                                        <p className="text-[8px] text-slate-300 italic">-- لم يحدد موعد الامتحان --</p>
                                    )}
                                    {hasExam && rest > 0 && (
                                        <div className="mt-2 bg-rose-50 border border-rose-200 p-2 rounded-xl flex items-center gap-2 animate-pulse">
                                            <AlertTriangle size={14} className="text-rose-600 flex-shrink-0" />
                                            <p className="text-[10px] text-rose-600 font-black leading-tight">
                                                🚨 انتباه: المرشح عنده امتحان وباقي كيسالوه {rest} DH!
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-[8px] text-slate-400 flex items-center gap-1 italic">
                                        <Calendar size={10} /> سجل فـ: {
                                            s.registration_date
                                                ? new Date(s.registration_date).toLocaleDateString('fr-FR')
                                                : (s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '---')
                                        }
                                    </p>
                                </div>
                                <div className="text-left">
                                    <p className="text-[14px] text-slate-900 font-black leading-none">{s.total_price} DH</p>
                                    <p className="text-[7px] text-slate-400 uppercase">الثمن الإجمالي</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className={`flex-1 py-2 rounded-xl border-2 text-center text-[10px] font-black ${totalTimbre > 0 ? 'bg-orange-500 text-white border-orange-600' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                                    TB: {totalTimbre > 0 ? `${totalTimbre} DH` : '--'}
                                </div>
                                <div className={`flex-1 py-2 rounded-xl border-2 text-center text-[10px] font-black ${isMedicalPaid ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                                    {(() => {
                                        const doc = getDoctorName(s);
                                        if (doc) return `VM: ${doc}`;
                                        return isMedicalPaid ? 'VM: ✓ مدفوعة' : 'VM: --';
                                    })()}
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-1.5">
                                {[1, 2, 3, 4, 5].map(n => {
                                    const trancheAmount = s[`tranche_${n}`] || 0;
                                    const trancheDate = s[`t${n}_date`];
                                    const timbreInThisTranche = s[`t${n}_timbre_amount`] || 0;
                                    const medicalInThisTranche = s[`t${n}_medical_paid`] || false;

                                    return (
                                        <div key={n} className={`min-w-[60px] h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${trancheAmount > 0 ? 'bg-white border-emerald-500 shadow-sm' : 'bg-slate-50/50 border-slate-100 text-slate-200'}`}>
                                            <span className="text-[7px] uppercase opacity-60 font-black italic">T{n}</span>
                                            <span className="text-[9px] font-black text-slate-900 leading-none">{trancheAmount > 0 ? `${trancheAmount} DH` : '--'}</span>

                                            {/* 📅 مسمار التليفون: تاريخ الدفعة */}
                                            {trancheAmount > 0 && trancheDate && (
                                                <span className="text-[6px] text-emerald-600 font-black mt-0.5">
                                                    {new Date(trancheDate).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            )}

                                            <div className="flex gap-1 mt-0.5">
                                                {timbreInThisTranche > 0 && (
                                                    <span className="text-[6px] bg-orange-100 text-orange-600 px-0.5 rounded-sm font-bold">TB</span>
                                                )}
                                                {medicalInThisTranche && (
                                                    <span className="text-[6px] bg-blue-100 text-blue-600 px-0.5 rounded-sm font-bold">
                                                        {typeof medicalInThisTranche === 'string' ? medicalInThisTranche : 'VM'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={`p-3 rounded-2xl text-center font-black text-[12px] ${rest === 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                {rest === 0 ? '✓ حـساب خـالـص' : `الباقي : ${rest} DH`}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 💻 نسخة الـ PC: الجدول الكبـير (معدلة بـ الخانة الجديدة) */}
            <div className="hidden sm:block bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <table className="w-full min-w-[1400px] text-right border-separate border-spacing-0" dir="rtl">
                        <thead className="bg-slate-50/80 text-slate-500 text-[10px]">
                            <tr>
                                <th className="p-6 sticky right-0 bg-white z-40 border-l border-slate-100 w-[200px] text-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    المرشح / تاريخ التسجيل
                                </th>
                                <th className="text-center p-4">الثمن الكلي</th>
                                <th className="text-center p-4">الدفعات (T1-T5)</th>

                                {/* 🚀 المسمار: العمود الجديد لتواريخ الدفعات */}
                                <th className="text-center p-4 w-[150px] bg-slate-50/50">تواريخ الدفعات</th>

                                <th className="text-center w-[120px] p-4">التمبر (TB)</th>
                                <th className="text-center w-[100px] p-4">الفحص (VM)</th>
                                <th className="text-center p-4">تاريخ الامتحان</th>
                                <th className="text-left pl-8 p-4">الباقي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {activeStudentsOnly.map(s => {
                                const paid = (s.tranche_1 || 0) + (s.tranche_2 || 0) + (s.tranche_3 || 0) + (s.tranche_4 || 0) + (s.tranche_5 || 0);
                                const rest = (s.total_price || 0) - paid;
                                const needsWarning = s.exam_date && rest > 0;
                                const totalTimbre = (s.t1_timbre_amount || 0) + (s.t2_timbre_amount || 0) + (s.t3_timbre_amount || 0) + (s.t4_timbre_amount || 0) + (s.t5_timbre_amount || 0);
                                const isMedicalPaid = s.t1_medical_paid || s.t2_medical_paid || s.t3_medical_paid || s.t4_medical_paid || s.t5_medical_paid;

                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-6 sticky right-0 bg-white z-20 group-hover:bg-slate-50 border-l-2 border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                            <p className="font-black text-slate-900 leading-none">{s.first_name} {s.last_name}</p>
                                            <p className="text-[8px] text-slate-400 mt-2 font-normal italic">
                                                سجل فـ: {s.registration_date ? new Date(s.registration_date).toLocaleDateString() : '---'}
                                            </p>
                                        </td>
                                        <td className="text-center text-slate-900 font-black p-4">DH {s.total_price}</td>

                                        {/* الدفعات (بقات كيم كانت) */}
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                {[1, 2, 3, 4, 5].map(n => {
                                                    const trancheAmount = s[`tranche_${n}`] || 0;
                                                    const timbreInThisTranche = s[`t${n}_timbre_amount`] || 0;
                                                    const medicalInThisTranche = s[`t${n}_medical_paid`] || false;

                                                    return (
                                                        <div key={n} className={`min-w-[80px] h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-sm ${trancheAmount > 0 ? 'bg-white border-emerald-500 scale-105' : 'bg-slate-50/50 border-slate-100 text-slate-200 opacity-40'}`}>
                                                            <span className="text-[8px] uppercase font-black italic opacity-60">Tranche {n}</span>
                                                            <span className="text-[13px] font-black text-slate-900 leading-tight">{trancheAmount > 0 ? `${trancheAmount} DH` : '--'}</span>
                                                            <div className="flex flex-col gap-0.5 mt-1 w-full px-1">
                                                                {timbreInThisTranche > 0 && (
                                                                    <div className="bg-orange-500 text-white text-[9px] font-black py-0.5 px-1 rounded-md flex justify-between items-center">
                                                                        <span>TB:</span>
                                                                        <span>{timbreInThisTranche}DH</span>
                                                                    </div>
                                                                )}
                                                                {medicalInThisTranche && (
                                                                    <div className="bg-blue-600 text-white text-[9px] font-black py-0.5 px-1 rounded-md flex flex-col items-center justify-center gap-0.5">
                                                                        <div className="flex items-center gap-1">
                                                                            <CheckCircle2 size={10} />
                                                                            <span>VM</span>
                                                                        </div>
                                                                        {typeof medicalInThisTranche === 'string' && (
                                                                            <span className="text-[7px] opacity-90 leading-none">{medicalInThisTranche}</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        {/* 🚀 المسمار: العمود الجديد لتواريخ الدفعات */}
                                        <td className="p-4 bg-slate-50/30">
                                            <div className="flex flex-col gap-1.5 items-center">
                                                {[1, 2, 3, 4, 5].map(n => {
                                                    const tAmt = s[`tranche_${n}`] || 0;
                                                    const tDate = s[`t${n}_date`];
                                                    if (tAmt > 0 && tDate) {
                                                        return (
                                                            <div key={n} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm w-full max-w-[120px] justify-between">
                                                                <span className="text-[7px] font-black text-slate-400">T{n}</span>
                                                                <span className="text-[9px] font-black text-emerald-600">
                                                                    {new Date(tDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                                {paid === 0 && <span className="text-slate-200">-- --</span>}
                                            </div>
                                        </td>

                                        <td className="p-2 text-center">
                                            <div className={`px-3 py-1.5 rounded-full border-2 inline-flex flex-col items-center justify-center transition-all ${totalTimbre > 0 ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                <span className="text-[8px] font-black uppercase">Timbre</span>
                                                <span className="text-[10px] font-black leading-none">{totalTimbre > 0 ? `${totalTimbre} DH` : '--'}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-center">
                                            {(() => {
                                                const doc = getDoctorName(s);
                                                if (doc) {
                                                    return (
                                                        <div className="px-3 py-1.5 rounded-full border-2 border-blue-500 bg-blue-50 text-blue-700 inline-flex flex-col items-center justify-center transition-all shadow-sm mx-auto w-fit">
                                                            <span className="text-[8px] font-black uppercase">VM</span>
                                                            <span className="text-[10px] font-black leading-none">{doc}</span>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${isMedicalPaid ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                                                        {isMedicalPaid ? <CheckCircle2 size={18} strokeWidth={3} /> : <span className="text-[9px] font-black opacity-30">VM</span>}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="text-center p-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-slate-900 font-black text-xs">{s.exam_date || '--'}</span>
                                                {needsWarning && (
                                                    <div className="bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                                                        <AlertTriangle size={8} className="text-rose-600 animate-pulse" />
                                                        <span className="text-[7px] text-rose-600 font-black">ناقص فـ الخلاص</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-left pl-8">
                                            <span className={`px-4 py-2 rounded-xl text-[12px] font-black shadow-sm border ${rest === 0 ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                {rest === 0 ? 'خالص ✓' : `${rest} DH`}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {showDoctorModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" style={{ fontStyle: 'normal' }}>
                    <div className="bg-white rounded-[35px] border-2 border-slate-900 p-8 w-full max-w-[400px] shadow-2xl space-y-6 text-right animate-in zoom-in-95 duration-200">
                        <div>
                            <h3 className="text-xl text-slate-900 font-black leading-none">تقرير الفحص الطبي</h3>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-bold">اختر طبيباً لإنشاء تقرير الفحص الطبي للمترشحين (الصنف B)</p>
                        </div>

                        <div className="space-y-3">
                            {['د. إكرام', 'د. نبيل', 'د. جمعة'].map(doc => {
                                const count = filteredStudents.filter(s => {
                                    const isB = !s.license_type || s.license_type === 'B' || s.licenseType === 'B';
                                    if (!isB) return false;
                                    return s.t1_medical_paid === doc ||
                                        s.t2_medical_paid === doc ||
                                        s.t3_medical_paid === doc ||
                                        s.t4_medical_paid === doc ||
                                        s.t5_medical_paid === doc;
                                }).length;

                                return (
                                    <button
                                        key={doc}
                                        onClick={() => {
                                            handlePrintDoctorReport(doc);
                                            setShowDoctorModal(false);
                                        }}
                                        className="w-full h-14 bg-slate-50 hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-500 rounded-2xl transition-all flex items-center justify-between px-6 group cursor-pointer text-slate-900 border-solid"
                                    >
                                        <span className="font-black text-sm group-hover:text-blue-600">{doc}</span>
                                        <span className="bg-slate-200 group-hover:bg-blue-200 text-slate-700 group-hover:text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-lg">
                                            {count} مترشح
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowDoctorModal(false)}
                                className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all border-none cursor-pointer"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}