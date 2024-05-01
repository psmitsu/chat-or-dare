import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types'

import styles from "./Message.module.css"

import BasicMessage from './BasicMessage.jsx'

const MessageMeta = ({ isReadShown, isRead, dt }) => (
    <span className={styles.meta}>
        <span>
            {dt.getHours()}:{('0'+dt.getMinutes()).slice(-2)}
        </span>
        { isReadShown && 
                (<span className={styles.deliveryStatus}>
                    {isRead ? '✓✓' : '✓'}
                </span>)
        }
    </span>
);

const Message = forwardRef(({message}, ref) => {
    let className, contents;

    switch (message.type) {
        case 'room.welcome': {
            className = styles.system;
            contents = 'Чат начат.';
            break;
        }
        case 'room.leave': {
            className = styles.system;
            contents = message.sender ? 'Ты покинул(а) чат.' : 'Незнакомец покинул чат.';
            break;
        }
        case 'room.chat': {
            className = `${styles.chat} ${message.sender ? styles.yours : styles.theirs}`;
            const dt = new Date(message.dt);
            contents = (
                <>
                    <article>
                        {message.text}
                        <MessageMeta 
                            isReadShown={message.sender}
                            isRead={message.isRead} 
                            dt={dt}
                        />
                    </article>
                </>
            );
            break;
        }
        case 'game.question': {
            className=`${styles.question} ${message.sender ? styles.yours : styles.theirs}`;
            const dt = new Date(message.dt);
            contents=(
                <>
                    <header>
                        {message.sender ? 'Вопрос для незнакомца' : 'Вопрос для тебя'}
                    </header>
                    <article>
                        {message.text}
                    </article>
                    <footer>
                        {message.answered ? 'Ответ принят' : (message.sender ? 'Нажми галочку чтобы принять ответ' : 'Незнакомец должен принять ответ')}
                    </footer>
                    <MessageMeta
                        dt={dt}
                    />
                </>
            );
            break;
        }
        default: {
            console.error(`Message: unrecognized message: ${message}`)
            return null;
        }
    }

    return (
        <BasicMessage
            ref={ref}
            className={className}
        >
            {contents}
        </BasicMessage>
    );
});

Message.propTypes = {
    message: PropTypes.object.isRequired,
}

Message.displayName = 'Message';

export default Message;
