// 📄 src/components/manager/PrintGprsReport.tsx

export const generateGprsPrint = (data: any[], weekStart: string, vehicle: string, agencyName: string = 'Boudinar') => {
    // 🚀 المسمار 1: فتح النافذة
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
        alert("يرجى السماح بالفتواذ المنبثقة (Pop-ups) لمشاهدة التقرير");
        return;
    }

    const totalMins = data.reduce((acc, curr) => acc + curr.duration_minutes, 0);
    const morningLogs = data.filter(log => log.period === 'morning');
    const eveningLogs = data.filter(log => log.period === 'evening' || log.period === 'afternoon');

    const renderTable = (logs: any[], title: string) => `
        <div style="margin-bottom: 30px;">
            <h2 style="font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; font-weight: 900;">${title}</h2>
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
                <thead>
                    <tr style="background: #eee;">
                        <th style="border: 1px solid #000; padding: 8px; font-size: 11px;">الترتيب</th>
                        <th style="border: 1px solid #000; padding: 8px; font-size: 11px;">التاريخ</th>
                        <th style="border: 1px solid #000; padding: 8px; font-size: 11px;">البدء</th>
                        <th style="border: 1px solid #000; padding: 8px; font-size: 11px;">الانتهاء</th>
                        <th style="border: 1px solid #000; padding: 8px; font-size: 11px;">النشاط</th>
                        <th style="border: 1px solid #000; padding: 8px; font-size: 11px;">المدة</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map((log, idx) => `
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px; font-weight: 900;">${idx + 1}</td>
                            <td style="border: 1px solid #000; padding: 8px;">${log.log_date}</td>
                            <td style="border: 1px solid #000; padding: 8px; font-weight: 900;">${log.entry_time.slice(0, 5)}</td>
                            <td style="border: 1px solid #000; padding: 8px; font-weight: 900;">${log.exit_time.slice(0, 5)}</td>
                            <td style="border: 1px solid #000; padding: 8px;">${log.activity_type === 'hlabba' ? 'حلبة' : 'دورة'}</td>
                            <td style="border: 1px solid #000; padding: 8px; font-weight: 900;">${Math.floor(log.duration_minutes / 60)}س ${log.duration_minutes % 60}د</td>
                        </tr>
                    `).join('')}
                    ${logs.length === 0 ? '<tr><td colspan="6" style="padding: 15px; color: #999;">لا توجد بيانات</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;

    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>تقرير GPRS - ${agencyName} - ${vehicle}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
                body { font-family: 'Tajawal', Arial, sans-serif; padding: 20px; background: white; color: #000; }
                .main-title { text-align: center; border: 4px solid #000; padding: 15px; margin-bottom: 20px; }
                .main-title h1 { margin: 0; font-size: 20px; font-weight: 900; }
                .info-line { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: 700; border-bottom: 2px solid #000; padding-bottom: 10px; font-size: 12px; }
                .footer { margin-top: 20px; display: flex; justify-content: flex-end; }
                .total-box { border: 3px solid #000; padding: 10px 20px; font-size: 16px; font-weight: 900; background: #eee; }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="main-title">
                <h1>Auto Ecole ${agencyName} - تقرير ${vehicle} - GPRS</h1>
                <div style="font-size: 13px; margin-top: 5px;">الأسبوع: ${weekStart}</div>
            </div>

            <div class="info-line">
                <div>المركبة: ${vehicle}</div>
                <div>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-MA')}</div>
            </div>

            ${renderTable(morningLogs, "الفترة الصباحية")}
            ${renderTable(eveningLogs, "الفترة المسائية")}

            <div class="footer">
                <div class="total-box">
                    المجموع الكلي: ${Math.floor(totalMins / 60)}س ${totalMins % 60}د
                </div>
            </div>

            <script>
                // 🚀 المسمار 2: ضمان الطباعة فـ الموبايل
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                        // فـ الموبايل كنخليو النافذة مفتوحة شوية باش يقد يختار Save as PDF
                        if(!/Android|iPhone|iPad/i.test(navigator.userAgent)) {
                            window.close();
                        }
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();
};