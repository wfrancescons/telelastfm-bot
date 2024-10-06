import config from '../config.js'
import { canSendMessage } from '../helpers/chatHelper.js'
import createEntity from '../utils/createEntity.js'
import { sendTextMessage } from '../utils/messageSender.js'

export default async function (ctx, error, info) {

    const extras = {
        reply_to_message_id: ctx.message?.message_id,
        entities: []
    }

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
                            message_text: `⚠️ Send /setlf to @${config.bot.username.replace('@', '')} to set your Lastfm\'s username`
                        }
                    }]

                    await ctx.answerInlineQuery(response)
                    break
                }

                const command = '/setlf lastfmusername'
                let message = `Type ${command} to set your Lastfm's username`

                if (isReply) {
                    const { first_name } = ctx.update.message.reply_to_message.from
                    message = `${first_name} needs to type ${command} to set a Lastfm's username`
                    extras.entities.push(createEntity(message.indexOf(first_name), first_name.length, 'bold'))
                }

                extras.entities.push(createEntity(message.indexOf(command), command.length, 'code'))

                await sendTextMessage(ctx, message, extras)
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

                const command = '/setlf lastfmusername'
                let message = `There aren't any scrobbles in your Lastfm. 🙁\n\n` +
                    `Is your username correct? 🤔\n` +
                    `Type ${command} to set your Lastfm's username`

                if (isReply) {
                    const { first_name } = ctx.update.message.reply_to_message.from
                    message = `There aren't any scrobbles in ${first_name}'s Lastfm. 🙁`
                    extras.entities.push(createEntity(message.indexOf(first_name), first_name.length, 'bold'))
                }

                extras.entities.push(createEntity(message.indexOf(command), command.length, 'code'))

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'REG_WITHOUT_ARGS': {
                const example = '/setlf lastfmusername'
                let message = `Type /setlf with with your Lastfm's username.\n` +
                    `\n➡️ Example: ${example}\n` +
                    `\nPlease, try again 🙂`

                extras.entities.push(createEntity(message.indexOf(example), example.length, 'code'))

                await sendTextMessage(ctx, message, extras)
                break
            }

            case 'CUSTOM_ARTIST_NOT_FOUND': {
                const example = '/artlf Taylor Swift'
                let message = `I can't find any artist with that name. Did you type it correctly? 🤔\n` +
                    `➡️ Example: ${example} \n` +
                    `Please, try again 🙂`

                extras.entities.push(createEntity(message.indexOf(example), example.length, 'code'))

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'CUSTOM_ALBUM_NOT_FOUND': {
                const correct_format = `album's name - artist's name`
                const example = '/alblf Chromatica - Lady Gaga'
                let message = `I can't find any albums by this artist. Did you type it correctly? 🤔\n` +
                    `Type like this: ${correct_format}\n` +
                    `\n➡️ Example: ${example} \n` +
                    `\nPlease, try again 🙂`

                extras.entities.push(createEntity(message.indexOf(correct_format), correct_format.length, 'italic'))
                extras.entities.push(createEntity(message.indexOf(correct_format), correct_format.length, 'bold'))
                extras.entities.push(createEntity(message.indexOf(example), example.length, 'code'))

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'GRID_INCORRECT_ARGS': {
                const valid_periods = ['overall', '7day', '1month', '3month', '6month', '12month']
                const example_commands = ['/gridlf 3x3', '/gridlf 5x5 7day', '/gridlf 4x8 noplays', '/gridlf 6x7 nonames']

                const message =
                    `Invalid argumments 🤔\n\n` +
                    `✅ Type a columns x rows value greater than 0 and up to 10\n` +
                    `✅ Valid Periods: ${valid_periods.join(', ')}\n` +
                    `\n➡️ Examples:\n` +
                    `${example_commands.join('\n')}`

                for (const period of valid_periods) {
                    extras.entities.push(createEntity(message.indexOf(period), period.length, 'code'))
                }
                for (const command of example_commands) {
                    extras.entities.push(createEntity(message.indexOf(command), command.length, 'code'))
                }

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'STORY_INCORRECT_ARGS': {

                const valid_types = ['tracks', 'albums', 'artists']
                const valid_periods = ['overall', '7day', '1month', '3month', '6month', '12month']
                const example_commands = ['/storylf mediatype period', '/storylf mediatype', '/storylf album 1month', '/storylf track']

                const message =
                    `Invalid argumments 🤔\n\n` +
                    `✅ Valid Media Types: ${valid_types.join(', ')}\n` +
                    `✅ Valid Periods: ${valid_periods.join(', ')}\n` +
                    `Type ${example_commands[0]} to generate a collage\n` +
                    `or ${example_commands[1]} to generate a image of your latest scrobble.\n` +
                    `\n➡️ Examples: ${example_commands[2]} or ${example_commands[3]}`

                for (const type of valid_types) {
                    extras.entities.push(createEntity(message.indexOf(type), type.length, 'code'))
                }
                for (const period of valid_periods) {
                    extras.entities.push(createEntity(message.indexOf(period), period.length, 'code'))
                }
                for (const command of example_commands) {
                    extras.entities.push(createEntity(message.indexOf(command), command.length, 'code'))
                }

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'NOT_A_VALID_LASTFM_USER': {
                const message = `${info} doesn't seem to be a valid Lastfm's username 🤔 \n` +
                    `Please, try again 🙂`

                extras.entities.push(createEntity(0, info.length, 'bold'))

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'CANNOT_SEND_MEDIA_MESSAGES': {
                const message = `Sorry 😔\n` +
                    `I'm not allowed to send photos here 🚫📷 \n\n` +
                    `An admin needs to review my permissions`

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'PRIVATE_USER': {
                const path = 'last.fm > settings > privacy'
                const option = 'Hide recent listening information'

                const message = `Can't get your scrobbles 🥴\n` +
                    `Your Lastfm profile is private 🔒\n` +
                    `Go to ${path} and uncheck ${option} to use this bot.`

                extras.entities.push(createEntity(message.indexOf(path), path.length, 'bold'))
                extras.entities.push(createEntity(message.indexOf(path), path.length, 'italic'))

                extras.entities.push(createEntity(message.indexOf(option), option.length, 'bold'))
                extras.entities.push(createEntity(message.indexOf(option), option.length, 'italic'))

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'RANK_REGISTERED_USER': {
                const message = `You are already participating in this group's race.\n` +
                    `To exit, use /rankoutlf 😉`

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'RANK_PERSONAL_CHAT': {
                const message = `Ranking isn't available for private chats 😔\n` +
                    `Try using the command in a group`

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'RANK_USER_NOT_FOUND': {
                const message = `I couldn't find you on the runners list 🤨\n\n` +
                    `Use /rankinlf to join the race`

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'COMMON_ERROR': {
                const message = `Something went wrong with Lastfm 🥴 \n` +
                    `But don't fret, let's give it another shot in a couple of minutes.\n` +
                    `If the issue keeps happening, contact me ${config.bot.support_chat}`

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'USER_CHANGED_USERNAME': {
                const command = '/setlf lastfmusername'
                const message = `Something went wrong 🥴 \n` +
                    `I couldn't find any Lastfm user with the username you provided.\n` +
                    `Did you change your Lastfm username?\n` +
                    `Type ${command} to change your username.\n\n` +
                    `If the issue keeps happening, contact me ${config.bot.support_chat}`

                extras.entities.push(createEntity(message.indexOf(command), command.length, 'code'))

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'NOT_A_MUSIC_BOT_MESSAGE': {
                const message = `Oops 🥴\n` +
                    `\n➡️ This command is only valid for messages with music information\n` +
                    `\nPlease, try again 🙂`

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'NOT_A_REPLY_MESSAGE': {
                const message = `\n➡️ In order to use this command, you need to reply to another user's message\n` +
                    `\nPlease, try again 🙂`

                await sendTextMessage(ctx, message, extras)

                break
            }

            case 'USER_NOT_FOUND_REPLY': {
                const message = `\n➡️ In order to use this command, you need to reply to another user's message\n` +
                    `\nPlease, try again 🙂`

                await sendTextMessage(ctx, message, extras)

                break
            }

            default: {
                console.error('Error:', error)
                if (!await canSendMessage(ctx.message.chat.id, ctx.botInfo.id)) break

                const message = `Something went wrong with Lastfm 🥴 \n` +
                    `But don't fret, let's give it another shot in a couple of minutes.\n` +
                    `If the issue keeps happening, contact me ${config.bot.support_chat}`

                await sendTextMessage(ctx, message, extras)

                break
            }

        }
    } catch (error) {
        console.error(`Unknown error with ${ctx.from.id} user. Message: ${error}`)
    }
}  
