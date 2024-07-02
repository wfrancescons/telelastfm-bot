import createEntity from '../../utils/createEntity.js'

function formatTrackDetails(data_to_format) {
  const statusText = data_to_format.isNowPlaying ? 'is now' : 'was'
  const loveText = data_to_format.isLovedTrack ? ' loves ❤️ and' : ''
  const streaks = data_to_format.streaks_count ? ` (🔥 ${(data_to_format.streaks_count).toLocaleString('pt-BR')})` : ''
  const tags = data_to_format.formatted_tags ? `\n🏷️ ${data_to_format.formatted_tags}` : ''
  const scrobbles = `${(data_to_format.userplaycount + 1).toLocaleString('pt-BR')} ${data_to_format.userplaycount + 1 !== 1 ? 'scrobbles so far' : 'scrobble so far'}`

  let message_text =
    '{{first_name}}{{streaks}}{{loveText}} {{statusText}} listening to:\n' +
    '🎶 {{track}}\n' +
    '💿 {{album}}\n' +
    '🧑‍🎤 {{artist}}' +
    '{{tags}}'

  let indexes = {}

  indexes.first_name = message_text.indexOf('{{first_name}}')
  message_text = message_text.replace('{{first_name}}', data_to_format.first_name)

  message_text = message_text.replace('{{streaks}}', streaks)
  message_text = message_text.replace('{{loveText}}', loveText)
  message_text = message_text.replace('{{statusText}}', statusText)
  message_text = message_text.replace('{{album}}', data_to_format.album)
  message_text = message_text.replace('{{artist}}', data_to_format.artist)

  indexes.track = message_text.indexOf('{{track}}')
  message_text = message_text.replace('{{track}}', data_to_format.track)

  indexes.tags = tags ? message_text.indexOf('{{tags}}') + '\n🏷️ '.length : -1
  message_text = message_text.replace('{{tags}}', tags)

  indexes.scrobbles = message_text.length + 2
  message_text += '\n\n📈 {{scrobbles}}'
  message_text = message_text.replace('{{scrobbles}}', scrobbles)

  return { message_text, indexes }
}

function createEntities({ first_name, track, indexes, image_url, formatted_tags }) {
  const entities = [
    createEntity(indexes.first_name, first_name.length, 'bold'),
    createEntity(indexes.track, track.length, 'bold'),
    createEntity(indexes.scrobbles, '📈'.length, 'text_link', image_url)
  ]

  if (indexes.tags !== -1) {
    entities.push(createEntity(indexes.tags, formatted_tags.length, 'italic'))
  }

  return entities
}

function lfFormatter(data_to_format) {
  const { first_name, track, image, tags } = data_to_format

  let formatted_tags
  if (tags && tags.length > 0) {
    formatted_tags = tags
      .slice(0, 3)
      .map(tag => tag.name.trim().toLowerCase().replace(' ', '').replace(' ', ''))
      .join(', ')
  }

  const { message_text, indexes } = formatTrackDetails({ ...data_to_format, formatted_tags })

  const entities = createEntities({ first_name, track, indexes, image_url: image.large, formatted_tags })

  return {
    text: message_text,
    entities
  }
}

export default lfFormatter
