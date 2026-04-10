document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('buttonWh');
    setPopupButtonState(button, 'disabled');
    chrome.storage.local.get('pId', function (result) {
        const pId = result.pId;
        chrome.tabs.query({ active: true, currentWindow: true }, function (tab1) {
            if (tab1[0].url.includes('https://minesweeper.online/') && tab1[0].url.includes('quests/' + pId)) {
                setPopupButtonState(button, 'ready');
                button.style.cursor = 'pointer'; // 鼠标指针样式
                button.addEventListener('click', function () {
                    setPopupButtonState(button, 'loading');
                    const tabId = tab1[0].id;
                    chrome.scripting.executeScript({
                        target: { tabId },
                        function: extractWheelQuest
                    });
                });
            } else {
                setPopupButtonState(button, 'disabled');
            }
        });
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'sendWheelQuest') {
        let allQuests = request.allQuests;
        console.log('收到任务数据：', allQuests);
        setPopupButtonState('buttonWh', 'success');
        var wheelType = {
            'shard387': '效率',
            'shard388': '竞速',
            'shard390': '连胜',
            'shard391': '高难',
            'shard392': '无猜',
            'shard393': 'pvp/功勋',
            'shard394': '命运任务',
            'shard395': '竞技场',
            'icecream447': '效率',
            'icecream448': '竞速',
            'icecream450': '连胜',
            'icecream451': '高难',
            'icecream452': '无猜',
            'icecream453': 'pvp/功勋',
            'icecream454': '命运任务',
            'icecream455': '竞技场',
            'cake507': '效率',
            'cake508': '竞速',
            'cake510': '连胜',
            'cake511': '高难',
            'cake512': '无猜',
            'cake513': 'pvp/功勋',
            'cake514': '命运任务',
            'cake515': '竞技场'
        }
        var wheelQuests = [['月', '日', '任务内容', '活动任务类型']];
        for (let i = 1; i < allQuests.length; i++) {
            if (allQuests[i][4] == 'Wheel') {
                if (i > 1 && ((allQuests[i][6] == 'shard394' && allQuests[i - 1][6] == 'shard394')
                     || (allQuests[i][6] == 'icecream454' && allQuests[i - 1][6] == 'icecream454')
                     || (allQuests[i][6] == 'cake514' && allQuests[i - 1][6] == 'cake514'))) {
                    continue;
                } else {
                    var wheelRow = [allQuests[i][2], allQuests[i][3], allQuests[i][5], wheelType[allQuests[i][6]]];
                    wheelQuests.push(wheelRow);
                }
            }
        }
        console.log(wheelQuests);
        var questsLeft = [
            ['效率', '竞速', '连胜', '高难', '无猜', 'pvp/功勋', '命运任务', '竞技场'],
            [0, 0, 0, 0, 0, 0, 0, 0], // 0为每日剩余
            [0, 0, 0, 0, 0, 0, 0, 0] // 0为周期剩余
        ];
        var dailyNum = 0;
        var roundNum = 0;
        const currentDate = new Date();
        const date = currentDate.getUTCDate();
        for (let i = 1; i < wheelQuests.length; i++) {
            if (wheelQuests[i][1] == date) {
                for (let j = 0; j < questsLeft[0].length; j++) {
                    if (questsLeft[0][j] == wheelQuests[i][3]) {
                        questsLeft[1][j] = 1;
                        break;
                    }
                }
                dailyNum++;
            } else {
                break;
            }
        }
        for (let i = 1; i <= (wheelQuests.length - 1) % 8; i++) {
            for (let j = 0; j < questsLeft[0].length; j++) {
                if (questsLeft[0][j] == wheelQuests[i][3]) {
                    questsLeft[2][j] = 1;
                    break;
                }
            }
            roundNum++;
        }
        console.log(questsLeft);
        var wheelOutput = '';
        if (dailyNum == 8) {
            wheelOutput += '今日转盘已转满 ';
            if (roundNum == 0) {
            wheelOutput += '\n明日无优先任务';
            } else {
                wheelOutput += '\n明日优先任务：';
                for (let i = 0; i < 8; i++) {
                    if (questsLeft[2][i] == 0) {
                        wheelOutput += questsLeft[0][i] + ' ';
                    }
                }
            }
        } else if (dailyNum >= roundNum) {
            wheelOutput += '今日剩余任务：';
            for (let i = 0; i < 8; i++) {
                if (questsLeft[1][i] == 0) {
                    wheelOutput += questsLeft[0][i] + ' ';
                }
            }
            if (roundNum == 0) {
            wheelOutput += '\n如果今日不转，明日无优先任务';
            } else {
                wheelOutput += '\n如果今日不转，明日优先任务：';
                for (let i = 0; i < 8; i++) {
                    if (questsLeft[2][i] == 0) {
                        wheelOutput += questsLeft[0][i] + ' ';
                    }
                }
            }
        } else if (dailyNum < roundNum) {
            wheelOutput += '今日优先任务：';
            for (let i = 0; i < 8; i++) {
                if (questsLeft[2][i] == 0) {
                    questsLeft[1][i] = 2;
                    wheelOutput += questsLeft[0][i] + ' ';
                }
            }
            wheelOutput += '\n今日后续任务：';
            for (let i = 0; i < 8; i++) {
                if (questsLeft[1][i] == 0) {
                    wheelOutput += questsLeft[0][i] + ' ';
                }
            }
            wheelOutput += '\n如果今日不转，明日优先任务：';
            for (let i = 0; i < 8; i++) {
                if (questsLeft[2][i] == 0) {
                    wheelOutput += questsLeft[0][i] + ' ';
                }
            }
        }
        console.log(wheelOutput);
        document.getElementById("resultWh").innerHTML = wheelOutput.replaceAll('\n', '<br>');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const currentDate = new Date();
    if ((currentDate.getUTCMonth() + 1) % 4 != 3) {
        document.getElementById("event3").style.display = 'none';
    }
});