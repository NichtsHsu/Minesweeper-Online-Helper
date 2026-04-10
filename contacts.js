document.addEventListener('DOMContentLoaded', function() {
    let isBatchUpdatingFriendNames = false;

    chrome.storage.local.get(['contactsList'], function(result) {
        let contactsList = result.contactsList || {};
        var index = 0;
        if (Object.keys(contactsList).length > 0) {
            for (let uid in contactsList) {
                if (!Array.isArray(contactsList[uid])) {
                    contactsList[uid] = [contactsList[uid], index, ''];
                } else {
                    if (typeof contactsList[uid][1] !== 'number') {
                        contactsList[uid][1] = index;
                    }
                    if (typeof contactsList[uid][2] !== 'string') {
                        contactsList[uid][2] = '';
                    }
                }
                index++;
            }
        }
        chrome.storage.local.set({ contactsList: contactsList });
    });
    displayContacts(); // 初始化显示
    /* 添加好友 */
    document.getElementById('addFriend').addEventListener('click', function() {
        document.getElementById('addFriendFlag').textContent = 0;
        document.getElementById('addFriendNotice').textContent = '';
        const uid = document.getElementById('addFriendUid').value;
        if (uid && !isNaN(uid)) {
            document.getElementById('addFriendNotice').textContent = '正在查找好友……';
            document.getElementById('addFriendUid').value = '';
            chrome.tabs.create({ url: ('https://minesweeper.online/cn/player/' + uid), active: false }, function (tab) {
                const ti = tab.id;
                var t0 = 100;
                var flag;
                var count = 1;
                var countMax = 300;
                intFriend = setInterval(() => {
                    flag = document.getElementById('addFriendFlag').textContent;
                    if (flag == 1) {
                        clearInterval(intFriend);
                        chrome.tabs.remove(ti, function() {});
                        document.getElementById('addFriendNotice').textContent = '添加好友成功！';
                    } else if (count == countMax) {
                        clearInterval(intFriend);
                        chrome.tabs.remove(ti, function() {});
                        document.getElementById('addFriendNotice').textContent = '添加好友失败！uid错误或网络异常';
                    } else {
                        extractName(ti, uid);
                        count++;
                    }
                }, t0);

                function extractName(tabId, uid) {
                    chrome.scripting.executeScript({
                        target: { tabId },
                        args: [uid],
                        function: extractFriendInfo
                    });
                }
            });
        }
    });
    /* 管理好友 */
    document.getElementById('editFriend').addEventListener('click', function() {
        var editCells = document.getElementsByClassName('editFriendCell');
        for (let i = 0; i < editCells.length; i++) {
            // cells[i].style.visibility = 'visible';
            editCells[i].style.display = 'table-cell';
        }
        if (document.getElementById('sortFriendMethod').innerText != 0) {
            var rankCells = document.getElementsByClassName('changeRankCell');
            for (let i = 0; i < rankCells.length; i++) {
                rankCells[i].style.visibility = 'hidden';
            }
        }
        document.getElementById('editFriendOver').style.display = 'inline';
    });
    document.getElementById('editFriendOver').addEventListener('click', function() {
        var cells = document.getElementsByClassName('editFriendCell');
        for (let i = 0; i < cells.length; i++) {
            // cells[i].style.visibility = 'visible';
            cells[i].style.display = 'none';
        }
        document.getElementById('editFriendOver').style.display = 'none';
    });
    /* 排序 */
    let sortFriendMethod = document.getElementById('sortFriendMethod');
    let friendUidDesc = document.getElementById('friendUidDesc');
    let friendNameDesc = document.getElementById('friendNameDesc');
    const sortButtons = [
        document.getElementById('sortFriendDefalt'),
        document.getElementById('sortFriendUid'),
        document.getElementById('sortFriendName')
    ];
    document.getElementById('sortFriendDefalt').addEventListener('click', function() {
        sortFriendMethod.textContent = 0;
        setTimeout(() => {
            displayContacts();
        }, 10);
    });
    document.getElementById('sortFriendUid').addEventListener('click', function() {
        if (sortFriendMethod.textContent != 1) {
            sortFriendMethod.textContent = 1;
        } else if (friendUidDesc.textContent == 0) {
            friendUidDesc.textContent = 1;
        } else {
            friendUidDesc.textContent = 0;
        }
        setTimeout(() => {
            displayContacts();
        }, 10);
    });
    document.getElementById('sortFriendName').addEventListener('click', function() {
        if (sortFriendMethod.textContent != 2) {
            sortFriendMethod.textContent = 2;
        } else if (friendNameDesc.textContent == 0) {
            friendNameDesc.textContent = 1;
        } else {
            friendNameDesc.textContent = 0;
        }
        setTimeout(() => {
            displayContacts();
        }, 10);
    });

    /* 批量更新好友用户名（按顺序打开主页并抓取） */
    document.getElementById('updateFriendNames').addEventListener('click', function() {
        if (isBatchUpdatingFriendNames) {
            return;
        }
        const noticeEle = document.getElementById('addFriendNotice');
        const triggerButton = document.getElementById('updateFriendNames');

        // Follow the current visible order in table rather than sorting by uid.
        const orderedUids = Array.from(document.querySelectorAll('#contactsTable tr')).map((row) => {
            const uidCell = row.cells && row.cells.length > 1 ? row.cells[1] : null;
            return uidCell ? uidCell.textContent.trim() : '';
        }).filter((uid) => uid !== '');

        chrome.storage.local.get(['contactsList'], function(result) {
            const contactsList = result.contactsList || {};

            if (orderedUids.length === 0) {
                noticeEle.textContent = '暂无好友可更新';
                return;
            }

            isBatchUpdatingFriendNames = true;
            triggerButton.disabled = true;
            sortButtons.forEach((button) => {
                button.disabled = true;
            });
            let updatedCount = 0;
            let failedCount = 0;

            function finishBatchUpdate() {
                isBatchUpdatingFriendNames = false;
                triggerButton.disabled = false;
                sortButtons.forEach((button) => {
                    button.disabled = false;
                });
                noticeEle.textContent = '更新完成：成功 ' + updatedCount + '，失败 ' + failedCount;
                displayContacts();
            }

            function processNext(index) {
                if (index >= orderedUids.length) {
                    finishBatchUpdate();
                    return;
                }

                const uid = orderedUids[index];
                noticeEle.textContent = '正在更新好友用户名（' + (index + 1) + '/' + orderedUids.length + '）：' + uid;

                chrome.tabs.create({ url: 'https://minesweeper.online/cn/player/' + uid, active: false }, function(tab) {
                    if (!tab || !tab.id) {
                        failedCount++;
                        setTimeout(() => {
                            processNext(index + 1);
                        }, 150);
                        return;
                    }

                    const tabId = tab.id;
                    const maxAttempts = 120;
                    let attempts = 0;

                    const timer = setInterval(() => {
                        attempts++;
                        chrome.scripting.executeScript({
                            target: { tabId },
                            function: function() {
                                const nameEle = document.querySelector('#PlayerBlock > h2 > div.pull-left > span');
                                return nameEle ? nameEle.textContent.trim() : '';
                            }
                        }, function(results) {
                            const hasRuntimeError = !!chrome.runtime.lastError;
                            const name = (!hasRuntimeError && results && results[0] && typeof results[0].result === 'string')
                                ? results[0].result.trim()
                                : '';

                            if (name) {
                                clearInterval(timer);
                                chrome.tabs.remove(tabId, function() {});
                                if (!Array.isArray(contactsList[uid])) {
                                    contactsList[uid] = [name, index, ''];
                                } else {
                                    contactsList[uid][0] = name;
                                    if (typeof contactsList[uid][2] !== 'string') {
                                        contactsList[uid][2] = '';
                                    }
                                }
                                updatedCount++;
                                const row = document.getElementById('friend' + uid);
                                if (row && row.cells && row.cells.length > 0) {
                                    row.cells[0].textContent = name;
                                }
                                chrome.storage.local.set({ contactsList: contactsList }, function() {
                                    displayContacts();
                                    setTimeout(() => {
                                        processNext(index + 1);
                                    }, 150);
                                });
                            } else if (attempts >= maxAttempts) {
                                clearInterval(timer);
                                chrome.tabs.remove(tabId, function() {});
                                failedCount++;
                                setTimeout(() => {
                                    processNext(index + 1);
                                }, 150);
                            }
                        });
                    }, 250);
                });
            }

            processNext(0);
        });
    });
});

