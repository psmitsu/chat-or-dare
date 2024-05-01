import { useState, useEffect } from 'react';

export default function DotsAnimation({
    className,
}) {
    const [ number, setNumber ] = useState(0);

    useEffect(() => {
        const tm = setTimeout(() => {
            setNumber(n => (n + 1) % 4);
        }, 300);

        // does cleanup fire if the component is unmounted?
        return () => {
            // console.log('IsTypingIndicator useEffect cleanup');
            clearTimeout(tm);
        };
    });

    return (
        <span className={className}>
            {'...'.slice(0,number)}
        </span>
    );
}
