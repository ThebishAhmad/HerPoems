import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function FloatingTagBar({ tags, activeTag, onTagClick }) {
    const ref = useRef(null)
    const [stuck, setStuck] = useState(false)

    useEffect(() => {
        if (!ref.current) return
        const observer = new IntersectionObserver(
            ([entry]) => setStuck(!entry.isIntersecting),
            { threshold: 1, rootMargin: '-65px 0px 0px 0px' }
        )
        observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    if (tags.length === 0) return null

    return (
        <>
            <div ref={ref} style={{ height: 1 }} />
            <motion.div
                className={`floating-tag-bar ${stuck ? 'stuck' : ''}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <motion.button
                    className={`tag-pill ${!activeTag ? 'active' : ''}`}
                    onClick={() => onTagClick(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    All
                </motion.button>
                {tags.map(tag => (
                    <motion.button
                        key={tag}
                        className={`tag-pill ${activeTag === tag ? 'active' : ''}`}
                        onClick={() => onTagClick(activeTag === tag ? null : tag)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        #{tag}
                    </motion.button>
                ))}
            </motion.div>
        </>
    )
}
