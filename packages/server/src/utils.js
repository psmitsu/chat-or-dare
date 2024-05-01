const chooseRandomly = (array) => array[Math.floor(Math.random() * array.length)]

const sanitise = (text) => {
  let sanitisedText = text;

  if (text.indexOf('<') > -1 || text.indexOf('>') > -1) {
    sanitisedText = text.replace(/</g, '&lt').replace(/>/g, '&gt');
  }

  return sanitisedText;
};

// (de)anonymizeMessage are kinda bad
// I store messsages in Redis ordered set, s.t. I easily retrieve them sorted by timestamp
// I deanonymize message in order to replace them in this set
// A cleaner way would be some sort of retrieval by key, but Redis sorted set doesn't allow that

const anonymizeMessage = (msg, user) => {
    const newMsg = { ...msg }

    if (newMsg.sender) {
        newMsg.sender = msg.sender === user.id
    }

    return newMsg
}

const deanonymizeMessage = (msg, user, room) => {
    const newMsg = { ...msg };

    if ('sender' in msg) {
        const intendedUser = msg.sender ? user : room.users.find(u => !u.equals(user));
        newMsg.sender = intendedUser.id;
    }

    return newMsg;
}

// get action string from the message
const parseAction = (message) => {
    const { type = null } = message;

    if (!type) {
        console.error('WS message does not have type specified');
        return null;
    }

    return type.split('.')
};

module.exports = {
    chooseRandomly: chooseRandomly,
    sanitise: sanitise,
    anonymizeMessage: anonymizeMessage,
    deanonymizeMessage: deanonymizeMessage,
    parseAction: parseAction,
}
