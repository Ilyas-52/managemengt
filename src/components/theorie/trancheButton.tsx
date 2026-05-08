'use client';
import { FileDown } from 'lucide-react';
declare module 'html2pdf.js';

interface Props {
  students: any[];
  agenceName?: string;
  selectedDate: Date; // 🚀 الساروت اللي كيربطنا بالهيدر
}

export default function PdfButton({ students, agenceName = 'Boudinar', selectedDate }: Props) {
  const downloadWeeklyIncomeReport = async () => {
    const html2pdf = (await import('html2pdf.js')).default;

    // 1. تحديد بداية الأسبوع (الاثنين 00:00:00) بـ طريقة "بيطون"
    const now = selectedDate;
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // 🕒 1. بداية السيمانة (الاثنين 00:00:00)
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - diffToMonday);
    lastMonday.setHours(0, 0, 0, 0);
    const limitTime = lastMonday.getTime();

    // 🕒 2. نهاية السيمانة (الأحد 23:59:59) - هادا هو المسمار الجديد
    const sundayEnd = new Date(lastMonday);
    sundayEnd.setDate(lastMonday.getDate() + 6);
    sundayEnd.setHours(23, 59, 59, 999);
    const endTime = sundayEnd.getTime();
    // 🕒 زيد هاد السطر فوق الـ element.innerHTML
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    // 3. الفلترة الذكية المحصورة فـ سيمانة وحدة بـ الضبط
    const weeklyIncomes = students.map(s => {
      // دالة صغيرة باش ما نعاودوش الكود: كتشوف واش التاريخ وسط السيمانة
      const getValidTranche = (dateField: string, amountField: string) => {
        if (!s[dateField]) return 0;
        const d = new Date(s[dateField]).getTime();
        // 🚀 المسمار: خاص التاريخ يكون >= الاثنين وَ <= الأحد
        return (d >= limitTime && d <= endTime) ? Number(s[amountField]) || 0 : 0;
      };

      const p1 = getValidTranche('t1_date', 'tranche_1');
      const p2 = getValidTranche('t2_date', 'tranche_2');
      const p3 = getValidTranche('t3_date', 'tranche_3');
      const p4 = getValidTranche('t4_date', 'tranche_4');
      const p5 = getValidTranche('t5_date', 'tranche_5');

      const weeklyTotal = p1 + p2 + p3 + p4 + p5;

      return {
        fullName: `${s.first_name || ''} ${s.last_name || ''}`,
        p1, p2, p3, p4, p5,
        weeklyTotal
      };
    }).filter(item => item.weeklyTotal > 0);

    // 3. تصميم الـ PDF (نفس الـ HTML والستيل ديالك)
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 15px; font-family: Arial, sans-serif; direction: rtl; text-align: right; width: 100%;">
        <h2 style="text-align: center; color: #0f172a; margin-bottom: 5px;">مداخيل الأسبوع الحقيقية - ${agenceName}</h2>
<p style="text-align: center; color: #64748b; font-size: 10px; margin-bottom: 20px;">
    الفترة: من ${lastMonday.toLocaleDateString('ar-MA')} إلى ${lastSunday.toLocaleDateString('ar-MA')}
</p>        
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background-color: #1e293b; color: white;">
              <th style="padding: 8px; border: 1px solid #ddd;">المرشح</th>
              <th style="padding: 8px; border: 1px solid #ddd;">T1</th>
              <th style="padding: 8px; border: 1px solid #ddd;">T2</th>
              <th style="padding: 8px; border: 1px solid #ddd;">T3</th>
              <th style="padding: 8px; border: 1px solid #ddd;">T4</th>
              <th style="padding: 8px; border: 1px solid #ddd;">T5</th> 
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #059669;">المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${weeklyIncomes.map(item => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${item.fullName}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p1 > 0 ? item.p1 : '-'}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p2 > 0 ? item.p2 : '-'}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p3 > 0 ? item.p3 : '-'}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p4 > 0 ? item.p4 : '-'}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.p5 > 0 ? item.p5 : '-'}</td> 
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #059669;">${item.weeklyTotal} DH</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
             <tr style="background-color: #f8fafc; font-weight: bold;">
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">إجمالي الأسبوع</td>
                <td colspan="5" style="border: 1px solid #ddd;"></td> 
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #059669; font-size: 14px;">
                    ${weeklyIncomes.reduce((acc, item) => acc + item.weeklyTotal, 0)} DH
                </td>
             </tr>
          </tfoot>
        </table>
      </div>
    `;

    const opt = {
      margin: 0.3,
      filename: `rapport-${agenceName.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // ✅ المسمار الحقيقي للأندرويد و Honor:
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // @ts-ignore
      html2pdf().from(element).set(opt).output('bloburl').then((pdfUrl: string) => {
        window.open(pdfUrl, '_blank');
      });
    } else {
      // @ts-ignore
      html2pdf().from(element).set(opt).save();
    }
  };

  return (
    <button
      onClick={downloadWeeklyIncomeReport}
      className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 transition-all font-bold shadow-lg"
    >
      <FileDown size={20} />
      <span>التقرير الاسبوعي للدفعات (PDF)</span>
    </button>
  );
}