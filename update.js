/* 刷新按钮状态 */
function setMainButtonState(buttonId, state) {
    if (typeof window.setButtonState === 'function') {
        window.setButtonState(buttonId, state);
    }
}

/* 刷新任务打开页追踪与统一关闭 */
if (!window.__refreshTabMap) {
    window.__refreshTabMap = {};
}

function registerRefreshTab(taskKey, tabId) {
    if (!taskKey || typeof tabId !== 'number') {
        return;
    }
    window.__refreshTabMap[taskKey] = tabId;
}

function closeRefreshTab(taskKey) {
    const tabId = window.__refreshTabMap[taskKey];
    if (typeof tabId !== 'number') {
        return false;
    }
    delete window.__refreshTabMap[taskKey];
    chrome.tabs.remove(tabId, function() {});
    return true;
}

window.closeRefreshTab = closeRefreshTab;

/* 刷新价格、个人数据 */
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('update').addEventListener('click', function () {
        // const button = document.getElementById('update');
        // button.style.backgroundColor = '#ff9f18';   // 对应按钮变为橙色，表示运行中
        const pId = document.getElementById('pIdNow').innerText;
        if (!pId) {
            window.alert('请先设置用户uID（个人主页网址中的数字）');
            return;
        }
        updateGems();
        updateArenaTickets();
        updateStatistics();
        updatePersonalData();
        updateEconomy();
        updateEquipmentStats();
        const currentDate = new Date();
        if ((currentDate.getUTCMonth() + 1) % 4 == 1 && currentDate.getUTCDate() > 3) { // 如果活动竞技场开启，刷新价格
            updateEventArenaTickets();
        }
        if ((currentDate.getUTCMonth() + 1) % 4 == 2 && currentDate.getUTCDate() > 3) { // 如果友谊任务开启，刷新任务
            updateFriendQuest5Pages();
        }
    });
}); 
/* 刷新宝石场币 */
function updateGems() {
    document.getElementById('flag1').textContent = 0;
    setMainButtonState('updateMarketPage', 'loading');
    chrome.tabs.create({ url: 'https://minesweeper.online/cn/marketplace', active: true }, function (tab1) {
        const ti1 = tab1.id;
        registerRefreshTab('gems', ti1);
        var t1 = 1000;
        var flag;
        var count = 1;
        var countMax = 100;
        extractGems(ti1);
        intervalGems = setInterval(() => {
            flag = document.getElementById('flag1').textContent;
            if (flag == 1) {
                clearInterval(intervalGems);
                closeRefreshTab('gems');
            } else if (count > countMax) {
                clearInterval(intervalGems);
                closeRefreshTab('gems');
                setMainButtonState('updateMarketPage', 'error');
            } else {
                count++;
            }
        }, t1);

        // recur(ti1, 0);
        // function recur(tabId, i) {
        //     var maxI = 50;
        //     var t0 = 200;
        //     setTimeout(() => {
        //         extract(tabId);
        //         const flag = document.getElementById('flag1').textContent;
        //         if (flag == 1 || i > maxI) {
        //             chrome.tabs.remove(tabId, function() {});
        //         } else {
        //             recur(tabId, i + 1);
        //         }
        //     }, i * t0);
        // }
        function extractGems(tabId) {
            chrome.scripting.executeScript({
                target: { tabId },
                function: extractGemsPrice
            });
        }
    });
}
/* 刷新竞技场门票 */
function updateArenaTickets() {
    document.getElementById('flag2').textContent = 0;
    setMainButtonState('updateAtPrice', 'loading');
    chrome.storage.local.get('autoUpdate', function (result) {
        // var backgroundCoe = 1;
        chrome.tabs.create({ url: 'https://minesweeper.online/cn/marketplace', active: true }, function (tab2) {
            const ti2 = tab2.id;
            registerRefreshTab('tickets', ti2);
            var t1 = 1000;
            extractAt(ti2);
            var flag;
            var count = 1;
            var countMax = 600;
            checkIntervalAt = setInterval(() => {
                flag = document.getElementById('flag2').textContent;
                if (flag == 1) {
                    clearInterval(checkIntervalAt);
                    closeRefreshTab('tickets');
                } else if (count > countMax) {
                    clearInterval(checkIntervalAt);
                    closeRefreshTab('tickets');
                    setMainButtonState('updateAtPrice', 'error');
                } else {
                    count++;
                }
            }, t1);

            function extractAt(tabId) {
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: extractTicketPrice
                });
            }
        });
    });
}
/* 刷新装备加成 */
function updateEquipmentStats() {
    document.getElementById('flagEquip').textContent = 0;
    setMainButtonState('updateEquipmentStats', 'loading');
    chrome.tabs.create({ url: 'https://minesweeper.online/cn/equipment', active: true }, function (tabEquip) {
        const tiEquip = tabEquip.id;
        registerRefreshTab('equip', tiEquip);
        var t1 = 1000;
        var flag;
        var count = 1;
        var countMax = 30;
        extractEquip(tiEquip);
        intervalEquip = setInterval(() => {
            flag = document.getElementById('flagEquip').textContent;
            if (flag == 1) {
                clearInterval(intervalEquip);
                closeRefreshTab('equip');
            } else if (count > countMax) {
                clearInterval(intervalEquip);
                closeRefreshTab('equip');
                setMainButtonState('updateEquipmentStats', 'error');
            } else {
                count++;
            }
        }, t1);

        function extractEquip(tabId) {
            chrome.scripting.executeScript({
                target: { tabId },
                function: extractEquipStats
            });
        }
    });

}
/* 刷新游戏数据 */
function updateStatistics() {
    const pId = document.getElementById('pIdNow').innerText;
    document.getElementById('flag5').textContent = 0;
    setMainButtonState('updateStatistic', 'loading');
    const u1 = 'https://minesweeper.online/cn/statistics/' + pId;
    chrome.tabs.create({ url: u1, active: true }, function (tab5) {
        const ti5 = tab5.id;
        registerRefreshTab('statistics', ti5);
        var t1 = 1000;
        var flag;
        var count = 1;
        var countMax = 30;
        extractStats(ti5);
        intervalStats = setInterval(() => {
            flag = document.getElementById('flag5').textContent;
            if (flag == 1) {
                clearInterval(intervalStats);
                closeRefreshTab('statistics');
            } else if (count > countMax) {
                clearInterval(intervalStats);
                closeRefreshTab('statistics');
                setMainButtonState('updateStatistic', 'error');
            } else {
                count++;
            }
        }, t1);

        function extractStats(tabId) {
            chrome.scripting.executeScript({
                target: { tabId },
                function: extractStatistics
            });
        }
    });
}
/* 刷新个人数据 */
function updatePersonalData() {
    const pId = document.getElementById('pIdNow').innerText;
    document.getElementById('flag3').textContent = 0;
    setMainButtonState('updatePersonalData', 'loading');
    const u2 = 'https://minesweeper.online/cn/player/' + pId;
    chrome.tabs.create({ url: u2, active: true }, function (tab3) {
        const ti3 = tab3.id;
        registerRefreshTab('personal', ti3);
        var t1 = 1000;
        var flag;
        var count = 1;
        var countMax = 30;
        extractPd(ti3);
        intervalPd = setInterval(() => {
            flag = document.getElementById('flag3').textContent;
            if (flag == 1) {
                clearInterval(intervalPd);
                closeRefreshTab('personal');
            } else if (count > countMax) {
                clearInterval(intervalPd);
                closeRefreshTab('personal');
                setMainButtonState('updatePersonalData', 'error');
            } else {
                count++;
            }
        }, t1);

        function extractPd(tabId) {
            chrome.scripting.executeScript({
                target: { tabId },
                function: extractPersonalData
            });
        }
    });
}
/* 刷新游戏经济 */
function updateEconomy() {
    document.getElementById('flagPe').textContent = 0;
    setMainButtonState('updateEconomy', 'loading');
    chrome.tabs.create({ url: 'https://minesweeper.online/cn/economy', active: true }, function (tabEco) {
        const tiE = tabEco.id;
        registerRefreshTab('economy', tiE);
        var t1 = 1000;
        var flag;
        var count = 1;
        var countMax = 40;
        extractEco(tiE);
        intervalEco = setInterval(() => {
            flag = document.getElementById('flagPe').textContent;
            if (flag == 1) {
                clearInterval(intervalEco);
                closeRefreshTab('economy');
            } else if (count > countMax) {
                clearInterval(intervalEco);
                closeRefreshTab('economy');
                setMainButtonState('updateEconomy', 'error');
            } else {
                count++;
            }
        }, t1);

        function extractEco(tabId) {
            chrome.scripting.executeScript({
                target: { tabId },
                function: extractEconomy
            });
        }
    });
}

