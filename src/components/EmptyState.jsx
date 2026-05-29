import { motion, AnimatePresence } from 'framer-motion'
import MagneticButton from './MagneticButton'

export default function EmptyState({ onAdd }) {
    return (
        <motion.div
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            <motion.div
                className="empty-quill"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <path d="M60 10L15 55L10 70L25 65L70 20L60 10Z" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
                    <path d="M55 15L65 25" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                    <line x1="20" y1="60" x2="30" y2="50" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
                </svg>
            </motion.div>

            <motion.p
                className="empty-subtitle"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
                "A poem begins as a lump in the throat..."
            </motion.p>

            <h2 className="empty-title">No poems yet</h2>
            <p className="empty-text">
                Your journal awaits its first verse.<br />
                Let the words find you.
            </p>

            <MagneticButton className="btn-primary btn-lg" onClick={onAdd}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Write Your First Poem
            </MagneticButton>
        </motion.div>
    )
}
