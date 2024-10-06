function ignoreChannelMessage(ctx, next) {
    if (ctx.message) {
        const isFromChannel = ctx.message.chat?.type === 'channel'
        const isForwardedFromChannel = ctx.message.forward_from_chat?.type === 'channel'

        if (isFromChannel || isForwardedFromChannel) {
            return
        }
    }

    return next()
}

export default ignoreChannelMessage