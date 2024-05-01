import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import ChatNav from '@/components/ChatNav/ChatNav.jsx';
import Messages from '@/components/Messages/Messages.jsx';
import ChatFooter from '@/components/ChatFooter/ChatFooter.jsx';

import styles from '@/styles/ChatRoom.module.css';

export default function ChatRoom({
    ready,
    send,
    searching,
    searchSettings,
    setSearchSettings,
    room,
    setRoom,
    messages,
    isTyping,
}) {
    const showReconnect = !ready && room === 'active' && !searching;
    const { canQuestion, canAccept } = checkQuestion(messages);

    const [ showSearchSettings, setShowSeachSettings ] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (room === 'missing') {
            router.push('/');
        }
    }, [room]);

    return (
        <div className={styles.container}>
            <div className={styles.middleColumn}>
                <ChatNav 
                    ready={ready} 
                    send={send} 
                    room={room}
                    setRoom={setRoom}
                    isTyping={isTyping}
                />
                <Messages 
                    send={send} 
                    messages={messages} 
                    showSearchSettings={room !== 'active' && showSearchSettings}
                />
                <ChatFooter 
                    ready={ready}
                    send={send} 
                    searching={searching}
                    searchSettings={searchSettings}
                    setSearchSettings={setSearchSettings}
                    showSearchSettings={showSearchSettings}
                    setShowSeachSettings={setShowSeachSettings}
                    room={room}
                    canAccept={canAccept}
                    canQuestion={canQuestion}
                />
            </div>
        </div>
    );
}

function checkQuestion(messages) {
    // messages are fetched from earliest to latest initially
    // i.e. the most recent question is the first in the array
    const lastQuestion = messages.find(msg => msg.type === 'game.question');

    // console.log('check question')
    // console.log(lastQuestion)

    // console.log(messages)

    const canQuestion = !lastQuestion || lastQuestion.answered;
    const canAccept = !canQuestion && lastQuestion.sender;
    return { canQuestion, canAccept };
}
