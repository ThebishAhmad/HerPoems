import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmDialog from '../components/ConfirmDialog'
import FocusMode from '../components/FocusMode'
import VersionHistory from '../components/VersionHistory'
import Comments from '../components/Comments'
import { useAuth } from '../hooks/useAuth'

const REACTION_TYPES = [
    { key: 'loved', icon: '❤️', label: 'Loved' },
    { key: 'hurt', icon: '💔', label: 'Hurt' },
    { key: 'felt', icon: '🌙', label: 'Felt' },
    { key: 'deep', icon: '🌊', label: 'Deep' },
]

const READING_THEMES = [
    { key: 'default', label: 'Default', icon: '🎨' },
    { key: 'paper', label: 'Paper', icon: '📄' },
    { key: 'midnight', label: 'Midnight', icon: '🌙' },
    { key: 'sepia', label: 'Sepia', icon: '📜' },
    { key: 'minimal', label: 'Minimal', icon: '◻️' },
]

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

function formatReadingTime(minutes) {
    if (minutes <= 1) return '~1 min read'
    return `~${minutes} min read`
}

export default function PoemPage({
    getPoem, toggleReaction, deletePoem, softDeletePoem, onEdit, setActiveTag,
    getAdjacentPoems, restoreVersion, bookmarks, analytics, streak,
    addComment, getComments, deleteComment, readingTheme, setReadingTheme,
}) {
    const { user } = useAuth()
    const { id } = useParams()
    const navigate = useNavigate()
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [focusMode, setFocusMode] = useState(false)
    const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
    const [reactBurst, setReactBurst] = useState(null)
    const [showQuoteCard, setShowQuoteCard] = useState(null)
    const [showThemePicker, setShowThemePicker] = useState(false)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [comments, setComments] = useState([])
    const contentRef = useRef(null)

    const poem = getPoem(id)
    const adjacent = poem ? getAdjacentPoems(id) : { prev: null, next: null }
    const isAuthor = user && poem && user.id === poem.user_id

    // Fetch comments from Firestore
    useEffect(() => {
        if (!poem) return
        let cancelled = false
        getComments(id).then(data => {
            if (!cancelled) setComments(data)
        })
        return () => { cancelled = true }
    }, [id, poem])

    const handleAddComment = async (poemId, name, text) => {
        const newComment = await addComment(poemId, name, text)
        setComments(prev => [newComment, ...prev])
    }

    const handleDeleteComment = async (poemId, commentId) => {
        await deleteComment(poemId, commentId)
        const updated = await getComments(poemId)
        setComments(updated)
    }

    // Record view + streak
    useEffect(() => {
        if (poem) {
            analytics.recordView(id)
            streak.recordReading()
        }
        return () => analytics.recordReadEnd()
    }, [id])

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [id])

    // Track scroll progress
    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return
            const rect = contentRef.current.getBoundingClientRect()
            const total = contentRef.current.scrollHeight
            const visible = window.innerHeight
            const scrolled = Math.max(0, -rect.top)
            const progress = Math.min(100, Math.round((scrolled / (total - visible)) * 100))
            setScrollProgress(progress)
            if (progress > 0 && progress % 10 === 0) {
                analytics.recordScrollDepth(id, progress)
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [id])

    // ESC for focus mode
    useEffect(() => {
        const handler = e => {
            if (e.key === 'Escape' && focusMode) setFocusMode(false)
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [focusMode])

    if (!poem) {
        useEffect(() => { navigate('/') }, [])
        return null
    }

    const handleReaction = type => {
        toggleReaction(poem.id, type)
        setReactBurst(type)
        setTimeout(() => setReactBurst(null), 600)
    }

    const handleDelete = () => {
        deletePoem(poem.id)
        setConfirmOpen(false)
        navigate('/')
    }

    const handleSoftDelete = () => {
        softDeletePoem(poem.id)
        setConfirmOpen(false)
        navigate('/')
    }


    const handleLineSelect = (line, index) => {
        if (!line.trim()) return
        analytics.recordSharedLine(id, index)
        setShowQuoteCard({ line, index })
    }

    const handleCopyQuote = () => {
        if (!showQuoteCard) return
        const text = `"${showQuoteCard.line}"\n— ${poem.title}`
        navigator.clipboard.writeText(text).catch(() => { })
        setShowQuoteCard(null)
    }

    const lines = poem.content.split('\n')
    const totalReactions = Object.values(poem.reactions || {}).reduce((s, v) => s + v, 0)
    const isBookmarked = bookmarks.isBookmarked(poem.id)

    return (
        <>
            <motion.div
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
                <article className={`poem-full reading-theme-${readingTheme}`} ref={contentRef}>
                    <div className="poem-top-bar">
                        <motion.button
                            className="btn-back"
                            onClick={() => navigate('/')}
                            whileHover={{ x: -4 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            <span>Back</span>
                        </motion.button>

                        <div className="poem-top-actions">
                            {/* Reading theme picker */}
                            <div className="theme-picker-wrap">
                                <button
                                    className="btn-ghost-sm"
                                    onClick={() => setShowThemePicker(!showThemePicker)}
                                    title="Reading theme"
                                >
                                    🎨
                                </button>
                                <AnimatePresence>
                                    {showThemePicker && (
                                        <motion.div
                                            className="theme-picker-dropdown"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                        >
                                            {READING_THEMES.map(t => (
                                                <button
                                                    key={t.key}
                                                    className={`theme-option ${readingTheme === t.key ? 'active' : ''}`}
                                                    onClick={() => { setReadingTheme(t.key); setShowThemePicker(false) }}
                                                >
                                                    <span>{t.icon}</span> {t.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Bookmark */}
                            <button
                                className={`btn-ghost-sm ${isBookmarked ? 'bookmarked' : ''}`}
                                onClick={() => bookmarks.toggleBookmark(poem.id)}
                                title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                            </button>

                            {/* Print */}
                            <button className="btn-ghost-sm" onClick={() => window.print()} title="Print">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 6 2 18 2 18 9" />
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                    <rect x="6" y="14" width="12" height="8" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <header className="poem-full-header">
                        <div className="poem-meta-badges">
                            {poem.visibility === 'private' && <span className="badge badge-private">🔒 Private</span>}
                            {poem.visibility === 'unlisted' && <span className="badge badge-unlisted">🔗 Unlisted</span>}
                            {poem.visibility === 'scheduled' && <span className="badge badge-scheduled">📅 Scheduled</span>}
                            {poem.mood && <span className="badge badge-mood">{getMoodIcon(poem.mood)} {poem.mood}</span>}
                            {poem.series && (
                                <Link to={`/series/${encodeURIComponent(poem.series)}`} className="badge badge-series">
                                    📚 {poem.series}
                                </Link>
                            )}
                        </div>

                        <motion.h1
                            className="poem-full-title"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                        >
                            {poem.title}
                        </motion.h1>

                        {poem.subtitle && (
                            <motion.p
                                className="poem-full-subtitle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {poem.subtitle}
                            </motion.p>
                        )}

                        <div className="poem-full-meta">
                            <time className="poem-full-date">{formatDate(poem.createdAt)}</time>
                            <span className="poem-reading-time">{formatReadingTime(poem.readingTime || 1)}</span>
                            <div className="poem-full-tags">
                                {(poem.tags || []).map(t => (
                                    <motion.span
                                        key={t}
                                        className="tag"
                                        onClick={() => { setActiveTag(t); navigate('/') }}
                                        whileHover={{ scale: 1.08, y: -2 }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {t}
                                    </motion.span>
                                ))}
                            </div>
                        </div>

                        {/* Reading progress */}
                        <div className="reading-progress-bar">
                            <div className="reading-progress-fill" style={{ width: `${scrollProgress}%` }} />
                        </div>
                    </header>

                    <div className="poem-full-body">
                        {lines.map((line, i) => (
                            <motion.span
                                key={i}
                                className="poem-line"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-20px' }}
                                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                onClick={() => handleLineSelect(line, i)}
                                title={line.trim() ? 'Click to share this line' : undefined}
                            >
                                {line || '\u00A0'}
                            </motion.span>
                        ))}
                    </div>

                    {/* Quote card overlay */}
                    <AnimatePresence>
                        {showQuoteCard && (
                            <motion.div
                                className="quote-card-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowQuoteCard(null)}
                            >
                                <motion.div
                                    className="quote-card"
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <p className="quote-card-text">"{showQuoteCard.line}"</p>
                                    <p className="quote-card-attr">— {poem.title}</p>
                                    <div className="quote-card-actions">
                                        <button className="btn-primary" onClick={handleCopyQuote}>
                                            Copy Quote
                                        </button>
                                        <button className="btn-secondary" onClick={() => setShowQuoteCard(null)}>
                                            Close
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Reactions */}
                    <footer className="poem-full-footer">
                        <div className="reaction-bar">
                            {REACTION_TYPES.map(r => {
                                const count = poem.reactions?.[r.key] || 0
                                const active = poem.reacted?.[r.key]
                                return (
                                    <motion.button
                                        key={r.key}
                                        className={`reaction-btn ${active ? 'active' : ''}`}
                                        onClick={() => handleReaction(r.key)}
                                        animate={reactBurst === r.key ? { scale: [1, 1.3, 1] } : {}}
                                        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                                        title={r.label}
                                    >
                                        <span className="reaction-icon">{r.icon}</span>
                                        <span className="reaction-count">{count}</span>
                                    </motion.button>
                                )
                            })}
                        </div>

                        {totalReactions > 0 && (
                            <div className="reaction-distribution">
                                {REACTION_TYPES.map(r => {
                                    const count = poem.reactions?.[r.key] || 0
                                    const pct = totalReactions > 0 ? Math.round((count / totalReactions) * 100) : 0
                                    if (pct === 0) return null
                                    return (
                                        <div
                                            key={r.key}
                                            className="reaction-dist-bar"
                                            style={{ '--pct': `${pct}%` }}
                                            title={`${r.label}: ${pct}%`}
                                        >
                                            <span className="reaction-dist-icon">{r.icon}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <div className="poem-actions">
                            <button className="btn-focus" onClick={() => setFocusMode(true)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                                </svg>
                                Focus
                            </button>
                            {isAuthor && (poem.versions || []).length > 1 && (
                                <button className="btn-ghost-sm" onClick={() => setVersionHistoryOpen(true)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    History ({poem.versions.length})
                                </button>
                            )}
                            {isAuthor && (
                                <>
                                    <button className="btn-ghost-sm" onClick={() => onEdit(poem)}>Edit</button>
                                    <button className="btn-ghost-sm btn-danger" onClick={() => setConfirmOpen(true)}>Delete</button>
                                </>
                            )}
                        </div>
                    </footer>

                    {/* Adjacent poem navigation */}
                    <nav className="adjacent-poems">
                        {adjacent.prev ? (
                            <Link to={`/poem/${adjacent.prev.id}`} className="adjacent-link prev">
                                <span className="adjacent-dir">← Previous</span>
                                <span className="adjacent-title">{adjacent.prev.title}</span>
                            </Link>
                        ) : <div />}
                        {adjacent.next ? (
                            <Link to={`/poem/${adjacent.next.id}`} className="adjacent-link next">
                                <span className="adjacent-dir">Next →</span>
                                <span className="adjacent-title">{adjacent.next.title}</span>
                            </Link>
                        ) : <div />}
                    </nav>

                    {/* Comments */}
                    <Comments
                        poemId={poem.id}
                        comments={comments}
                        addComment={handleAddComment}
                        deleteComment={handleDeleteComment}
                    />
                </article>
            </motion.div>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onSoftDelete={handleSoftDelete}
                onConfirm={handleDelete}
            />

            <FocusMode
                isOpen={focusMode}
                onClose={() => setFocusMode(false)}
                poem={poem}
            />

            <VersionHistory
                isOpen={versionHistoryOpen}
                onClose={() => setVersionHistoryOpen(false)}
                poem={poem}
                onRestore={restoreVersion}
            />
        </>
    )
}

function getMoodIcon(mood) {
    const map = { love: '💕', loss: '🥀', anger: '🔥', nostalgia: '🌅', existential: '🌌' }
    return map[mood] || ''
}
