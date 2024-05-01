import { ErrorLayout } from './ErrorLayout.jsx';

export default function Fallback() {
    function reloadPage(evt) {
        evt.preventDefault();
        window.location.reload();
    }

    return (
        <ErrorLayout>
            <h1>Ошибка</h1>
            <p>Что-то пошло не так...😔 Пожалуйста, <a onClick={reloadPage}>обнови</a> страницу!</p>
        </ErrorLayout>
    );
}
