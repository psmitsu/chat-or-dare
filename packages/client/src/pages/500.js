import { useEffect } from 'react';
import { ErrorLayout } from '@/components/Error/ErrorLayout.jsx';
import Link from 'next/link';
import { handle500 } from '@/util/handleError.js';

export default function Custom500() {
    useEffect(() => {
        handle500();
    }, []);

    return (
        <ErrorLayout>
            <h1>Ошибка 500</h1>
            <p>Ошибка сервера! 😱 На <Link href='/'>главную</Link></p>
        </ErrorLayout>
    );
}
