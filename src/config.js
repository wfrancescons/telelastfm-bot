const config = {
  environment: process.env.NODE_ENV,
  lastfm_token: process.env.LASTFM_TOKEN_API,
  bot: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    username: process.env.TELEGRAM_BOT_USERNAME,
    news_channel: process.env.TELEGRAM_NEWS_CHANNEL,
    support_chat: process.env.TELEGRAM_SUPPORT_CHAT
  },
  spotify: {
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET
  },
  sequelize: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect: process.env.DB_DIALECT,
    logging: false
  }
}

function checkUndefined(obj, parentKey = '') {
  let isValid = true

  for (const key in obj) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      isValid = checkUndefined(obj[key], fullKey) && isValid
    } else if (obj[key] === undefined) {
      console.error(`Undefined value found at key: ${fullKey}`)
      isValid = false
    }
  }

  return isValid
}

if (!checkUndefined(config)) throw new Error('Configuration validation failed. See log for details.')

export default config