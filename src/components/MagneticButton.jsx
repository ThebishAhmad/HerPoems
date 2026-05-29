import { useState, useRef, useCallback } from 'react'

export default function MagneticButton({ children, className = '', as: Tag = 'button', ...props }) {
    const ref = useRef(null)
    const [transform, setTransform] = useState({ x: 0, y: 0 })

    const handleMouseMove = useCallback(e => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = (e.clientX - cx) * 0.2
        const dy = (e.clientY - cy) * 0.2
        setTransform({ x: Math.max(-12, Math.min(12, dx)), y: Math.max(-12, Math.min(12, dy)) })
    }, [])

    const handleMouseLeave = useCallback(() => {
        setTransform({ x: 0, y: 0 })
    }, [])

    return (
        <Tag
            ref={ref}
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `translate(${transform.x}px, ${transform.y}px)`,
                transition: transform.x === 0 ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
            }}
            {...props}
        >
            {children}
        </Tag>
    )
}
