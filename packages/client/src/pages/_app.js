import { useState } from 'react';
import Head from 'next/head';
import useWebSocket from '@/lib/util/useWebSocket.js'; 
import { ErrorBoundary } from 'react-error-boundary';

import { useFetchChat, useListenChat, useIsTyping } from '@/util/chatHooks.js';
import useSoundNotification from '@/util/useSoundNotification.js';

import Fallback from '@/components/Error/Fallback.jsx';
import { handleRuntimeError } from '@/util/handleError.js';

import '@/styles/globals.css'

const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
const IS_TYPING_DELAY = 3500;

export default function App({ Component, pageProps }) {
  const [connected, message, send] = useWebSocket(wsUrl);

  // Chat state
  const [ searching, setSearching ] = useState(false);
  /* Room state:
     * - missing: the user is not in any room
     * - active: the user is in a room together with another user
     * - inactive: the user is in a room, but another user has left
     * - retired: the user has just left the room
     *     - on server, the room is `missing`, so on client page refresh would show the start screen
     *     - use this extra state on client s.t. the chat is visible after leaving it
     */
  const [ room, setRoom ] = useState();
  const [ messages, setMessages ] = useState([]);

  const [ searchSettings, setSearchSettings ] = useState({
    adultMode: false,
    myGender: 'unspecified',
    theirGender: 'female'
  });

  useFetchChat({
    shouldFetch: connected,
    apiUrl: apiUrl,
    setSearching: setSearching,
    setRoom: setRoom,
    setMessages: setMessages,
  });

  useListenChat({
    message: message,
    setSearching: setSearching,
    room: room,
    setRoom: setRoom,
    setMessages: setMessages,
  });

  const isTyping = useIsTyping(message, IS_TYPING_DELAY);
  useSoundNotification(message, room);

  console.log('_app.js');

  return (
    <>
      <Head>
        <title>Правда или Чат</title>
        <meta name="description" content='Анонимный чат с вопросами в стиле игры "Правда или Действие"' />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <ErrorBoundary
        FallbackComponent={Fallback}
        onError={handleRuntimeError}
      >
        <Component 
          { ...pageProps }
          ready={connected} 
          send={send} 
          searching={searching} 
          searchSettings={searchSettings}
          setSearchSettings={setSearchSettings}
          room={room} 
          setRoom={setRoom}
          messages={messages} 
          isTyping={isTyping}
        />
      </ErrorBoundary>
    </>
  );
}
