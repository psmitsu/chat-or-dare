import { reportGoal } from '@/lib/util/yandexMetrika.js';

const handleRuntimeError = (error, info) => {
    console.log('Runtime error:', error, 'componentStack: ', info.componentStack);

    reportGoal({
        id: 'reactErrorBoundary',
        params: {
            url: document.location.href,
            error: error,
            componentStack: info.componentStack,
        },
    });
}

const handle500 = () => {
    console.log('Error 500');

    reportGoal({
        id: 'error500',
        params: {
            url: document.location.href,
            referrer: document.referrer,
        },
    });
}

const handle404 = () => {
    console.log('Error 404');

    reportGoal({
        id: 'error404',
        params: {
            url: document.location.href,
            referrer: document.referrer,
        },
    });
};

export {
    handleRuntimeError,
    handle500,
    handle404,
};
