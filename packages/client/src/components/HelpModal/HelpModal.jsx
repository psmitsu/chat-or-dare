import styles from './HelpModal.module.css';

import FadeInOut from '@/lib/components/FadeInOut.jsx';

const FADEOUT_DELAY=500;

const HelpQuestionBtn = () => {
    return (
        <span className={styles.questionBtn}>
            В
        </span>
    );
}

const HelpAcceptBtn = () => {
    return (
        <span className={styles.acceptBtn}>
            <span>&#10003;</span>
        </span>
    );
}

const HelpModal = ({isShown, close}) => {
    const handleModalClick = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
    }

    return (
        <FadeInOut
            isMount={isShown}
            baseClassName={styles.overlay}
            inClassName={styles.in}
            outDelay={FADEOUT_DELAY}
            handleClick={close}
        >
            <div 
                className={styles.modal}
                onClick={handleModalClick}
            >
                <header>
                    <button 
                        onClick={close}
                    >
                        &#10005;
                    </button>
                </header>
                <h4>
                    Чат
                </h4>
                <p>
                    Когда чат начнется, ты или собеседник можете нажать на <HelpQuestionBtn/> - тогда приложение задаст кому-то из вас вопрос. Тот, кому задали - пишет ответ в чат. Другой человек читает и подтверждает, что ответ его устраивает - для этого он нажимает <HelpAcceptBtn />.
                </p>
                <h4>
                    Поиск
                </h4>
                <p>
                    Можно (только совершеннолетним!) искать чат-комнаты со взрослыми вопросами. Можно искать собеседника определенного пола: тогда нужно будет указать и свой пол.
                </p>
            </div>
        </FadeInOut>
    );
};

export { HelpQuestionBtn };
export default HelpModal;
