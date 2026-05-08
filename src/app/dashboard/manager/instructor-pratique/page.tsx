'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PracticalTerminal from '@/components/terminals/PracticalTerminal';

export default function HamzaPage() {
    const [userData, setUserData] = useState<{ agence_id: string, agence_name: string } | null>(null);

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const agenceId = user.user_metadata.agence_id;
                const { data: agenceData } = await supabase.from('agencies').select('name').eq('id', agenceId).single();

                setUserData({
                    // ✅ مسمار 1: حيدنا بودينار الافتراضية. دبا السيستيم غياخد الوكالة الحقيقية ديال المستخدم
                    agence_id: agenceId,
                    agence_name: agenceData?.name || 'وكالة غير معروفة'
                });
            }
        };
        getData();
    }, []);

    if (!userData) return <div className="min-h-screen flex items-center justify-center font-black italic">جاري تحميل البيانات...</div>;

    const instructorName = userData.agence_name === 'Krona' ? 'Bilal' : 'Hamza';

    return (
        <PracticalTerminal
            instructorName={instructorName}
            agenceId={userData.agence_id}
            agenceName={userData.agence_name}
            // ✅ مسمار 2: دوزنا selectedAgency باش يتحيد السطر الأحمر والفلترة تخدم بيطون
            selectedAgency={{ id: userData.agence_id, name: userData.agence_name }}
        />
    );
}