import { motion, AnimatePresence } from 'framer-motion'

export default function FocusMode({ isOpen, onClose, poem }) {
    if (!poem) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="focus-mode-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.button
                        className="focus-mode-close"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.1 }}
                    >
                        ✕
                    </motion.button>
                    <div className="focus-mode-content">
                        <motion.h1
                            className="poem-full-title"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            {poem.title}
                        </motion.h1>
                        <div className="poem-full-body">
                            {poem.content.split('\n').map((line, i) => (
                                <motion.span
                                    key={i}
                                    className="poem-line"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 + i * 0.12, duration: 0.5 }}
                                >
                                    {line || '\u00A0'}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
