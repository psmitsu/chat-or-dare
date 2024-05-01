import { useState, useEffect, useRef } from 'react'

// Fetch chat state using rest api after reconnect
export function useFetchChat({ shouldFetch, apiUrl, setSearching, setRoom, setMessages }) {
    useEffect(() => {
        // AbortController prevents fetch from firing twice and creating junk session
        const controller = new AbortController();
        let ignore = false;

        const fetchStatus = async () => {
            const resp = await fetch(`${apiUrl}/me`, {
                signal: controller.signal,
            });

            // .room, .searching
            const data = await resp.json();
            return data;
        }

        const fetchMessages = async (path, offset, result = []) => {
            const resp = await fetch(`${apiUrl}/${path}/${offset}`, {
                signal: controller.signal,
            });

            // .messages
            const data = await resp.json();

            // assume that chats don't have too many messages, so we can afford to wait until all are fetched
            // TODO: implement loading messages on scroll top
            if (data.messages.length === 50) {
                return await fetchMessages(path, offset+1, [ ...data.messages, ...result ]);
            }

            return [ ...data.messages, ...result ];
        }

        const fetchEverything = async () => {
            const { room, searching } = await fetchStatus();
            let messages = [];

            if (room !== 'missing') {
                const gameMessages = await fetchMessages('game', 0);
                const chatMessages = await fetchMessages('chat', 0);
                messages = [...gameMessages, ...chatMessages];
            }

            if (!ignore) {
                console.log('fetchState:', '\nroom: ', room, '\n#messages:', messages.length, '\nsearching: ', searching);

                setSearching(searching);
                setRoom(room);
                // expecting messages to get sorted by date descending later
                setMessages(messages);
            }
        }

        // fetch current state after setting up the websocket connection
        if (shouldFetch) {
            fetchEverything();
        }

        return () => {
            ignore = true;
            controller.abort();
        }
    }, [shouldFetch]);
}

// Listen to websocket messages to update chat state
export function useListenChat({ message, setSearching, room, setRoom, setMessages }) {
    // Extra state to prevent message processing when other state pieces change
    // useEffect(fun, [message]) is advised against in React docs
    const [prevMessage, setPrevMessage] = useState(message);

    // Handle WS messages
    if (message && message !== prevMessage) {
        setPrevMessage(message);
        // console.log('Recieved message')
        // console.log(message)

        const data = JSON.parse(message.data);

        switch (data.type) {
            case 'system.find': {
                setSearching(true);
                break;
            }
            case 'system.cancel': {
                setSearching(false);
                break;
            }
            case 'room.welcome': {
                setRoom('active');
                setSearching(false);
                setMessages([data]);
                break;
            }
            case 'room.leave': {
                if (room === 'active') {
                    // timeout to allow useSoundNotification read that room === active
                    setTimeout(() => {
                        setRoom(data.sender ? 'retired' : 'inactive');
                    }, 10);
                } else {
                    break;
                }
            }
            case 'room.chat':
            case 'game.question': {
                // add or replace the message:
                // question, chat
                setMessages(old => {
                    const idx = old.findIndex(msg => msg.dt === data.dt);

                    return idx > -1 ?
                        [...old.slice(0,idx), data, ...old.slice(idx+1)]
                        :
                        [data,...old];
                });

                break;
            }
            case 'room.typing' : {
                break;
            }
            default: {
                console.error(`useChat: unknown message type: ${JSON.stringify(data)}`);
            }
        }
    }
}

export function useIsTyping(wsMessage, delay) {
    const [ isTyping, setIsTyping ] = useState(false);
    const timeoutRef = useRef();

    useEffect(() => {
        if (wsMessage) {
            const data = JSON.parse(wsMessage.data);

            if (data.type === 'room.typing') {
                !isTyping && setIsTyping(true);

                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => setIsTyping(false), delay);
            }
        }

    }, [wsMessage, delay]);

    return isTyping;
}

