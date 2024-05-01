/* allow using this only when counter id is provided via environment variable */
if (!process.env.NEXT_PUBLIC_YAMETRIKA_ID) {
    throw new Error('Provide NEXT_PUBLIC_YAMETRIKA_ID environment variable');
}

const counterId = process.env.NEXT_PUBLIC_YAMETRIKA_ID;

/* `<MetrikaInjector />` should be put in `_document.js` within <body/> */
const MetrikaInjector = ({webvisor=false} = {}) => (
    <>
        <script
            dangerouslySetInnerHTML={{
                __html: `
                        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                        m[i].l=1*new Date();
                        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

                        ym(${counterId}, "init", {
                             clickmap:true,
                             trackLinks:true,
                             accurateTrackBounce:true,
                             webvisor: ${webvisor},
                        });
                    `,
            }}
        />
        <noscript>
            <div>
                <img 
                    src={`https://mc.yandex.ru/watch/${counterId}`}
                    style={{
                        position : "absolute", 
                        left : "-9999px",
                    }}
                    alt="" 
                />
            </div>
        </noscript>
    </>
);

const reportGoal = ({id, params=null} = {}) => {
    ym(counterId, 'reachGoal', id, params);
};

export {
    MetrikaInjector,
    reportGoal,
};
