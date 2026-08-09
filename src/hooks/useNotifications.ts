'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/components/NotificationDropdown';

export function useNotifications(agencyName: string) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    
    // 🌟 1️⃣ ستيت التاريخ المختار للتصفية
    const [selectedDate, setSelectedDate] = useState<string>('');

    const fetchNotifications = useCallback(async (dateFilter?: string) => {
        if (!agencyName) return;

        const targetDate = dateFilter !== undefined ? dateFilter : selectedDate;

        // 🌟 بناء الاستعلامات الديناميكية
        let regularQuery = supabase
            .from('notifications')
            .select('*')
            .eq('agency', agencyName)
            .not('message', 'ilike', '%بمبلغ%')
            .order('created_at', { ascending: false });

        let fleetQuery = supabase
            .from('fleet_operations_notifications')
            .select('*')
            .eq('agency', agencyName)
            .order('created_at', { ascending: false });

        // 🌟 إلا المانجر اختار تاريخ، كيجيب كاع الإشعارات د داك النهار كامل بدون limit!
        if (targetDate) {
            const startOfDay = `${targetDate}T00:00:00`;
            const endOfDay = `${targetDate}T23:59:59`;

            regularQuery = regularQuery.gte('created_at', startOfDay).lte('created_at', endOfDay);
            fleetQuery = fleetQuery.gte('created_at', startOfDay).lte('created_at', endOfDay);
        } else {
            // ف الحالة العادية بدون تاريخ كيحافظ على الحدود السابقة
            regularQuery = regularQuery.limit(15);
            fleetQuery = fleetQuery.limit(5);
        }

        const [regularRes, fleetRes] = await Promise.all([regularQuery, fleetQuery]);

        const normalizedRegular = (regularRes.data || []).map(n => ({ ...n, isFleet: false }));
        const normalizedFleet = (fleetRes.data || []).map(n => ({ ...n, isFleet: true }));

        let combined = [...normalizedRegular, ...normalizedFleet]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // إلا ما كاينش تاريخ محدد كنحدوها ف 15، ولكن مع التاريخ كيعرض كااااع إشعارات داك النهار
        if (!targetDate) {
            combined = combined.slice(0, 15);
        }

        if (regularRes.error) {
            console.error("❌ [FETCH ERROR]:", regularRes.error.message);
            return;
        }

        setNotifications(combined);

        // 3. حساب الـ Counter المجموع
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
            .eq('is_read', false);

        if (!countError) {
            const totalUnread = (realUnreadCount || 0) + (fleetUnreadCount || 0);
            setUnreadCount(totalUnread);
        }
    }, [agencyName, selectedDate]);

    // 🌟 دالة لتغيير التاريخ وتحديث البيانات ف البلاصة
    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        fetchNotifications(date);
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
    }, [agencyName, fetchNotifications]);

    return { 
        notifications, 
        unreadCount, 
        selectedDate,          // 🌟 جديد
        handleDateChange,       // 🌟 جديد
        markAllAsRead, 
        markSingleAsRead, 
        deleteNotification, 
        fetchNotifications 
    };
}