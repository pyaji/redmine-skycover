// ==UserScript==
// @name         SkyCover redime (для заполнения текущего времени)
// @namespace    http://tampermonkey.net/
// @version      2025-01-28
// @description  try to take over the world!
// @author       You
// @match        https://redmine.skycover.ru/sprints/*
// @match        https://redmine.skycover.ru/projects/business/time_entries*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let curr_inp
    function callback(mutationsList, observer) {
        let inp
        for(let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                if (mutation.addedNodes.length) {
                    for (let node of mutation.addedNodes) {
                        if (node.querySelector === undefined) continue
                        let _inp = node?.querySelector('#time_entry_spent_on')
                        if (_inp) {
                           inp = _inp
                            break
                        }
                    }
                }
            }

        }
        if (inp) {
            let curr_date = localStorage.getItem('curr_date')
            if (curr_date) {
                inp.value = curr_date
            }

        }


    }

    const config = { childList: true, subtree: true };

    const observer = new MutationObserver(callback);

    observer.observe(document.body, config);

    curr_inp = document.querySelector('#values_spent_on_1')
    if (curr_inp) {
        localStorage.setItem('curr_date', curr_inp.value)
    }

})();