/* 显示好友列表主函数 */
function displayContacts() {
    document.getElementById('editFriendOver').style.display = 'none';
    chrome.storage.local.get(['contactsList'], function(result) {
        let contactsList = result.contactsList;
        if (Object.keys(contactsList).length > 0) {
            document.getElementById('noContacts').style.display = 'none';
            document.getElementById('contactsArea').style.display = 'block';
            console.log('好友列表：', contactsList);
            var contactsTable = document.getElementById('contactsTable');
            contactsTable.innerHTML = '';
            var uidRank = [];
            let sfm = document.getElementById('sortFriendMethod').innerText;
            let fud = document.getElementById('friendUidDesc').innerText;
            let fnd = document.getElementById('friendNameDesc').innerText;
            if (sfm == 0) { // 默认排序
                for (const uid in contactsList) {
                    uidRank[contactsList[uid][1]] = uid;
                }
            } else if (sfm == 1) {
                if (fud == 1) {
                    uidRank = Object.keys(contactsList).sort((a, b) => b - a);
                } else {
                    uidRank = Object.keys(contactsList).sort((a, b) => a - b);
                }
            } else if (sfm == 2) {
                var sortName;
                if (fnd == 1) {
                    sortName = Object.entries(contactsList).sort(([, a], [, b]) => b[0].localeCompare(a[0]));
                } else {
                    sortName = Object.entries(contactsList).sort(([, a], [, b]) => a[0].localeCompare(b[0]));
                }
                uidRank = sortName.map(([key]) => key);
            }
            for (let i = 0; i < uidRank.length; i++) {
                let uid = uidRank[i];
                var friendRow = contactsTable.insertRow();
                friendRow.id = 'friend' + uid;
                var name = friendRow.insertCell();
                name.textContent = contactsList[uid][0];
                clickCopyText(name);
                var uidCell = friendRow.insertCell();
                uidCell.textContent = uid;
                clickCopyText(uidCell);

                var noteCell = friendRow.insertCell();
                var noteInput = document.createElement('input');
                noteInput.type = 'text';
                noteInput.className = 'inputBox friendNoteInput';
                noteInput.placeholder = '添加备注...';
                noteInput.value = typeof contactsList[uid][2] === 'string' ? contactsList[uid][2] : '';
                noteInput.setAttribute('data-uid', uid);
                noteCell.appendChild(noteInput);

                var openPage = document.createElement('button');
                openPage.id = 'open' + uid;
                openPage.className  = 'openFriend';
                openPage.textContent = '个人主页';
                var exchange = document.createElement('button');
                exchange.id = 'exchange' + uid;
                exchange.className  = 'exchangeFriend';
                exchange.textContent = '一对一交易';
                var op = friendRow.insertCell();
                op.appendChild(openPage);
                var ex = friendRow.insertCell();
                ex.appendChild(exchange);

                var up = document.createElement('button');
                up.id = 'up' + uid;
                up.className  = 'changeRankButton';
                up.textContent = '▲';
                if (contactsList[uid][1] == 0) {
                    up.style.visibility = 'hidden';
                }
                var down = document.createElement('button');
                down.id = 'down' + uid;
                down.className  = 'changeRankButton';
                down.textContent = '▼';
                if (contactsList[uid][1] == uidRank.length - 1) {
                    down.style.visibility = 'hidden';
                }
                var cr = friendRow.insertCell();
                cr.classList = 'editFriendCell changeRankCell';
                // cr.style.visibility = 'hidden'
                cr.style.display = 'none';
                cr.appendChild(up);
                cr.appendChild(down);

                var deleteFriend = document.createElement('button');
                deleteFriend.id = 'deleteFriend' + uid;
                deleteFriend.className  = 'deleteFriend';
                deleteFriend.textContent = '删除好友';
                var df = friendRow.insertCell();
                df.className = 'editFriendCell';
                // df.style.visibility = 'hidden'
                df.style.display = 'none';
                df.appendChild(deleteFriend);

                contactsLinks(uid);
                bindFriendNoteInput(noteInput, uid);
            }
        } else {
            document.getElementById('noContacts').style.display = 'block';
            document.getElementById('contactsArea').style.display = 'none';
        }
    });
}

