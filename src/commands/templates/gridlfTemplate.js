import limitText from '../../helpers/limitText.js'

function createImageElement({ src, x, y, width, height }) {
    return { type: 'image', src, x, y, width, height }
}

function createRectangleElement({ fillStyle, x, y, width, height }) {
    return { type: 'rectangle', fillStyle, x, y, width, height }
}

function createTextElement({ text, x, y, font, fillStyle, shadow, maxWidth, lineHeight }) {
    return { type: 'text', text, x, y, font, fillStyle, shadow, maxWidth, lineHeight }
}

function createGradientRectangle(x, y, config) {
    const rgb = config.GRADIENT_COLOR.join(', ')
    return createRectangleElement({
        fillStyle: {
            type: 'linearGradient',
            colors: [
                { stop: 0, color: `rgba(${rgb}, 0)` },
                { stop: 1, color: `rgba(${rgb}, 0.9)` }
            ],
            x0: x,
            y0: y + config.POSTER_HEIGHT - config.GRADIENT_HEIGHT,
            x1: x,
            y1: y + config.POSTER_HEIGHT
        },
        x,
        y: y + config.POSTER_HEIGHT - config.GRADIENT_HEIGHT,
        width: config.POSTER_WIDTH,
        height: config.GRADIENT_HEIGHT
    })
}

