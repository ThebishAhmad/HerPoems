import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

function getPreviewLines(content, maxLines = 4) {
    const lines = content.split('\n').filter(l => l.trim().length > 0)
    return lines.slice(0, maxLines).join('\n')
}

const REACTION_ICONS = { loved: '❤️', hurt: '💔', felt: '🌙', deep: '🌊' }

export default function PoemCard({ poem, index, onTagClick, isBookmarked }) {
    const navigate = useNavigate()
    const totalReactions = Object.values(poem.reactions || {}).reduce((s, v) => s + v, 0)
    const topReaction = Object.entries(poem.reactions || {}).sort((a, b) => b[1] - a[1])[0]

    return (
        <motion.article
            className="poem-card"
            onClick={() => navigate(`/poem/${poem.id}`)}
            initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
                duration: 0.5,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{
                y: -8,
                boxShadow: 'var(--shadow-card-hover)',
                transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
            }}
            whileTap={{ scale: 0.98 }}
            layout
        >
            {/* Badges */}
            <div className="poem-card-badges">
                {poem.visibility === 'private' && <span className="card-badge badge-private">🔒</span>}
                {poem.visibility === 'unlisted' && <span className="card-badge badge-unlisted">🔗</span>}
                {poem.mood && <span className="card-badge badge-mood">{getMoodIcon(poem.mood)}</span>}
                {isBookmarked && <span className="card-badge badge-bookmarked">🔖</span>}
            </div>

            <h3 className="poem-card-title">{poem.title}</h3>
            {poem.subtitle && <p className="poem-card-subtitle">{poem.subtitle}</p>}
            <p className="poem-card-preview">{getPreviewLines(poem.content)}</p>

            {poem.series && (
                <span className="poem-card-series">📚 {poem.series}</span>
            )}

            <div className="poem-card-footer">
                <div className="poem-card-tags">
                    {(poem.tags || []).map(t => (
                        <motion.span
                            key={t}
                            className="tag"
                            onClick={e => {
                                e.stopPropagation()
                                onTagClick(t)
                            }}
                            whileHover={{ scale: 1.08, y: -2 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                            {t}
                        </motion.span>
                    ))}
                </div>
                <span className={`poem-card-likes ${totalReactions > 0 ? 'has-likes' : ''}`}>
                    {topReaction && topReaction[1] > 0 && (
                        <span className="card-top-reaction">{REACTION_ICONS[topReaction[0]]}</span>
                    )}
                    {totalReactions}
                </span>
            </div>
        </motion.article>
    )
}

function getMoodIcon(mood) {
    const map = { love: '💕', loss: '🥀', anger: '🔥', nostalgia: '🌅', existential: '🌌' }
    return map[mood] || ''
}
