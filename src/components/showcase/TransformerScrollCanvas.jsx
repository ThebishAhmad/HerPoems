import { useRef, useEffect, useState, useCallback } from 'react'
import { useTransform, useMotionValueEvent } from 'framer-motion'
import { getFramePath, SEQUENCE_CONFIG } from '../../data/transformerData'

export default function TransformerScrollCanvas({ scrollYProgress, totalFrames }) {
    const canvasRef = useRef(null)
    const imagesRef = useRef([])
    const currentFrameRef = useRef(0)
    const rafRef = useRef(null)
    const [loaded, setLoaded] = useState(false)
    const [loadProgress, setLoadProgress] = useState(0)

    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, totalFrames - 1])

    // Preload all frames
    useEffect(() => {
        let cancelled = false
        const images = []
        let count = 0

        // Load in batches to avoid blocking
        const BATCH = 20
        let i = 0

        function loadBatch() {
            if (cancelled) return
            const end = Math.min(i + BATCH, totalFrames)
            for (let j = i; j < end; j++) {
                const img = new Image()
                img.src = getFramePath(j)
                img.onload = () => {
                    count++
                    if (!cancelled) {
                        setLoadProgress(Math.round((count / totalFrames) * 100))
                        if (count === totalFrames) {
                            setLoaded(true)
                            drawFrame(0)
                        }
                    }
                }
                img.onerror = () => {
                    count++
                    if (!cancelled && count === totalFrames) {
                        setLoaded(true)
                        drawFrame(0)
                    }
                }
                images[j] = img
            }
            i = end
            if (i < totalFrames) {
                setTimeout(loadBatch, 0)
            }
        }

        loadBatch()
        imagesRef.current = images

        return () => { cancelled = true }
    }, [totalFrames])

    // Draw a frame with object-fit: contain logic + DPI scaling
    const drawFrame = useCallback((index) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const img = imagesRef.current[index]
        if (!img || !img.complete || !img.naturalWidth) return

        const dpr = window.devicePixelRatio || 1
        const displayW = canvas.clientWidth
        const displayH = canvas.clientHeight

        // Set canvas buffer size for Retina
        if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
            canvas.width = displayW * dpr
            canvas.height = displayH * dpr
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, displayW, displayH)

        // Object-fit: cover logic (fill entire canvas, crop excess)
        const imgRatio = img.naturalWidth / img.naturalHeight
        const canvasRatio = displayW / displayH

        let drawW, drawH, offsetX, offsetY
        if (imgRatio > canvasRatio) {
            drawH = displayH
            drawW = displayH * imgRatio
            offsetX = (displayW - drawW) / 2
            offsetY = 0
        } else {
            drawW = displayW
            drawH = displayW / imgRatio
            offsetX = 0
            offsetY = (displayH - drawH) / 2
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
    }, [])

    // Listen to scroll-driven frame changes
    useMotionValueEvent(frameIndex, 'change', (v) => {
        const idx = Math.round(v)
        if (idx !== currentFrameRef.current) {
            currentFrameRef.current = idx
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(() => drawFrame(idx))
        }
    })

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (loaded) drawFrame(currentFrameRef.current)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [loaded, drawFrame])

    return (
        <>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    zIndex: 0,
                }}
            />

            {/* Loading overlay */}
            {!loaded && (
                <div className="showcase-loader">
                    <div className="showcase-loader-inner">
                        <div className="showcase-loader-bar">
                            <div
                                className="showcase-loader-fill"
                                style={{ width: `${loadProgress}%` }}
                            />
                        </div>
                        <span className="showcase-loader-text">
                            LOADING SEQUENCE — {loadProgress}%
                        </span>
                    </div>
                </div>
            )}
        </>
    )
}
