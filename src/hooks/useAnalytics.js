import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAnalytics(uid) {
    const [data, setData] = useState({ poems: {}, global: { totalViews: 0, sessions: [] } })
    const readStart = useRef(null)
    const currentPoemId = useRef(null)

    // Load from Supabase on mount
    useEffect(() => {
        if (!uid) return

        async function load() {
            try {
                const { data: userData, error } = await supabase.from('users').select('analytics').eq('id', uid).maybeSingle()
                if (userData && userData.analytics) {
                    setData(userData.analytics)
                }
            } catch (err) {
                console.error('Failed to load analytics from Supabase', err)
            }
        }
        load()
    }, [uid])

    const saveToSupabase = useCallback(async newAnalytics => {
        if (!uid) return
        try {
            await supabase.from('users').upsert({ id: uid, analytics: newAnalytics })
        } catch (err) {
            console.error('Failed to save analytics to Supabase', err)
        }
    }, [uid])

    const recordView = useCallback(poemId => {
        const now = Date.now()
        const hour = new Date(now).getHours()
        setData(prev => {
            const poemData = prev.poems[poemId] || {
                views: 0, totalReadTime: 0, readSessions: [],
                scrollDepths: [], sharedLines: {}, hourlyViews: new Array(24).fill(0),
            }
            const hourlyViews = [...(poemData.hourlyViews || new Array(24).fill(0))]
            hourlyViews[hour] = (hourlyViews[hour] || 0) + 1

            const nextData = {
                ...prev,
                poems: {
                    ...prev.poems,
                    [poemId]: { ...poemData, views: poemData.views + 1, lastViewed: now, hourlyViews }
                },
                global: { ...prev.global, totalViews: prev.global.totalViews + 1 }
            }
            saveToSupabase(nextData)
            return nextData
        })
        readStart.current = now
        currentPoemId.current = poemId
    }, [saveToSupabase])

    const recordReadEnd = useCallback(() => {
        if (!readStart.current || !currentPoemId.current) return
        const duration = Math.floor((Date.now() - readStart.current) / 1000)
        const poemId = currentPoemId.current
        if (duration < 2) return

        setData(prev => {
            const poemData = prev.poems[poemId]
            if (!poemData) return prev
            const readSessions = [...(poemData.readSessions || []), { duration, timestamp: Date.now() }].slice(-100)
            const nextData = {
                ...prev,
                poems: {
                    ...prev.poems,
                    [poemId]: {
                        ...poemData,
                        totalReadTime: poemData.totalReadTime + duration,
                        readSessions,
                    }
                }
            }
            saveToSupabase(nextData)
            return nextData
        })
        readStart.current = null
        currentPoemId.current = null
    }, [saveToSupabase])

    const recordScrollDepth = useCallback((poemId, depth) => {
        setData(prev => {
            const poemData = prev.poems[poemId]
            if (!poemData) return prev
            const scrollDepths = [...(poemData.scrollDepths || []), depth].slice(-200)
            const nextData = {
                ...prev,
                poems: { ...prev.poems, [poemId]: { ...poemData, scrollDepths } }
            }
            saveToSupabase(nextData)
            return nextData
        })
    }, [saveToSupabase])

    const recordSharedLine = useCallback((poemId, lineIndex) => {
        setData(prev => {
            const poemData = prev.poems[poemId]
            if (!poemData) return prev
            const sharedLines = { ...(poemData.sharedLines || {}) }
            sharedLines[lineIndex] = (sharedLines[lineIndex] || 0) + 1
            const nextData = {
                ...prev,
                poems: { ...prev.poems, [poemId]: { ...poemData, sharedLines } }
            }
            saveToSupabase(nextData)
            return nextData
        })
    }, [saveToSupabase])

    const getPoemAnalytics = useCallback(poemId => {
        const poemData = data.poems[poemId]
        if (!poemData) return null
        const sessions = poemData.readSessions || []
        const avgReadTime = sessions.length > 0
            ? Math.round(sessions.reduce((s, r) => s + r.duration, 0) / sessions.length)
            : 0
        const maxDepth = (poemData.scrollDepths || []).length > 0
            ? Math.max(...poemData.scrollDepths)
            : 0
        return { ...poemData, avgReadTime, maxScrollDepth: maxDepth }
    }, [data])

    const getTopPoems = useCallback((limit = 10) => {
        return Object.entries(data.poems)
            .map(([id, d]) => ({ id, ...d }))
            .sort((a, b) => b.views - a.views)
            .slice(0, limit)
    }, [data])

    const getGlobalStats = useCallback(() => {
        const poems = Object.values(data.poems)
        const totalViews = data.global.totalViews
        const totalReadTime = poems.reduce((s, p) => s + (p.totalReadTime || 0), 0)
        const hourlyViews = new Array(24).fill(0)
        poems.forEach(p => {
            (p.hourlyViews || []).forEach((v, h) => { hourlyViews[h] += v })
        })
        const peakHour = hourlyViews.indexOf(Math.max(...hourlyViews))
        return { totalViews, totalReadTime, peakHour, hourlyViews, poemCount: poems.length }
    }, [data])

    return {
        recordView, recordReadEnd, recordScrollDepth, recordSharedLine,
        getPoemAnalytics, getTopPoems, getGlobalStats,
    }
}
