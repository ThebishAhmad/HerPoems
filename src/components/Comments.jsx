import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function formatDate(ts) {
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Comments({ poemId, comments, addComment, deleteComment }) {
    const [name, setName] = useState('')
    const [text, setText] = useState('')
    const [isExpanded, setIsExpanded] = useState(false)
    const inputRef = useRef(null)

    const handleSubmit = e => {
        e.preventDefault()
        if (!text.trim()) return
        const commentName = name.trim() || 'Anonymous'
        addComment(poemId, commentName, text.trim())
        setText('')
    }

    return (
        <section className="comments-section">
            <button
                className="comments-toggle"
                onClick={() => { setIsExpanded(!isExpanded); if (!isExpanded) setTimeout(() => inputRef.current?.focus(), 100) }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {comments.length > 0 ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}` : 'Leave a thought'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points={isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                </svg>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="comments-body"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <form className="comment-form" onSubmit={handleSubmit}>
                            <input
                                ref={inputRef}
                                type="text"
                                className="comment-name-input"
                                placeholder="Your name (optional)"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                maxLength={50}
                            />
                            <div className="comment-text-row">
                                <textarea
                                    className="comment-text-input"
                                    placeholder="Share a thought..."
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    rows={2}
                                    maxLength={500}
                                />
                                <button type="submit" className="btn-primary comment-submit" disabled={!text.trim()}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </button>
                            </div>
                        </form>

                        <div className="comments-list">
                            {comments.map(c => (
                                <motion.div
                                    key={c.id}
                                    className="comment-item"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="comment-header">
                                        <span className="comment-name">{c.name}</span>
                                        <span className="comment-date">{formatDate(c.timestamp)}</span>
                                        <button
                                            className="comment-delete"
                                            onClick={() => deleteComment(poemId, c.id)}
                                            title="Delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="comment-text">{c.text}</p>
                                </motion.div>
                            ))}
                            {comments.length === 0 && (
                                <p className="comments-empty">No thoughts yet. Be the first.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
