// ==UserScript==
// @name         Redmine Move tasks from feature to feature
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  allow move tasks from one task feature to another
// @author       ai@c-mit.ru
// @match        https://redmine.skycover.ru/sprints/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=c-mit.ru
// @grant        none
// ==/UserScript==

function add_checkboxes(id) {
    var tr = $(`#pbi_${id}_row`);
    var tasks = $('td[id] table', tr)
    var checkboxes = [];

    tasks.each((_, task) => {
        let task_id_ = task.getAttribute('id')
        let tr_selector = `#${task_id_} > tbody > tr:nth-child(1) a.issue.child`
        let checkbox = $('<input type="checkbox" value="' + task_id_.replace('task_', '') + '">').change(() => {
            let _chkboxes = $('input[type=checkbox]:checked')
            $(`#mv_tsks_${id}`).text(`Переместить ${_chkboxes.length}`)
        });
        console.log(tr_selector)
        $(tr_selector).before(checkbox)
        checkboxes.push(checkbox)
    })
    return checkboxes;
}


async function getToken() {
    let token = localStorage.getItem('redmine-api')
    if (!token) {
       let new_token = prompt('Укажите токен апи')
       let headers = await build_headers(new_token)
       let resp = await fetch('/users/current.json', {headers})
       if (resp.ok) {
           localStorage.setItem('redmine-api', new_token)
       } else {
           let r = confirm('токен невалиден, попробовать еще раз?')
           if (r) {
              token = await getToken()
           }

       }
    }
    return token
}
async function build_headers(using_token=null) {
    if (using_token) {
        return {
            "Content-Type": "application/json",
            'X-Redmine-API-Key': using_token
        }
    }
    const token = await getToken()
    if (!token) {
        return null
    }
    return {
        "Content-Type": "application/json",
        'X-Redmine-API-Key': token
    }
}

async function move_to_dst(dst, sprint_id) {
    const headers = await build_headers()
    if (!headers) {
        console.log('empty headers')
     return
    }
   let resp = await fetch(`/issues/${dst}.json`, {headers})
   let data = await resp.json()
   if (data.issue.tracker.id == 2) {
     console.log('переносим')
     $('input[type=checkbox]:checked').each(async (_, el) => {
         let task_id = el.getAttribute('value')
         let project_id = data.issue.project.id
         let rsp = await fetch(`/issues/${task_id}.json`, {
             method: 'PUT',
             body: JSON.stringify({
                 issue: {
                     parent_issue_id: dst,
                     project_id: project_id,
                     sprint_id: sprint_id
                 }
             }),
             headers
         })
         console.log(rsp)
     })


   } else {
     console.log('что-то не так')
   }

   console.log('resp', data)
}

(function() {
    'use strict';
    console.info('loaded!');
    var features_list = [];
    var counter_tasks = 0;
    var active_feature = null;
    var checkboxes = []
    // Your code here...
    function clear_checkboxes(btn) {
        btn.text('Переместить')
        for(const chckbx of checkboxes) {
            chckbx.remove()
        }
        checkboxes = []
        active_feature = null
    }
    function activate_checkboxes(fid) {
        active_feature = fid
        checkboxes = add_checkboxes(fid)
    }

    $('#sprint_board td.sprint-board:first-child table').each((indx, tbl) => {
        var tbl_body = $('tbody', tbl)
        var feature_id = tbl.getAttribute('id').replace('pbi_', '')
        var tbl_move = $(`<tr><td colspan="3"><button id='mv_tsks_${feature_id}'>Переместить из ${feature_id}</button></td></tr>`)
        var btn = $('button', tbl_move).click(() => {
            console.log(`клик на ${feature_id}`)
            if (!active_feature) {
                activate_checkboxes(feature_id)
            } else {
                let dest=prompt("Переместить? укажите в какую задачу");
                let sprint_id=prompt("Айди спринта")
               if (dest) {
                 console.log('переместить d', dest)
                   move_to_dst(dest, sprint_id)
               } else {
                  clear_checkboxes(btn)
               }
            }
            btn.text('Переместить 0')
        })
        tbl_body.append(tbl_move)
    })

})();