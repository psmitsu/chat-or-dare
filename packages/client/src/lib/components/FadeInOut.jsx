import { useState, useRef, useEffect } from 'react';

const FadeInOut = ({isMount, children, baseClassName, inClassName, outClassName, outDelay, handleClick}) => {
    const [ shouldRender, setShouldRender ] = useState();
    const ref = useRef();

    // manage mounted state depending on isMount prop
    if (isMount && !shouldRender) {
        setShouldRender(true);
    }

    // unmount the component after specified delay
    useEffect(() => {
        if (!isMount && shouldRender) {
            const timeout = setTimeout(() => {
                setShouldRender(false);
            }, outDelay);

            return () => clearTimeout(timeout);
        }
    }, [isMount, outDelay]);

    // add/remove css class after rendering / before unmounting
    useEffect(() => {
        let timeout;

        if (isMount && shouldRender) {
            timeout = setTimeout(() => 
                ref.current.className = baseClassName + ' ' + inClassName,
                10
            );
        } else if (!isMount && shouldRender) {
            timeout = setTimeout(() =>
                ref.current.className = baseClassName + ' ' + outClassName,
                10
            );
        }

        return () => clearTimeout(timeout);
    }, [isMount, shouldRender]);

    return (
        <>
            {shouldRender ?
                <div
                    ref={ref}
                    className={baseClassName}
                    onClick={handleClick}
                >
                    {children}
                </div>
                : null
            }
        </>
    );
};

export default FadeInOut;
