const express = require('express')
const session = require('express-session')
const RedisStore = require('connect-redis').default
// const path = require('node:path')
// const cors = require('cors')

const app = express()
const exressWs = require('express-ws')(app)

const { client, connect, clearDb } = require('./redis.js')
const { User } = require('./model.js')
const { queue, initWs, handleWs } = require('./websocket.js')
const { anonymizeMessage } = require('./utils.js')
const { logger } = require('./logger.js');

const PORT = 3001

const sessionMiddleware = session({
    store: new RedisStore({ client : client }),
    resave: false,
    saveUninitialized: false,
    secret: 'keyboard cat',
    cookie: {
        path: '/',
        // sameSite: 'none',
        secure: false,
        httpOnly: true,
        expires: 24*60*60*1000,
    },
});

const authOrCreate = (req, res, next) => {
    if (!req.session.userid) {
        req.session.userid = User.createId()
    }

    next()
}

const logRequest = (req, res, next) => {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl
    // This also needs `proxy_set_header  X-Real-IP  $remote_addr;` in nginx.conf
    // const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    logger.log({ level: 'info', message: `User ${req.session.userid} requested ${fullUrl}` });
    next()
}

// const allowCORS = (req, res, next) => {
//     res.header(`Access-Control-Allow-Origin`, `http://localhost:5173`);
//     res.header(`Access-Control-Allow-Methods`, `GET,PUT,POST,DELETE`);
//     res.header(`Access-Control-Allow-Headers`, `Content-Type`);
//     next()
// }

// const corsMiddleware = cors({
//     origin: true,
//     credentials: true,
//     optionsSuccessStatus: 200
// })

async function getRoomStatus(room) {
    if (!room) {
        return 'missing';
    }

    const roomActive = await room.isActive;

    return roomActive ? 'active' : 'inactive';
}

function makeGetMessages(type) {
    if (!(type === 'chat' || type === 'game')) {
        throw new Error('Trying to create a message handler for unknown type ' + type);
    }

    return async (req, res) => {
        const user = new User(req.session.userid);
        const room = await user.room;

        if (!room) {
            logger({ level: 'error', message: 'getMessages: room is missing' });
            // TODO: proper response
            return;
        }

        let msgList;

        if (type === 'chat') {
            msgList = room.messages;
        } else if (type === 'game') {
            const game = room.game;
            msgList = game.questions;
        }

        const offset = parseInt(req.params.offset);
        const messages = (await msgList.getList(offset)).map(msg => anonymizeMessage(msg, user));

        return res.json({
            messages: messages,
        });
    }
}

const init = async () => {
    await connect()
    // await clearDb()

    initWs();

    // app.use(corsMiddleware)
    app.use(sessionMiddleware)
    app.use(authOrCreate)
    app.use(logRequest)

    // Serve frontend from here in DEV to not bother with cookies and CORS issues
    // app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))

    app.get('/me', async (req, res) => {
        const user = new User(req.session.userid);

        // check if the user is in a room and the room's status
        const room = await user.room;
        const roomStatus = await getRoomStatus(room);

        // check if the user is searching for a chat
        const isSearching = await queue.isEnqueued(user);

        return res.json({
            searching: isSearching,
            room: roomStatus,
        });
    });

    app.get('/chat/:offset', makeGetMessages('chat'));
    app.get('/game/:offset', makeGetMessages('game'));

    app.ws('/ws', handleWs);

    app.listen(PORT);

    console.log(`App listening on ${PORT}`);
}

init()
