const { getUserTopTracks, getUserTopAlbums, getUserTopArtists } = require('../controller/lastfm')
const { getLastfmUser } = require('../controller/user')
const makeStory = require('../controller/collage/collage')

const acceptedMediaTypes = ['tracks', 'albums', 'artists']
const acceptedPeriods = ['overall', '7day', '1month', '3month', '6month', '12month']

const periodMap = {
    'overall': 'all time',
    '7day': 'last 7 days',
    '1month': 'last month',
    '3month': 'last 3 months',
    '6month': 'last 6 months',
    '12month': 'last 12 months'
}

const getLastfmData = (lastfm_user, media, period) => {
    return new Promise(async (resolve, reject) => {
        try {

            let data
            if (media === 'tracks') data = await getUserTopTracks(lastfm_user, period)
            if (media === 'albums') data = await getUserTopAlbums(lastfm_user, period)
            if (media === 'artists') data = await getUserTopArtists(lastfm_user, period)
            resolve(data)

        } catch (erro) {
            reject(erro)
        }
    })
}

const story = async (ctx) => {

    const { first_name } = ctx.update.message.from
    const text = ctx.update.message.text.trim().toLowerCase()
    const [ command, media_type, period ] = text.split(' ')

    try {

        if (!acceptedMediaTypes.includes(media_type) || !acceptedPeriods.includes(period)) {

            ctx.replyWithChatAction('typing')
    
            const invalidArgummentsText = 'Invalid argumments 🤔\n' +
                'Type `/story mediatype period` to generate your collage.\n' +
                '➡️ Example: `/story tracks 7day`\n\n' +
                '✅ Valid MediaTypes: `tracks`, `albums`, `artists`\n' +
                '✅ Valid Periods: `overall`, `7day`, `1month`, `3month`, `6month`, `12month`'
    
            return ctx.replyWithMarkdown(invalidArgummentsText)
        }

        ctx.replyWithChatAction('typing')

        const lastfm_user = await getLastfmUser(ctx)
        if (!lastfm_user) return ctx.replyWithMarkdown('Type `/reg lastfmusername` to set your Lastfm\'s username')

        const response = await ctx.reply('🖼️ Generating your collage...')
        const { message_id } = response

        getLastfmData(lastfm_user, media_type, period)
            .then(data => {
                const periodToText = periodMap[period]

                const model = {
                    period: periodToText,
                    mediaType: media_type,
                    data
                }

                ctx.replyWithChatAction('upload_photo')

                makeStory(model).then(imageBuffer => {
                    ctx.replyWithPhoto({ source: imageBuffer }, { caption: `${first_name}, your top ${media_type} of ${periodToText}` })
                    ctx.deleteMessage(message_id)
                })
            })
            .catch(erro => {
                console.log(erro)
                if (erro == "LastFm scrobbles is equal to zero") return ctx.replyWithMarkdown('There aren\'t any scrobbles on your lastFM. 🙁\n\nIs your username correct? 🤔\nType `/reg lastfmusername` to set your Lastfm\'s username')
                return ctx.reply('Something went wrong 🥴 \nBut don\'t fret, let\'s give it another shot in a couple of minutes.')
            })

    } catch (erro) {
        console.log(erro)
        return ctx.reply('Something went wrong 🥴 \nBut don\'t fret, let\'s give it another shot in a couple of minutes.')
    }
}

module.exports = story