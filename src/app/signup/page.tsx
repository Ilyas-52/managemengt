'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, KeyRound, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// 🛡️ التكوين الأمني: الربط بين الكود السري والمسار الحقيقي فـ الـ VS Code
const ACCESS_CONFIG: Record<string, { role: string, agence: string, full_name: string }> = {
    // وكالة بودينار - Boudinar
    'THEO-BOU-XP': { role: 'instructor_theory', agence: 'Boudinar', full_name: 'youssef' },
    'PRAT-BOU-XP': { role: 'instructor_practical', agence: 'Boudinar', full_name: 'hamza' },

    // وكالة كرونا - Krona Empire
    'THEO-KRO-MOHD': { role: 'instructor_theory', agence: 'Krona', full_name: 'mohammed' },
    'PRAT-KRO-BILAL': { role: 'instructor_practical', agence: 'Krona', full_name: 'bilal' },

    //  وكالة تزغين - Tazaghine
    'THEO-TAZ-WAZ': { role: 'instructor_theory', agence: 'Tazaghine', full_name: 'wafae/zakaria' },
    'PRAT-TAZ-BELK': { role: 'instructor_practical', agence: 'Tazaghine', full_name: 'belkassmi' },

    //  وكالة ازغار - Azghar
    'THEO-AZG-BRH': { role: 'instructor_theory', agence: 'Azghar', full_name: 'brahim' },
    'PRAT-AZG-ISM': { role: 'instructor_practical', agence: 'Azghar', full_name: 'ismail' },

    // الماناجر العام
    'MGR-GLOBAL-2026': { role: 'manager', agence: 'Boudinar', full_name: 'younes' },
};

export default function SignUpPage() {


    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const cleanKey = accessKey.trim().toUpperCase();
            const config = ACCESS_CONFIG[cleanKey];

            if (!config) {
                alert("❌ كود الانضمام غير صحيح!");
                setLoading(false);
                return;
            }

            // 1. جلب الـ ID ديال الوكالة من الداتابيز
            const { data: agenceData, error: agenceError } = await supabase
                .from('agencies')
                .select('id')
                .eq('name', config.agence)
                .single();

            if (agenceError || !agenceData) {
                throw new Error("لم يتم العثور على الوكالة في قاعدة البيانات.");
            }

            // 2. عملية التسجيل في Supabase Auth مع الـ Metadata الصحيحة
            const { error: signUpError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: {
                        user_role: config.role, // كيمشي لـ الـ Middleware
                        agence_id: agenceData.id, // كيمشي لـ الـ Isolation
                        full_name: config.full_name // هادا هو الساروت ديال التوجيه
                    }
                }
            });

            if (signUpError) throw signUpError;

            alert(`✅ تم التسجيل بنجاح لـ ${config.full_name} في وكالة ${config.agence}!`);
            router.push('/login');

        } catch (err: any) {
            alert("❌ مشكلة في التسجيل: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-8 font-black tracking-tighter uppercase selection:bg-[#1dbf73] selection:text-white" dir="rtl">
            <section className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-700">
                <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white">
                    <header className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1dbf73] text-white rounded-2xl mb-6 shadow-[0_10px_25px_rgba(29,191,115,0.3)] -rotate-3">
                            <UserPlus size={32} />
                        </div>
                        <h1 className="text-4xl text-slate-900 leading-none font-black">انضمام جديد</h1>
                        <p className="text-[#1dbf73] text-sm mt-3 font-bold">بوابة مؤسسة يونس لتعليم السياقة</p>
                    </header>

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[11px] text-red-500 pr-4 block font-black underline">كود الانضمام السري</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="أدخل كود الصلاحية"
                                    required
                                    className="w-full h-14 pr-12 bg-red-50/30 border-2 border-red-50 rounded-2xl outline-none text-slate-900 placeholder:text-red-200 transition-all text-sm font-black focus:border-red-500 focus:bg-white"
                                    onChange={(e) => setAccessKey(e.target.value)}
                                />
                                <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 text-red-200 group-focus-within:text-red-500 transition-colors" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 pr-4 block font-black">البريد الالكتروني</label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    placeholder="email@example.com"
                                    required
                                    className="w-full h-14 pr-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 placeholder:text-slate-300 transition-all text-sm lowercase font-black focus:border-[#1dbf73] focus:bg-white"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1dbf73] transition-colors" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 pr-4 block font-black">كلمة المرور</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="w-full h-14 pr-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-[#1dbf73] focus:bg-white transition-all text-sm font-black text-slate-900"
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1dbf73] transition-colors" size={18} />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-lg transition-all active:scale-[0.97] hover:bg-black flex items-center justify-center gap-3 shadow-xl mt-4"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>تأكيد التسجيل</span>
                                    <ChevronRight size={20} className="rotate-180" />
                                </>
                            )}
                        </button>

                        <div className="text-center mt-6">
                            <Link href="/login" className="text-slate-400 text-[10px] font-black hover:text-[#1dbf73] transition-colors">
                                عندك حساب؟ رجوع لتسجيل الدخول
                            </Link>
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}