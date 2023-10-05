import axios from 'axios'
import Vibrant from 'node-vibrant'
import sharp from 'sharp'

const { get } = axios

const hexToRgb = (hex) => {
    const rgbToParse = hex.match(/[^#]{1,2}/g);
    const rgb = [
        parseInt(rgbToParse[0], 16),
        parseInt(rgbToParse[1], 16),
        parseInt(rgbToParse[2], 16)
    ]
    return rgb
}

async function getProminentColor(imageSource) {
    const vibrantData = await Vibrant.from(imageSource).getPalette()
    const vibrantHex = vibrantData.Vibrant.getHex()

    return vibrantHex
}

const generateFilter = (hex) => {
    return new Promise((resolve, reject) => {
        sharp({
            create: {
                width: 1080,
                height: 1920,
                channels: 4,
                background: hex
            }
        })
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
        const prominentColor = await getProminentColor(buffer)
        const filter = await generateFilter(prominentColor)

        sharp(buffer)
            .resize({
                width: 1080,
                height: 1920,
                fit: sharp.cover,
                position: sharp.strategy.entropy
            })
            .greyscale()
            .blur(blur)
            .modulate({ brightness: 0.3 })
            .composite([{ input: filter, left: 0, top: 0, blend: 'soft-light' }])
            .jpeg()
            .toBuffer()
            .then(data => resolve(data))
            .catch(erro => reject(erro))
    })
}

async function getCollageColor(imageSource) {
    const vibrantData = await Vibrant.from(imageSource).getPalette()
    const vibrantHex = vibrantData.DarkVibrant.getHex()
    return hexToRgb(vibrantHex)
}

export { generateBackground, getCollageColor, getProminentColor }

