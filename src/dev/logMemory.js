function logMemoryRss() {
    const memory_rss = process.memoryUsage().rss / 1024 / 1024 // em MB

    console.log(`💽 Memory Usage: ${memory_rss.toFixed(2)} MB`)
}

export { logMemoryRss }
