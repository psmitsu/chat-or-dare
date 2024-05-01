import { useState } from 'react';
import PropTypes from 'prop-types';

import HelpModal from '@/components/HelpModal/HelpModal.jsx';
import { makeLeave } from '@/util/messages.js';
import DotsAnimation from '@/lib/components/DotsAnimation.jsx';

import styles from './ChatNav.module.css';
import utilityStyles from '@/styles/utility.module.css';

ChatNav.propTypes = {
    ready: PropTypes.bool.isRequired,
    send: PropTypes.func.isRequired,
    room: PropTypes.string.isRequired,
    setRoom: PropTypes.func.isRequired,
}

export default function ChatNav({
    ready,
    send,
    room,
    setRoom,
    isTyping,
}) {
    const [ showHelp, setShowHelp ] = useState(false);

    function handleLeaveClick(e) {
        e.preventDefault()
        send(makeLeave())
    }

    function handleCloseClick(e) {
        e.preventDefault();
        if (room === 'inactive') {
            send(makeLeave());
        }
        setRoom('missing')
    }

    return (
        <div className={styles.container}>
            <div className={styles.chatnav}>
                <div className={styles.left}>
                    <button onClick={() => setShowHelp(true)}>
                        ?
                    </button>
                </div>
                <div className={styles.center}>
                    <div className={styles.logo}>Правда или Чат</div>
                    <div className={styles.status}>
                        <ChatnavStatus 
                            ready={ready}
                            room={room}
                            isTyping={isTyping}
                        />
                    </div>
                </div>
                <div className={styles.right}>
                    {room === 'active' ?
                        <button onClick={handleLeaveClick}>
                            &#10005;
                        </button> :
                            <button onClick={handleCloseClick}>
                                &#8962;
                            </button>
                    }
                </div>
            </div>
            <HelpModal isShown={showHelp} close={() => setShowHelp(false)}/>
        </div>
    );
}

function ChatnavStatus({
    ready,
    room,
    isTyping,
}) {
    if (!ready) {
        return <>Соединение<DotsAnimation className={utilityStyles.absolute} /></>
    }

    if (room === 'active') {
        return (
            <>
                { isTyping ?  
                    <span>
                        Собеседник печатает
                        <DotsAnimation className={utilityStyles.absolute}/>
                    </span>
                    : 'Собеседник онлайн' 
                }
            </>
        );
    }

    return <>Cобеседник оффлайн</>;
}
