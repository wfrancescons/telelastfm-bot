import getColors from 'get-image-colors'

async function getPredominantColor(url) {
    const colors = await getColors(url)
    const rgb = colors[0].rgb()
    return rgb
}

export default getPredominantColor