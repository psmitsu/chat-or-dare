import PropTypes from 'prop-types'

import { makeFindChat, makeCancelFindChat } from '@/util/messages.js'
import SpinningFrame from '@/lib/components/SpinningFrame.jsx'

import styles from './FindChatButton.module.css'

export default function FindChatButton({
    ready,
    searching,
    searchSettings,
    send,
    containerClassName,
}) {
    function handleStartClick() {
        if (ready) {
            send(makeFindChat(searchSettings))
        }
    }

    function handleStopClick() {
        if (ready) {
            send(makeCancelFindChat())
        }
    }

    return (
        <>
            <SpinningFrame
                on={searching}
                padding='3px'
                borderRadius='18px'
                spinnerColor='lightgrey'
                className={containerClassName || ''}
            >
                {!searching ?
                    <button 
                        onClick={handleStartClick} 
                        className={styles.button}
                    >
                        Найти Чат
                    </button> :
                        <button
                            onClick={handleStopClick}
                            className={`${styles.button} ${styles.stop}`}
                        >
                            Стоп Поиск
                        </button>
                }
            </SpinningFrame>
        </>
    );
}
