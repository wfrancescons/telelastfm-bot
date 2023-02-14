import axios from 'axios'
import sharp from 'sharp'

const { get } = axios

const gradients = [
    { start: '#283c86', end: '#45a247' },
    { start: '#103783', end: '#9bafd9' },
    { start: '#d3321d', end: '#ffcf67' },
    { start: '#471069', end: '#95f9c3' },
    { start: '#e60b09', end: '#e9d022' },
    { start: '#34073d', end: '#ef745c' },
    { start: '#392d69', end: '#b57bee' },
    { start: '#471069', end: '#30c5d2' },
]

const colors = [
    '#6e0a78',
    '#ba2649',
    '#1a6b54',
    '#0F4C81',
    '#8B0000',
    '#DE970B'
]

const hexToRgb = (hex) => {
    const rgbToParse = hex.match(/[^#]{1,2}/g);
    const rgb = [
        parseInt(rgbToParse[0], 16),
        parseInt(rgbToParse[1], 16),
        parseInt(rgbToParse[2], 16)
    ]
    return rgb
}

const generateFilter = () => {
    return new Promise((resolve, reject) => {

        const random = Math.floor(Math.random() * (gradients.length))

        sharp(Buffer.from(
            `<svg height="1920" width="1080">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform="rotate(-40)">
                        <stop offset="20%" style="stop-color:${gradients[random].start};stop-opacity:1" />
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

const generateBackground = (imageURL, blur = 15) => {
    return new Promise(async (resolve, reject) => {
        const { data } = await get(imageURL, { responseType: 'arraybuffer', timeout: 5 * 1000 })
        const buffer = Buffer.from(data)
        const filter = await generateFilter()

        sharp(buffer)
            .resize({
                width: 1080,
                height: 1920,
                fit: sharp.cover,
                position: sharp.strategy.entropy
            })
            .greyscale()
            .blur(blur)
            .modulate({ brightness: 0.2 })
            .composite([{ input: filter, left: 0, top: 0, blend: 'soft-light' }])
            .jpeg()
            .toBuffer()
            .then(data => resolve(data))
            .catch(erro => reject(erro))
    })
}

const getCollageColor = () => {
    const random = Math.floor(Math.random() * (colors.length))
    const color = colors[random]
    return hexToRgb(color)
}

export { getCollageColor, generateBackground }