function contactsLinks(uid) {
    const open = document.getElementById('open' + uid);
    const exchange = document.getElementById('exchange' + uid);
    const deleteFriend = document.getElementById('deleteFriend' + uid);
    const up = document.getElementById('up' + uid);
    const down = document.getElementById('down' + uid);
    open.addEventListener('click', function() {
        chrome.tabs.create({ url: ('https://minesweeper.online/cn/player/' + uid), active: true });
    });
    exchange.addEventListener('click', function() {
        chrome.tabs.create({ url: ('https://minesweeper.online/cn/exchange/new/' + uid), active: true });
    });
    deleteFriend.addEventListener('click', function() {
        chrome.storage.local.get(['contactsList'], function(result) {
            let contactsList = result.contactsList || {};
            var index = contactsList[uid][1];
            delete contactsList[uid];
            for (let uids in contactsList) {
                if (contactsList[uids][1] > index) {
                    contactsList[uids][1]--;
                }
            }
            chrome.storage.local.set({ contactsList: contactsList });
        });
        setTimeout(() => {
            document.getElementById('addFriendNotice').textContent = '';
            displayContacts();
        }, 10);
        setTimeout(() => {
            document.getElementById('editFriend').click();
        }, 20);
    });
    up.addEventListener('click', function() {
        chrome.storage.local.get(['contactsList'], function(result) {
            let contactsList = result.contactsList || {};
            var index = contactsList[uid][1];
            if (index > 0) {
                for (let id in contactsList) {
                    if (contactsList[id][1] == index - 1) {
                        contactsList[id][1]++;
                        contactsList[uid][1]--;
                        break;
                    }
                }
            }
            chrome.storage.local.set({ contactsList: contactsList });
        });
        setTimeout(() => {
            document.getElementById('addFriendNotice').textContent = '';
            displayContacts();
        }, 10);
        setTimeout(() => {
            document.getElementById('editFriend').click();
        }, 20);
    });
    down.addEventListener('click', function() {
        chrome.storage.local.get(['contactsList'], function(result) {
            let contactsList = result.contactsList || {};
            var index = contactsList[uid][1];
            if (index < Object.keys(contactsList).length - 1) {
                for (let id in contactsList) {
                    if (contactsList[id][1] == index + 1) {
                        contactsList[id][1]--;
                        contactsList[uid][1]++;
                        break;
                    }
                }
            }
            chrome.storage.local.set({ contactsList: contactsList });
        });
        setTimeout(() => {
            document.getElementById('addFriendNotice').textContent = '';
            displayContacts();
        }, 10);
        setTimeout(() => {
            document.getElementById('editFriend').click();
        }, 20);
    });
}

