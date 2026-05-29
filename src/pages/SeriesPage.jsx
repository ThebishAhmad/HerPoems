import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function SeriesPage({ getSeriesPoems, bookmarks }) {
    const { name } = useParams()
    const navigate = useNavigate()
    const seriesName = decodeURIComponent(name)
    const poems = getSeriesPoems(seriesName)

    return (
        <motion.div
            className="series-page"
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <motion.button
                className="btn-back"
                onClick={() => navigate('/')}
                whileHover={{ x: -4 }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back</span>
            </motion.button>

            <header className="series-header">
                <span className="series-badge">📚 Series</span>
                <h1 className="page-title series-title">{seriesName}</h1>
                <p className="series-count">{poems.length} poem{poems.length !== 1 ? 's' : ''}</p>
            </header>

            <div className="series-timeline">
                {poems.map((poem, i) => (
                    <motion.div
                        key={poem.id}
                        className="series-entry"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        onClick={() => navigate(`/poem/${poem.id}`)}
                    >
                        <div className="series-entry-marker">
                            <span className="series-entry-num">{i + 1}</span>
                            {i < poems.length - 1 && <div className="series-entry-line" />}
                        </div>
                        <div className="series-entry-card">
                            <h3 className="series-entry-title">{poem.title}</h3>
                            {poem.subtitle && <p className="series-entry-subtitle">{poem.subtitle}</p>}
                            <p className="series-entry-preview">
                                {poem.content.split('\n').filter(l => l.trim()).slice(0, 3).join(' / ')}
                            </p>
                            <div className="series-entry-meta">
                                <time>{new Date(poem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                                {poem.readingTime && <span>~{poem.readingTime} min</span>}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {poems.length === 0 && (
                <div className="series-empty">
                    <p>No poems in this series yet.</p>
                </div>
            )}
        </motion.div>
    )
}
