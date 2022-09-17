import sharp from 'sharp'

const gradients = [
    { star: '#283c86', end: '#45a247' },
    { star: '#db36a4', end: '#f7ff00' },
    { star: '#780206', end: '#061161' },
    { star: '#1dbde6', end: '#f1515e' },
    { star: '#f3696e', end: '#f8a902' },
    { star: '#0a33f9', end: '#f6f151' },
    { star: '#ffce06', end: '#6c960d' },
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