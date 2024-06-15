import createEntity from '../../utils/createEntity.js'

function formatTrackDetails(infos) {
    const {
        isNowPlaying, album, artist, userplaycount, first_name, formatted_tags
    } = infos

    const textArray = []

    if (infos.isCustom) {
        textArray.push(
            `${first_name} listened to:`,
            `\n💿 ${album}`,
            `\n🧑‍🎤 ${artist}\n`,
            `\n📈 ${(userplaycount).toLocaleString('pt-BR')} ${userplaycount > 1 ? 'scrobbles so far' : 'scrobble so far'}`
        )

    } else {
        const status = isNowPlaying ? 'is now' : 'was'
        textArray.push(
            `${first_name} ${status} listening to:`,
            `\n💿 ${album}`,
            `\n🧑‍🎤 ${artist}\n`,
            `\n📈 ${(userplaycount + 1).toLocaleString('pt-BR')} ${userplaycount + 1 !== 1 ? 'scrobbles so far' : 'scrobble so far'}`
        )
    }

    if (formatted_tags) textArray.push(`\n\n🔖 ${formatted_tags}`)

    return textArray
}

function calculateIndexes(textArray) {
    const albumIndex = textArray[0].length + '💿'.length + 2
    const imageIndex = textArray.slice(0, 3).reduce((sum, current) => sum + current.length, 0) + 1

    if (textArray.length > 4) {
        const tagsIndex = textArray.slice(0, 4).reduce((sum, current) => sum + current.length, 0) + '🔖'.length + 3
        return { albumIndex, imageIndex, tagsIndex }
    }

    return { albumIndex, imageIndex }
}

function createEntities(first_name, album, indexes, imageUrl, formatted_tags) {
    const entities = [
        createEntity(0, first_name.length, 'bold'),
        createEntity(indexes.albumIndex, album.length, 'bold'),
        createEntity(indexes.imageIndex, '📈'.length, 'text_link', imageUrl)
    ]

    if (indexes.tagsIndex) {
        entities.push(createEntity(indexes.tagsIndex, formatted_tags.length, 'italic'))
    }

    return entities
}

function alblfFormatter(data_to_format) {
    const { first_name, album, image, tags } = data_to_format

    let formatted_tags
    if (tags && tags.length > 0) {
        formatted_tags = tags
            .slice(0, 3)
            .map(tag => tag.name.trim().toLowerCase().replace(' ', '').replace(' ', ''))
            .join(', ')
    }

    const textArray = formatTrackDetails({ ...data_to_format, formatted_tags })
    const indexes = calculateIndexes(textArray)

    const entities = createEntities(first_name, album, indexes, image.medium, formatted_tags)

    return {
        text: textArray.join(''),
        entities
    }
}

export default alblfFormatter
