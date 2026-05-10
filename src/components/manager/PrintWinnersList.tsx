// 📄 src/components/manager/PrintWinnersList.tsx
import { ExamResult } from '@/types/dashboard';

export const generateWinnersPrint = (students: any[], examResults: any[], reportDate?: Date | string) => {
    // ✅ المسمار: كرينا Iframe مخفي فـ بلاصة window.open باش يخدم ف أندرويد و Honor
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const printWindow = iframe.contentWindow;

    if (!printWindow) return;

    // 📅 مسمار التوقيت (كيتبع الـ selectedDate دابا)
    const currentDate = reportDate ? new Date(reportDate) : new Date();
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتنبر", "أكتوبر", "نوفمبر", "دجنبر"];
    const currentMonth = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();

    const selMonth = currentDate.getMonth();
    const selYear = currentDate.getFullYear();

    // 🚀 مسمار الفلترة: الناجحين فـ هاد الشهر والعام بالضبط
    const winners = students.filter(student => {
        // 1. واش مبرمج فهاد الشهر؟
        if (!student.exam_date) return false;
        const d = new Date(student.exam_date);
        if (d.getMonth() !== selMonth || d.getFullYear() !== selYear) return false;

        // 2. واش نجح نهائياً؟
        const name = `${student.first_name} ${student.last_name}`;
        const r = examResults.find(res => res.student_name === name) || {} as Partial<ExamResult>;
        const theoryPass = r.theory_result === 'admis' || r.theory_result_2 === 'admis';
        const practicalPass = r.practical_result === 'admis' || r.practical_result_2 === 'admis';
        return theoryPass && practicalPass;
    });

    const rows = winners.map((student, index) => {
        const name = `${student.first_name} ${student.last_name}`;
        const r = examResults.find(res => res.student_name === name) || {} as Partial<ExamResult>;

        return `
            <tr>
                <td style="width: 40px;">${index + 1}</td>
                <td class="student-name">${name}</td>
                <td class="cell">${r.practical_paid ? '✓' : 'X'}</td>
                <td class="cell">${r.is_dora ? '✓' : 'X'}</td>
                <td class="status-cell">✅ ناجح نهائياً</td>
            </tr>
        `;
    }).join('');

    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>لائحة الناجحين - ${currentMonth}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
                body { font-family: 'Tajawal', sans-serif; padding: 40px; background: white; }
                .main-header { text-align: center; margin-bottom: 30px; }
                .main-header h1 { border: 4px solid #04b55f; display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: 900; color: #04b55f; border-radius: 15px; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 2px solid #000; padding: 12px; text-align: center; font-size: 14px; }
                
                th { background-color: #f0fdf4; font-weight: 900; color: #166534; }
                .student-name { text-align: right; font-weight: 900; padding-right: 15px; }
                .cell { font-size: 20px; font-weight: 900; }
                .status-cell { font-weight: 900; color: #04b55f; }
                
                .footer { margin-top: 40px; text-align: left; font-size: 12px; font-weight: 900; border-top: 1px solid #000; padding-top: 10px; }
                @media print { body { padding: 10px; } }
            </style>
        </head>
        <body>
            <div class="main-header">
                <h1>لائحة الناجحين لشهر ${currentMonth} ${currentYear}</h1>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>اسم المترشح</th>
                        <th>واجب الامتحان</th>
                        <th>الدورة الشرفية</th>
                        <th>النتيجة النهائية</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.length > 0 ? rows : '<tr><td colspan="5">لا يوجد ناجحون حالياً</td></tr>'}
                </tbody>
            </table>

            <div class="footer">مؤسسة بودينار لتعليم السياقة - تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-MA')}</div>

            <script>
                window.onload = () => {
                    setTimeout(() => { 
                        window.print(); 
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();

    // مسح الـ Iframe من الكود ملي تسالي الطباعة باش تبقى الماكينة خفيفة
    iframe.onload = () => {
        setTimeout(() => {
            // document.body.removeChild(iframe); 
        }, 2000);
    };
};