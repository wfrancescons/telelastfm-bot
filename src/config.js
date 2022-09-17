if (process.env.NODE_ENV !== 'production') {
  await import('dotenv').then((dotenv) => {
    dotenv.config();
  });
}

const config = {
  environment: process.env.NODE_ENV,
  bot_token: process.env.TELEGRAM_BOT_TOKEN,
  mongoURI: process.env.MONGODB_URI,
  lastfmURL: process.env.LASTFM_URL_API,
  lastfmToken: process.env.LASTFM_TOKEN_API,
};

export default config;
