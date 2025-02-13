// ==UserScript==
// @name         Skycover Redmine
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  add parent tash
// @author       Elias Arkhipov
// @match        https://redmine.skycover.ru/*/time_entries*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=c-mit.ru
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    console.log('redmine');
    async function get_all_entries(link) {
        let url = new URL(window.location)
        url.pathname += '.json'
        url.searchParams.set('limit', 100)
        let entries = [];
        let resp = await fetch(url);
        let { total_count, time_entries } = await resp.json();
        var len = time_entries.length
        entries.push(...time_entries)
        link.html('.. идет скачка ..')
        if (len < total_count) {
            // загрузить остальные
            console.log('entries to load');
            url.searchParams.set('offset', len)
            url.searchParams.set('limit', total_count)
            let resp = await fetch(url);
            let { time_entries } = await resp.json();
            entries.push(...time_entries)
        }
        return entries

    };
    function get_issues_ids(items) {
        let ret = new Set()
        for (const i of items) {
            ret.add(i.issue.id)
        }
        return Array.from(ret)
    }
    function get_issues_parents(items) {
        let ret = new Set()
        for (const i of items) {
            ret.add(i.parent.id)
        }
        return Array.from(ret)
    }
    function sanitize(txt) {
       return txt.replace(/[#;]/gi, ' ')
    }
    async function load_issues_data(items_ids, link, prefix = 'Задачи', start=0) {
        let url = new URL(window.location)
        url.search = ''
        var items = []
        var count = items_ids.length
        for (const i in items_ids) {
            let item_id = items_ids[i]
            url.pathname = `issues/${item_id}.json`
            link.html(`Готоволю ${prefix} ${parseInt(i) + parseInt(start)}/${parseInt(count) + parseInt(start)}`)
            let resp = await fetch(url)
            let data = await resp.json()
            items.push(data.issue)
        }
        return items

    }
    function build_report(time_entries, issues, parents) {
        let ret = [[
            'Проект', 'Дата', 'Пользователь', 'Фича',
            'Задача : Комментарий', 'Час(а,ов)'
        ]]
        let issues_dict = issues.reduce(
            (r, i) => ({ ...r, [i.id]: i }),
            {}
        )
        let parents_dict = parents.reduce(
            (r, i) => ({ ...r, [i.id]: i }),
            {}
        )
        for (const entrie of time_entries) {
            let issue_id = entrie.issue.id
            let issue = issues_dict[issue_id]
            let parent = parents_dict[issue.parent.id]
            let subject = entrie.comments ? `${issue.subject} : ${entrie.comments}` : issue.subject;
            let subject2 = `${issue.tracker.name} №${issue_id}: ${subject}`
            let [y,m,d] = entrie.spent_on.split('-')
            let line = [
                entrie.project.name,
                `${d}.${m}.${y}`,
                entrie.user.name,
                sanitize(parent.subject),
                sanitize(`${subject2}`),
                `${entrie.hours}`.replace('.', ',')
            ]
            ret.push(line)
        }
        return ret

    }
    var btn = $('<li><a>отчет</a></li>').click(
        async function () {
            var link = ($('a', this));
            let data = await get_all_entries(link)
            let issues_ids = get_issues_ids(data)
            let issues = await load_issues_data(issues_ids, link, "Задачи")
            let parents_ids = get_issues_parents(issues)
            let parents = await load_issues_data(parents_ids, link, "Фичи", issues_ids.length)
            //console.log('time_entries', data)
            //console.log('issues', issues)
            //console.log('parrents', parents)
            let to_upload = build_report(data, issues, parents)
            let csvContent = "data:text/csv;charset=utf-8,"
                + to_upload.map(e => e.join(";")).join("\n");

            var encodedUri = encodeURI(csvContent);
            var dlink = document.createElement("a");
            dlink.setAttribute("href", encodedUri);
            dlink.setAttribute("download", "my_data.csv");
            document.body.appendChild(dlink); // Required for FF
            dlink.click();
            document.body.removeChild(dlink);
            link.html('готово')
            setTimeout(() => {
               link.html('отчет')
            }, 1500)
            //console.log(to_upload)
        })

    $('#account ul').append(btn);
}
)()
