'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/components/NotificationDropdown';

export function useNotifications(agencyName: string) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    const fetchNotifications = async () => {
        if (!agencyName) return;

        // 1. جلب الإشعارات العادية د الوكالة الحالية (مع استبعاد ميساجات السيستيم الأوتوماتيكية)
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('agency', agencyName)
            .not('message', 'ilike', '%بمبلغ%')
            .order('created_at', { ascending: false })
            .limit(15);

        // 2. 🎯 جلب إشعارات أسطول السيارات الخاصة بالوكالة (حيدنا شرط is_read باش يبقاو باينين ف الجرس وخا مقروءين!)
        const { data: fleetData } = await supabase
            .from('fleet_operations_notifications')
            .select('*')
            .eq('agency', agencyName)
            .order('created_at', { ascending: false })
            .limit(5);

        // 🔀 وسم الإشعارات لتمييزها بدقة داخل الـ Dropdown ومنع تداخل الـ IDs
        const normalizedRegular = (data || []).map(n => ({ ...n, isFleet: false }));
        const normalizedFleet = (fleetData || []).map(n => ({ ...n, isFleet: true }));

        const combined = [...normalizedRegular, ...normalizedFleet]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 15);

        if (error) {
            console.error("❌ [FETCH ERROR]:", error.message);
            return;
        }

        setNotifications(combined);

        // 3. 🚀 حساب الـ Counter المجموع (هنا الـ العداد كيحسب غي لي مزال ما تقرأو بـ الصح Rgh)
        const { count: realUnreadCount, error: countError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('agency', agencyName)
            .eq('is_read', false)
            .not('message', 'ilike', '%بمبلغ%');

        const { count: fleetUnreadCount } = await supabase
            .from('fleet_operations_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('agency', agencyName)
            .eq('is_read', false); // العداد كينقص عادي ملي كتبرك عليها حيت كتولي true ف الداتابيز

        if (!countError) {
            const totalUnread = (realUnreadCount || 0) + (fleetUnreadCount || 0);
            setUnreadCount(totalUnread);
            console.log("📊 Counter Updated Locally:", totalUnread);
        }
    };

    const markAllAsRead = async () => {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        await supabase.from('notifications').update({ is_read: true }).eq('agency', agencyName).eq('is_read', false);
        await supabase.from('fleet_operations_notifications').update({ is_read: true }).eq('agency', agencyName).eq('is_read', false);
        fetchNotifications();
    };

    const markSingleAsRead = async (id: string, isFleet?: boolean) => {
        setNotifications(prev => prev.map(n => (n.id === id && !!n.isFleet === !!isFleet) ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (isFleet) {
            await supabase.from('fleet_operations_notifications').update({ is_read: true }).eq('id', id);
        } else {
            await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        }
        fetchNotifications();
    };

    const deleteNotification = async (id: string, isFleet?: boolean) => {
        setNotifications(prev => prev.filter(n => !(n.id === id && !!n.isFleet === !!isFleet)));
        const deletedNotif = notifications.find(n => n.id === id && !!n.isFleet === !!isFleet);
        if (deletedNotif && !deletedNotif.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        if (isFleet) {
            await supabase.from('fleet_operations_notifications').delete().eq('id', id);
        } else {
            await supabase.from('notifications').delete().eq('id', id);
        }
        fetchNotifications();
    };

    useEffect(() => {
        if (!agencyName) return;
        fetchNotifications();

        // 🛰️ الـ Real-time العالمي: كيتصنت لجميع تحديثات الجداول ف البلاصة
        const channel = supabase.channel(`global-notifs-${agencyName}`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `agency=eq.${agencyName}`
                },
                () => {
                    console.log("🔔 New Notification Detected!");
                    fetchNotifications();
                }
            )
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'fleet_operations_notifications',
                    filter: `agency=eq.${agencyName}`
                },
                () => {
                    console.log("🔔 New Fleet Notification Detected!");
                    fetchNotifications();
                }
            ).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [agencyName]);

    return { notifications, unreadCount, markAllAsRead, markSingleAsRead, deleteNotification, fetchNotifications };
}