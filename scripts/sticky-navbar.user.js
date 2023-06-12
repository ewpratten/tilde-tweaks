// ==UserScript==
// @name         Tilde: Sticky navbar
// @namespace    https://ewp.fyi/tilde-tweaks
// @version      0.1
// @description  Make the navbar stick to the top of the screen
// @author       Evan Pratten <evan@ewpratten.com>
// @match        https://tildes.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tildes.net
// @grant        none
// ==/UserScript==

const STATIC_CSS = `
@media screen and (min-width: 840px) {
    #site-header {
        background-color: var(--background-secondary-color);
        position: sticky;
        top: 0;
        z-index: 1;
    }

    html:not([data-scroll='0']) #site-header {
        padding: 0.2rem !important;
        transform: translate(0px,-1px);
    }

    html:not([data-scroll='0']) .site-header-logo {
        background-image: none !important;
        padding: 0 !important;
        line-height: unset !important;
        font-size: unset !important;
    }

    html:not([data-scroll='0']) .logged-in-user-info {
        margin-top: 0 !important;
    }
}
`;

(function() {
    'use strict';

    // Apply the static CSS to the site
    document.head.innerHTML += `<style>${STATIC_CSS}</style>`;

    // Scroll detection
    document.addEventListener(
        'scroll',
        () => {
            document.documentElement.dataset.scroll = window.scrollY;
        },
        {passive: true}
    );
    document.documentElement.dataset.scroll = window.scrollY;
})();
