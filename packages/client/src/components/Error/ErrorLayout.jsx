import styles from './ErrorLayout.module.css';

const ErrorLayout = ({children}) => {
    return (
        <div className={styles.errorContainer}>
            {children}
        </div>
    );
}

export { ErrorLayout };
