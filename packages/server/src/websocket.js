const { 
    Queue, 
    User,
    RoomManager 
} = require('./model.js');

const { 
    makeWelcome,
    makeLeave, 
    makeFindChat, 
    makeCancelFindChat, 
    makeChat,
    makeRead 
} = require('./messages.js');

const {
    anonymizeMessage,
    deanonymizeMessage,
    parseAction 
} = require('./utils.js');

const { logger } = require('./logger.js');

const PING_INTERVAL_SECONDS = 30;
const DISCONNECT_TIMEOUT_SECONDS = 300;
const RETIRE_TIMEOUT_SECONDS = 300; 

// queue that matches users
const queue = new Queue(processNewRoom);

// map for keeping track of online users ( user -> ws )
const userSockets = new Map()
// keep track of disconnect handler timeouts, to prevent older disconnect handlers affecting more recent disconnects
const userTimeouts = new Map();

// ws message handlers: messages are formed as e.g. { type: 'system.find' }
const handlers = new Map()
const systemHandler = new Map()
const roomHandler = new Map()
const gameHandler = new Map()

handlers.set('system', systemHandler)
handlers.set('room', roomHandler)
handlers.set('game', gameHandler)

// Make a handler for special messages that acknowledge that another message is read
const makeProcessAcknowledge = (properType) => async (msg, user) => {
    const room = await user.room;

    if (!room) {
        logger.log({level: 'error', message: 'processAcnkowledge: user is not in a room'});
        return;
    }

    const original = deanonymizeMessage(msg, user, room);
    original.type = properType;

    // user cannot acknowledge their own messages as read
    if (user.id === msg.sender) {
        return;
    }

    const replacement = makeRead(original);

    room.messages.replace(original, replacement);
    // client should replace the message with the same id in its state
    room.users.forEach(u => send(replacement, u, (!user.equals(u)) && room));
};

// system
systemHandler.set('find', async (message, user) => {
    const isEnqueued = await queue.isEnqueued(user);

    if (isEnqueued) {
        logger.log({level: 'warn', message: `system.find: ${user.id} is enqueued already`});
        return;
    }

    queue.push(user, {
        adultMode: message?.settings?.adultMode,
        gender: message?.settings?.myGender,
        searchGender: message?.settings?.theirGender,
    });

    send(makeFindChat(), user)
});

systemHandler.set('cancel', async (message, user) => {
    const isRemoved = await queue.remove(user)
    if (isRemoved) { 
        send(makeCancelFindChat(), user)
    }
});

// TODO: check that the room is active before accepting the chat / game message

// room
roomHandler.set('chat', async (msg, user) => {
    const room = await user.room;

    if (!room) {
        logger.log({level: 'error', message: 'room.chat: user is not in a room'});
        return;
    }

    // TODO: sanitize
    const message = makeChat(msg, user); // set `datetime` and `sender`

    room.messages.save(message); // store in Redis
    room.users.forEach(u => send(message, u, (!user.equals(u)) && room));
});

roomHandler.set('ack', makeProcessAcknowledge('room.chat'));

roomHandler.set('leave', (msg, user) => {
    processLeaveRoom(user)
});

roomHandler.set('typing', async (msg, user) => {
    const room = await user.room;

    if (!room) {
        logger.log({level: 'error', message: 'room.typing: user is not in a room'});
        return;
    }

    const otherUser = room.users.filter(u => !user.equals(u))[0];

    send(msg, otherUser, room);
});

// game
gameHandler.set('ask', async (message, user) => {
    const room = await user.room;

    if (!room) {
        logger.log({level: 'error', message: 'game.ask: user is not in a room'});
        return;
    }

    const game = room.game;

    const question = await game.nextQuestion();

    if (question) {
        room.users.forEach(u => send(question, u, (!user.equals(u)) && room));
    }
});

gameHandler.set('accept', async (message, user) => {
    const room = await user.room;

    if (!room) {
        logger.log({level: 'error', message: 'game.accept: user is not in a room'});
        return;
    }

    const game = room.game;

    const modifiedQuestion = await game.acceptQuestion(user);


    if (modifiedQuestion) {
        // client should replace the message with the same id in its state
        room.users.forEach(u => send(modifiedQuestion, u, (!user.equals(u)) && room));
    }
});

// TODO: should I acknowledge game messages?
// gameHandler.set('ack', makeProcessAcknowledge('game.question'));

// Base stuff

// send a message to a user through websocket
// fromRoom - (optional, can supply false to negate) room object - send msg only if user is in this room
async function send(message, user, fromRoom) {
    if (!user) {
        logger.log({ level: 'error', message: 'send: Trying to send message, but user is missing' });
        return;
    }

    // logger.log({ level: 'info', message: `Sending ${JSON.stringify(message)} to ${user.id}` });

    if (fromRoom) {
        const room = await user.room;
        if (!room || !room.equals(fromRoom)) {
            logger.log({ level: 'warn', message: `send: Trying to send ${JSON.stringify(message)} to ${user.id} but they are not in a related room.` });
            return;
        }
    }

    const ws = userSockets.get(user.id);

    const anonymizedMessage = anonymizeMessage(message, user);

    if (ws) {
        const payload = JSON.stringify(anonymizedMessage);
        ws.send(payload);
        // logger.log({ level: 'info', message: `send: Sent ${payload} to user ${user.id}`});
    } else {
        logger.log({ level: 'warn', message: `send: Missing websocket for ${user.id}` });
    }
}

