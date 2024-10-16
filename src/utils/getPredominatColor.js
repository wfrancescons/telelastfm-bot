import getColors from 'get-image-colors'

async function getPredominantColor(url) {
    try {
        const colors = await getColors(url)
        const rgb = colors[0].rgb()
        return rgb
    } catch (error) {
        console.error(error)
        return [14, 14, 14]
    }

}

export default getPredominantColor