import PropTypes from 'prop-types'

SpinningFrame.propTypes = {
    on: PropTypes.bool,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]),
    spinnerColor: PropTypes.string,
    backgroundColor: PropTypes.string,
    padding: PropTypes.string,
    borderRadius: PropTypes.string,
}

export default function SpinningFrame(props) {
    const spCol = `linear-gradient(${props.spinnerColor || 'white'}, ${props.spinnerColor || 'white'})`
    const bgCol = `linear-gradient(${props.backgroundColor || 'transparent'}, ${props.backgroundColor || 'transparent'}), `
    const background = `${bgCol.repeat(3)}${spCol}`

    //console.log(background)

    return (
        <div 
            className={props.className}
            style={{
                position: 'relative', 
                zIndex: 0,
                overflow: 'hidden',
                padding: props.padding || '2px',
                borderRadius: props.borderRadius || '8px',
            }}
        >
            <style>
                {`
                    @keyframes spinning-frame-rotate {
                        100% { transform: rotate(1turn); }
                    }
                `}
            </style>
            {props.on && <div 
                style={{
                    position: 'absolute',
                    zIndex: -1,
                    left: '-50%',
                    top: '-50%',
                    width: '200%',
                    height: '200%',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '50% 50%, 50% 50%',
                    backgroundPosition: '0 0, 100% 0, 100% 100%, 0 100%',
                    backgroundImage: background,
                    animation: 'spinning-frame-rotate 0.75s linear infinite'
                }}
            />}
            {props.children}
        </div>
    )
}
