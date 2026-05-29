// ═══════════════════════════════════════════
//  Cinematic Transformer Sequence — Data
//  A book opening with petals flying
// ═══════════════════════════════════════════

export const SEQUENCE_CONFIG = {
    totalFrames: 240,
    folder: '/images/transformer-sequence',
    filePrefix: 'ezgif-frame-',
    fileExtension: '.jpg',
    scrollHeight: '500vh',
}

// ─── Scroll-driven narrative phases ───
// Each phase owns a [start, end] range on scrollYProgress [0..1]
// Copy appears/disappears within these ranges

export const PHASES = {
    // Phase 1: The book rests. Quiet tension.
    presence: {
        range: [0, 0.28],
        title: ['A story', 'waiting to', 'unfold.'],
        subtitle: 'SCROLL TO BEGIN THE TRANSFORMATION',
        systemTag: 'SYS — AWAITING INPUT',
    },

    // Phase 2: The book stirs. Petals begin to lift.
    awakening: {
        range: [0.12, 0.35],
        fragments: [
            { at: 0.14, text: 'Something stirs', position: 'left' },
            { at: 0.22, text: 'beneath the cover', position: 'right' },
            { at: 0.30, text: 'a breath — a flutter', position: 'center' },
        ],
    },

    // Phase 3: Transformation. Petals scatter. The book opens.
    transformation: {
        range: [0.28, 0.72],
        captions: [
            { at: 0.30, text: 'INITIATING', sub: 'The binding loosens' },
            { at: 0.38, text: 'PETALS RISING', sub: 'Organic matter dispersing' },
            { at: 0.46, text: 'UNFOLDING', sub: 'Pages catching light' },
            { at: 0.54, text: 'CORE ENGAGED', sub: 'The story reveals itself' },
            { at: 0.62, text: 'IN BLOOM', sub: 'Every petal a sentence' },
            { at: 0.68, text: 'EMERGENCE', sub: 'Form finding form' },
        ],
        // Poetic lines that ghost across the screen during transformation
        poeticLines: [
            { at: 0.34, text: 'What was closed now opens', y: '30%' },
            { at: 0.42, text: 'Petals carry words the pages could not hold', y: '65%' },
            { at: 0.52, text: 'Light pours through the spine', y: '45%' },
            { at: 0.60, text: 'Every ending is a different kind of beginning', y: '55%' },
        ],
    },

    // Phase 4: Arrival. The transformation is complete.
    arrival: {
        range: [0.72, 1.0],
        statement: ['Cinematic', 'Transformation'],
        credit: 'Directed by Tabish Ahmad',
        poemLine: 'The book was never meant to stay closed.',
        cta: { label: 'PORTFOLIO', href: '#' },
    },
}

// Frame counter config
export const FRAME_COUNTER = {
    range: [0.25, 0.75], // visible during mid-sequence
}

export function getFramePath(index) {
    const num = String(index + 1).padStart(3, '0')
    return `${SEQUENCE_CONFIG.folder}/${SEQUENCE_CONFIG.filePrefix}${num}${SEQUENCE_CONFIG.fileExtension}`
}
