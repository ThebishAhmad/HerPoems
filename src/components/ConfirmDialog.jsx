import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, onSoftDelete }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={e => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        className="modal modal-sm"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <h3 className="modal-heading">Delete this poem?</h3>
                        <p className="confirm-text">
                            Do you want to permanently delete this poem, or just hide it so it's never displayed?
                        </p>
                        <div className="confirm-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                            <button className="btn-secondary" onClick={onSoftDelete} style={{ width: '100%' }}>Hide (Keep in Database)</button>
                            <button className="btn-danger-solid" onClick={onConfirm} style={{ width: '100%' }}>Delete Forever</button>
                            <button className="btn-ghost" onClick={onClose} style={{ width: '100%' }}>Cancel</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
