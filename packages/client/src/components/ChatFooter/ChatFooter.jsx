import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';

import AutoresizeTextarea from '@/lib/components/AutoresizeTextarea.jsx';
import useMobileCheck from '@/lib/util/useMobileCheck.js';
import FadeInOut from '@/lib/components/FadeInOut.jsx';
import SendIconSVG from '@/lib/components/SendIconSVG.jsx';
import CheckMarkIconSVG from '@/lib/components/CheckMarkIconSVG.jsx';

import FindChatButton from '@/components/Buttons/FindChatButton.jsx';
import SearchSettings from '@/components/SearchSettings/SearchSettings.jsx';
import { makeChat, makeTyping, makeQuestion, makeAccept } from '@/util/messages.js';

import styles from './ChatFooter.module.css';

const SEND_TYPING_DELAY = 2000;

const DELAY = 500;
const SEND_COLOR = 'rgba(255, 255, 255, 0.87)'

const fadeInOutProps = {
    inClassName: styles.in,
    outDelay: DELAY,
};

export default function ChatFooter({
    ready,
    send,
    room,
    searching,
    searchSettings,
    setSearchSettings,
    showSearchSettings,
    setShowSeachSettings,
    canQuestion,
    canAccept,
}) {
    const [value, setValue] = useState("");
    const [justSent, setJustSent] = useState(false); // is this leftover junk?
    // const [showSearchSettings, setShowSeachSettings] = useState(false);

    const [ sendTypingLocked, setSendTypingLocked ] = useState(false);
    const sendTypingLockTimeoutRef = useRef();

    const textAreaRef = useRef(null);
    const isMobile = useMobileCheck();

    function sendChatMessage() {
        if (value === '') {
            console.error('Message is empty');
            return;
        }

        if (ready) {
            send(makeChat(value));
            setValue("");
            setJustSent(true);
        }
    }

    // send "is typing" message when value changes

    function sendTyping() {
        if (!sendTypingLocked) {
            send(makeTyping());
            // console.log('User is typing');

            setSendTypingLocked(true);
            clearTimeout(sendTypingLockTimeoutRef.current);
            sendTypingLockTimeoutRef.current = setTimeout(
                () => setSendTypingLocked(false),
                SEND_TYPING_DELAY,
            );
        }
    }

    // Focus on textarea upon keypress; send message on enter (in desktops)
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.defaultPrevented) {
                return; // do nothing if the event is already processed;
            }

            // this seems to be a decent check that a character belongs to printable range
            if (event.key.length === 1 && !event.ctrlKey) {
                // console.log('window listener');
                // will that always result in handle change?
                textAreaRef.current.focusTextArea();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    const shouldCollapse = canQuestion || canAccept || value !== '';

    return (
        <div className={styles.container}>
            {room === 'active' ? 
                <div className={styles.chatfooter}>
                    <div className={`${styles.messageformContainer} ${shouldCollapse ? styles.collapsed : ''}`}>
                        <AutoresizeTextarea 
                            className={styles.messageformTextarea}
                            ref={textAreaRef}
                            placeholder="Сообщение"
                            value={value}
                            onKeyDown={(e) => {
                                // console.log('txArea.onKeyDown');
                                if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
                                    event.preventDefault();
                                    sendChatMessage();
                                }
                                event.stopPropagation();
                            }}
                            onChange={(e) => {
                                // console.log('txArea.onChange');
                                sendTyping();
                                setValue(e.target.value);
                            }}
                        />
                    </div>
                    <div className={styles.controls}>
                        <FadeInOut
                            isMount={canQuestion}
                            baseClassName={styles.btnContainer}
                            {...fadeInOutProps}
                        >
                            <button 
                                className={styles.question}
                                onClick={() => 
                                        ready && send(makeQuestion())
                                }
                            >
                                <span className={styles.btnSpan}>В</span>
                            </button>
                        </FadeInOut>
                        <FadeInOut
                            isMount={canAccept}
                            baseClassName={styles.btnContainer}
                            {...fadeInOutProps}
                        >
                            <button 
                                className={styles.accept}
                                onClick={() => 
                                        ready && send(makeAccept())
                                }
                            >
                                <div className={styles.btnSvgContainer}>
                                    <CheckMarkIconSVG />
                                </div>
                            </button>
                        </FadeInOut>
                        {/* Unmount send button immediately if the message is just sent */}
                        <FadeInOut
                            isMount={value !== ''}
                            baseClassName={styles.btnContainer}
                            {...fadeInOutProps}
                        >
                            <button 
                                className={styles.send}
                                onClick={() => 
                                        sendChatMessage()
                                }
                            >
                                <div className={styles.btnSvgContainer}>
                                    <SendIconSVG 
                                        color={SEND_COLOR}
                                    />
                                </div>
                            </button>
                        </FadeInOut>
                    </div>
                </div>
                : <div className={styles.inactive}>
                    <div className={styles.inactiveRow}>
                            <FindChatButton 
                                ready={ready}
                                searching={searching}
                                searchSettings={searchSettings}
                                send={send}
                            />
                            <div className={styles.inactiveSettingsBtnContainer}>
                                <button
                                    className={styles.inactiveSettingsBtn}
                                    onClick={() => setShowSeachSettings(prev => !prev)}
                                >
                                    <span>⚙</span>
                                </button>
                            </div>
                    </div>
                    <FadeInOut
                        isMount={showSearchSettings}
                        baseClassName={styles.searchSettingsContainer}
                        inClassName={styles.in}
                        outDelay='350'
                    >
                        <div>
                            <SearchSettings 
                                searching={searching}
                                searchSettings={searchSettings}
                                setSearchSettings={setSearchSettings}
                            />
                        </div>
                    </FadeInOut>
                </div>
            }
        </div>
    );
}