/* 分析全球任务 */
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('updateEq').addEventListener('click', function () {
        setMainButtonState('updateEq', 'loading');
        document.getElementById('flag4').textContent = 0;
        chrome.tabs.create({ url: 'https://minesweeper.online/cn/event-quests', active: true }, function (tab0) {
            const ti0 = tab0.id;
            registerRefreshTab('eventQuest', ti0);
            recurEq(ti0, 0);

            function recurEq(tabId, i) {
                var maxI = 50;
                var t0 = 200;
                setTimeout(() => {
                    extractEq(tabId);
                    const flag = document.getElementById('flag4').textContent;
                    if (flag == 1 || i > maxI) {
                        closeRefreshTab('eventQuest');
                        if (flag != 1) {
                            setMainButtonState('updateEq', 'error');
                        }
                    } else {
                        recurEq(tabId, i + 1);
                    }
                }, i * t0);
            }
            function extractEq(tabId) {
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: extractEventQuest
                });
            }
        });
    });
});

/* 分析转盘选项 */
document.addEventListener('DOMContentLoaded', function () {
    const button = document.getElementById('updateWheel');
    button.addEventListener('click', function () {
        setMainButtonState('updateWheel', 'loading');
        document.getElementById('flagWheel').textContent = 0;
        const pId = document.getElementById('pIdNow').innerText;
        document.getElementById('flag3').textContent = 0;
        const uw = 'https://minesweeper.online/cn/quests/' + pId;
        chrome.tabs.create({ url: uw, active: true }, function (tab) {
            const ti = tab.id;
            registerRefreshTab('wheel', ti);
            var t1 = 1000;
            analyseWheel(ti);
            var flag;
            var count = 1;
            var countMax = 120;
            checkIntervalWh = setInterval(() => {
                flag = document.getElementById('flagWheel').textContent;
                if (flag == 1) {
                    clearInterval(checkIntervalWh);
                    closeRefreshTab('wheel');
                } else if (count > countMax) {
                    clearInterval(checkIntervalWh);
                    closeRefreshTab('wheel');
                    setMainButtonState('updateWheel', 'error');
                } else {
                    count++;
                }
            }, t1);

            function analyseWheel(tabId) {
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: extractWheelQuest
                });
            }
        });
    });
});
