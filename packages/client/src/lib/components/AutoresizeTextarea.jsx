import PropTypes from 'prop-types'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

// Adapted from https://codepen.io/datwood/pen/MrxLMv

const AutoresizeTextarea = forwardRef(
    ({
        placeholder,
        value,
        onKeyDown,
        onChange,
        className,
    }, ref) => 
    {
        const txRef = useRef();
        const measureRef=  useRef();

        useEffect(() => {

            const getMeasuredHeight = () => {
                const parentStyles = window.getComputedStyle(txRef.current);

                // placing `.` to workaround height calculation for empty string or string ending with newline
                const lastChar = value.slice(-1);
                measureRef.current.innerText = lastChar === '\n' || lastChar === '' ? `${value}.` : value;

                Object.assign(measureRef.current.style, {
                    position: "absolute",
                    visibility: "hidden",
                    display: 'block',
                    width: parentStyles.width,
                    boxSizing: parentStyles.boxSizing,
                    fontFamily: parentStyles.fontFamily,
                    fontWeight: parentStyles.fontWeight,
                    fontSize: parentStyles.fontSize,
                    overflowWrap: parentStyles.overflowWrap,
                    wordWrap: parentStyles.wordWrap,
                    hyphens: parentStyles.hyphens,
                    letterSpacing: parentStyles.letterSpacing,
                    lineHeight: parentStyles.lineHeight,
                });

                return window.getComputedStyle(measureRef.current).height;
            };

            if (value === '') {
                measureRef.current.innerText = 'Placeholder';
            }

            // console.time('getMeasuredHeight');
            txRef.current.style.height = getMeasuredHeight();
            // console.timeEnd('getMeasuredHeight');
        }, [value]);

        // forwardRef
        useImperativeHandle(ref, () => {
            return {
                focusTextArea() {
                    txRef.current.focus();
                },
            };
        });

        return (
            <>
                <textarea 
                    className={className}
                    ref={txRef}
                    placeholder={placeholder}
                    value={value}
                    onKeyDown={onKeyDown}
                    onChange={onChange}
                />
                <div 
                    ref={measureRef}
                />
            </>
        );
    }
);

AutoresizeTextarea.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func,
}

AutoresizeTextarea.displayName = 'AutoresizeTextarea';

export default AutoresizeTextarea;
