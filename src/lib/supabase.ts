// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'; // هادي هي السمية الصحيحة ✅

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// هادو هما "القواعد" ديال السيستيم الجديد
export type Student = {
  id: string;
  full_name: string;
  agency: 'Boudinar' | 'Krona' | 'Tazaghine' | 'Azghar';
  total_price: number;
  remaining_balance: number;
  theory_instructor: string;
  practice_instructor: string;
  registration_date: string;
  is_archived: boolean;
  // الأشطر (Max 4) كيتسيفاو كـ JSON في الداتابيز
  payments: Array<{
    amount: number;
    date: string;
    is_timbre_deducted: boolean;
  }>;
};