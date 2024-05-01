import { useState } from 'react';

import { Toggle, GenderRadio, OptionalGenderRadio } from '@/components/Buttons/SearchSettingsButtons.jsx';

import styles from './SearchSettings.module.css';
import utilityStyles from '@/styles/utility.module.css';

export default function SearchSettings({
    searching,
    searchSettings,
    setSearchSettings
}) {
    const { adultMode, myGender, theirGender } = searchSettings;

    return (
        <div className={`${styles.container} ${searching ? styles.inactive : ''}`}>
            <div className={styles.item}>
                <div className={`${styles.title} ${utilityStyles.noselect}`}>
                    Вопросы 18+
                </div>
            </div>
            <div className={`${styles.item} ${styles.right}`}>
                <Toggle 
                    checked={adultMode}
                    handleChange={() => setSearchSettings(
                        prevSettings => ({
                            ...prevSettings,
                            adultMode: !prevSettings.adultMode,
                        })
                    )}
                />
            </div>
            <div className={styles.item}>
                <div className={`${styles.title} ${utilityStyles.noselect}`}>
                    Мой пол
                </div>
            </div>
            <div className={`${styles.item} ${styles.right}`}>
                <OptionalGenderRadio 
                    gender={myGender}
                    handleSetGender={gender => setSearchSettings(
                        prevSettings => ({ 
                            ...prevSettings, 
                            myGender: gender 
                        })
                    )}
                />
            </div>
            <div className={styles.item}>
                <div className={`${styles.title} ${utilityStyles.noselect}`}>
                    Пол собеседника
                </div>
            </div>
            <div className={`${styles.item} ${styles.right}`}>
                <GenderRadio 
                    isEnabled={myGender !== 'unspecified'}
                    gender={theirGender}
                    handleSetGender={gender => setSearchSettings(
                        prevSettings => ({ 
                            ...prevSettings, 
                            theirGender: gender 
                        })
                    )}
                />
            </div>
            {searching && (
                <div className={styles.cover}>
                </div>
            )}
        </div>
    );
}
