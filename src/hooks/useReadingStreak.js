import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

function getToday() {
    return new Date().toISOString().split('T')[0]
}

function daysBetween(a, b) {
    const d1 = new Date(a)
    const d2 = new Date(b)
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24))
}

export function useReadingStreak(uid) {
    const [data, setData] = useState({
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null,
        totalDaysRead: 0,
        history: [],
    })

    // Load from Supabase on mount
    useEffect(() => {
        if (!uid) return

        async function load() {
            try {
                const { data: userData, error } = await supabase.from('users').select('streak').eq('id', uid).maybeSingle()
                if (userData && userData.streak) {
                    setData(userData.streak)
                }
            } catch (err) {
                console.error('Failed to load streak from Supabase', err)
            }
        }
        load()
    }, [uid])

    const saveToSupabase = useCallback(async newStreak => {
        if (!uid) return
        try {
            await supabase.from('users').upsert({ id: uid, streak: newStreak })
        } catch (err) {
            console.error('Failed to save streak to Supabase', err)
        }
    }, [uid])

    const recordReading = useCallback(() => {
        const today = getToday()
        setData(prev => {
            if (prev.lastReadDate === today) return prev

            let newStreak = 1
            if (prev.lastReadDate) {
                const gap = daysBetween(prev.lastReadDate, today)
                if (gap === 1) newStreak = prev.currentStreak + 1
                else if (gap === 0) return prev
            }

            const longestStreak = Math.max(prev.longestStreak, newStreak)
            const history = [...prev.history, today].slice(-365)

            const nextData = {
                currentStreak: newStreak,
                longestStreak,
                lastReadDate: today,
                totalDaysRead: prev.totalDaysRead + 1,
                history,
            }

            saveToSupabase(nextData)
            return nextData
        })
    }, [saveToSupabase])

    const hasReadToday = data.lastReadDate === getToday()

    return {
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        totalDaysRead: data.totalDaysRead,
        hasReadToday,
        history: data.history,
        recordReading,
    }
}
