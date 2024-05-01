export function makeFindChat(searchSettings) {
    return { 
        type : 'system.find',
        settings: {
            adultMode: searchSettings.adultMode,
            myGender: searchSettings.myGender,
            theirGender: searchSettings.theirGender,
        },
    };
}

export function makeCancelFindChat() {
    return { type : 'system.cancel' };
}

export function makeChat(text) {
    return { type: 'room.chat', text: text };
}

export function makeTyping() {
    return { type: 'room.typing' };
}

export function makeLeave() {
    return { type: 'room.leave' };
}

export function makeQuestion() {
    return { type: 'game.ask' };
}

export function makeAccept() {
    return { type: 'game.accept' };
}
