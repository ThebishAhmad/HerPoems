import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MOODS = [
    { value: null, label: 'No mood', icon: '—' },
    { value: 'love', label: 'Love', icon: '💕' },
    { value: 'loss', label: 'Loss', icon: '🥀' },
    { value: 'anger', label: 'Anger', icon: '🔥' },
    { value: 'nostalgia', label: 'Nostalgia', icon: '🌅' },
    { value: 'existential', label: 'Existential', icon: '🌌' },
]

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Public', icon: '🌍', desc: 'Visible to all' },
    { value: 'private', label: 'Private', icon: '🔒', desc: 'Only you' },
    { value: 'unlisted', label: 'Unlisted', icon: '🔗', desc: 'Via direct link' },
]

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
}

const modalVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
    exit: { opacity: 0, y: 20, scale: 0.96, transition: { duration: 0.2 } },
}

export default function PoemModal({ isOpen, onClose, onSubmit, editPoem, saveDraft, loadDraft, clearDraft, allSeries }) {
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [content, setContent] = useState('')
    const [tags, setTags] = useState('')
    const [visibility, setVisibility] = useState('public')
    const [mood, setMood] = useState(null)
    const [series, setSeries] = useState('')
    const [scheduledAt, setScheduledAt] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [draftStatus, setDraftStatus] = useState('')
    const titleRef = useRef(null)
    const draftTimer = useRef(null)

    const isEditing = !!editPoem

    useEffect(() => {
        if (isOpen) {
            if (editPoem) {
                setTitle(editPoem.title)
                setSubtitle(editPoem.subtitle || '')
                setContent(editPoem.content)
                setTags((editPoem.tags || []).join(', '))
                setVisibility(editPoem.visibility || 'public')
                setMood(editPoem.mood || null)
                setSeries(editPoem.series || '')
                setScheduledAt(editPoem.scheduledAt ? new Date(editPoem.scheduledAt).toISOString().slice(0, 16) : '')
                setDraftStatus('')
                setShowAdvanced(!!(editPoem.mood || editPoem.series || editPoem.visibility !== 'public'))
            } else {
                const draft = loadDraft()
                if (draft) {
                    setTitle(draft.title || '')
                    setSubtitle(draft.subtitle || '')
                    setContent(draft.content || '')
                    setTags(draft.tags || '')
                    setVisibility(draft.visibility || 'public')
                    setMood(draft.mood || null)
                    setSeries(draft.series || '')
                    setScheduledAt(draft.scheduledAt || '')
                    if (draft.title || draft.content) setDraftStatus('Draft restored')
                    setShowAdvanced(!!(draft.mood || draft.series))
                } else {
                    setTitle('')
                    setSubtitle('')
                    setContent('')
                    setTags('')
                    setVisibility('public')
                    setMood(null)
                    setSeries('')
                    setScheduledAt('')
                    setDraftStatus('')
                    setShowAdvanced(false)
                }
            }
            setTimeout(() => titleRef.current?.focus(), 100)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
    }, [isOpen, editPoem])

    const handleDraftSave = useCallback(() => {
        if (isEditing) return
        clearTimeout(draftTimer.current)
        draftTimer.current = setTimeout(() => {
            saveDraft({ title, subtitle, content, tags, visibility, mood, series, scheduledAt })
            setDraftStatus('Draft saved')
            setTimeout(() => setDraftStatus(''), 2000)
        }, 1000)
    }, [title, subtitle, content, tags, visibility, mood, series, scheduledAt, isEditing, saveDraft])

    useEffect(() => {
        if (isOpen && !isEditing) handleDraftSave()
    }, [title, subtitle, content, tags])

    const handleSubmit = e => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) return
        const opts = {
            visibility,
            mood,
            series: series.trim() || null,
            scheduledAt: scheduledAt ? new Date(scheduledAt).getTime() : null,
        }
        onSubmit(title.trim(), subtitle.trim(), content.trim(), tags, opts)
        if (!isEditing) clearDraft()
        onClose()
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : null
    const isScheduledFuture = scheduledDate && scheduledDate.getTime() > Date.now()
    const timeUntil = isScheduledFuture ? getTimeUntil(scheduledDate) : null

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    data-lenis-prevent
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={e => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        className="modal modal-compose"
                        data-lenis-prevent
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="modal-heading">{isEditing ? 'Edit Poem' : 'New Poem'}</h2>
                            <button className="modal-close" onClick={onClose}>&times;</button>
                        </div>

                        <form className="poem-form" onSubmit={handleSubmit} noValidate>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label htmlFor="input-title">Title <span className="required">*</span></label>
                                    <input
                                        ref={titleRef}
                                        type="text"
                                        id="input-title"
                                        placeholder="Give your poem a name"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        maxLength={200}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="input-subtitle">Subtitle</label>
                                    <input
                                        type="text"
                                        id="input-subtitle"
                                        placeholder="An optional subtitle"
                                        value={subtitle}
                                        onChange={e => setSubtitle(e.target.value)}
                                        maxLength={300}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="input-content">Poem <span className="required">*</span></label>
                                    <textarea
                                        id="input-content"
                                        placeholder="Write your heart out..."
                                        rows={8}
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        required
                                    />
                                    <div className="char-counter"><span>{content.length}</span> characters</div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="input-tags">Tags</label>
                                    <input
                                        type="text"
                                        id="input-tags"
                                        placeholder="love, nature, melancholy (comma separated)"
                                        value={tags}
                                        onChange={e => setTags(e.target.value)}
                                    />
                                </div>

                                {/* Visibility selector */}
                                <div className="form-group">
                                    <label>Visibility</label>
                                    <div className="visibility-selector">
                                        {VISIBILITY_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                className={`visibility-option ${visibility === opt.value ? 'active' : ''}`}
                                                onClick={() => setVisibility(opt.value)}
                                            >
                                                <span className="visibility-icon">{opt.icon}</span>
                                                <span className="visibility-label">{opt.label}</span>
                                                <span className="visibility-desc">{opt.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Advanced toggle */}
                                <button
                                    type="button"
                                    className="btn-advanced-toggle"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points={showAdvanced ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
                                    </svg>
                                    {showAdvanced ? 'Less options' : 'More options'}
                                </button>

                                <AnimatePresence>
                                    {showAdvanced && (
                                        <motion.div
                                            className="advanced-options"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            {/* Mood selector */}
                                            <div className="form-group">
                                                <label>Mood</label>
                                                <div className="mood-selector">
                                                    {MOODS.map(m => (
                                                        <button
                                                            key={m.value || 'none'}
                                                            type="button"
                                                            className={`mood-pill ${mood === m.value ? 'active' : ''}`}
                                                            onClick={() => setMood(m.value)}
                                                        >
                                                            <span>{m.icon}</span>
                                                            <span>{m.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Series */}
                                            <div className="form-group">
                                                <label htmlFor="input-series">Series / Collection</label>
                                                <input
                                                    type="text"
                                                    id="input-series"
                                                    placeholder='e.g. "Midnight Letters", "Unsent Things"'
                                                    value={series}
                                                    onChange={e => setSeries(e.target.value)}
                                                    list="series-suggestions"
                                                />
                                                {allSeries && allSeries.length > 0 && (
                                                    <datalist id="series-suggestions">
                                                        {allSeries.map(s => <option key={s} value={s} />)}
                                                    </datalist>
                                                )}
                                            </div>

                                            {/* Schedule */}
                                            <div className="form-group">
                                                <label htmlFor="input-schedule">Schedule Publication</label>
                                                <input
                                                    type="datetime-local"
                                                    id="input-schedule"
                                                    value={scheduledAt}
                                                    onChange={e => setScheduledAt(e.target.value)}
                                                    min={new Date().toISOString().slice(0, 16)}
                                                />
                                                {timeUntil && (
                                                    <div className="schedule-countdown">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        Publishes in {timeUntil}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="form-footer">
                                <span className="draft-status">{draftStatus}</span>
                                <div className="form-buttons">
                                    <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                                    <button type="submit" className="btn-primary">
                                        {isScheduledFuture ? '📅 Schedule' : isEditing ? 'Save Changes' : 'Publish'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function getTimeUntil(date) {
    const diff = date.getTime() - Date.now()
    if (diff <= 0) return null
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    return parts.join(' ') || 'less than a minute'
}
