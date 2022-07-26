const { getListeningNow } = require('./controller/lastFm')

const ln = async (username, ctx) => {
    try {
        const {
            track,
            album,
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getListeningNow(username)

        const { first_name: telegram_first_name } = ctx.update.message.from

        const markdown = `*${telegram_first_name}* ${isNowPlaying ? 'is now' : 'was'} listening to:` +
        `\n🎵 *${track}*` +
        `\n💽 ${album}` +
        `\n🧑‍🎤 ${artist} \n` +
        `\n[📊](${image}) ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        return markdown

    } catch (error) {

    }
}

module.exports = {
    ln
}