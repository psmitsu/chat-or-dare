import { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script';
import { MetrikaInjector } from '@/lib/util/yandexMetrika.js';

export default function Document() {
    return (
        <Html lang="ru">
            <Head
            />
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
