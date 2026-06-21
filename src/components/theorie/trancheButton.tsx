'use client';
import { useState } from 'react';
import { FileDown, X, Car, Truck } from 'lucide-react';
declare module 'html2pdf.js';

interface Props {
  students: any[];
  agenceName?: string;
  selectedDate: Date; // 🚀 الساروت اللي كيربطنا بالهيدر
}

export default function PdfButton({ students, agenceName = 'Boudinar', selectedDate }: Props) {
  // 🔒 ساروت التحكم ف فتح وقفل مودال الاختيار
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  const generatePdfReport = (reportType: 'b_only' | 'others') => {
    setIsOpenMenu(false); // قفل المودال فوراً عند الاختيار
    
    // استدعاء html2pdf ديناميكياً
    import('html2pdf.js').then((html2pdfModule) => {
      const html2pdf = html2pdfModule.default;

      // 🕒 1. تحديد بداية الأسبوع ونهايته (الاثنين 00:00:00 تال الأحد 23:59:59)
      const now = selectedDate;
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - diffToMonday);
      lastMonday.setHours(0, 0, 0, 0);
      const limitTime = lastMonday.getTime();

      const sundayEnd = new Date(lastMonday);
      sundayEnd.setDate(lastMonday.getDate() + 6);
      sundayEnd.setHours(23, 59, 59, 999);
      const endTime = sundayEnd.getTime();
      
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);

      // 2. دالة الفلترة الصارمة د الدفعات وسط هاد السيمانة
      const getValidTrancheAmount = (student: any, dateField: string, amountField: string) => {
        if (!student[dateField]) return 0;
        const d = new Date(student[dateField]).getTime();
        return (d >= limitTime && d <= endTime) ? Number(student[amountField]) || 0 : 0;
      };

      const isBOnly = reportType === 'b_only';

      // 🚀 مسمار الحل للـ TypeScript: عطينا (: any) للماب باش يطير الخط الأحمر نهائياً
      let filteredIncomes = students.map((s): any => {
        // تنظيف نوع البيرمي لضمان القراءة الصحيحة من الداتابيز
        const sType = String(s.license_type || s.licenseType || 'B').trim().toUpperCase();

        // 🚗 فرز الأصناف: إيلا برك على بوطون B كنجيبو غير صنف B بوحدو
        if (isBOnly && sType !== 'B') return { weeklyTotal: 0 };

        // 🏍️🚛 وإيلا برك على بوطون الأصناف الأخرى، كنجيبو الموتور A + الوزن الثقيل C, D, E مجموعين ف ورقة وحدة
        if (!isBOnly && !['A', 'C', 'D', 'E'].includes(sType)) return { weeklyTotal: 0 };

        // 🔒 مسمار الأمان الفخم:
        // إيلا كان صنف B ➔ كيقرا من tranche_1 كيم كان الكود الأول ديالك الكلاسيكي 100%
        // وإلا (الأصناف الأخرى) ➔ كيقرا من خانات t1 و t2 لي مأمنين ف الداتابيز الجديدة
        const p1 = isBOnly ? getValidTrancheAmount(s, 't1_date', 'tranche_1') : getValidTrancheAmount(s, 't1_date', 't1');
        const p2 = isBOnly ? getValidTrancheAmount(s, 't2_date', 'tranche_2') : getValidTrancheAmount(s, 't2_date', 't2');
        const p3 = isBOnly ? getValidTrancheAmount(s, 't3_date', 'tranche_3') : getValidTrancheAmount(s, 't3_date', 't3');
        const p4 = isBOnly ? getValidTrancheAmount(s, 't4_date', 'tranche_4') : getValidTrancheAmount(s, 't4_date', 't4');
        const p5 = isBOnly ? getValidTrancheAmount(s, 't5_date', 'tranche_5') : getValidTrancheAmount(s, 't5_date', 't5');
        
        const weeklyTotal = p1 + p2 + p3 + p4 + p5;

        return {
          fullName: `${s.first_name || ''} ${s.last_name || ''}`,
          licenseType: sType,
          p1, p2, p3, p4, p5,
          weeklyTotal
        };
      }).filter(item => item.weeklyTotal > 0);

      // 3. تصميم الـ PDF ديناميكياً بناءً على الزر المضغوط
      const element = document.createElement('div');
      let tableHtml = '';
      
      if (isBOnly) {
        // 🚗 صنف B بوووحدو العريض بالخانات الـ 5 (نفس الـ HTML ديال كودك الأول بـ المليلمتر)
        tableHtml = `
          <h2 style="text-align: center; color: #0f172a; margin-bottom: 5px; font-family: Arial, sans-serif;">مداخيل الأسبوع الحقيقية (صنف السيارات B) - ${agenceName}</h2>
          <p style="text-align: center; color: #64748b; font-size: 10px; margin-bottom: 20px; font-family: Arial, sans-serif;">
            الفترة: من ${lastMonday.toLocaleDateString('ar-MA')} إلى ${lastSunday.toLocaleDateString('ar-MA')}
          </p>        
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; direction: rtl; font-family: Arial, sans-serif;">
            <thead>
              <tr style="background-color: #1e293b; color: white;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">المرشح</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">T1</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">T2</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">T3</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">T4</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">T5</th> 
                <th style="padding: 8px; border: 1px solid #ddd; background-color: #059669; text-align: center;">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${filteredIncomes.length > 0 ? filteredIncomes.map(item => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${item.fullName}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p1 > 0 ? item.p1 : '-'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p2 > 0 ? item.p2 : '-'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p3 > 0 ? item.p3 : '-'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p4 > 0 ? item.p4 : '-'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p5 > 0 ? item.p5 : '-'}</td> 
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #059669;">${item.weeklyTotal} DH</td>
                </tr>
              `).join('') : `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">لا توجد مداخيل مسجلة لصنف السيارات (B) خلال هذا الأسبوع.</td></tr>`}
            </tbody>
            <tfoot>
               <tr style="background-color: #f8fafc; font-weight: bold;">
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">إجمالي الأسبوع (Permis B)</td>
                  <td colspan="5" style="border: 1px solid #ddd;"></td> 
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #059669; font-size: 14px;">
                      ${filteredIncomes.reduce((acc, item) => acc + item.weeklyTotal, 0)} DH
                  </td>
               </tr>
            </tfoot>
          </table>
        `;
      } else {
        // 🏍️🚛 الأصناف الأخرى (A, C, D, E) مجموعة ف جدول عريض من T1 تال T5 مع فرز البيرمي
        tableHtml = `
          <h2 style="text-align: center; color: #1e3a8a; margin-bottom: 5px; font-family: Arial, sans-serif;">مداخيل الأسبوع الموحدة (الأصناف A / C / D / E) - ${agenceName}</h2>
          <p style="text-align: center; color: #64748b; font-size: 10px; margin-bottom: 20px; font-family: Arial, sans-serif;">
            الفترة: من ${lastMonday.toLocaleDateString('ar-MA')} إلى ${lastSunday.toLocaleDateString('ar-MA')}
          </p>        
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; direction: rtl; font-family: Arial, sans-serif;">
            <thead>
              <tr style="background-color: #1e3a8a; color: white;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">المرشح (الصنف)</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">T1</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">T2</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">T3</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">T4</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">T5</th> 
                <th style="padding: 8px; border: 1px solid #ddd; background-color: #059669; text-align: center;">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${filteredIncomes.length > 0 ? filteredIncomes.map(item => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
                    ${item.fullName} <span style="font-size: 9px; color: #2563eb; font-weight: 900;">(Permis ${item.licenseType})</span>
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p1 > 0 ? item.p1 : '-'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p2 > 0 ? item.p2 : '-'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p3 > 0 ? item.p3 : '-'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p4 > 0 ? item.p4 : '-'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p5 > 0 ? item.p5 : '-'}</td> 
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #059669;">${item.weeklyTotal} DH</td>
                </tr>
              `).join('') : `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">لا توجد مداخيل مسجلة لهذه الأصناف خلال هذا الأسبوع.</td></tr>`}
            </tbody>
            <tfoot>
               <tr style="background-color: #f8fafc; font-weight: bold;">
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">إجمالي المداخيل الكلية للأصناف الأخرى</td>
                  <td colspan="5" style="border: 1px solid #ddd;"></td> 
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #059669; font-size: 14px;">
                      ${filteredIncomes.reduce((acc, item) => acc + item.weeklyTotal, 0)} DH
                  </td>
               </tr>
            </tfoot>
          </table>
        `;
      }

      element.innerHTML = `<div style="padding: 15px; font-family: Arial, sans-serif; direction: rtl; text-align: right; width: 100%;">${tableHtml}</div>`;

      const opt = {
        margin: 0.3,
        filename: `rapport-semaine-${reportType}-${agenceName.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // @ts-ignore
        html2pdf().from(element).set(opt).output('bloburl').then((pdfUrl: string) => {
          window.open(pdfUrl, '_blank');
        });
      } else {
        // @ts-ignore
        html2pdf().from(element).set(opt).save();
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpenMenu(true)}
        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 transition-all font-bold shadow-lg border-none cursor-pointer"
      >
        <FileDown size={20} />
        <span>التقرير الاسبوعي للدفعات (PDF)</span>
      </button>

      {isOpenMenu && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-[2rem] p-6 shadow-2xl w-full max-w-sm border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-3">
              <h3 className="text-sm font-black text-slate-800">    اختر صنف التقرير الاسبوعي للدفعات</h3>
              <button 
                type="button" 
                onClick={() => setIsOpenMenu(false)} 
                className="p-1.5 bg-slate-100 rounded-full hover:bg-rose-500 hover:text-white text-slate-400 border-none cursor-pointer transition-colors"
              >
                <X size={14} />
              </button>
            </div>


            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => generatePdfReport('b_only')}
                className="w-full py-4 px-4 bg-slate-900 text-white font-black text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 border-none cursor-pointer active:scale-95 shadow-md"
              >
                <Car size={16} className="text-emerald-400" />
                <span>🚗 صنف السيارات فقط (Permis B)</span>
              </button>

              <button
                type="button"
                onClick={() => generatePdfReport('others')}
                className="w-full py-4 px-4 bg-blue-600 text-white font-black text-xs rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 border-none cursor-pointer active:scale-95 shadow-md"
              >
                <Truck size={16} className="text-blue-200" />
                <span>🏍️🚛 الأصناف الأخرى (A / C / D / E)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}