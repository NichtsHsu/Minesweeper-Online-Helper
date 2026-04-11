document.addEventListener('DOMContentLoaded', function() {
    /* 分析活动任务 */
    const button = document.getElementById('buttonEq');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab1) {
        if (tab1[0].url.includes('https://minesweeper.online/') && tab1[0].url.includes('event-quests')) {
            setPopupButtonState(button, 'ready');
            button.style.cursor = 'pointer'; // 鼠标指针样式
            button.addEventListener('click', function () {
                setPopupButtonState(button, 'loading');
                const tabId = tab1[0].id;
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: extractEventQuest
                });
            });
        } else {
            setPopupButtonState(button, 'disabled');
        }
    });
    /* 统计奖牌榜 */
    const buttonTally = document.getElementById('buttonEqTally');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab2) {
        if (tab2[0].url.includes('https://minesweeper.online/') && tab2[0].url.includes('event-quests')) {
            setPopupButtonState(buttonTally, 'ready');
            buttonTally.style.cursor = 'pointer'; // 鼠标指针样式
            buttonTally.addEventListener('click', function () {
                setPopupButtonState(buttonTally, 'loading');
                const tabId = tab2[0].id;
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: function () {
                        var tallyMap = {'time': '', 'tally': {}};
                        var rawRank = [];
                        var rawRankTitle = ['任务id', '等级', '任务', '分类', '冠军', '亚军', '季军', '第四', '第五'];
                        // var rawRank2 = [['任务id', '等级', '任务', '分类', '冠军', '亚军', '季军', '第四', '第五']];
                        var name = ['中级效率', '高级效率', '竞技场', '连胜', '盲扫', '无猜', '自定义', '金币', '宝石', '竞速', '初级局数', '中级局数', '高级局数', 'PvP'];
                        var keyword = ['中级', '高级', '竞技场', '连胜', '盲扫', 'NG', '自定义', '金币', '获得', '用时', '初级', '中级', '高级', 'PvP'];
                        var keywordEff = '效率达到';
                        var keywordAt = '门票';
                        var typeNum = 14;
                        var t0 = 100;
                        var qti = 0; // 任务表索引
                        var qpi = 0; // 任务表翻页区索引
                        const questsBlock = document.querySelector("#QuestsBlock");
                        for (let i = 0; i < questsBlock.children.length; i++) {
                            const ele = questsBlock.children[i];
                            if (ele.classList.contains('table-bordered')) {
                                const title = ele.querySelector("thead > tr > th:nth-child(4)");
                                if (title && (title.textContent == '冠军' || title.textContent == 'Winners')) {
                                    qti = i + 1;
                                    if (ele.nextElementSibling && ele.nextElementSibling.classList == 'pagination pagination-sm noselect') {
                                        qpi = i + 2;
                                    }
                                    break;
                                }
                            }
                        }
                        const time = new Date();
                        tallyMap['time'] = time.toString();
                        if (qpi) {
                            var pageNum = 1;
                            tallyPageInterval = setInterval(() => {
                                const pageActive = document.querySelector(`#QuestsBlock > ul:nth-child(${qpi}) > li.page.active`);
                                const questTable = document.querySelector(`#QuestsBlock > table:nth-child(${qti})`);
                                if (pageActive.textContent == pageNum) {
                                    // console.log('匹配', pageActive.textContent, pageNum)
                                    var ready = 1;
                                    document.querySelectorAll('div[id^="winners_"]').forEach(leaderboard => {
                                        if (leaderboard.textContent == ' 正在加载...' || leaderboard.textContent == ' Loading...') {
                                            ready = 0;
                                        }
                                    });
                                    if (ready) {
                                        questTable.querySelectorAll('tr[id^="quest_row_"]').forEach(questRow => {
                                            var newQuestRow = ['', '', '', '', '', '', '', '', ''];
                                            newQuestRow[0] = questRow.id.match(/quest_row_(\d+)$/)[1];
                                            var ql = questRow.querySelector('td:nth-child(1)').textContent;
                                            var qc = questRow.querySelector('td:nth-child(2)').textContent;
                                            newQuestRow[1] = ql;
                                            newQuestRow[2] = qc;
                                            if (qc.includes(keywordEff)) {
                                                if (qc.includes(keyword[0])) {
                                                    newQuestRow[3] = name[0];
                                                } else if (qc.includes(keyword[1])) {
                                                    newQuestRow[3] = name[1];
                                                }
                                            } else if (qc.includes(keywordAt)) {
                                                newQuestRow[3] = name[9];
                                            } else {
                                                for (let j = 2; j < typeNum; j++) {
                                                    if (qc.includes(keyword[j])) {
                                                        newQuestRow[3] = name[j];
                                                        break;
                                                    }
                                                }
                                            }
                                            questRow.querySelectorAll('div[id^="winners_"]').forEach(leaderboard => {
                                                leaderboard.querySelectorAll('div > table > tbody > tr').forEach(lbtr => {
                                                    const rank = lbtr.querySelector(`td:nth-child(1)`).textContent;
                                                    const player = lbtr.querySelector(`td.vertical-align-top.username-overflow-column `).textContent;
                                                    if (!tallyMap['tally'][player]) {
                                                        tallyMap['tally'][player] = [0, 0, 0, 0, 0];
                                                    }
                                                    if (rank <= 5) {
                                                        tallyMap['tally'][player][rank - 1]++;
                                                        newQuestRow[+rank + 3] = player;
                                                    }
                                                });
                                            });
                                            rawRank.push(newQuestRow);
                                        });
                                        // document.querySelectorAll('div[id^="winners_"]').forEach(leaderboard => {
                                        //     leaderboard.querySelectorAll('div > table > tbody > tr').forEach(lbtr => {
                                        //         const rank = lbtr.querySelector(`td:nth-child(1)`).textContent;
                                        //         const player = lbtr.querySelector(`td.vertical-align-top.username-overflow-column `).textContent;
                                        //         if (!tallyMap['tally'][player]) {
                                        //             tallyMap['tally'][player] = [0, 0, 0, 0, 0];
                                        //         }
                                        //         if (rank <= 5) {
                                        //             tallyMap['tally'][player][rank - 1]++;
                                        //         }
                                        //     });
                                        // });
                                        pageNum++;
                                        const pageLastDisabled = document.querySelector(`#QuestsBlock > ul:nth-child(${qpi}) > li.last.disabled`);
                                        if (pageLastDisabled) {
                                            // console.log('结束', pageActive.textContent, pageNum)
                                            // console.log(tallyMap, rawRank);
                                            clearInterval(tallyPageInterval);
                                            const eCheck = document.querySelector(`#QuestsBlock > div:nth-child(${qti - 2}) > div.pull-left > label > input`);
                                            eCheck.click();
                                            countTally();
                                        }
                                    }
                                } else if (pageActive.textContent < pageNum) {
                                    // console.log('下一页', pageActive.textContent, pageNum)
                                    const pageNext = document.querySelector(`#QuestsBlock > ul:nth-child(${qpi}) > li.next`);
                                    pageNext.click();
                                } else if (pageActive.textContent > pageNum) {
                                    // console.log('过页', pageActive.textContent, pageNum)
                                    const pageFirst = document.querySelector(`#QuestsBlock > ul:nth-child(${qpi}) > li.first`);
                                    pageFirst.click();
                                }
                            }, t0);
                        } else {
                            document.querySelectorAll('div[id^="winners_"]').forEach(leaderboard => {
                                leaderboard.querySelectorAll('div > table > tbody > tr').forEach(lbtr => {
                                    const rank = lbtr.querySelector(`td:nth-child(1)`).textContent;
                                    const player = lbtr.querySelector(`td.vertical-align-top.username-overflow-column `).textContent;
                                    if (!tallyMap['tally'][player]) {
                                        tallyMap['tally'][player] = [0, 0, 0, 0, 0];
                                    }
                                    tallyMap['tally'][player][rank - 1]++;
                                });
                            });
                            const eCheck = document.querySelector(`#QuestsBlock > div:nth-child(${qti - 2}) > div.pull-left > label > input`);
                            eCheck.click();
                            countTally();
                            console.log(tallyMap);
                        }
                        function countTally() {
                            startQuery = setInterval(() => {
                                const testTitle = document.querySelector("#QuestsBlock > div:nth-child(1) > table > tbody > tr > td:nth-child(1) > h2");
                                if (testTitle) {
                                    clearInterval(startQuery);
                                    if (qpi) {
                                        var pageNum = 1;
                                        tallyPageIntervalNew = setInterval(() => {
                                            const pageActive = document.querySelector(`#QuestsBlock > ul:nth-child(${qpi}) > li.page.active`);
                                            const questTable = document.querySelector(`#QuestsBlock > table:nth-child(${qti})`);
                                            if (pageActive.textContent == pageNum) {
                                                // console.log('匹配', pageActive.textContent, pageNum)
                                                var ready = 1;
                                                document.querySelectorAll('div[id^="winners_"]').forEach(leaderboard => {
                                                    if (leaderboard.textContent == ' 正在加载...' || leaderboard.textContent == ' Loading...') {
                                                        ready = 0;
                                                    }
                                                });
                                                if (ready) {
                                                    questTable.querySelectorAll('tr[id^="quest_row_"]').forEach(questRow => {
                                                        var newQuestRow = ['', '', '', '', '', '', '', '', ''];
                                                        newQuestRow[0] = questRow.id.match(/quest_row_(\d+)$/)[1];
                                                        var ql = questRow.querySelector('td:nth-child(1)').textContent;
                                                        var qc = questRow.querySelector('td:nth-child(2)').textContent;
                                                        newQuestRow[1] = ql;
                                                        newQuestRow[2] = qc;
                                                        if (qc.includes(keywordEff)) {
                                                            if (qc.includes(keyword[0])) {
                                                                newQuestRow[3] = name[0];
                                                            } else if (qc.includes(keyword[1])) {
                                                                newQuestRow[3] = name[1];
                                                            }
                                                        } else if (qc.includes(keywordAt)) {
                                                            newQuestRow[3] = name[9];
                                                        } else {
                                                            for (let j = 2; j < typeNum; j++) {
                                                                if (qc.includes(keyword[j])) {
                                                                    newQuestRow[3] = name[j];
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                        questRow.querySelectorAll('div[id^="winners_"]').forEach(leaderboard => {
                                                            leaderboard.querySelectorAll('div > table > tbody > tr').forEach(lbtr => {
                                                                const rank = lbtr.querySelector(`td:nth-child(1)`).textContent;
                                                                const player = lbtr.querySelector(`td.vertical-align-top.username-overflow-column `).textContent;
                                                                if (!tallyMap['tally'][player]) {
                                                                    tallyMap['tally'][player] = [0, 0, 0, 0, 0];
                                                                }
                                                                if (rank <= 5) {
                                                                    tallyMap['tally'][player][rank - 1]++;
                                                                    newQuestRow[+rank + 3] = player;
                                                                }
                                                            });
                                                        });
                                                        rawRank.push(newQuestRow);
                                                    });
                                                    pageNum++;
                                                    const pageLastDisabled = document.querySelector(`#QuestsBlock > ul:nth-child(${qpi}) > li.last.disabled`);
                                                    if (pageLastDisabled) {
                                                        // console.log('结束', pageActive.textContent, pageNum)
                                                        clearInterval(tallyPageIntervalNew);
                                                        rawRank.sort((a, b) => a[0] - b[0]);
                                                        rawRank.unshift(rawRankTitle);
                                                        console.log(tallyMap, rawRank);
                                                        chrome.runtime.sendMessage({ action: 'sendEventQuestTallyMap', tallyMap: tallyMap, rawRank: rawRank });
                                                    }
                                                }
                                            } else if (pageActive.textContent < pageNum) {
                                                // console.log('下一页', pageActive.textContent, pageNum)
                                                const pageNext = document.querySelector(`#QuestsBlock > ul:nth-child(${qpi}) > li.next`);
                                                pageNext.click();
                                            } else if (pageActive.textContent > pageNum) {
                                                // console.log('过页', pageActive.textContent, pageNum)
                                                const pageFirst = document.querySelector(`#QuestsBlock > ul:nth-child(${qpi}) > li.first`);
                                                pageFirst.click();
                                            }
                                        }, t0);
                                    } else {
                                        document.querySelectorAll('div[id^="winners_"]').forEach(leaderboard => {
                                            leaderboard.querySelectorAll('div > table > tbody > tr').forEach(lbtr => {
                                                const rank = lbtr.querySelector(`td:nth-child(1)`).textContent;
                                                const player = lbtr.querySelector(`td.vertical-align-top.username-overflow-column `).textContent;
                                                if (!tallyMap['tally'][player]) {
                                                    tallyMap['tally'][player] = [0, 0, 0, 0, 0];
                                                }
                                                tallyMap['tally'][player][rank - 1]++;
                                            });
                                        });
                                        console.log(tallyMap);
                                        chrome.runtime.sendMessage({ action: 'sendEventQuestTallyMap', tallyMap: tallyMap });
                                    }
                                }
                            }, t0);
                        }
                    }
                });
            });
        } else {
            setPopupButtonState(buttonTally, 'disabled');
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'eventQuest') {
        let eqInfo = request.eqInfo;
        console.log('全球任务分析:', eqInfo);   // 在控制台打出结果
        chrome.storage.local.set({ eqInfo: eqInfo });     // 保存数据
        setPopupButtonState('buttonEq', 'success');
        const result = eqInfo.map(item => item + '<br>').join('');
        document.getElementById('result').innerHTML = result;
    } else if (request.action === 'sendEventQuestTallyMap') {
        let tallyMap = request.tallyMap;
        let rawRank = request.rawRank;
        console.log('全球任务排行榜:', tallyMap);   // 在控制台打出结果
        console.log('全球任务排行榜原始数据:', rawRank);   // 在控制台打出结果
        chrome.storage.local.get(['eventQuestTallyMap', 'eventQuestRawRank'], function(result) {
            let eventQuestTallyMap = result.eventQuestTallyMap || {};
            let eventQuestRawRank = result.eventQuestRawRank || {};
            const currentDate = new Date();
            const newMonth = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0');
            eventQuestTallyMap[newMonth] = tallyMap;
            eventQuestRawRank[newMonth] = rawRank;
            chrome.storage.local.set({ eventQuestTallyMap: eventQuestTallyMap });     // 保存数据
            chrome.storage.local.set({ eventQuestRawRank: eventQuestRawRank });     // 保存数据
        });
        setPopupButtonState('buttonEqTally', 'success');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const currentDate = new Date();
    if ((currentDate.getUTCMonth() + 1) % 4 != 0) {
        document.getElementById("event4").style.display = 'none';
    }
});