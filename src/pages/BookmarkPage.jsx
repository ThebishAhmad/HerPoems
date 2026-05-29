import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function BookmarkPage({ bookmarks, getPoem }) {
    const navigate = useNavigate()
    const [activeFolder, setActiveFolder] = useState('Favorites')
    const [newFolder, setNewFolder] = useState('')

    const folderBookmarks = bookmarks.getBookmarksByFolder(activeFolder)
    const poems = folderBookmarks.map(b => ({ ...getPoem(b.poemId), bookmarkData: b })).filter(p => p.id)

    const handleAddFolder = e => {
        e.preventDefault()
        if (newFolder.trim()) {
            bookmarks.addFolder(newFolder.trim())
            setActiveFolder(newFolder.trim())
            setNewFolder('')
        }
    }

    return (
        <motion.div
            className="bookmark-page"
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="bookmark-header">
                <h1 className="page-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    Bookmarks
                </h1>
            </div>

            <div className="bookmark-layout">
                <aside className="bookmark-sidebar">
                    <h3 className="sidebar-title">Folders</h3>
                    <div className="folder-list">
                        {bookmarks.folders.map(f => (
                            <button
                                key={f}
                                className={`folder-item ${activeFolder === f ? 'active' : ''}`}
                                onClick={() => setActiveFolder(f)}
                            >
                                <span className="folder-icon">
                                    {f === 'Favorites' ? '⭐' : f === 'Late Night' ? '🌙' : f === 'Pain' ? '💔' : '📁'}
                                </span>
                                <span className="folder-name">{f}</span>
                                <span className="folder-count">
                                    {bookmarks.getBookmarksByFolder(f).length}
                                </span>
                            </button>
                        ))}
                    </div>
                    <form className="add-folder-form" onSubmit={handleAddFolder}>
                        <input
                            type="text"
                            placeholder="New folder..."
                            value={newFolder}
                            onChange={e => setNewFolder(e.target.value)}
                            maxLength={30}
                        />
                        <button type="submit" className="btn-primary" disabled={!newFolder.trim()}>+</button>
                    </form>
                </aside>

                <div className="bookmark-content">
                    <h2 className="folder-heading">
                        {activeFolder}
                        <span className="folder-heading-count">{poems.length} poem{poems.length !== 1 ? 's' : ''}</span>
                    </h2>

                    {poems.length === 0 ? (
                        <div className="bookmark-empty">
                            <p>No poems in this folder yet.</p>
                            <p className="text-muted">Bookmark poems while reading to save them here.</p>
                        </div>
                    ) : (
                        <div className="bookmark-grid">
                            {poems.map((poem, i) => (
                                <motion.div
                                    key={poem.id}
                                    className="bookmark-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => navigate(`/poem/${poem.id}`)}
                                >
                                    <h3 className="bookmark-card-title">{poem.title}</h3>
                                    {poem.subtitle && <p className="bookmark-card-subtitle">{poem.subtitle}</p>}
                                    <p className="bookmark-card-preview">
                                        {poem.content.split('\n').filter(l => l.trim()).slice(0, 3).join('\n')}
                                    </p>
                                    <div className="bookmark-card-footer">
                                        <select
                                            className="folder-move-select"
                                            value={activeFolder}
                                            onChange={e => {
                                                e.stopPropagation()
                                                bookmarks.moveToFolder(poem.id, e.target.value)
                                            }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {bookmarks.folders.map(f => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>
                                        <button
                                            className="btn-ghost-sm btn-danger"
                                            onClick={e => { e.stopPropagation(); bookmarks.toggleBookmark(poem.id) }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
