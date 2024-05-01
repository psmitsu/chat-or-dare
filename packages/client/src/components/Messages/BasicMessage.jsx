import { forwardRef } from 'react';
import PropTypes from 'prop-types';

import styles from './Message.module.css';

const BasicMessage = forwardRef((props, ref) => {
    return (
        <div className={`${styles.row} ${props.className}`}
            ref={ref}
        >
            <div className={`${styles.container} ${props.className}`}
            >
                <div className={`${styles.text} ${props.className}`}>
                    {props.children}
                </div>
            </div>
        </div>
    )
})

export default BasicMessage;

BasicMessage.propTypes = {
    className: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
    ])
}

BasicMessage.displayName = 'BasicMessage';
