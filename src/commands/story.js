const { getUserTopTracks, getUserTopAlbuns, getUserTopArtists } = require('../controller/lastfm')
const { getLastfmUser } = require('../controller/user')
const makeStory = require('../controller/collage/collage')

const acceptedMediaTypes = ['tracks', 'albums', 'artists']
const acceptedPeriods = ['overall', '7day', '1month', '3month', '6month', '12month']

const periodText = [
    { period: 'overall', text: 'all time' },
    { period: '7day', text: 'last 7 days' },
    { period: '1month', text: 'last month' },
    { period: '3month', text: 'last 3 months' },
    { period: '6month', text: 'last 6 months' },
    { period: '12month', text: 'last 12 months' },
]

const story = async (ctx) => {

    const { first_name } = ctx.update.message.from
    const text = ctx.update.message.text.trim().toLowerCase()
    const [command, mediaType, period] = text.split(' ')

    if (!acceptedMediaTypes.includes(mediaType) || !acceptedPeriods.includes(period)) {
        ctx.replyWithChatAction('typing')
        const invalidArgummentsText = 'Invalid argumments 🤔\n'+
                                      'Type `/story mediatype period` to generate your collage.\n'+
                                      'Example: `/story tracks 7days`\n\n'+
                                      'Valid MediaTypes: `tracks`, `albums`, `artists`\n'+
                                      'Valid Periods: `overall`, `7day`, `1month`, `3month`, `6month`, `12month`'

        return ctx.replyWithMarkdown(invalidArgummentsText)
    }

    ctx.replyWithChatAction('upload_photo')

    const formattedPeriod = periodText.find(item => item.period === period)

    try {
        const lastfm_user = await getLastfmUser(ctx)
        if (!lastfm_user) return ctx.replyWithMarkdown('Type `/reg lastfmusername` to set your Lastfm\'s username')

        let data
        if (mediaType === 'tracks') {
            data = await getUserTopTracks(lastfm_user, period)
        }
        if (mediaType === 'albums') {
            data = await getUserTopTracks(lastfm_user, period)
        }
        if (mediaType === 'artists') {
            data = await getUserTopArtists(lastfm_user, period)
        }

        const model = {
            period: formattedPeriod.text,
            mediaType: mediaType,
            data
        }
        const imageBuffer = await makeStory(model)

        return ctx.replyWithPhoto({ source: imageBuffer })

    } catch (erro) {
        console.log(erro)
        return ctx.reply('Something went wrong 🥴 \nBut don\'t fret, let\'s give it another shot in a couple of minutes.')
    }
}

module.exports = story