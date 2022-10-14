export default async (ctx, errorCode, info) => {
  try {

    switch (errorCode) {

      case 'NOT_A_LASTFM_USER':
        await ctx.replyWithMarkdown("Type `/reg lastfmusername` to set your Lastfm's username")
        break

      case 'ZERO_SCROBBLES':
        await ctx.replyWithMarkdown("There aren't any scrobbles on your lastFM. 🙁\n\nIs your username correct? 🤔\nType `/reg lastfmusername` to set your Lastfm's username")
        break

      case 'COMMON_ERROR':
        await ctx.reply("Something went wrong 🥴 \nBut don't fret, let's give it another shot in a couple of minutes.")
        break

      case 'REG_WITHOUT_ARGS':
        await ctx.replyWithMarkdown('Type /reg with with your Lastfm\'s username. \nExample: `/reg lastfmusername` \nPlease, try again 🙂')
        break

      case 'ADDN_INCORRECT_ARGS':
        await ctx.replyWithMarkdown("Type /addn with artist's name + hyphen + artist's nick. \nExample: `/addn Taylor Swift - Queen of Pop` \nPlease, try again 🙂")
        break

      case 'RMVN_WITHOUT_ARGS':
        await ctx.replyWithMarkdown('Type /rmvn with artist\'s name to remove artist\'s nick. \nExample: `/rmvn Taylor Swift` \nPlease, try again 🙂')
        break

      case 'RMVN_NICK_NOT_FOUND':
        await ctx.reply('Didn\'t find anyone with that name in my records 🤔 \nPlease, try again.')
        break

      case 'STORY_INCORRECT_ARGS':
        const text =
          'Invalid argumments 🤔\n' +
          'Type `/story mediatype period` to generate your collage.\n' +
          '➡️ Example: `/story tracks 7day`\n\n' +
          '✅ Valid Media Types: `tracks`, `albums`, `artists`\n' +
          '✅ Valid Periods: `overall`, `7day`, `1month`, `3month`, `6month`, `12month`'

        await ctx.replyWithMarkdown(text)
        break

      case 'NOT_A_VALID_LASTFM_USER':
        await ctx.reply(`'${info}' doesn't seem to be a valid Lastfm's username 🤔 \nPlease, try again`)
        break

      case 'CANNOT_SEND_MEDIA_MESSAGES':
        await ctx.reply(`I'm not allowed to send photos here 🚫📷 \nAn admin needs to review my permissions`)
        break

      default:
        await ctx.reply("Something went wrong 🥴 \nBut don't fret, let's give it another shot in a couple of minutes.")

        console.error(`Unknown error with ${ctx.from.id} user`)

        break

    }
  } catch (error) {

    console.log(error)

  }
}
