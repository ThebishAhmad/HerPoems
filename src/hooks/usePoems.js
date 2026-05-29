import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const STORAGE_DRAFT = 'inkwell_draft'
const STORAGE_SCROLL = 'inkwell_scroll_positions'

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function parseTags(tagString) {
    return tagString
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)
}

function estimateReadingTime(content) {
    const words = content.trim().split(/\s+/).length
    return Math.max(1, Math.round(words / 200))
}

export function usePoems(uid) {
    const [poems, setPoems] = useState([])
    const [loading, setLoading] = useState(true)

    const [scrollPositions, setScrollPositions] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_SCROLL)) || {}
        } catch { return {} }
    })

    const [reactedMap, setReactedMap] = useState({})

    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('newest')
    const [activeTag, setActiveTag] = useState(null)
    const [activeMood, setActiveMood] = useState(null)

    // Persist scroll positions locally
    useEffect(() => {
        localStorage.setItem(STORAGE_SCROLL, JSON.stringify(scrollPositions))
    }, [scrollPositions])

    // Load reacted map from Supabase
    useEffect(() => {
        if (!uid) return
        async function loadReacted() {
            try {
                const { data, error } = await supabase.from('users').select('reactedMap').eq('id', uid).maybeSingle()
                if (data && data.reactedMap) {
                    setReactedMap(data.reactedMap)
                }
            } catch (err) {
                console.error('Failed to load reacted map', err)
            }
        }
        loadReacted()
    }, [uid])

    const saveReactedMapToSupabase = useCallback(async newReactedMap => {
        if (!uid) return
        try {
            await supabase.from('users').upsert({ id: uid, reactedMap: newReactedMap })
        } catch (err) {
            console.error('Failed to save reacted map', err)
        }
    }, [uid])

    // Fetch poems from Supabase on mount
    useEffect(() => {
        async function fetchPoems() {
            try {
                const { data, error } = await supabase.from('poems').select('*')
                if (error) throw error
                if (data) {
                    setPoems(data)
                }
            } catch (err) {
                console.error('Failed to fetch poems:', err)
                // Fallback to localStorage if Supabase fails
                try {
                    const raw = localStorage.getItem('inkwell_poems')
                    if (raw) setPoems(JSON.parse(raw))
                } catch { /* empty */ }
            } finally {
                setLoading(false)
            }
        }
        fetchPoems()
    }, [])

    // Check and publish scheduled poems
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            setPoems(prev => {
                let changed = false
                const updated = prev.map(p => {
                    if (p.visibility === 'scheduled' && p.scheduledAt && p.scheduledAt <= now) {
                        changed = true
                        const newP = { ...p, visibility: 'public', scheduledAt: null }
                        // Update Supabase in background
                        supabase.from('poems').update({ visibility: 'public', scheduledAt: null }).eq('id', p.id).catch(console.error)
                        return newP
                    }
                    return p
                })
                return changed ? updated : prev
            })
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    const allTags = useCallback(() => {
        const tagSet = new Set()
        poems.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)))
        return Array.from(tagSet).sort()
    }, [poems])

    const allSeries = useCallback(() => {
        const seriesSet = new Set()
        poems.forEach(p => { if (p.series) seriesSet.add(p.series) })
        return Array.from(seriesSet).sort()
    }, [poems])

    const getFiltered = useCallback(() => {
        let filtered = [...poems]

        filtered = filtered.filter(p => p.visibility !== 'private' && p.visibility !== 'scheduled')

        if (search) {
            const q = search.toLowerCase()
            filtered = filtered.filter(
                p =>
                    p.title.toLowerCase().includes(q) ||
                    p.content.toLowerCase().includes(q) ||
                    (p.subtitle && p.subtitle.toLowerCase().includes(q))
            )
        }

        if (activeTag) {
            filtered = filtered.filter(p => p.tags && p.tags.includes(activeTag))
        }

        if (activeMood) {
            filtered = filtered.filter(p => p.mood === activeMood)
        }

        switch (sort) {
            case 'oldest':
                filtered.sort((a, b) => a.createdAt - b.createdAt)
                break
            case 'most-liked': {
                filtered.sort((a, b) => {
                    const aTotal = Object.values(a.reactions || {}).reduce((s, v) => s + v, 0)
                    const bTotal = Object.values(b.reactions || {}).reduce((s, v) => s + v, 0)
                    return bTotal - aTotal
                })
                break
            }
            case 'newest':
            default:
                filtered.sort((a, b) => b.createdAt - a.createdAt)
        }

        return filtered
    }, [poems, search, sort, activeTag, activeMood])

    const addPoem = useCallback(async (title, subtitle, content, tagsStr, { visibility = 'public', mood = null, series = null, scheduledAt = null } = {}) => {
        const id = generateId()
        const newPoem = {
            id,
            title,
            subtitle,
            content,
            tags: parseTags(tagsStr),
            reactions: { loved: 0, hurt: 0, felt: 0, deep: 0 },
            likes: 0,
            visibility: scheduledAt ? 'scheduled' : visibility,
            mood,
            series,
            scheduledAt,
            readingTime: estimateReadingTime(content),
            versions: [{ content, title, subtitle, timestamp: Date.now() }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
        setPoems(prev => [newPoem, ...prev])

        try {
            await supabase.from('poems').insert(newPoem)
        } catch (err) {
            console.error('Failed to save poem to Supabase:', err)
        }

        return newPoem
    }, [])

    const updatePoem = useCallback(async (id, title, subtitle, content, tagsStr, { visibility, mood, series, scheduledAt } = {}) => {
        let updatedPoem = null
        setPoems(prev =>
            prev.map(p => {
                if (p.id !== id) return p
                const versions = [...(p.versions || []), { content, title, subtitle, timestamp: Date.now() }]
                updatedPoem = {
                    ...p, title, subtitle, content,
                    tags: parseTags(tagsStr),
                    readingTime: estimateReadingTime(content),
                    versions: versions.slice(-50),
                    updatedAt: Date.now(),
                    ...(visibility !== undefined && { visibility: scheduledAt ? 'scheduled' : visibility }),
                    ...(mood !== undefined && { mood }),
                    ...(series !== undefined && { series }),
                    ...(scheduledAt !== undefined && { scheduledAt }),
                }
                return updatedPoem
            })
        )

        if (updatedPoem) {
            try {
                const { id: _id, ...data } = updatedPoem
                await supabase.from('poems').update(data).eq('id', id)
            } catch (err) {
                console.error('Failed to update poem in Supabase:', err)
            }
        }
    }, [])

    const deletePoem = useCallback(async id => {
        setPoems(prev => prev.filter(p => p.id !== id))

        try {
            await supabase.from('poems').delete().eq('id', id)
            // Also delete associated comments
            await supabase.from('comments').delete().eq('poemId', id)
        } catch (err) {
            console.error('Failed to delete poem from Supabase:', err)
        }
    }, [])

    const toggleReaction = useCallback(async (id, type) => {
        let updatedReactions = null
        let nextReactedMap = null
        setPoems(prev =>
            prev.map(p => {
                if (p.id !== id) return p
                const reacted = { ...(reactedMap[id] || {}) }
                const reactions = { ...(p.reactions || { loved: 0, hurt: 0, felt: 0, deep: 0 }) }
                if (reacted[type]) {
                    reacted[type] = false
                    reactions[type] = Math.max(0, (reactions[type] || 1) - 1)
                } else {
                    reacted[type] = true
                    reactions[type] = (reactions[type] || 0) + 1
                }
                const totalLikes = Object.values(reactions).reduce((s, v) => s + v, 0)

                // Update local reacted state
                nextReactedMap = { ...reactedMap, [id]: reacted }
                setReactedMap(nextReactedMap)

                updatedReactions = reactions
                return { ...p, reactions, likes: totalLikes, liked: Object.values(reacted).some(Boolean) }
            })
        )

        if (nextReactedMap) {
             saveReactedMapToSupabase(nextReactedMap)
        }

        if (updatedReactions) {
            try {
                await supabase.from('poems').update({ reactions: updatedReactions }).eq('id', id)
            } catch (err) {
                console.error('Failed to update reactions:', err)
            }
        }
    }, [reactedMap, saveReactedMapToSupabase])

    const toggleLike = useCallback(id => toggleReaction(id, 'loved'), [toggleReaction])

    const restoreVersion = useCallback(async (poemId, versionIndex) => {
        let restored = null
        setPoems(prev =>
            prev.map(p => {
                if (p.id !== poemId || !p.versions?.[versionIndex]) return p
                const version = p.versions[versionIndex]
                restored = {
                    ...p,
                    title: version.title || p.title,
                    subtitle: version.subtitle || p.subtitle,
                    content: version.content,
                    updatedAt: Date.now(),
                }
                return restored
            })
        )

        if (restored) {
            try {
                await supabase.from('poems').update({
                    title: restored.title,
                    subtitle: restored.subtitle,
                    content: restored.content,
                    updatedAt: restored.updatedAt,
                }).eq('id', poemId)
            } catch (err) {
                console.error('Failed to restore version:', err)
            }
        }
    }, [])

    const getPoem = useCallback(id => {
        const poem = poems.find(p => p.id === id)
        if (!poem) return null
        return { ...poem, reacted: reactedMap[id] || {} }
    }, [poems, reactedMap])

    const getRandomId = useCallback(() => {
        const visible = poems.filter(p => p.visibility !== 'private' && p.visibility !== 'scheduled')
        if (visible.length === 0) return null
        return visible[Math.floor(Math.random() * visible.length)].id
    }, [poems])

    const getLateNightPoem = useCallback(() => {
        const hour = new Date().getHours()
        if (hour < 23 && hour > 5) return getRandomId()
        const moody = poems.filter(p =>
            p.visibility !== 'private' && p.visibility !== 'scheduled' &&
            (p.mood === 'loss' || p.mood === 'nostalgia' || p.mood === 'existential' ||
                (p.tags || []).some(t => ['night', 'midnight', 'dark', 'alone', 'distance', 'loss'].includes(t)))
        )
        if (moody.length > 0) return moody[Math.floor(Math.random() * moody.length)].id
        return getRandomId()
    }, [poems, getRandomId])

    const getSeriesPoems = useCallback(seriesName => {
        return poems
            .filter(p => p.series === seriesName)
            .sort((a, b) => a.createdAt - b.createdAt)
    }, [poems])

    const getAdjacentPoems = useCallback(currentId => {
        const visible = poems
            .filter(p => p.visibility !== 'private' && p.visibility !== 'scheduled')
            .sort((a, b) => b.createdAt - a.createdAt)
        const idx = visible.findIndex(p => p.id === currentId)
        return {
            prev: idx > 0 ? visible[idx - 1] : null,
            next: idx < visible.length - 1 ? visible[idx + 1] : null,
        }
    }, [poems])

    const saveScrollPosition = useCallback((poemId, position) => {
        setScrollPositions(prev => ({ ...prev, [poemId]: position }))
    }, [])

    const getScrollPosition = useCallback(poemId => scrollPositions[poemId] || 0, [scrollPositions])

    const addComment = useCallback(async (poemId, name, text) => {
        const comment = { id: generateId(), poemId, name, text, timestamp: Date.now() }
        try {
            await supabase.from('comments').insert(comment)
        } catch (err) {
            console.error('Failed to add comment:', err)
        }
        return comment
    }, [])

    const getComments = useCallback(async poemId => {
        try {
            const { data, error } = await supabase.from('comments').select('*').eq('poemId', poemId).order('timestamp', { ascending: false })
            if (error) throw error
            return data || []
        } catch (err) {
            console.error('Failed to fetch comments:', err)
            return []
        }
    }, [])

    const deleteComment = useCallback(async (poemId, commentId) => {
        try {
            await supabase.from('comments').delete().eq('id', commentId)
        } catch (err) {
            console.error('Failed to delete comment:', err)
        }
    }, [])

    const saveDraft = useCallback(draft => {
        localStorage.setItem(STORAGE_DRAFT, JSON.stringify(draft))
    }, [])

    const loadDraft = useCallback(() => {
        try {
            const raw = localStorage.getItem(STORAGE_DRAFT)
            return raw ? JSON.parse(raw) : null
        } catch { return null }
    }, [])

    const clearDraft = useCallback(() => {
        localStorage.removeItem(STORAGE_DRAFT)
    }, [])

    return {
        poems, loading,
        search, setSearch,
        sort, setSort,
        activeTag, setActiveTag,
        activeMood, setActiveMood,
        getFiltered,
        allTags, allSeries,
        addPoem, updatePoem, deletePoem,
        toggleLike, toggleReaction, getPoem, getRandomId, getLateNightPoem,
        restoreVersion, getSeriesPoems, getAdjacentPoems,
        saveScrollPosition, getScrollPosition,
        addComment, getComments, deleteComment,
        saveDraft, loadDraft, clearDraft,
    }
}
