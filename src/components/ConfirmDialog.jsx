import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmDialog({ isOpen, onClose, onConfirm }) {
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
                            This action cannot be undone. The poem will be permanently removed.
                        </p>
                        <div className="confirm-actions">
                            <button className="btn-secondary" onClick={onClose}>Keep It</button>
                            <button className="btn-danger-solid" onClick={onConfirm}>Delete Forever</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
