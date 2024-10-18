import getColors from 'get-image-colors'

async function getPredominantColor(url) {
    try {
        const colors = await getColors(url)
        let color = colors[0]

        if (color.luminance() > 0.7) {
            color = color.darken(2)
        }

        return color.rgb()
    } catch (error) {
        console.error(error)
        return [14, 14, 14]
    }
}

export default getPredominantColor