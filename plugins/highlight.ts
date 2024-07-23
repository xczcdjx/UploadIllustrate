// plugins/highlight.js
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.directive('highlight', {
        mounted(el) {
            const blocks = el.querySelectorAll('pre code');
            blocks.forEach((block:any) => {
                hljs.highlightElement(block);
            });
        },
    });
});
