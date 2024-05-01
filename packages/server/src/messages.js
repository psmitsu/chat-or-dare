const { sanitise } = require('./utils.js')
const { randomUUID } = require('crypto');

// On anonymizing (see anonymizeMessage), `sender` id value is replaced with boolean, indicating whether the client recieving the message is also its sender

// system
const makeFindChat = () => {
    return ({
        type: 'system.find',
        searching: true,
    });
}

const makeCancelFindChat = () => {
    return ({
        type: 'system.cancel',
    });
}

// room
const makeWelcome = () => {
    return ({
        type: 'room.welcome',
        dt: Date.now()
    });
}

const makeLeave = (user) => {
    return ({
        type: 'room.leave',
        room: 'inactive',
        sender: user.id,
        dt: Date.now()
    });
}

const makeChat = (msg, user) => {
    return ({
        type: 'room.chat',
        text: sanitise(msg.text),
        sender: user.id,
        isRead: false,
        dt: Date.now()
    });
}

const makeRead = (msg) => {
    const newMsg = { ...msg };
    newMsg.isRead = true;
    return newMsg;
};

// game
const makeQuestion = (text, sender) => {
    return ({
        type: 'game.question',
        text: text,
        answered: false,
        sender: sender.id,
        isRead: false,
        dt: Date.now()
    });
}

const makeMarkedQuestion = (question) => {
    const newQuestion = { ...question };
    newQuestion.answered = true;
    return newQuestion;
}

module.exports = {
    makeFindChat: makeFindChat,
    makeCancelFindChat: makeCancelFindChat,
    makeWelcome: makeWelcome,
    makeLeave: makeLeave,
    makeChat: makeChat,
    makeRead: makeRead,
    makeQuestion: makeQuestion,
    makeMarkedQuestion: makeMarkedQuestion,
}
