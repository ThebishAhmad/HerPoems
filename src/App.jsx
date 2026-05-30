import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Lenis from 'lenis'
import { usePoems } from './hooks/usePoems'
import { useTheme } from './hooks/useTheme'
import { useBookmarks } from './hooks/useBookmarks'
import { useReadingStreak } from './hooks/useReadingStreak'
import { useAnalytics } from './hooks/useAnalytics'
import { ToastProvider, useToast } from './components/Toast'
import Navbar from './components/Navbar'
import ScrollProgress from './components/ScrollProgress'
import PoemModal from './components/PoemModal'
import HomePage from './pages/HomePage'
import PoemPage from './pages/PoemPage'
import BookmarkPage from './pages/BookmarkPage'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import SeriesPage from './pages/SeriesPage'
import ShowcasePage from './pages/ShowcasePage'
import { useAuth } from './hooks/useAuth'
import Auth from './components/Auth'

function AppContent({ uid }) {
    const poemStore = usePoems(uid)
    const { theme, toggleTheme, readingTheme, setReadingTheme } = useTheme()
    const bookmarkStore = useBookmarks(uid)
    const streakStore = useReadingStreak(uid)
    const analytics = useAnalytics(uid)
    const navigate = useNavigate()
    const location = useLocation()
    const showToast = useToast()

    const [modalOpen, setModalOpen] = useState(false)
    const [editPoem, setEditPoem] = useState(null)

    // Lenis smooth scroll — disable inside modals
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        })

        window.__lenis = lenis

        function raf(time) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }
        requestAnimationFrame(raf)

        return () => {
            lenis.destroy()
            delete window.__lenis
        }
    }, [])

    // Stop Lenis when modal is open
    useEffect(() => {
        if (window.__lenis) {
            if (modalOpen) window.__lenis.stop()
            else window.__lenis.start()
        }
    }, [modalOpen])

    // Keyboard shortcuts
    useEffect(() => {
        const handler = e => {
            if (e.key === 'Escape') {
                if (modalOpen) setModalOpen(false)
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault()
                handleAddPoem()
            }
            // Arrow key navigation on poem pages
            if (location.pathname.startsWith('/poem/') && !modalOpen) {
                const id = location.pathname.split('/poem/')[1]
                const adj = poemStore.getAdjacentPoems(id)
                if (e.key === 'ArrowLeft' && adj.prev) {
                    e.preventDefault()
                    navigate(`/poem/${adj.prev.id}`)
                }
                if (e.key === 'ArrowRight' && adj.next) {
                    e.preventDefault()
                    navigate(`/poem/${adj.next.id}`)
                }
            }
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [modalOpen, location.pathname, poemStore])

    const handleAddPoem = useCallback(() => {
        setEditPoem(null)
        setModalOpen(true)
    }, [])

    const handleEditPoem = useCallback(poem => {
        setEditPoem(poem)
        setModalOpen(true)
    }, [])

    const handleSubmit = useCallback((title, subtitle, content, tags, opts = {}) => {
        if (editPoem) {
            poemStore.updatePoem(editPoem.id, title, subtitle, content, tags, opts)
            showToast('Poem updated.')
        } else {
            if (opts.scheduledAt) {
                poemStore.addPoem(title, subtitle, content, tags, opts)
                showToast('Poem scheduled! 📅')
            } else {
                poemStore.addPoem(title, subtitle, content, tags, opts)
                showToast('Poem published!')
            }
        }
    }, [editPoem, poemStore, showToast])

    const handleRandomPoem = useCallback(() => {
        const id = poemStore.getRandomId()
        if (id) navigate(`/poem/${id}`)
        else showToast('No poems to show. Write one first!')
    }, [poemStore, navigate, showToast])

    const handleLateNight = useCallback(() => {
        const id = poemStore.getLateNightPoem()
        if (id) navigate(`/poem/${id}`)
        else showToast('No poems for the night yet...')
    }, [poemStore, navigate, showToast])

    const handleDelete = useCallback(id => {
        poemStore.deletePoem(id)
        showToast('Poem deleted forever.')
    }, [poemStore, showToast])

    const handleSoftDelete = useCallback(id => {
        poemStore.softDeletePoem(id)
        showToast('Poem hidden from display.')
    }, [poemStore, showToast])

    return (
        <>
            <div className="animated-gradient-bg" />
            <ScrollProgress />
            <div className="app-wrapper">
                <Navbar
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onAddPoem={handleAddPoem}
                    onRandomPoem={handleRandomPoem}
                    onLateNight={handleLateNight}
                    streak={streakStore}
                />

                <main className="app-content">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route
                                path="/"
                                element={
                                    <HomePage
                                        poems={poemStore.poems}
                                        loading={poemStore.loading}
                                        getFiltered={poemStore.getFiltered}
                                        allTags={poemStore.allTags}
                                        search={poemStore.search}
                                        setSearch={poemStore.setSearch}
                                        sort={poemStore.sort}
                                        setSort={poemStore.setSort}
                                        activeTag={poemStore.activeTag}
                                        setActiveTag={poemStore.setActiveTag}
                                        onAddPoem={handleAddPoem}
                                        bookmarks={bookmarkStore}
                                    />
                                }
                            />
                            <Route
                                path="/poem/:id"
                                element={
                                    <PoemPage
                                        getPoem={poemStore.getPoem}
                                        toggleReaction={poemStore.toggleReaction}
                                        deletePoem={handleDelete}
                                        softDeletePoem={handleSoftDelete}
                                        onEdit={handleEditPoem}
                                        setActiveTag={poemStore.setActiveTag}
                                        getAdjacentPoems={poemStore.getAdjacentPoems}
                                        restoreVersion={poemStore.restoreVersion}
                                        bookmarks={bookmarkStore}
                                        analytics={analytics}
                                        streak={streakStore}
                                        addComment={poemStore.addComment}
                                        getComments={poemStore.getComments}
                                        deleteComment={poemStore.deleteComment}
                                        readingTheme={readingTheme}
                                        setReadingTheme={setReadingTheme}
                                    />
                                }
                            />
                            <Route
                                path="/bookmarks"
                                element={
                                    <BookmarkPage
                                        bookmarks={bookmarkStore}
                                        getPoem={poemStore.getPoem}
                                    />
                                }
                            />
                            <Route
                                path="/analytics"
                                element={
                                    <AnalyticsDashboard
                                        analytics={analytics}
                                        poems={poemStore.poems}
                                        streak={streakStore}
                                    />
                                }
                            />
                            <Route
                                path="/series/:name"
                                element={
                                    <SeriesPage
                                        getSeriesPoems={poemStore.getSeriesPoems}
                                        bookmarks={bookmarkStore}
                                    />
                                }
                            />
                            <Route path="/showcase" element={null} />
                        </Routes>
                    </AnimatePresence>
                </main>

                <footer className="site-footer">
                    <p>For your poems. I want to read them all.</p>
                </footer>
            </div>

            <PoemModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditPoem(null) }}
                onSubmit={handleSubmit}
                editPoem={editPoem}
                saveDraft={poemStore.saveDraft}
                loadDraft={poemStore.loadDraft}
                clearDraft={poemStore.clearDraft}
                allSeries={poemStore.allSeries()}
            />
        </>
    )
}

export default function App() {
    const location = useLocation()
    const { user, loading } = useAuth()
    const isShowcase = location.pathname === '/showcase'

    if (isShowcase) {
        return <ShowcasePage />
    }

    if (loading) {
        return <div className="loading-screen">Authenticating reader...</div>
    }

    if (!user) {
        return <Auth />
    }

    return (
        <ToastProvider>
            <AppContent uid={user.id} />
        </ToastProvider>
    )
}
