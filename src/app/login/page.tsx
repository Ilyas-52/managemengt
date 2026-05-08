'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ChevronRight, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      alert("البيانات غير صحيحة! ❌");
      setLoading(false);
    } else {
      // 🕵️‍♂️ كنجبدو الـ Role والـ Name من الميتادات لي سجلنا فـ Signup
      const userRole = data.user?.user_metadata?.user_role;
      const fullName = data.user?.user_metadata?.full_name || '';

      // تحويل الاسم لـ lowercase باش يطابق سمية المجلدات (youssef, hamza, etc.)
      const pathName = fullName.toLowerCase().trim();

      // تحديث الـ Cookies باش الـ Middleware يقرأ الـ Session الجديدة
      router.refresh();

      setTimeout(() => {
        // 🚀 التوجيه الذكي على حساب المانيفست التقني لي صاوبنا
        if (userRole === 'manager') {
          router.push('/dashboard/manager');
        }
        else if (userRole === 'instructor_theory') {
          // التوجيه لـ dashboard/theory/[الاسم]
          router.push(`/dashboard/theory/${pathName}`);
        }
        else if (userRole === 'instructor_practical') {
          // التوجيه لـ dashboard/instructor/[الاسم]
          router.push(`/dashboard/instructor/${pathName}`);
        }
        else {
          // إيلا ما كاينش Role واضح، صيفطو لـ الدشبورد الرئيسي
          router.push('/dashboard');
        }
      }, 150);
    }
  };
  return (
    <main className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-8 font-black tracking-tighter uppercase selection:bg-[#1dbf73] selection:text-white" dir="rtl">
      <section className="w-full max-w-[380px] sm:max-w-[440px] animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white rounded-[40px] p-6 sm:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white">
          <header className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1dbf73] text-white rounded-2xl mb-6 shadow-[0_10px_25px_rgba(29,191,115,0.3)] rotate-3">
              <Mail size={32} />
            </div>
            <h1 className="text-5xl text-slate-900 leading-none tracking-tight font-black">
              مـرحـبـاً بـكـم
            </h1>
            <p className="text-[#1dbf73] text-sm mt-3 tracking-wide font-bold">
              مؤسسة يونس لتعليم السياقة
            </p>
          </header>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 pr-4 block font-black">البريد الالكتروني</label>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="أدخل البريد الإلكتروني"
                  required
                  className="w-full h-16 pr-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none text-slate-900 placeholder:text-slate-300 transition-all text-sm lowercase font-black focus:border-[#1dbf73] focus:bg-white caret-[#1dbf73]"
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
                  placeholder="أدخل كلمة المرور"
                  required
                  className="w-full h-16 pr-12 bg-slate-50 border-2 border-slate-50 rounded-2xl placeholder:text-slate-300 outline-none focus:border-[#1dbf73] focus:bg-white transition-all text-sm font-black text-slate-900 caret-[#1dbf73]"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1dbf73] transition-colors" size={18} />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full h-14 bg-[#1dbf73] text-white rounded-2xl font-black text-lg transition-all active:scale-[0.97] hover:bg-[#19a463] flex items-center justify-center gap-3 shadow-xl shadow-[#1dbf73]/20 border-none"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span> تسجيل الدخول </span>
                  <ChevronRight size={20} className="rotate-180" />
                </>
              )}
            </button>

            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <p className="text-slate-500 text-[12px] font-black">
                ما عندكش حساب؟{' '}
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1 text-[#1dbf73] hover:underline decoration-2 underline-offset-4 transition-all"
                >
                  <UserPlus size={14} />
                  سجل من هنا
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}