import PropTypes from 'prop-types'

SendIconSVG.propTypes = {
    color: PropTypes.string,
}

export default function SendIconSVG(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            version="1"
            viewBox="0 0 42 42"
        >
            <path
                fill={props.color}
                d="M96 393c-3-4-6-30-6-59v-52l48-10c26-6 64-14 85-17 20-4 37-11 37-15s-17-11-37-15c-21-3-59-11-85-17l-48-10v-53c0-30 4-56 8-59 12-7 327 141 327 154 0 6-63 41-140 77-171 79-181 83-189 76z"
                transform="matrix(.1 0 0 -.1 0 48) translate(-15)"
            ></path>
        </svg>
    );
}
