const { client, connect } = require('../redis.js')
const { Queue, User, Room, Game } = require('../model.js')

const messages = [
    { text: 'hello', dt: 1 },
    { text: 'world', dt: 2 }
]

const question = { text: 'Eh?', dt: 3}

const init = async () => {
    let u1 = new User('1')
    let u2 = new User('2')

    await connect()
    await client.flushDb()

    // User: online
    let isOnline = await u1.online
    console.assert(!isOnline, 'User must be offline', isOnline)
    u1.online = true
    isOnline = await u1.online
    console.assert(isOnline, 'User must be online', isOnline)
    u1.online = false
    isOnline = await u1.online
    console.assert(!isOnline, 'User must be offline #2', isOnline)

    const q = new Queue(async (room) => {
        // Room: id, users; Queue push and init room
        console.assert(room.id == '1:2', 'Room id should be correct', room.id)
        const [ user1, user2 ] = room.users
        console.assert(user1.equals(u1), 'Users should be equal #1', JSON.stringify(user1), JSON.stringify(u1))
        console.assert(user2.equals(u2), 'Users should be equal #2', JSON.stringify(user2), JSON.stringify(u2))

        // User: isSearching #2
        const isSearching2 = await q.isEnqueued(u1)
        console.assert(!isSearching2, 'User search status should be false', isSearching2)

        // User: room (i.e. room is created properly)
        const r1 = await user1.room
        const r2 = await user2.room

        console.assert( r1.equals(r2) && r1.equals(room), 
            'Rooms should be equal',
            JSON.stringify(r1), 
            JSON.stringify(r2), 
            JSON.stringify(room))

        // Room: getMessages, saveMessage, replaceMessage
        console.assert((await room.getMessages()).length === 0, 'getMessages() must return an empty array when no messages have been saved')

        messages.forEach(m => room.saveMessage(m))
        const savedMessages = await room.getMessages()
        console.assert(savedMessages[0].dt === messages[1].dt, 'Messages should be saved', savedMessages)

        room.replaceMessage(messages[0], { ...messages[0], text: 'Hello' })
        const savedMessages2 = await room.getMessages()
        console.assert(savedMessages2[1].text === 'Hello', 'Message should be replaced', savedMessages2)

        // Game: set/get activePlayer, set/get question
        const game = room.game
        game.activePlayer = user1
        game.question = question

        const gameQuestion = await game.question
        const gamePlayer = await game.activePlayer

        // console.log(`game:${room.id}`)
        // let gameData = await client.hGetAll(`game:${game.id}`)
        // console.log('Game Data:')
        // console.log(gameData)
        // console.log("Game player:")
        // console.log(gamePlayer)

        console.assert(gameQuestion.dt === 3, 'Game question should be set', gameQuestion)
        console.assert(gamePlayer.equals(user1), 'Game player should be set', gamePlayer)

        game.question = null
        game.activePlayer = null

        console.assert((await game.question) === null, 'Game question should be unset')
        console.assert((await game.activePlayer) === null, 'Game player should be unset')

        // Room: retire

        // set some values s.t. the game key is present
        game.activePlayer = user1
        game.question = question

        let roomExists = (await client.exists(`room:${room.id}`)) > 0
        let gameExists = (await client.exists(`game:${game.id}`)) > 0

        console.assert(roomExists, 'Room should be present in Redis', roomExists)
        console.assert(gameExists, 'Game should be present in Redis', gameExists)

        room.retire()

        roomExists = (await client.exists(`room:${room.id}`)) > 0
        gameExists = (await client.exists(`game:${room.id}`)) > 0

        console.assert(roomExists, 'Room should not be deleted yet', roomExists)
        console.assert(gameExists, 'Game should not be deleted yet', gameExists)

        await (new Promise((resolve) => {
            setTimeout(async () => {
                roomExists = (await client.exists(`room:${room.id}`)) > 0
                gameExists = (await client.exists(`game:${room.id}`)) > 0
                console.assert(!roomExists, 'Room should be deleted', roomExists)
                console.assert(!gameExists, 'Game should be deleted', gameExists)
                resolve(true)
            }, 5*1000)
        }))

        console.log('Tests finished')
    })

    q.push(u1)
    // user: isSearching
    const isSearching = await q.isEnqueued(u1)
    console.assert(!!isSearching, 'User search status should be true', isSearching)
    q.push(u2)
}

init()
