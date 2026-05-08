'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// استيراد الصفحات القديمة ديالك كـ "Components"
import ManagerView from './manager/page';
import InstructorTheorieView from './manager/instructor-theorie/page';
import InstructorPratiqueView from './manager/instructor-pratique/page';

export default function DashboardPage() {
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            
            const userRole = user.user_metadata.role;
            const instructorName = user.user_metadata.instructor_name?.toLowerCase();

            if (userRole === 'manager') {
                setRole('manager');
            } else if (userRole === 'instructor_practical') {
                if (instructorName) {
                    router.push(`/dashboard/instructor/${instructorName}`);
                } else {
                    setRole('instructor_practical'); // Fallback for old users
                }
            } else if (userRole === 'instructor_theory') {
                if (instructorName) {
                    router.push(`/dashboard/theory/${instructorName}`);
                } else {
                    setRole('instructor_theory'); // Fallback for old users
                }
            }
            
            setLoading(false);
        };
        getSession();
    }, [router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black italic">جاري التحقق من الصلاحيات...</div>;

    // 🛡️ المبدل الذكي (The Switcher)
    return (
        <>
            {role === 'manager' && <ManagerView />}
            {role === 'instructor_theory' && <InstructorTheorieView />}
            {role === 'instructor_practical' && <InstructorPratiqueView />}
        </>
    );
}