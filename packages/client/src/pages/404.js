import { useEffect } from 'react';
import { ErrorLayout } from '@/components/Error/ErrorLayout.jsx';
import Link from 'next/link';
import { handle404 } from '@/util/handleError.js';

export default function Custom404() {
    useEffect(() => {
        handle404();
    }, []);

    return (
        <ErrorLayout>
            <h1>Ошибка 404</h1>
            <p>Такой страницы нет! 🤔 На <Link href='/'>главную</Link></p>
        </ErrorLayout>
    );
}
