const { getTrackListeningNow, getAlbumListeningNow,getArtistListeningNow } = require('../lastfm')
const { getLastfmUser, setLastfmUser } = require('../controller/user')

const ln = async (ctx) => {
    ctx.replyWithChatAction('typing')

    try {
        const lastfmUser = await getLastfmUser(ctx)

        if (!lastfmUser) return ctx.reply('Utilize o comando \'/reg usuariolastfm\' para se registrar')

        const {
            track,
            album,
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getTrackListeningNow(lastfmUser)

        const { first_name } = ctx.update.message.from

        const text = `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:` +
            `\n🎵 ${track}` +
            `\n💽 ${album}` +
            `\n🧑‍🎤 ${artist} \n` +
            `\n📊 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`

        const entities = [{
            offset: text.indexOf(first_name),
            length: first_name.length,
            type: 'bold',
        },
        {
            offset: text.indexOf(track),
            length: track.length,
            type: 'bold',
        },
        {
            offset: text.indexOf('📊'),
            length: '📊'.length,
            type: 'text_link',
            url: image
        }]

        return ctx.reply(text, { entities })

    } catch (erro) {
        console.log(erro)
        ctx.reply('Ops! Tive um problema 🥴 \nTente novamente mais tarde.')
    }
}

const alb = async (ctx) => {
    ctx.replyWithChatAction('typing')

    try {
        const lastfmUser = await getLastfmUser(ctx)

        if (!lastfmUser) return ctx.reply('Utilize o comando \'/reg usuariolastfm\' para se registrar')

        const {
            album,
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getAlbumListeningNow(lastfmUser)

        const { first_name } = ctx.update.message.from

        const text = `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:` +
        `\n💽 ${album}` +
        `\n🧑‍🎤 ${artist} \n` +
        `\n📊 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        const entities = [{
            offset: text.indexOf(first_name),
            length: first_name.length,
            type: 'bold',
        },
        {
            offset: text.indexOf(album),
            length: album.length,
            type: 'bold',
        },
        {
            offset: text.indexOf('📊'),
            length: '📊'.length,
            type: 'text_link',
            url: image
        }]

        return ctx.reply(text, { entities })

    } catch (erro) {
        console.log(erro)
        ctx.reply('Ops! Tive um problema 🥴 \nTente novamente mais tarde.')
    }
}

const art = async (ctx) => {
    ctx.replyWithChatAction('typing')

    try {
        const lastfmUser = await getLastfmUser(ctx)

        if (!lastfmUser) return ctx.reply('Utilize o comando \'/reg usuariolastfm\' para se registrar')

        const {
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getArtistListeningNow(lastfmUser)

        const { first_name } = ctx.update.message.from

        const text = `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:` +
        `\n🧑‍🎤 ${artist} \n` +
        `\n📊 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        const entities = [{
            offset: text.indexOf(first_name),
            length: first_name.length,
            type: 'bold',
        },
        {
            offset: text.indexOf(artist),
            length: artist.length,
            type: 'bold',
        },
        {
            offset: text.indexOf('📊'),
            length: '📊'.length,
            type: 'text_link',
            url: image
        }]

        return ctx.reply(text, { entities })

    } catch (erro) {
        console.log(erro)
        ctx.reply('Ops! Tive um problema 🥴 \nTente novamente mais tarde.')
    }
}

const reg = (ctx) => {
    ctx.replyWithChatAction('typing')

    const telegram_id = ctx.message.from.id
    const text = ctx.update.message.text.split(' ')
    const [command, arg] = text

    if (!arg) return ctx.reply('Utilize o comando com seu nome de usuário do LastFM \nExemplo: \'/reg usuariolastfm\' \nTente novamente, por favor.')

    setLastfmUser(telegram_id, arg)
        .then(user => {
            if (!user) return ctx.reply(`'${arg}' não parece ser um usuário do LastFM. \nTente novamente.`)
            return ctx.reply(`'${arg}' salvo como seu usuário do LastFM`)
        })
        .catch(erro => {
            console.log(erro)
            ctx.reply('Ops! Tive um problema 🥴 \nTente novamente mais tarde.')
        })
}


module.exports = {
    ln,
    alb,
    art,
    reg
}