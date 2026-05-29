import { motion, AnimatePresence } from 'framer-motion'

function formatDate(ts) {
    return new Date(ts).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function diffLines(oldText, newText) {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const maxLen = Math.max(oldLines.length, newLines.length)
    const result = []
    for (let i = 0; i < maxLen; i++) {
        const o = oldLines[i]
        const n = newLines[i]
        if (o === undefined) result.push({ type: 'add', text: n })
        else if (n === undefined) result.push({ type: 'remove', text: o })
        else if (o !== n) result.push({ type: 'change', oldText: o, text: n })
        else result.push({ type: 'same', text: n })
    }
    return result
}

export default function VersionHistory({ isOpen, onClose, poem, onRestore }) {
    if (!isOpen || !poem) return null
    const versions = poem.versions || []
    if (versions.length < 2) return null

    const latest = versions[versions.length - 1]

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
                        className="modal modal-version-history"
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.96 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="modal-heading">Version History</h2>
                            <button className="modal-close" onClick={onClose}>&times;</button>
                        </div>
                        <div className="modal-body version-list">
                            {versions.slice().reverse().map((version, revIdx) => {
                                const realIdx = versions.length - 1 - revIdx
                                const isLatest = revIdx === 0
                                const prevVersion = realIdx > 0 ? versions[realIdx - 1] : null
                                const diff = prevVersion ? diffLines(prevVersion.content, version.content) : null

                                return (
                                    <div key={realIdx} className={`version-item ${isLatest ? 'current' : ''}`}>
                                        <div className="version-header">
                                            <span className="version-label">
                                                {isLatest ? '● Current' : `v${realIdx + 1}`}
                                            </span>
                                            <span className="version-date">{formatDate(version.timestamp)}</span>
                                            {!isLatest && (
                                                <button
                                                    className="btn-ghost-sm"
                                                    onClick={() => { onRestore(poem.id, realIdx); onClose() }}
                                                >
                                                    Restore
                                                </button>
                                            )}
                                        </div>
                                        {version.title && (
                                            <div className="version-title">{version.title}</div>
                                        )}
                                        {diff && (
                                            <div className="version-diff">
                                                {diff.filter(d => d.type !== 'same').slice(0, 10).map((d, i) => (
                                                    <div key={i} className={`diff-line diff-${d.type}`}>
                                                        {d.type === 'add' && <span>+ {d.text}</span>}
                                                        {d.type === 'remove' && <span>- {d.text}</span>}
                                                        {d.type === 'change' && (
                                                            <>
                                                                <span className="diff-old">- {d.oldText}</span>
                                                                <span className="diff-new">+ {d.text}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