function generateScrobbleImage(item, x, y, width, height, param, config, media_type, useLargeImage = false) {
    const scrobbleElements = []

    if (item.image) {
        const src = item.image
        scrobbleElements.push(createImageElement({ src, x, y, width, height }))
    } else {
        scrobbleElements.push(createRectangleElement({ fillStyle: 'rgba(0, 0, 0, 0.5)', x, y, width, height }))
    }

    if (param === 'notexts') return scrobbleElements

    scrobbleElements.push(createGradientRectangle(x, y, { ...config, POSTER_WIDTH: width, POSTER_HEIGHT: height }))

    if (!param || param === 'noplays') {
        let textElements = []

        if (media_type === 'tracks') {
            if (param === 'noplays') {
                textElements.push({
                    text: limitText(item.track.name, 50),
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET + config.TEXT_LINE_HEIGHT,
                    font: `normal 700 ${config.TRACK_NAME_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
                textElements.push({
                    text: limitText(item.track.artist, 30),
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET,
                    font: `normal 500 ${config.TRACK_ARTIST_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
            } else {
                textElements.push({
                    text: limitText(item.track.name, 50),
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET + 2 * config.TEXT_LINE_HEIGHT,
                    font: `normal 700 ${config.TRACK_NAME_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
                textElements.push({
                    text: limitText(item.track.artist, 30),
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET + config.TEXT_LINE_HEIGHT,
                    font: `normal 500 ${config.TRACK_ARTIST_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
                textElements.push({
                    text: `${Number(item.scrobbles).toLocaleString('pt-BR')} ${item.scrobbles == 1 ? 'scrobble' : 'scrobbles'}`,
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET,
                    font: `${config.TRACK_SCROBBLE_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
            }
        } else if (media_type === 'albums') {
            if (param === 'noplays') {
                textElements.push({
                    text: limitText(item.album.name, 50),
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET + config.TEXT_LINE_HEIGHT,
                    font: `normal 700 ${config.ALBUM_NAME_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
                textElements.push({
                    text: limitText(item.album.artist, 50),
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET,
                    font: `normal 500 ${config.ALBUM_ARTIST_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
            } else {
                textElements.push({
                    text: limitText(item.album.name, 50),
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET + 2 * config.TEXT_LINE_HEIGHT,
                    font: `normal 700 ${config.ALBUM_NAME_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
                textElements.push({
                    text: limitText(item.album.artist, 30),
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET + config.TEXT_LINE_HEIGHT,
                    font: `normal 500 ${config.ALBUM_ARTIST_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
                textElements.push({
                    text: `${Number(item.scrobbles).toLocaleString('pt-BR')} ${item.scrobbles == 1 ? 'scrobble' : 'scrobbles'}`,
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET,
                    font: `${config.ALBUM_SCROBBLE_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
            }
        } else if (media_type === 'artists') {
            if (param === 'noplays') {
                textElements.push({
                    text: limitText(item.artist.name, 50),
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET,
                    font: `normal 700 ${config.ARTIST_NAME_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
            } else {
                textElements.push({
                    text: limitText(item.artist.name, 50),
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET + config.TEXT_LINE_HEIGHT,
                    font: `normal 700 ${config.ARTIST_NAME_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
                textElements.push({
                    text: `${Number(item.scrobbles).toLocaleString('pt-BR')} ${item.scrobbles == 1 ? 'scrobble' : 'scrobbles'}`,
                    yOffset: config.SCROBBLE_TEXT_Y_OFFSET,
                    font: `${config.ARTIST_SCROBBLE_FONT_SIZE}px "Noto Sans JP", sans-serif`
                })
            }
        }

        textElements.forEach(({ text, yOffset, font }) => {
            scrobbleElements.push(createTextElement({
                text,
                x: x + config.TEXT_PADDING,
                y: y + height - yOffset,
                font,
                fillStyle: '#ffffff',
                shadow: {
                    color: 'rgba(0, 0, 0, 1.0)',
                    offsetX: 2,
                    offsetY: 2,
                    blur: 4
                },
                maxWidth: width - 2 * config.TEXT_PADDING,
                lineHeight: config.TEXT_LINE_HEIGHT
            }))
        })
    }

    return scrobbleElements
}

function gridlfTemplate({ lastfm_data, columns, rows, predominantColor, media_type, param = null }) {
    const config = {
        POSTER_WIDTH: 250,
        POSTER_HEIGHT: 250,
        GRADIENT_HEIGHT: 100,
        GRADIENT_COLOR: predominantColor,
        TEXT_PADDING: 15,
        TEXT_LINE_HEIGHT: 18,
        SCROBBLE_TEXT_Y_OFFSET: 15,
        TRACK_NAME_FONT_SIZE: 16,
        TRACK_ARTIST_FONT_SIZE: 15,
        TRACK_SCROBBLE_FONT_SIZE: 14,
        ALBUM_NAME_FONT_SIZE: 16,
        ALBUM_ARTIST_FONT_SIZE: 15,
        ALBUM_SCROBBLE_FONT_SIZE: 14,
        ARTIST_NAME_FONT_SIZE: 16,
        ARTIST_SCROBBLE_FONT_SIZE: 14
    }

    const data = {
        type: 'lastfm-grid',
        width: columns * config.POSTER_WIDTH,
        height: rows * config.POSTER_HEIGHT,
        background: '#0E0E0E',
        firstLarge: false,
        elements: []
    }

    const firstLarge = columns > 2 && rows > 2

    if (firstLarge) {
        const firstItem = lastfm_data[0]
        const firstElements = generateScrobbleImage(firstItem, 0, 0, 2 * config.POSTER_WIDTH, 2 * config.POSTER_HEIGHT, param, config, media_type, true)
        data.elements.push(...firstElements)
    }

    let index = firstLarge ? 1 : 0
    let x = firstLarge ? 2 * config.POSTER_WIDTH : 0
    let y = 0

    while (index < lastfm_data.length) {
        if (x >= columns * config.POSTER_WIDTH) {
            x = 0
            y += config.POSTER_HEIGHT
        }

        if (firstLarge && x === 0 && y < 2 * config.POSTER_HEIGHT) {
            x = 2 * config.POSTER_WIDTH
        }

        if (y >= rows * config.POSTER_HEIGHT) {
            break
        }

        const item = lastfm_data[index]
        const scrobbleElements = generateScrobbleImage(item, x, y, config.POSTER_WIDTH, config.POSTER_HEIGHT, param, config, media_type)
        data.elements.push(...scrobbleElements)

        x += config.POSTER_WIDTH
        index++
    }

    return data
}

export default gridlfTemplate
