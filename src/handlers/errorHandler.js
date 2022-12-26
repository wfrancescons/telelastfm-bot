export default async (ctx, error, info) => {

    try {

        const isInlineQuery = ctx.update?.inline_query
        const isReply = ctx.update.message?.reply_to_message?.from.id

        switch (error) {

            case 'USER_NOT_FOUND':

                if (isInlineQuery) {
                    const response = [{
                        type: 'article',
                        id: 1,
                        title: '⚠️ User not found',
                        description: 'Use /reg to set your Lastfm\'s username',
                        input_message_content: {
                            message_text: 'Send /reg to @telelastfmbot to set your Lastfm\'s username'
                        }
                    }]

                    await ctx.answerInlineQuery(response)
                    break
                }

                if (isReply) {
                    const { first_name } = ctx.update.message.reply_to_message.from
                    ctx.replyWithMarkdown(`${first_name} needs to type \`/reg lastfmusername\` to set a Lastfm's username`)
                    break
                }

                await ctx.replyWithMarkdown('Type `/reg lastfmusername` to set your Lastfm\'s username')
                break

            case 'ZERO_SCROBBLES':
                await ctx.replyWithMarkdown(
                    'There aren\'t any scrobbles on your Lastfm. 🙁\n\n' +
                    'Is your username correct? 🤔\n' +
                    'Type `/reg lastfmusername` to set your Lastfm\'s username'
                )
                break

            case 'COMMON_ERROR':
                await ctx.reply(
                    'Something went wrong with Lastfm 🥴 \n' +
                    'But don\'t fret, let\'s give it another shot in a couple of minutes.\n' +
                    'If the issue keeps happening, contact me @telelastfmsac'
                )
                break

            case 'REG_WITHOUT_ARGS':
                await ctx.replyWithMarkdown(
                    'Type /reg with with your Lastfm\'s username. \n' +
                    'Example: `/reg lastfmusername` \n' +
                    'Please, try again 🙂'
                )
                break

            case 'ADDN_INCORRECT_ARGS':
                await ctx.replyWithMarkdown(
                    'Type /addn with artist\'s name + hyphen + artist\'s nick. \n' +
                    'Example: `/addn Taylor Swift - Queen of Pop` \n' +
                    'Please, try again 🙂'
                )
                break

            case 'ADDN_BADWORDS':
                await ctx.replyWithMarkdown(
                    'You\'re using inappropriate words 🚫\n' +
                    'Please, be kind 😉'
                )
                break

            case 'RMVN_WITHOUT_ARGS':
                await ctx.replyWithMarkdown(
                    'Type /rmvn with artist\'s name to remove artist\'s nick. \n' +
                    'Example: `/rmvn Taylor Swift` \n' +
                    'Please, try again 🙂'
                )
                break

            case 'RMVN_NICK_NOT_FOUND':
                await ctx.reply(
                    'Didn\'t find anyone with that name in my records 🤔 \n' +
                    'Please, try again 🙂'
                )
                break

            case 'STORY_INCORRECT_ARGS':
                const text =
                    'Invalid argumments 🤔\n\n' +
                    '✅ Valid Media Types: `tracks`, `albums`, `artists`\n' +
                    '✅ Valid Periods: `overall`, `7day`, `1month`, `3month`, `6month`, `12month`\n\n' +
                    'Type `/story mediatype period` to generate a collage\n' +
                    'or `/story mediatype` to generate a image of your latest scrobble.\n' +
                    '➡️ Examples: `/story album 1month` or `/story track`'

                await ctx.replyWithMarkdown(text)
                break

            case 'NOT_A_VALID_LASTFM_USER':
                await ctx.reply(
                    `'${info}' doesn't seem to be a valid Lastfm's username 🤔 \n` +
                    `Please, try again 🙂`
                )
                break

            case 'CANNOT_SEND_MEDIA_MESSAGES':
                await ctx.reply(
                    'I\'m not allowed to send photos here 🚫📷 \n' +
                    'An admin needs to review my permissions'
                )
                break

            case 'PRIVATE_USER':
                await ctx.reply(
                    'Can\'t get your scrobbles 🥴\n' +
                    'Your Lastfm profile is private 🔒\n' +
                    'Go to last.fm/settings/privacy and uncheck “Hide recent listening information” to use this bot.'
                )
                break

            default:
                console.error('Error:', error)
                await ctx.reply(
                    'Something went wrong with Lastfm 🥴 \n' +
                    'But don\'t fret, let\'s give it another shot in a couple of minutes.\n' +
                    'If the issue keeps happening, contact me @telelastfmsac'
                )
                break

        }
    } catch (error) {
        console.error(`Unknown error with ${ctx.from.id} user. Message: ${error}`)
    }
}  