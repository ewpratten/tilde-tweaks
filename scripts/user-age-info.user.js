// ==UserScript==
// @name         Tilde: User Age Info
// @namespace    https://ewp.fyi/tilde-tweaks
// @version      0.1
// @description  Show when a user created their account on hover
// @author       Evan Pratten <evan@ewpratten.com>
// @match        https://tildes.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tildes.net
// @grant        none
// ==/UserScript==
//
// WARNING: This script makes a lot of HTTP requests!

const USERNAME_FROM_URL_RE = /https:\/\/tildes\.net\/user\/(.*)/;
const USER_REGISTERATION_DATE_RE = /<dt>Registered<\/dt>\s+<dd>(.*)<\/dd>/;
const RATE_LIMIT_COOLDOWN_MS = 1000;

// Some site info to hint the coloring system
const ADMIN_USERS = ["deimos"];

// Custom styles used by this script
const CUSTOM_STYLES = `
/* User age bracket colors */
.link-user[data-user-age-bracket="this-week"] {
    background-color: #90ee905c;
}
.link-user[data-user-age-bracket="this-month"] {
    background-color: #fbf71c6e;
}

/* User role colors */
.link-user[data-user-is-admin] {
    background-color: #ff45007d;
}

/* Common styles for colored users*/
.link-user[data-user-age-bracket] {
    padding-left: 1px;
    padding-right: 1px;
}

/* Stats */
#site-footer-user-age-cache-stats {
    width: 100%;
    text-align: center;
    margin-top: 0.5em;
}
`;

async function handleLink(element) {
    // Parse the username from the link
    let user_url = element.href;
    let username = USERNAME_FROM_URL_RE.exec(user_url)[1];

    // Attempt to get the user data
    let reg_date = localStorage.getItem(`user_reg_${username}`);

    // If the data does not exist, scrape it
    if (reg_date == null) {
        console.log(`Scraping @${username}'s user page for info`);

        // Get the user page
        let user_page = await (await fetch(user_url)).text();

        // Cache the data
        let re_result = USER_REGISTERATION_DATE_RE.exec(user_page);
        if (re_result == null) { console.log(`Failed to scrape @${username}`); return; }
        reg_date = re_result[1];
        localStorage.setItem(`user_reg_${username}`, reg_date);
        updateFooterStats();

        // Wait a bit to keep the rate limiter happy
        await new Promise(r => setTimeout(r, RATE_LIMIT_COOLDOWN_MS));
    }

    // Add a tooltop to the element with the registration date
    element.title = `Registered: ${reg_date}`;

    // Add attributes to let CSS target the user age
    let age_days = Math.abs((Date.parse(reg_date) - (new Date())) / (1000 * 3600 * 24));
    element.dataset.userAge = Math.floor(age_days);
    if ( age_days <= 7 ) {
        element.dataset.userAgeBracket = "this-week";
    } else if (age_days <= 30) {
        element.dataset.userAgeBracket = "this-month";
    }

    // Add a tag to site admins
    if (ADMIN_USERS.includes(username.toLowerCase())) {
        element.dataset.userIsAdmin = true;
    }
}

function updateFooterStats() {
    // If no footer section exists, create one
    if (!document.getElementById("site-footer-user-age-cache-stats")) {
        document.getElementById("site-footer").innerHTML += `<div id="site-footer-user-age-cache-stats"></div>`;
    }

    // Count localstorage keys
    let cached_user_count = 0;
    for (var key in localStorage) {
        if (key.startsWith("user_reg_")) {
            cached_user_count += 1;
        }
    }

    // Re-write the cache stats
    document.getElementById("site-footer-user-age-cache-stats").innerHTML = `User ages cached: ${cached_user_count}`;
}

(async function() {
    'use strict';

    // Inject script styles into the page
    document.head.innerHTML += `<style>${CUSTOM_STYLES}</style>`;

    // Spawn a task to handle each user tag found on the current page
    // This must be done sync because of the rate limiter handling
    updateFooterStats();
    let user_tags = document.querySelectorAll(".link-user");
    console.log(`${user_tags.length} user tags found on this page`);
    for (var tag of user_tags) { await handleLink(tag); }
})();
