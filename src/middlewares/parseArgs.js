function parseArgs(ctx, next) {
    if (ctx.message?.text) {
        const args = ctx.update.message.text.split(' ')
        args.shift()
        ctx.args = args
    }
    return next()
}

export default parseArgs