// room enter
function processNewRoom(room) {
    const msg = makeWelcome()
    room.messages.save(msg)
    room.users.forEach(user => send(msg, user))
    
    logger.log({ level: 'info', message: `processNewRoom: ${room.id}` });
}

// room exit
async function processLeaveRoom(user) {
    logger.log({ level: 'info', message: `processLeaveRoom: User ${user.id}` });
    const room = await user.room;

    if (!room) {
        logger.log({level: 'error', message: 'processLeaveRoom: user is not in a room'});
        return;
    }

    // notify room members and mark the room for deletion
    if (room) {
        const msg = makeLeave(user);
        room.messages.save(msg);
        room.users.forEach(u => send(msg, u, (!user.equals(u)) && room));
        RoomManager.retire(room, RETIRE_TIMEOUT_SECONDS);

        // logging
        const game = room.game;
        const nMessages = await room.messages.getNumber();
        const nQuestions = await game.questions.getNumber();

        logger.log({ level: 'info', message: `processLeaveRoom: room ${room.id} retired.\nMessages: ${nMessages}; Questions: ${nQuestions}.` });
    }

    // delete the room from the user's record
    user.leaveRoom();
}

// make this async so that it doesn't outrun handleDisconnect
async function handleConnect(userid, ws) {
    const user = new User(userid);
    logger.log({ level: 'info', message: `handleConnect: user ${user.id} connected`});

    userSockets.set(user.id, ws);
    user.online = true; // redis

    const timeout = userTimeouts.get(user.id);

    if (timeout) {
        clearTimeout(timeout);
        userTimeouts.delete(user.id);
    }

    return user;
}

async function handleDisconnect (user, ws) {
    const currentWs = userSockets.get(user.id);

    // Somehow 'zombie websocket' connections are created. 
    // I assume ignoring them should be fine, bc the currentWs holds the last connection
    // And the last connection has to be the one that the client is actually using
    if (typeof currentWs !== 'undefined' && ws !== currentWs) {
        logger.log({ level: 'info', message: `handleDisconnect: ${user.id} Junk websocket disconnect` });
        return;
    }

    logger.log({ level: 'info', message: `handleDisconnect: user ${user.id} is no longer connected` });

    userSockets.delete(user.id);
    user.online = false; // redis

    // if (await queue.isEnqueued(user)) {
    //     queue.remove(user);
    // }

    // wait for the user to reconnect. They may connect to another server
    const timeout = setTimeout(async () => {
        const isOnline = await user.online;

        if (isOnline) {
            logger.log({ level: 'info', message: `handleDisconnect: disconnectTimeout: user ${user.id} is connected` });
            return;
        }

        logger.log({ level: 'info', message: `handleDisconnect: disconnectTimeout: user ${user.id} has left` });

        queue.remove(user);
        processLeaveRoom(user);
    }, DISCONNECT_TIMEOUT_SECONDS * 1000);

    userTimeouts.set(user.id, timeout);
}

function handleMessage(data, user) {
    // logger.log({ level: 'info', message: `handleMessage: user ${user.id} sent ${data}` });

    let msg;

    try {
        msg = JSON.parse(data);
    } catch (error) {
        logger.log({ level: 'error', message: 'handleMessage: error parsing JSON', error: error });
    }

    const [ type, action ] = parseAction(msg);

    const handler = handlers.get(type);
    if (!handler) {
        logger.log({ level: 'error', message: `handleMessage: wrong message type ${msg}` });
        return;
    }

    const handleAction = handler.get(action);
    if (!handleAction) {
        logger.log({ level: 'error', message: `handleMessage: wrong message type.action ${msg}` });
        return;
    }

    handleAction(msg, user);
}

function handlePong(ws) {
    ws.isAlive = true;
}

async function init() {
    logger.log({ level: 'info', message: 'init ws handlers' });

    const onlineUsers = await User.getAllOnline();
    onlineUsers.forEach(handleDisconnect);

    // ping
    setInterval(function pingAll() {
    // setInterval(() => {
        [...userSockets.values()].forEach(ws => {
            if (ws.isAlive === false) return ws.terminate();

            ws.isAlive = false;
            ws.ping()
        });
    }, PING_INTERVAL_SECONDS * 1000);
}

// entry point for a websocket connection
async function handleWs(ws, req) {
    const user = await handleConnect(req.session.userid, ws);

    ws.on('close', () => handleDisconnect(user, ws));
    ws.on('message', (data) => handleMessage(data, user));
    ws.on('pong', () => handlePong(ws));
}

module.exports = {
    initWs: init,
    handleWs: handleWs,
    queue: queue,
};
