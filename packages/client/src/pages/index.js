import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import HelpModal, { HelpQuestionBtn } from '@/components/HelpModal/HelpModal.jsx';
import SearchSettings from '@/components//SearchSettings/SearchSettings.jsx';
import FindChatButton from '@/components/Buttons/FindChatButton.jsx';
import DotsAnimation from '@/lib/components/DotsAnimation.jsx';

import styles from '@/styles/Home.module.css';
import utilityStyles from '@/styles/utility.module.css';

export default function Home({
    ready,
    searching,
    searchSettings,
    setSearchSettings,
    room,
    send,
}) {
    const [showHelp, setShowHelp] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (room && room !== 'missing') {
            router.push('/chat');
        }
        // throw new Error('Test Error');
    }, [room]);

    const handleAClick = (evt) => {
        evt.preventDefault();
        setShowHelp(prev => !prev);
    }

    //console.log('index.js');

    return (
        <>
            <div className={styles.container}>
                <h1 className={`${styles.title} ${utilityStyles.noselect}`}>Правда или Чат</h1>
                <p className={`${styles.connection} ${ready ? '' : styles.shown}`}>
                    Соединение
                    <DotsAnimation className={utilityStyles.absolute} />
                </p>
                <p className={styles.desc}>
                    Анонимный чат с вопросами в стиле игры &quot;Правда или Действие&quot;. Начинай чат и нажимай на <HelpQuestionBtn />, чтобы задать случайный вопрос. <a onClick={handleAClick}>Подробнее</a>
                </p>
                <div className={styles.controls}>
                    <div 
                        className={styles.startchatSettings}
                    >
                        <SearchSettings 
                            searching={searching}
                            searchSettings={searchSettings}
                            setSearchSettings={setSearchSettings}
                        />
                    </div>
                    <div className={styles.startchatButtonContainer}>
                        <FindChatButton
                            ready={ready}
                            searching={searching}
                            searchSettings={searchSettings}
                            send={send}
                        /> 
                    </div>
                </div>
                <HelpModal 
                    isShown={showHelp}
                    close={() => setShowHelp(false)}
                />
            </div>
        </>
    );
}
