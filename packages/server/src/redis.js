const { createClient } = require('redis')

const client = createClient()

client.on('error', err => console.log('Redis Client Error', err))

module.exports = {
    connect: async () => await client.connect(),
    clearDb: async () => await client.flushDb(),
    client: client
}
