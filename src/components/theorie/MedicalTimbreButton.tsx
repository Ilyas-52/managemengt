'use client';
import { FileText } from 'lucide-react';
declare module 'html2pdf.js';

interface Props {
  students: any[];
  agenceName?: string;
  selectedDate: Date; // 🚀 الساروت اللي كيربطنا بالهيدر
}

export default function MedicalTimbreButton({
  students,
  agenceName = 'Boudinar',
  selectedDate // 🚀 جيب التاريخ من هنا
}: Props) {
  const downloadReport = async () => {
    const html2pdf = (await import('html2pdf.js')).default;

    const now = selectedDate;
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    // 🕒 تحت السطر ديال sunday.setDate(monday.getDate() + 6);
    const startTime = monday.setHours(0, 0, 0, 0); // هادي ديجا عندك (limitTime)
    const endTime = new Date(monday);
    endTime.setDate(monday.getDate() + 6);
    endTime.setHours(23, 59, 59, 999);
    const limitEnd = endTime.getTime(); // 🚀 هادا هو المسمار الجديد

    const limitTime = monday.setHours(0, 0, 0, 0);

    const getArabicMonth = (date: Date) => {
      const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      return months[date.getMonth()];
    };

    const weeklyIncomes = students.map(s => {
      // 🚀 1. حساب المجموع الكلي ديال التمبر (باش نعرفو واش "خالص")
      const totalTimbreEver =
        (Number(s.t1_timbre_amount) || 0) + (Number(s.t2_timbre_amount) || 0) +
        (Number(s.t3_timbre_amount) || 0) + (Number(s.t4_timbre_amount) || 0) +
        (Number(s.t5_timbre_amount) || 0);

      // 🚀 2. حساب شحال خلص "هاد الأسبوع" بـ الضبط (تجميع الدفعات)
      let paidTimbreThisWeek = 0;
      let latestTimbreDate = 0;

      [1, 2, 3, 4, 5].forEach(n => {
        const d = s[`t${n}_date`] ? new Date(s[`t${n}_date`]).getTime() : 0;
        if (d >= limitTime && d <= limitEnd) {
          paidTimbreThisWeek += Number(s[`t${n}_timbre_amount`]) || 0;
          if (d > latestTimbreDate) latestTimbreDate = d;
        }
      });

      // 🚀 3. حساب الفيزيتا (إيلا خلصها فـ أي دفعة هاد الأسبوع)
      let paidMedicalThisWeek = 0;
      let latestMedicalDate = 0;
      [1, 2, 3, 4, 5].forEach(n => {
        const d = s[`t${n}_date`] ? new Date(s[`t${n}_date`]).getTime() : 0;
        if (d >= limitTime && d <= limitEnd && s[`t${n}_medical_paid`]) {
          paidMedicalThisWeek = 100;
          if (d > latestMedicalDate) latestMedicalDate = d;
        }
      });

      const timbreRest = 700 - totalTimbreEver;

      return {
        fullName: `${s.first_name} ${s.last_name}`,
        timbre: paidTimbreThisWeek,
        timbreRest: timbreRest,
        medical: paidMedicalThisWeek,
        tDateStr: latestTimbreDate > 0 ? new Date(latestTimbreDate).toLocaleDateString('fr-FR') : '-',
        mDateStr: latestMedicalDate > 0 ? new Date(latestMedicalDate).toLocaleDateString('fr-FR') : '-',
        totalRow: paidTimbreThisWeek + paidMedicalThisWeek
      };
    }).filter(item => item.totalRow > 0);

    const totalTimbres = weeklyIncomes.reduce((acc, item) => acc + item.timbre, 0);
    const totalMedical = weeklyIncomes.reduce((acc, item) => acc + item.medical, 0);

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 20px; font-family: 'Arial', sans-serif; direction: rtl; text-align: right; width: 100%;">
        <h1 style="text-align: center; text-decoration: underline; font-size: 20px; margin-bottom: 5px;">تقرير التمبر والفحص الطبي الأسبوعي - ${agenceName}</h1>
        <p style="text-align: center; color: #1e293b; font-weight: bold; font-size: 13px; margin-bottom: 25px;">
    الفترة: من الاثنين ${monday.getDate()} إلى الأحد ${sunday.getDate()} ${getArabicMonth(monday)} ${monday.getFullYear()}
</p>

        <table style="width: 100%; border-collapse: collapse; border: 2px solid black; font-size: 10px;">
          <thead>
            <tr style="background-color: #f8fafc; height: 45px;">
              <th style="border: 1px solid black; width: 22%; padding: 5px;">اسم المترشح</th>
              <th style="border: 1px solid black; width: 12%; text-align: center;">المبلغ المدفوع (تمبر)</th>
              <th style="border: 1px solid black; width: 10%; text-align: center;">المبلغ المتبقي</th>
              <th style="border: 1px solid black; width: 15%; text-align: center;">تاريخ الدفع</th>
              <th style="border: 1px solid black; width: 8%; text-align: center;">الفحص</th>
              <th style="border: 1px solid black; width: 12%; text-align: center;">واجب الفحص</th>
              <th style="border: 1px solid black; width: 15%; text-align: center;">تاريخ الفحص</th>
            </tr>
          </thead>
          <tbody>
            ${weeklyIncomes.map(item => `
              <tr style="height: 38px;">
                <td style="border: 1px solid black; padding: 5px; font-weight: bold; font-size: 12px;">${item.fullName}</td>
                <td style="border: 1px solid black; text-align: center; font-weight: bold; color: #15803d;">
                  ${item.timbre > 0 ? item.timbre + ' درهم' : '-'}
                </td>
                <td style="border: 1px solid black; text-align: center; color: ${item.timbreRest <= 0 ? '#15803d' : '#b91c1c'}; font-weight: bold;">
                  ${item.timbreRest <= 0 ? 'خالص' : item.timbreRest + ' درهم'}
                </td>
                <td style="border: 1px solid black; text-align: center; font-size: 9px;">${item.tDateStr}</td>
                <td style="border: 1px solid black; text-align: center; font-weight: bold;">${item.medical > 0 ? '✓' : ''}</td>
                <td style="border: 1px solid black; text-align: center;">${item.medical > 0 ? '100 درهم' : '-'}</td>
                <td style="border: 1px solid black; text-align: center; font-size: 9px;">${item.mDateStr}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="height: 45px; background-color: #f1f5f9; font-weight: bold;">
              <td style="border: 1px solid black; text-align: center;">مجموع السيولة</td>
              <td colspan="3" style="border: 1px solid black; text-align: center; color: #b91c1c; font-size: 13px;">مجموع التمبر: ${totalTimbres} درهم</td>
              <td colspan="3" style="border: 1px solid black; text-align: center; color: #1d4ed8; font-size: 13px;">مجموع الفحص: ${totalMedical} درهم</td>
            </tr>
            <tr style="height: 45px; background-color: #000; color: #fff; font-weight: bold;">
              <td colspan="4" style="border: 1px solid black; text-align: center; font-size: 14px;">إجمالي المبالغ المحصلة هذا الأسبوع</td>
              <td colspan="3" style="border: 1px solid black; text-align: center; font-size: 18px;">${totalTimbres + totalMedical} درهم</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    const opt = {
      margin: 0.2,
      filename: `timbre-medical-${agenceName.toLowerCase()}-${now.getTime()}.pdf`,
      html2canvas: { scale: 3 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // Logic for mobile vs desktop remains same...
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // @ts-ignore
      html2pdf().from(element).set(opt).toPdf().get('pdf').then((pdf) => {
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          newWindow.onload = () => { setTimeout(() => { URL.revokeObjectURL(url); }, 100); };
        }
      });
    } else {
      // @ts-ignore
      html2pdf().from(element).set(opt).save();
    }
  };

  return (
    <button onClick={downloadReport} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition-all font-black shadow-lg">
      <FileText size={20} />
      <span>تقرير التمبر والفحص (أسبوعي)</span>
    </button>
  );
}