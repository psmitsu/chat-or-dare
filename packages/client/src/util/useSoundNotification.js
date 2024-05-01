import { useState, useEffect } from 'react';

const start = '/sound/mixkit-software-interface-start-2574.wav';
const stop = '/sound/mixkit-software-interface-back-2575.wav';
const message = '/sound/mixkit-message-pop-alert-2354.mp3';
const question = '/sound/mixkit-gaming-lock-2848.wav';
const accept = '/sound/mixkit-correct-answer-tone-2870.wav';

function play(url) {
    const audio = new Audio(url);
    audio.play();
}

export default function useSoundNotification(wsMessage, room) {
    useEffect(() => {
        if (wsMessage) {
            const data = JSON.parse(wsMessage.data);

            if (data.isRead && !(data.type === 'game.question' && data.answered)) {
                return;
            }

            switch (data.type) {
                case 'room.welcome': {
                    play(start);
                    break;
                }
                case 'room.leave': {
                    if (room === 'active' ) {
                        play(stop);
                    }
                    break;
                }
                case 'room.chat': {
                    // !data.sender && play(message);
                    play(message);
                    break;
                }
                case 'game.question': {
                    play(data.answered ? accept : question);
                    break;
                }
                case 'room.typing':
                case 'system.find':
                case 'system.cancel': {
                    // do nothing on these messages
                    break;
                }
                default: {
                    console.error(`useSoundNotification: unknown message type: ${JSON.stringify(data)}`);
                }
            }
        }
    }, [wsMessage]);
}
