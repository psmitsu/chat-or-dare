import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';

import FadeInOut from '@/lib/components/FadeInOut.jsx';
import Message from './Message.jsx';

import styles from './Messages.module.css';

const DELAY=500;

Messages.propTypes = {
    send: PropTypes.func.isRequired,
    messages: PropTypes.array.isRequired,
}

export default function Messages({
    send,
    messages,
    showSearchSettings,
}) {
    const [ scrollAtBottom, setScrollAtBottom ] = useState(true);
    const [ shouldScrollBottom, setShouldScrollBottom ] = useState(false);
    const [ documentVisible, setDocumentVisible ] = useState(false);

    const sortedMessages = useMemo(
        () => [...messages].sort((a,b) => a.dt - b.dt),
        [messages],
    );

    const nNewMessages = useMemo(
        () => {
            const newMessages = messages.filter(msg => msg.type === 'room.chat' && !msg.sender && !msg.isRead)
            return newMessages.length;
        },
        [messages],
    );

    const containerRef = useRef(null)

    const msgNodesRef = useRef([]);

    // resize refs array when messages change
    useEffect(() => {
        msgNodesRef.current = msgNodesRef.current.slice(0, messages.length);
    }, [messages]);

    function markAsRead(message) {
        let msgType;

        if (message.type === 'room.chat') {
            msgType = 'room.ack';
        } else if (message.type === 'game.question') {
            msgType = 'game.ack';
        } else {
            console.error('Trying to acknowledge wrong message');
        }

        const newMessage = {
            ...message,
            type: msgType, // ack_chat, ack_question
        };

        send(newMessage);
    }

    // listen if the scroll is at bottom (we can see the last message)
    useEffect(() => {
        const nodes = msgNodesRef.current;

        const observer = new IntersectionObserver(([ entry ]) => {
            if (entry.intersectionRatio > 0) {
                setScrollAtBottom(true);
            } else {
                setScrollAtBottom(false);
            }
        });

        // check if the last node is visible
        if (nodes.length > 0) {
            observer.observe(nodes[nodes.length - 1]);
            return () => observer.disconnect();
        } else {
            setScrollAtBottom(true);
        }

    }, [sortedMessages]);

    // scroll messages list to the bottom if necessary
    useEffect(() => {
        const nodes = msgNodesRef.current;
        const lastNode = nodes[nodes.length - 1];

        if (sortedMessages.length === 0) {
            return;
        }

        const lastMsg = sortedMessages[sortedMessages.length - 1];
        const lastMsgYours = lastMsg.type === 'room.chat' && lastMsg.sender;

        if (scrollAtBottom | lastMsgYours | shouldScrollBottom) {
            console.log('Scroll to last message');
            lastNode.scrollIntoView({ behavior: 'smooth' });
            setShouldScrollBottom(false);
        }
    }, [sortedMessages, shouldScrollBottom]);

    // monitor page visibility, for use in handling unread messages 
    useEffect(() => {
        const handleVisibilityChange = () => {
            setDocumentVisible(!document.hidden);
        }

        // handle visibility state on page load
        handleVisibilityChange();
        // monitor
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // handle unread messages
    useEffect(() => {
        const nodes = msgNodesRef.current;
        const nodesToUnreadMessages= new Map();

        sortedMessages
            .reduce((acc, msg,idx) => 
                (msg.type === 'room.chat' && !msg.sender && !msg.isRead) ? [ ...acc, idx] : acc, []
            ).forEach(msgIdx => 
                nodesToUnreadMessages.set(nodes[msgIdx], sortedMessages[msgIdx])
            );

        if (documentVisible) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.intersectionRatio > 0) {
                        console.log('HIT');
                        const msg = nodesToUnreadMessages.get(entry.target);
                        markAsRead(msg);
                    }
                });
            }, { root: containerRef.current, threshold: .5 });

            [...nodesToUnreadMessages.keys()].forEach(msgRef => {
                observer.observe(msgRef);
            });

            return () => observer.disconnect();
        }
    }, [sortedMessages, documentVisible]);

    const myDivRef = useRef();

    // monitor container resize and adjust scroll position
    useEffect(() => {
        let previousViewHeight = containerRef.current.clientHeight;

        const resizeObserver = new ResizeObserver(() => {
            if (!containerRef.current) {
                return;
            }

            const fullHeight = containerRef.current.scrollHeight;
            const viewHeight = containerRef.current.clientHeight;
            const delta = viewHeight - previousViewHeight;

            const remainingScroll = fullHeight - containerRef.current.scrollTop - viewHeight;
            const previousRemainingScroll = remainingScroll > 0 ? 
                remainingScroll + delta : 0;

            containerRef.current.scroll({
                top: fullHeight - previousRemainingScroll - viewHeight,
                behavior: 'smooth'
            });

            previousViewHeight = viewHeight;
        });

        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // show scroll button only when search settings (in ChatFooter) are not shown
    const [ showScrollBottom, setShowScrollBottom ] = useState(false);

    useEffect(() => {
        if (!showSearchSettings && !showScrollBottom) {
            const timeout = setTimeout(() => {
                setShowScrollBottom(true);
            }, DELAY);

            return () => clearTimeout(timeout);
        } else if (showSearchSettings && showScrollBottom) {
            setShowScrollBottom(false);
        }
    }, [showSearchSettings, showScrollBottom]);

    return (
        <>
            {nNewMessages > 0 && (
                <Head>
                    <title>({`${nNewMessages}`}) Правда или Чат</title>
                </Head>
            )}
            <div 
                ref={containerRef}
                className={styles.container}
            >
                <div 
                    className={styles.messages}
                >
                    {/* form keys preventing collision of dt */}
                    { sortedMessages.map((msg,idx) => 
                        <Message 
                            ref={node => msgNodesRef.current[idx] = node}
                            key={msg.dt + (msg.sender || msg.type)}
                            message={msg} 
                        /> 
                    ) }
                </div>
            </div>
            <FadeInOut
                isMount={!scrollAtBottom && showScrollBottom}
                baseClassName={styles.scrollBottomBtnContainer}
                inClassName={styles.in}
                outDelay={DELAY}
            >
                <button 
                    className={styles.scrollBottomBtn}
                    onClick={() => setShouldScrollBottom(true)}
                >
                    <span className={styles.scrollBottomBtnText}>↓</span>
                    {nNewMessages > 0 && (
                        <div className={styles.scrollBottomBtnNewMsg}>{nNewMessages}</div>
                    )}
                </button>
            </FadeInOut>
            <div 
                ref={myDivRef}
                style={{
                    position: 'fixed',
                    zIndex: '1000',
                    top: '15px',
                    left: '15px',
                    color: 'yellow'
                }}>
            </div>
        </>
    );
}
