import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const DEFAULT_FOLDERS = ['Favorites', 'Late Night', 'Pain']

export function useBookmarks(uid) {
    const [bookmarks, setBookmarks] = useState({})
    const [folders, setFolders] = useState(DEFAULT_FOLDERS)

    // Load from Supabase on mount
    useEffect(() => {
        if (!uid) return

        async function load() {
            try {
                const { data, error } = await supabase.from('users').select('bookmarks, folders').eq('id', uid).maybeSingle()
                if (data) {
                    if (data.bookmarks) setBookmarks(data.bookmarks)
                    if (data.folders) setFolders(data.folders)
                }
            } catch (err) {
                console.error('Failed to load bookmarks from Supabase', err)
            }
        }
        load()
    }, [uid])

    const saveToSupabase = useCallback(async (newBookmarks, newFolders) => {
        if (!uid) return
        try {
            await supabase.from('users').upsert({ id: uid, bookmarks: newBookmarks, folders: newFolders })
        } catch (err) {
            console.error('Failed to save bookmarks to Supabase', err)
        }
    }, [uid])

    const isBookmarked = useCallback(poemId => !!bookmarks[poemId], [bookmarks])

    const getFolder = useCallback(poemId => bookmarks[poemId]?.folder || null, [bookmarks])

    const toggleBookmark = useCallback((poemId, folder = 'Favorites') => {
        setBookmarks(prev => {
            const next = { ...prev }
            if (next[poemId]) {
                delete next[poemId]
            } else {
                next[poemId] = { folder, savedAt: Date.now() }
            }
            saveToSupabase(next, folders)
            return next
        })
    }, [folders, saveToSupabase])

    const moveToFolder = useCallback((poemId, folder) => {
        setBookmarks(prev => {
            if (!prev[poemId]) return prev
            const next = { ...prev, [poemId]: { ...prev[poemId], folder } }
            saveToSupabase(next, folders)
            return next
        })
    }, [folders, saveToSupabase])

    const addFolder = useCallback(name => {
        if (!name.trim()) return
        setFolders(prev => {
            const trimmed = name.trim()
            if (prev.includes(trimmed)) return prev
            const next = [...prev, trimmed]
            saveToSupabase(bookmarks, next)
            return next
        })
    }, [bookmarks, saveToSupabase])

    const removeFolder = useCallback(name => {
        if (DEFAULT_FOLDERS.includes(name)) return
        setFolders(prev => {
            const nextFolders = prev.filter(f => f !== name)
            setBookmarks(prevBms => {
                const nextBms = { ...prevBms }
                Object.keys(nextBms).forEach(id => {
                    if (nextBms[id].folder === name) nextBms[id].folder = 'Favorites'
                })
                saveToSupabase(nextBms, nextFolders)
                return nextBms
            })
            return nextFolders
        })
    }, [saveToSupabase])

    const getBookmarksByFolder = useCallback(folder => {
        return Object.entries(bookmarks)
            .filter(([, data]) => data.folder === folder)
            .map(([id, data]) => ({ poemId: id, ...data }))
            .sort((a, b) => b.savedAt - a.savedAt)
    }, [bookmarks])

    const getAllBookmarkedIds = useCallback(() => Object.keys(bookmarks), [bookmarks])

    return {
        bookmarks, folders,
        isBookmarked, getFolder, toggleBookmark, moveToFolder,
        addFolder, removeFolder, getBookmarksByFolder, getAllBookmarkedIds,
    }
}