function bindFriendNoteInput(input, uid) {
    function saveNote() {
        chrome.storage.local.get(['contactsList'], function(result) {
            const contactsList = result.contactsList || {};
            if (!contactsList[uid]) {
                return;
            }
            if (!Array.isArray(contactsList[uid])) {
                contactsList[uid] = [String(contactsList[uid]), 0, ''];
            }
            contactsList[uid][2] = input.value || '';
            chrome.storage.local.set({ contactsList: contactsList });
        });
    }

    input.addEventListener('change', saveNote);
    input.addEventListener('blur', saveNote);
}

/* 点击昵称或uid复制 */
function clickCopyText(ele) {
    // ele.style.cursor = 'pointer';
    ele.addEventListener('click', (event) => {
        let mouseX = event.clientX;
        let mouseY = event.clientY;
        const textToCopy = ele.innerText.trim();
        navigator.clipboard.writeText(textToCopy).then(() => {
            // 显示提示框在点击位置
            const copyNotify = document.createElement('div');
            copyNotify.id = 'copyNotify';
            copyNotify.innerText = '已复制';
            document.body.appendChild(copyNotify);
            copyNotify.style.left = `${mouseX}px`; // 设置提示框的横坐标
            copyNotify.style.top = `${mouseY}px`; // 设置提示框的纵坐标
            copyNotify.style.display = 'block'; // 显示提示框
            // 2秒后隐藏提示框
            setTimeout(() => {
                copyNotify.style.display = 'none'; // 隐藏提示框
            }, 2000);
        });
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'sendFriendInfo') {
        let friendInfo = request.friendInfo;
        console.log('收到好友信息：', friendInfo);
        chrome.storage.local.get(['contactsList'], function(result) {
            let contactsList = result.contactsList || {}; // 确保存在数据，防止为 undefined
            var index = Object.keys(contactsList).length;
            if (contactsList[friendInfo[0]]) {
                contactsList[friendInfo[0]][0] = friendInfo[1];
                if (typeof contactsList[friendInfo[0]][2] !== 'string') {
                    contactsList[friendInfo[0]][2] = '';
                }
            } else {
                contactsList[friendInfo[0]] = [friendInfo[1], index, ''];
            }
            // 保存更新后的数据
            chrome.storage.local.set({ contactsList: contactsList });
        });
        document.getElementById('addFriendFlag').textContent = 1;   // 设置成功标记
        setTimeout(() => {
            displayContacts();
        }, 100);
    }
});