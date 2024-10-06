import limitText from '../../helpers/limitText.js'

function createImageElement({ src, x, y, width, height, filter, composite }) {
  return { type: 'image', src, x, y, width, height, filter, composite }
}

function createRectangleElement({ fillStyle, x, y, width, height }) {
  return { type: 'rectangle', fillStyle, x, y, width, height }
}

function createTextElement({ text, x, y, font, fillStyle, shadow, maxWidth, lineHeight, align }) {
  return { type: 'text', text, x, y, font, fillStyle, shadow, maxWidth, lineHeight, align }
}

function createGradientRectangle(x, y, config) {
  const rgb = config.GRADIENT_COLOR.join(', ')
  return createRectangleElement({
    fillStyle: {
      type: 'linearGradient',
      colors: [
        { stop: 0, color: `rgba(${rgb}, 0)` },
        { stop: 1, color: `rgba(${rgb}, 1)` }
      ],
      x0: x,
      y0: y,
      x1: x,
      y1: y + config.GRADIENT_HEIGHT
    },
    x,
    y,
    width: config.COVER_WIDTH,
    height: config.GRADIENT_HEIGHT
  })
}

function generateTrackStory({ lastfm_data, canva_data, config }) {
  const src = lastfm_data.image.extralarge
  const track_title = lastfm_data.track
  const album_title = lastfm_data.album
  const artist_title = lastfm_data.artist
  const scrobbles = Number(lastfm_data.userplaycount) + 1

  // cover
  canva_data.elements.push(createImageElement({ src, x: 0, y: 0, width: 1080, height: 1080 }))

  canva_data.elements.push(createRectangleElement({
    fillStyle: `rgb(${config.GRADIENT_COLOR.join(',')})`,
    x: 0,
    y: 900,
    width: 1080,
    height: 180
  }))

  // gradiente
  canva_data.elements.push(createGradientRectangle(0, 250, config))

  // track
  canva_data.elements.push(createTextElement({
    text: limitText(track_title, 30),
    align: 'center',
    x: 540,
    y: 1140,
    font: `normal 700 ${config.H1_FONT_SIZE}px "Noto Sans JP", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: 50
  }))

  // album
  canva_data.elements.push(createTextElement({
    text: limitText(album_title, 35),
    align: 'center',
    x: 540,
    y: 1210,
    font: `normal 500 ${config.H2_FONT_SIZE}px "Noto Sans JP", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: 50
  }))

  // artist
  canva_data.elements.push(createTextElement({
    text: limitText(artist_title, 40),
    align: 'center',
    x: 540,
    y: 1275,
    font: `normal 400 ${config.H2_FONT_SIZE}px "Noto Sans JP", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: 50
  }))

  // play controls
  canva_data.elements.push(createImageElement({
    src: './src/commands/templates/assets/play_controls.png',
    x: 0,
    y: 1400,
    width: 1080,
    height: 350,
    composite: 'hard-light'
  }))

  // scrobbles
  canva_data.elements.push(createTextElement({
    text: scrobbles === 1 ? 'SCROBBLE' : 'SCROBBLES',
    align: 'center',
    x: 540,
    y: 1000,
    font: `normal 700 ${config.H3_FONT_SIZE}px "Noto Sans JP", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: 50
  }))

  // number
  canva_data.elements.push(createTextElement({
    text: scrobbles.toLocaleString('pt-BR'),
    align: 'center',
    x: 540,
    y: 920,
    font: `${config.SCROBBLES_FONT_SIZE}px "Train One", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: 50
  }))

  return canva_data
}

function generateAlbumStory({ lastfm_data, canva_data, config }) {
  const src = lastfm_data.image.extralarge
  const album_title = lastfm_data.album
  const artist_title = lastfm_data.artist
  const scrobbles = Number(lastfm_data.userplaycount) + 1

  // cover
  canva_data.elements.push(createImageElement({ src, x: 0, y: 0, width: 1080, height: 1080 }))

  canva_data.elements.push(createRectangleElement({
    fillStyle: `rgb(${config.GRADIENT_COLOR.join(',')})`,
    x: 0,
    y: 900,
    width: 1080,
    height: 180
  }))

  // gradiente
  canva_data.elements.push(createGradientRectangle(0, 250, config))

  // album
  canva_data.elements.push(createTextElement({
    text: limitText(album_title, 45),
    align: 'center',
    x: 540,
    y: 1180,
    font: `normal 700 ${config.H1_FONT_SIZE}px "Noto Sans JP", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: config.H1_FONT_SIZE + 10
  }))

  // artist
  canva_data.elements.push(createTextElement({
    text: limitText(artist_title, 40),
    align: 'center',
    x: 540,
    y: 1250,
    font: `normal 400 ${config.H2_FONT_SIZE}px "Noto Sans JP", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: 50
  }))

  // play controls
  canva_data.elements.push(createImageElement({
    src: './src/commands/templates/assets/play_controls.png',
    x: 0,
    y: 1400,
    width: 1080,
    height: 350,
    composite: 'hard-light'
  }))

  // scrobbles
  canva_data.elements.push(createTextElement({
    text: scrobbles === 1 ? 'SCROBBLE' : 'SCROBBLES',
    align: 'center',
    x: 540,
    y: 1000,
    font: `normal 700 ${config.H3_FONT_SIZE}px "Noto Sans JP", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: 50
  }))

  // number
  canva_data.elements.push(createTextElement({
    text: scrobbles.toLocaleString('pt-BR'),
    align: 'center',
    x: 540,
    y: 920,
    font: `${config.SCROBBLES_FONT_SIZE}px "Train One", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: 50
  }))

  return canva_data
}

function generateArtistStory({ lastfm_data, canva_data, config }) {
  const src = lastfm_data.image.extralarge
  const artist_title = lastfm_data.artist
  const scrobbles = Number(lastfm_data.userplaycount) + 1

  // cover
  canva_data.elements.push(createImageElement({ src, x: 0, y: 0, width: 1080, height: 1080 }))

  canva_data.elements.push(createRectangleElement({
    fillStyle: `rgb(${config.GRADIENT_COLOR.join(',')})`,
    x: 0,
    y: 900,
    width: 1080,
    height: 180
  }))

  // gradiente
  canva_data.elements.push(createGradientRectangle(0, 250, config))

  // artist
  canva_data.elements.push(createTextElement({
    text: limitText(artist_title, 30),
    align: 'center',
    x: 540,
    y: 1140,
    font: `normal 700 ${config.H1_FONT_SIZE}px "Noto Sans JP", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: 50
  }))

  // play controls
  canva_data.elements.push(createImageElement({
    src: './src/commands/templates/assets/play_controls.png',
    x: 0,
    y: 1400,
    width: 1080,
    height: 350,
    composite: 'hard-light'
  }))

  // scrobbles
  canva_data.elements.push(createTextElement({
    text: scrobbles === 1 ? 'SCROBBLE' : 'SCROBBLES',
    align: 'center',
    x: 540,
    y: 1000,
    font: `normal 700 ${config.H3_FONT_SIZE}px "Noto Sans JP", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: 50
  }))

  // number
  canva_data.elements.push(createTextElement({
    text: scrobbles.toLocaleString('pt-BR'),
    align: 'center',
    x: 540,
    y: 920,
    font: `${config.SCROBBLES_FONT_SIZE}px "Train One", sans-serif`,
    fillStyle: '#ffffff',
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      offsetX: 2,
      offsetY: 2,
      blur: 10
    },
    maxWidth: 1000,
    lineHeight: 50
  }))

  return canva_data
}

function storylfTemplate({ lastfm_data, predominant_color, media_type }) {
  const canva_data = {
    type: 'lastfm-story',
    width: 1080,
    height: 1920,
    background: `rgb(${predominant_color.join(',')})`,
    elements: []
  }

  const config = {
    COVER_WIDTH: 1080,
    COVER_HEIGHT: 1080,
    GRADIENT_HEIGHT: 650,
    GRADIENT_COLOR: predominant_color || [0, 0, 0],
    H1_FONT_SIZE: 60,
    H2_FONT_SIZE: 45,
    H3_FONT_SIZE: 40,
    SCROBBLES_FONT_SIZE: 200
  }

  if (media_type === 'tracks') generateTrackStory({ lastfm_data, canva_data, config })
  if (media_type === 'albums') generateAlbumStory({ lastfm_data, canva_data, config })
  if (media_type === 'artists') generateArtistStory({ lastfm_data, canva_data, config })

  return canva_data
}

export default storylfTemplate
