import { canSendMessage } from '../helpers/chatHelper.js'

export default async function (ctx, error, info) {

    const extras = { reply_to_message_id: ctx.message?.message_id }
    const isInlineQuery = ctx.update?.inline_query
    const isReply = ctx.update.message?.reply_to_message?.from.id

    try {

        switch (error) {

            case 'USER_NOT_FOUND': {

                if (isInlineQuery) {
                    const response = [{
                        type: 'article',
                        id: 1,
                        title: '⚠️ User not found',
                        description: 'Use /setlf to set your Lastfm\'s username',
                        input_message_content: {
                            message_text: 'Send /setlf to @telelastfmbot to set your Lastfm\'s username'
                        }
                    }]

                    await ctx.answerInlineQuery(response)
                    break
                }

                if (isReply) {
                    const { first_name } = ctx.update.message.reply_to_message.from
                    ctx.replyWithMarkdown(`${first_name} needs to type \`/setlf lastfmusername\` to set a Lastfm's username`, extras)
                    break
                }

                await ctx.replyWithMarkdown('Type `/setlf lastfmusername` to set your Lastfm\'s username', extras)
                break
            }

            case 'ZERO_SCROBBLES': {

                if (isInlineQuery) {
                    const response = [{
                        type: 'article',
                        id: 1,
                        title: '⚠️ No scrobbles found',
                        description: 'There aren\'t any scrobbles in your Lastfm. 🙁',
                        input_message_content: {
                            message_text: '⚠️ No scrobbles found'
                        }
                    }]

                    await ctx.answerInlineQuery(response)
                    break
                }

                if (isReply) {
                    const { first_name } = ctx.update.message.reply_to_message.from
                    ctx.replyWithMarkdown(`There aren't any scrobbles in ${first_name}'s Lastfm. 🙁`, extras)
                    break
                }

                await ctx.replyWithMarkdown(
                    'There aren\'t any scrobbles in your Lastfm. 🙁\n\n' +
                    'Is your username correct? 🤔\n' +
                    'Type `/setlf lastfmusername` to set your Lastfm\'s username',
                    extras
                )
                break
            }

            case 'REG_WITHOUT_ARGS': {
                await ctx.replyWithMarkdown(
                    'Type /setlf with with your Lastfm\'s username. \n' +
                    'Example: `/setlf lastfmusername` \n' +
                    'Please, try again 🙂',
                    extras
                )
                break
            }

            case 'CUSTOM_ARTIST_NOT_FOUND': {
                await ctx.replyWithMarkdown(
                    'TODO: CUSTOM ERROR',
                    extras
                )
                break
            }

            case 'CUSTOM_ALBUM_NOT_FOUND': {
                await ctx.replyWithMarkdown(
                    'TODO: CUSTOM ERROR',
                    extras
                )
                break
            }

            case 'COLLAGE_INCORRECT_ARGS': {
                await ctx.replyWithMarkdown(
                    'Invalid argumments 🤔\n\n' +
                    '✅ Type a columns x rows value greater than 0 and up to 10\n' +
                    '✅ Valid Periods: `overall`, `7day`, `1month`, `3month`, `6month`, `12month`\n\n' +
                    '➡️ Examples:\n' +
                    '`/gridlf 3x3`\n' +
                    '`/gridlf 5x5 7day`\n' +
                    '`/gridlf 4x8 noplays`\n' +
                    '`/gridlf 6x7 nonames`',
                    extras
                )
                break
            }

            case 'TOP_INCORRECT_ARGS': {
                await ctx.replyWithMarkdown(
                    'Invalid argumments 🤔\n\n' +
                    '✅ Valid Media Types: `tracks`, `alb`, `art`\n' +
                    '✅ Valid Periods: `overall`, `7day`, `1month`, `3month`, `6month`, `12month`\n\n' +
                    'Type `/toplf mediatype period` to generate a collage\n' +
                    '➡️ Examples:\n' +
                    '`/toplf alb`\n' +
                    '`/toplf 7day`\n' +
                    '`/toplf tracks 1month`\n' +
                    '`/toplf alb overall`',
                    extras
                )
                break
            }

            case 'STORY_INCORRECT_ARGS': {
                await ctx.replyWithMarkdown(
                    'Invalid argumments 🤔\n\n' +
                    '✅ Valid Media Types: `tracks`, `albums`, `artists`\n' +
                    '✅ Valid Periods: `overall`, `7day`, `1month`, `3month`, `6month`, `12month`\n\n' +
                    'Type `/storylf mediatype period` to generate a collage\n' +
                    'or `/storylf mediatype` to generate a image of your latest scrobble.\n' +
                    '➡️ Examples: `/storylf album 1month` or `/storylf track`',
                    extras
                )
                break
            }

            case 'NOT_A_VALID_LASTFM_USER': {
                extras.entities = [{
                    offset: 0,
                    length: info.length,
                    type: 'bold'
                }]
                await ctx.reply(
                    `${info} doesn't seem to be a valid Lastfm's username 🤔 \n` +
                    `Please, try again 🙂`,
                    extras
                )
                break
            }

            case 'CANNOT_SEND_MEDIA_MESSAGES': {
                await ctx.reply(
                    'Sorry 😔\n' +
                    'I\'m not allowed to send photos here 🚫📷 \n\n' +
                    'An admin needs to review my permissions',
                    extras
                )
                break
            }

            case 'PRIVATE_USER': {
                await ctx.reply(
                    'Can\'t get your scrobbles 🥴\n' +
                    'Your Lastfm profile is private 🔒\n' +
                    'Go to last.fm/settings/privacy and uncheck “Hide recent listening information” to use this bot.',
                    extras
                )
                break
            }

            case 'RANK_REGISTERED_USER': {
                await ctx.reply(
                    `You are already participating in this group's race.\n` +
                    `To exit, use /rankout 😉`,
                    extras
                )
                break
            }

            case 'RANK_NO_VACANCY': {
                await ctx.reply(
                    'There are no spots left in this group\'s race 😔\n' +
                    'Someone needs to use /rankout to free new spots',
                    extras
                )
                break
            }

            case 'RANK_PERSONAL_CHAT': {
                await ctx.reply(
                    'Ranking isn\'t available for private chats 😔\n' +
                    'Try using the command in a group',
                    extras
                )
                break
            }

            case 'RANK_USER_NOT_FOUND': {
                await ctx.reply(
                    'I couldn\'t find you on the runners list 🤨\n\n' +
                    'Use /rankin to join the race',
                    extras
                )
                break
            }

            case 'COMMON_ERROR': {
                await ctx.reply(
                    'Something went wrong with Lastfm 🥴 \n' +
                    'But don\'t fret, let\'s give it another shot in a couple of minutes.\n' +
                    'If the issue keeps happening, contact me @telelastfmsac',
                    extras
                )
                break
            }

            case 'USER_CHANGED_USERNAME': {
                await ctx.replyWithMarkdown(
                    'Something went wrong 🥴 \n' +
                    'I couldn\'t find any Lastfm user with the username you provided.\n' +
                    'Did you change your Lastfm username?\n' +
                    'Type `/setlf lastfmusername` to change your username.\n\n' +
                    'If the issue keeps happening, contact me @telelastfmsac',
                    extras
                )
                break
            }

            case 'NOT_A_MUSIC_BOT_MESSAGE': {
                await ctx.replyWithMarkdown(
                    'Oops 🥴\n' +
                    '\n➡️ This command is only valid for messages with music information\n' +
                    '\nPlease, try again 🙂',
                    extras
                )
                break
            }

            case 'NOT_A_REPLY_MESSAGE': {
                await ctx.replyWithMarkdown(
                    '\n➡️ In order to use this command, you need to reply to another user\'s message\n' +
                    '\nPlease, try again 🙂',
                    extras
                )
                break
            }

            case 'USER_NOT_FOUND_REPLY': {
                await ctx.replyWithMarkdown(
                    '\n➡️ In order to use this command, you need to reply to another user\'s message.\n' +
                    '\nPlease, try again 🙂',
                    extras
                )
                break
            }

            default: {
                console.error('Error:', error)
                if (!await canSendMessage(ctx.message.chat.id, ctx.botInfo.id)) break
                await ctx.reply(
                    'Something went wrong with Lastfm 🥴 \n' +
                    'But don\'t fret, let\'s give it another shot in a couple of minutes.\n' +
                    'If the issue keeps happening, contact me @telelastfmsac',
                    extras
                )
                break
            }

        }
    } catch (error) {
        console.error(`Unknown error with ${ctx.from.id} user. Message: ${error}`)
    }
}  
