# Chat-or-Dare

Анонимный чат на Express+React, который задаёт случайные вопросы в стиле игры Правда или Действие.

## Содержание

* [О приложении](#about)
* [Особенности](#features)
* [Как запустить](#howto)

<a name="about"></a>
## О приложении

Реализация анонимного чата на Express, Redis и Next.

Особенность чата: во время диалога можно просить приложение сгенерировать вопрос в стиле игры Правда или Действие, например, "какой человек больше всего на тебя повлиял в жизни"? Предпологается, что такая фича облегчит общение со случайным человеком, позволит собеседникам быстрее и комфортнее узнать друг друга.

<a name="features"></a>
## Особенности

Бэкэнд: Node.js, Express, Redis.
Фронтенд: React.js, Next.
Real-time сообщения: Websockets

Контроль над процессами с помощью PM2. PM2 также используется для деплоя приложения.

<a name="howto"></a>
## Запуск

Необходимы Node.JS и PM2:
    
    npm i -g pm2

Создайте в корне проекта `.env` файл со следующими переменными:
    
    NODE_ENV="development"
    # url по которому фронт будет обращаться к апи
    NEXT_PUBLIC_BACKEND_URL
    # url по которому фронт будет подключать вебсокет
    NEXT_PUBLIC_WS_URL

Запустите проект в dev окружении:
    
    npm run pm2 start ecosystem.config.js

Если нужно production окружение:
    
    # .env
    NODE_ENV="production"

    npm run build-all
    npm run pm2 start

Более подробно про pm2 можно почитать в [моем гайде](https://gist.github.com/psmitsu/63981568ce2c016e8dc03cb0f84565c9)