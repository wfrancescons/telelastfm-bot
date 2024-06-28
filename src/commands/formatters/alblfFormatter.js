import createEntity from '../../utils/createEntity.js'

function formatTrackDetails(data_to_format) {

    const streaks = data_to_format.streaks_count

    const text_array = []

    if (data_to_format.isCustom) {
        text_array.push(
            `${data_to_format.first_name} listened to:`,
            `\n💿 ${data_to_format.album}`,
            `\n🧑‍🎤 ${data_to_format.artist}\n`,
            `\n📈 ${(data_to_format.userplaycount).toLocaleString('pt-BR')} ${data_to_format.userplaycount > 1 ? 'scrobbles so far' : 'scrobble so far'}` +
            `${streaks !== 0 ? `\n🔥 ${streaks} bot streaks` : ''}`
        )

    } else {
        const status = data_to_format.isNowPlaying ? 'is now' : 'was'
        text_array.push(
            `${data_to_format.first_name} ${status} listening to:`,
            `\n💿 ${data_to_format.album}`,
            `\n🧑‍🎤 ${data_to_format.artist}\n`,
            `\n📈 ${(data_to_format.userplaycount + 1).toLocaleString('pt-BR')} ${data_to_format.userplaycount + 1 !== 1 ? 'scrobbles so far' : 'scrobble so far'}` +
            `${streaks !== 0 ? `\n🔥 ${streaks} bot streaks` : ''}`
        )
    }

    if (data_to_format.formatted_tags) text_array.push(`\n\n🔖 ${data_to_format.formatted_tags}`)

    return text_array
}

function calculateIndexes(textArray) {
    const album_index = textArray[0].length + '💿'.length + 2
    const image_index = textArray.slice(0, 3).reduce((sum, current) => sum + current.length, 0) + 1

    if (textArray.length > 4) {
        const tags_index = textArray.slice(0, 4).reduce((sum, current) => sum + current.length, 0) + '🔖'.length + 3
        return { album_index, image_index, tags_index }
    }

    return { album_index, image_index }
}

function createEntities({ first_name, album, indexes, image_url, formatted_tags }) {
    const entities = [
        createEntity(0, first_name.length, 'bold'),
        createEntity(indexes.album_index, album.length, 'bold'),
        createEntity(indexes.image_index, '📈'.length, 'text_link', image_url)
    ]

    if (indexes.tagsIndex) {
        entities.push(createEntity(indexes.tags_index, formatted_tags.length, 'italic'))
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

    const text_message = formatTrackDetails({ ...data_to_format, formatted_tags })
    const indexes = calculateIndexes(text_message)

    const entities = createEntities({ first_name, album, indexes, image_url: image.large, formatted_tags })

    return {
        text: text_message.join(''),
        entities
    }
}

export default alblfFormatter
