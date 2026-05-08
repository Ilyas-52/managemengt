'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TheoryTerminal from '@/components/terminals/TheoryTerminal';

export default function TazaghineTheoryPage() {
    const [userData, setUserData] = useState<{ agence_id: string, agence_name: string } | null>(null);

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // كنجبدو الـ ID ديال الوكالة من الـ Metadata اللي تسجلات فـ الـ Signup
                const agenceId = user.user_metadata.agence_id;

                // كنجبدو سمية الوكالة الحقيقية من الداتابيز (Tazaghine)
                const { data: agenceData } = await supabase
                    .from('agencies')
                    .select('name')
                    .eq('id', agenceId)
                    .single();

                setUserData({
                    agence_id: agenceId,
                    agence_name: agenceData?.name || 'Tazaghine'
                });
            }
        };
        getData();
    }, []);

    if (!userData) return <div className="min-h-screen flex items-center justify-center font-black italic">جاري تحميل البيانات...</div>;

    return (
        <TheoryTerminal
            // هاد السمية هي "الساروت" اللي غادي يشتركوا فيه وفاء وزكرياء
            instructorName="wafae/zakaria"
            agenceId={userData.agence_id}
            agenceName={userData.agence_name}
        />
    );
}