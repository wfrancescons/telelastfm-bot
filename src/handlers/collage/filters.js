import sharp from 'sharp'

const gradients = [
    { star: '#283c86', end: '#45a247' },
    { star: '#103783', end: '#9bafd9' },
    { star: '#d3321d', end: '#ffcf67' },
    { star: '#0b3866', end: '#95f9c3' },
    { star: '#e60b09', end: '#e9d022' },
    { star: '#34073d', end: '#ef745c' },
    { star: '#392d69', end: '#b57bee' },
    { star: '#471069', end: '#30c5d2' },
]

const generateFilter = () => {

    const random = Math.floor(Math.random() * (gradients.length))

    return new Promise((resolve, reject) => {
        sharp(Buffer.from(
            `<svg height="1920" width="1080">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform="rotate(-40)">
                        <stop offset="20%" style="stop-color:${gradients[random].star};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${gradients[random].end};stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect height="1920" width="1080" fill="url(#grad1)" />
            </svg>`
        ))
            .jpeg()
            .toBuffer()
            .then(data => resolve(data))
            .catch(erro => reject(erro))
    })

}

export default generateFilter