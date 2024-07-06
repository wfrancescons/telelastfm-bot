import createEntity from '../../utils/createEntity.js'

function formatArtistDetails(data_to_format) {
    const statusText = data_to_format.isCustom ? 'listened' : data_to_format.isNowPlaying ? 'is now listening' : 'was listening'
    const streaks = data_to_format.streaks_count ? ` (🔥 ${(data_to_format.streaks_count).toLocaleString('pt-BR')})` : ''
    const tags = data_to_format.formatted_tags ? `\n🏷️ ${data_to_format.formatted_tags}` : ''
    const playcount = data_to_format.isNowPlaying ? data_to_format.userplaycount + 1 : data_to_format.userplaycount
    const scrobbles = `${playcount.toLocaleString('pt-BR')} ${playcount !== 1 ? 'scrobbles so far' : 'scrobble so far'}`

    let message_text =
        '{{first_name}}{{streaks}} {{statusText}} to:\n' +
        '🧑‍🎤 {{artist}}' +
        '{{tags}}'

    let indexes = {}

    indexes.first_name = message_text.indexOf('{{first_name}}')
    message_text = message_text.replace('{{first_name}}', data_to_format.first_name)

    message_text = message_text.replace('{{streaks}}', streaks)
    message_text = message_text.replace('{{statusText}}', statusText)

    indexes.artist = message_text.indexOf('{{artist}}')
    message_text = message_text.replace('{{artist}}', data_to_format.artist)

    indexes.tags = tags ? message_text.indexOf('{{tags}}') + '\n🏷️ '.length : -1
    message_text = message_text.replace('{{tags}}', tags)

    indexes.scrobbles = message_text.length + 2
    message_text += '\n\n📈 {{scrobbles}}'
    message_text = message_text.replace('{{scrobbles}}', scrobbles)

    return { message_text, indexes }
}

function createEntities({ first_name, artist, indexes, image_url, formatted_tags }) {
    const entities = [
        createEntity(indexes.first_name, first_name.length, 'bold'),
        createEntity(indexes.artist, artist.length, 'bold'),
        createEntity(indexes.scrobbles, '📈'.length, 'text_link', image_url)
    ]

    if (indexes.tags !== -1) {
        entities.push(createEntity(indexes.tags, formatted_tags.length, 'italic'))
    }

    return entities
}

function artlfFormatter(data_to_format) {
    const { first_name, artist, image, tags } = data_to_format

    let formatted_tags
    if (tags && tags.length > 0) {
        formatted_tags = tags
            .slice(0, 3)
            .map(tag => tag.name.trim().toLowerCase().replace(/\s+/g, ''))
            .join(', ')
    }

    const { message_text, indexes } = formatArtistDetails({ ...data_to_format, formatted_tags })

    const entities = createEntities({ first_name, artist, indexes, image_url: image.large, formatted_tags })

    return {
        text: message_text,
        entities
    }
}

export default artlfFormatter
