const { getUserTopAlbuns, getUserTopTracks } = require('../controller/lastfm')
const { getLastfmUser } = require('../controller/user')
const makeStory = require('../controller/collage/collage')

const story = async (ctx) => {

    ctx.replyWithChatAction('upload_photo')

    const { first_name } = ctx.update.message.from

    try {
        const lastfm_user = await getLastfmUser(ctx)

        if (!lastfm_user) return ctx.replyWithMarkdown('Type `/reg lastfmusername` to set your Lastfm\'s username')

        const albuns = await getUserTopAlbuns(lastfm_user)

        const req = {
            period: 'last 7 days',
            mediaType: 'albums',
            data: albuns
        }

        const imageBuffer = await makeStory(req)

        return ctx.replyWithPhoto({ source: imageBuffer })

    } catch (erro) {
        console.log(erro)
        ctx.reply('Something went wrong 🥴 \nBut don\'t fret, let\'s give it another shot in a couple of minutes.')
    }
}

module.exports = story