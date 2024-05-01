import { useId } from 'react';

import styles from './SearchSettingsButtons.module.css';
import utilityStyles from '@/styles/utility.module.css';

export function Toggle({
    checked,
    handleChange
}) {
    const id = useId();

    return (
        <div className={styles.toggleContainer}>
            <input
                type='checkbox'
                id={id}
                className={styles.toggleCheckbox}
                checked={checked}
                onChange={handleChange}
            />
            <label
                htmlFor={id}
                className={styles.toggleLabel}
            >
                <span 
                    className={styles.toggleButton}
                />
            </label>
        </div>
    );
}

export function GenderRadio ({
    isEnabled,
    gender,
    handleSetGender,
}) {
    return (
        <div className={`${styles.radioContainer} ${isEnabled ? '' : styles.disabled}`}>
            <BasicGenderRadio 
                namePrefix='their'
                gender={gender}
                handleSetGender={handleSetGender}
            />
            <span
                className={`${styles.radioSelection} ${utilityStyles.noselect}`}
            />
        </div>
    );
}

export function OptionalGenderRadio({
    gender,
    handleSetGender,
}) {
    const unspecifiedId = useId();

    return (
        <div className={`${styles.radioContainer} ${styles.optional}`}>
            <input
                type='radio'
                id={unspecifiedId}
                name='gender'
                value='unspecified'
                className={styles.radioInput}
                checked={gender === 'unspecified'}
                onChange={() => handleSetGender('unspecified')}
            />
            <label 
                htmlFor={unspecifiedId}
                className={styles.radioLabel}
            >
                <span className={`${styles.radioLabelContent} ${styles.unspecified} ${utilityStyles.noselect}`}>?</span>
            </label>
            <BasicGenderRadio 
                gender={gender}
                handleSetGender={handleSetGender}
            />
            <span
                className={styles.radioSelection}
            />
        </div>
    );
}

function BasicGenderRadio({
    namePrefix = '',
    gender,
    handleSetGender,
} = {}) {
    const maleId = useId();
    const femaleId = useId();

    return (
        <>
            <input
                type='radio'
                id={femaleId}
                name={`${namePrefix}gender`}
                value='female'
                className={styles.radioInput}
                checked={gender === 'female'}
                onChange={() => handleSetGender('female')}
            />
            <label 
                htmlFor={femaleId}
                className={`${styles.radioLabel} ${styles.female} ${utilityStyles.noselect}`}
            >
                <span className={`${styles.radioLabelContent} ${styles.specified} ${styles.female}`} />
                <span className={`${styles.radioLabelSign} ${styles.female}`}>+</span>
            </label>

            <input
                type='radio'
                id={maleId}
                name={`${namePrefix}gender`}
                value='male'
                className={styles.radioInput}
                checked={gender === 'male'}
                onChange={() => handleSetGender('male')}
            />
            <label 
                htmlFor={maleId}
                className={`${styles.radioLabel} ${styles.male} ${utilityStyles.noselect}`}
            >
                <span className={`${styles.radioLabelContent} ${styles.specified} ${styles.male}`} />
                <span className={`${styles.radioLabelSign} ${styles.male}`}>➜</span>
            </label>
        </>
    );
}
