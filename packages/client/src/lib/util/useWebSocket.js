import {useRef, useState, useEffect, useCallback} from 'react'

const RECONNECT_MS_INITIAL=3000;
const RECONNECT_MS_MULTIPLIER=1.7;

export default function useWebSocket(url) {
    const wsRef = useRef()
    const [isReady, setIsReady] = useState(false)
    const [connectDelay, setConnectDelay] = useState(0);
    const [message, setMessage] = useState()

    const timeoutMsRef = useRef(0);

    useEffect(() => {
        let timeout, ws;

        // returns next msToWait
        const connect = () => {
            console.log('connect, delay:', connectDelay, 'isReady:', isReady);

            timeout = setTimeout(() => {
                console.log('connect, timeoutCallback, delay:', connectDelay, 'isReady:', isReady);
                ws = new WebSocket(url);

                ws.onopen = () => {
                    console.log('connect, OPEN, delay:', connectDelay);
                    setIsReady(true);
                    setConnectDelay(0);
                }

                ws.onclose = () => {
                    console.log('connect, CLOSE, delay:', connectDelay);
                    setIsReady(false);
                    setConnectDelay(prev => prev ? RECONNECT_MS_MULTIPLIER * prev : RECONNECT_MS_INITIAL);
                }

                ws.onmessage = (msg) => {
                    // console.log(msg)
                    setMessage(msg);
                }

                // test
                // window.myWS = ws
                wsRef.current = ws;
            }, connectDelay);
        }

        if (!isReady) {
            connect();
        }

        return () => {
            console.log('useWebSocket useEffect cleanup');
            clearTimeout(timeout);
        }
    }, [isReady, connectDelay]);

    const send = useCallback(msgObj => {
        wsRef.current?.send(JSON.stringify(msgObj))
    }, [isReady])

    return [isReady, message, send]
}
