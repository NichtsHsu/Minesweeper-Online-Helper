/*
 * 共享内容脚本函数
 * 这些函数通过 chrome.scripting.executeScript 注入到目标网页中执行。
 * 主页面（index.html）和弹出页面（displayPage.html）共同引用。
 */

/* ===== 宝石/场币/碎片价格提取 ===== */
function extractGemsPrice() {
    var priceMap = [
        ['黄玉', '红宝石', '蓝宝石', '紫水晶', '缟玛瑙', '海蓝宝石', '祖母绿', '石榴石', '碧玉', '钻石'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['金竞技场币', '铜竞技场币', '银竞技场币', '镍竞技场币', '钢竞技场币', '铁竞技场币', '钯竞技场币', '钛竞技场币', '锌竞技场币', '铂竞技场币'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['稀有碎片', '史诗碎片', '传说碎片', '完美碎片'],
        [0, 0, 0, 0],
        ['完美T', '完美R', '完美S', '完美A', '完美O', '完美Q', '完美E', '完美G', '完美J', '完美D'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
    var chsGemName = ['黄玉', '红宝石', '蓝宝石', '紫水晶', '缟玛瑙', '海蓝宝石', '祖母绿', '石榴石', '碧玉', '钻石'];
    var enGemName = [
        ['Topaz', 'Ruby', 'Sapphire', 'Amethyst', 'Onyx', 'Aquamarine', 'Emerald', 'Garnet', 'Jade', 'Diamond'],
        ['topaz', 'ruby', 'sapphire', 'amethyst', 'onyx', 'aquamarine', 'emerald', 'garnet', 'jade', 'diamond']
    ];
    var t0 = 100;
    var tm = 10;
    var typeIndex = [1, 2, 0, 3, 4, 5, 6, 7, 8, 9]; // 修正黄玉顺序
    try {
        loadQuery = setInterval(() => {
            let testItem = document.querySelector("#stat_table_body > tr:nth-child(1) > td:nth-child(3)");
            if (testItem) {
                clearInterval(loadQuery);
                queryGems();
            }
        }, t0);
    } catch (e) {
        console.error('错误页面', e);
    }
    // 查询宝石场币碎片
    function queryGems() {
        for (let t = 0; t < tm; t++) {
                priceMap[1][typeIndex[t]] = document.querySelector(`#stat_table_body > tr:nth-child(${t + 1}) > td:nth-child(3)`).textContent;
                priceMap[3][typeIndex[t]] = document.querySelector(`#stat_table_body > tr:nth-child(${t + 11}) > td:nth-child(3)`).textContent;
            }
        for (let i = 0; i < 4; i++) {
            priceMap[5][i] = document.querySelector(`#stat_table_body > tr:nth-last-child(${4 - i}) > td:nth-child(3)`).textContent.replace(/ /g, "");
        }
        setTimeout(() => {
            let liParts = document.querySelector("#market_search_filters_left > span > ul > li:nth-child(6) > a");
            liParts.click();
            let liPerParts = document.querySelector("#market_search_filters_left > span:nth-child(4) > ul > li:nth-child(5) > a");
            liPerParts.click();
            queryPerPartsProgress(0);
        }, t0);
    }
    // 递归查询完美碎片
    function queryPerPartsProgress(type) {
        let liType = document.querySelector(`#market_search_filters_left > span:nth-child(5) > ul > li:nth-child(${type + 2}) > a`);
        liType.click();
        perPartsTypeQuery = setInterval(() => {
            let itemName = document.querySelector("#stat_table_body > tr:nth-child(1) > td:nth-child(2) > span > span");
            if (itemName && (itemName.textContent.includes(chsGemName[typeIndex[type]]) || itemName.textContent.includes(enGemName[1][typeIndex[type]]))) {
                console.log(itemName.textContent, chsGemName[typeIndex[type]])
                clearInterval(perPartsTypeQuery);
                let itemPrice = document.querySelector("#stat_table_body > tr:nth-child(1) > td:nth-child(3)");
                priceMap[7][typeIndex[type]] = itemPrice.textContent.replace(/ /g, "");
                if (type < tm - 1) { // 查找下一个
                    queryPerPartsProgress(type + 1);
                } else { // type == 9 为最后一个，输出结果
                    console.log(priceMap);
                    chrome.runtime.sendMessage({ action: 'sendGemsPrice', gemsPrice: priceMap });
                }
            }
        }, t0);
    }
}

/* ===== 竞技场门票价格提取 ===== */
function extractTicketPrice() {
    try {
        var priceMap = [
            ['', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'],
            ['速度', 0, 0, 0, 0, 0, 0, 0, 0],
            ['速度NG', 0, 0, 0, 0, 0, 0, 0, 0],
            ['盲扫', 0, 0, 0, 0, 0, 0, 0, 0],
            ['效率', 0, 0, 0, 0, 0, 0, 0, 0],
            ['高难度', 0, 0, 0, 0, 0, 0, 0, 0],
            ['随机难度', 0, 0, 0, 0, 0, 0, 0, 0],
            ['硬核', 0, 0, 0, 0, 0, 0, 0, 0],
            ['硬核NG', 0, 0, 0, 0, 0, 0, 0, 0],
            ['耐力', 0, 0, 0, 0, 0, 0, 0, 0],
            ['噩梦', 0, 0, 0, 0, 0, 0, 0, 0]
        ];
        var t0 = 100; // 等待间隔
        var typeMax = 10; // 多少种竞技场
        var levelMax = 8; // 最大等级

        function selectTicket(type, level) { // 选择市场中的单个门票条目
            setTimeout(() => {
                let typeMenu = document.querySelector(`#market_search_filters_left > span:nth-child(4) > ul > li:nth-child(${type + 2}) > a`);
                typeMenu.click(); // 选择门票种类
                let levelMenu = document.querySelector(`#market_search_filters_left > span:nth-child(5) > ul > li:nth-child(${level + 2}) > a`);
                levelMenu.click(); // 选择门票等级
            }, t0);
        }
        function queryTicket() { // 查询当前页面最低价是否存在
            let price = document.querySelector("#stat_table_body > tr:nth-child(1) > td:nth-child(3)");
            let name = document.querySelector("#stat_table_body > tr:nth-child(1) > td:nth-child(2) > span");
            if (price && name) {
                let queryResult = [name.textContent, price.textContent.replace(/ /g, "")];    // 删去可能的空格 1 200 -> 1200
                return queryResult;
            } else {
                return null;
            }
        }
        function queryProgress(type, level) { // 递归查询函数
            selectTicket(type, level);
            setTimeout(() => {
                var count = 1;
                var countMax = 50;
                checkInterval = setInterval(() => { // 循环调用queryTicket查找是否有数据
                    let queryResult = queryTicket();
                    if (queryResult) {
                        if (queryResult[0].includes(priceMap[type + 1][0]) && queryResult[0].includes(priceMap[0][level + 1])) {
                            console.log('找到：L', level + 1, ' type', type + 1, queryResult);
                            clearInterval(checkInterval); // 查询成功后停止循环
                            priceMap[type + 1][level + 1] = queryResult[1];
                            if (type == typeMax - 1) {
                                if (level == levelMax - 1) { // 已到达最后一张（噩梦8）
                                    console.log(priceMap);
                                    chrome.runtime.sendMessage({ action: 'sendTicketPrice', ticketPrice: priceMap });
                                } else {
                                    queryProgress(type, level + 1); // 其他情况递归进入下一张票
                                }
                            } else {
                                if (level == levelMax - 1) {
                                    queryProgress(type + 1, 0);
                                } else {
                                    queryProgress(type, level + 1);
                                }
                            }
                        } else {
                            count++;
                            console.log('匹配错误：L', level + 1, ' type', type + 1, queryResult);
                        }
                    } else if (count == countMax) {
                        console.log('暂无L', level + 1, ' type', type + 1, '票价');
                        clearInterval(checkInterval); // 查询超时，停止循环
                        if (type == typeMax - 1) {
                            if (level == levelMax - 1) { // 已到达最后一张（噩梦8）
                                console.log(priceMap);
                                chrome.runtime.sendMessage({ action: 'sendTicketPrice', ticketPrice: priceMap });
                            } else {
                                queryProgress(type, level + 1); // 其他情况递归进入下一张票
                            }
                        } else {
                            if (level == levelMax - 1) {
                                queryProgress(type + 1, 0);
                            } else {
                                queryProgress(type, level + 1);
                            }
                        }
                    } else {
                        count++;
                        console.log('未找到：L', level + 1, ' type', type + 1);
                    }
                }, t0);
            }, t0 * 2);
        }
        startAtQuery = setInterval(() => {
            let choice1 = document.querySelector("#market_search_filters_left > span > ul > li:nth-child(4) > a");
            if (choice1) {
                clearInterval(startAtQuery);
                choice1.click(); // 选择竞技场门票分类
                atCategoryInterval = setInterval(() => {
                    let firstItem = document.querySelector("#stat_table_body > tr:nth-child(1) > td:nth-child(2) > span")
                    if (firstItem.textContent.includes('L')) {
                        clearInterval(atCategoryInterval);
                        queryProgress(0, 0);
                    }
                }, t0);
            }
        }, t0);
    } catch (e) {
        console.error(e);
    }
}

/* ===== 装备加成提取 ===== */
function extractEquipStats() {
    var equipStats = [
        ['经验', '金币', '竞技场门票', '每日任务', '赛季任务', '任务等级', '竞技场币', '活跃度', '活动物品', '精英任务'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['黄玉', '红宝石', '蓝宝石', '紫水晶', '缟玛瑙', '海蓝宝石', '祖母绿', '石榴石', '碧玉'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
    var t0 = 100;
    try {
        startEquipQuery = setInterval(() => {
            let allStats = document.querySelector("#EquipmentBlock > div:nth-child(1) > div.pull-right > span:nth-child(3) > img");
            if (allStats) {
                clearInterval(startEquipQuery);

                hoverBox(allStats);
                let list = document.querySelector("body > div.popover.fade.bottom.in > div.popover-content > div > div");

                const statMap = {
                    '经验': 0,
                    '金币': 1,
                    '竞技场门票': 2,
                    '每日任务': 3,
                    '赛季任务': 4,
                    '任务等级': 5,
                    '竞技场币': 6,
                    '活跃度': 7,
                    '活动物品': 8,
                    '精英任务': 9
                };
                const gemMap = {
                    '黄玉': 0,
                    '红宝石': 1,
                    '蓝宝石': 2,
                    '紫水晶': 3,
                    '缟玛瑙': 4,
                    '海蓝宝石': 5,
                    '祖母绿': 6,
                    '石榴石': 7,
                    '碧玉': 8
                };
                let baseGemBonus = '0';
                const extraGemBonus = {};
    
                for (const item of list.children) {
                    const match = item.textContent.trim().match(/^([^:：]+)[:：]\s*(.+)$/);
                    if (!match) {
                        continue;
                    }
                    const key = match[1].trim();
                    const value = match[2].trim();

                    if (key in statMap) {
                        equipStats[1][statMap[key]] = normalizeStatValue(key, value);
                    } else if (key === '宝石') {
                        baseGemBonus = value;
                    } else if (key in gemMap) {
                        extraGemBonus[key] = value;
                    }
                }

                for (const gemName in gemMap) {
                    const gemIdx = gemMap[gemName];
                    equipStats[3][gemIdx] = baseGemBonus;
                    if (extraGemBonus[gemName]) {
                        equipStats[3][gemIdx] = mergeGemBonus(baseGemBonus, extraGemBonus[gemName]);
                    }
                }

                console.log(equipStats);
                chrome.runtime.sendMessage({ action: 'sendEquipStats', equipStats: equipStats });
            }
        }, t0);
    } catch (e) {
        console.error('错误页面', e);
    }

    /* 模拟鼠标悬浮在button */
    function hoverBox(button) {
        let event = new MouseEvent("mouseover", {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: button.getBoundingClientRect().left + button.offsetWidth / 2,
            clientY: button.getBoundingClientRect().top + button.offsetHeight / 2
        });
        button.dispatchEvent(event);
    }

    function mergeGemBonus(baseValue, addValue) {
        const baseNum = parseMul(baseValue);
        const addNum = parseMul(addValue);
        if (baseNum !== null && addNum !== null) {
            return formatMul(baseNum + addNum);
        }
        return String(baseValue || '').replace(/^\+/, '');
    }

    function parseMul(text) {
        const m = String(text || '').replace(/\s+/g, '').match(/^([+-]?\d+(?:\.\d+)?)x$/i);
        return m ? parseFloat(m[1]) : null;
    }

    function formatMul(num) {
        const rounded = Math.round(num * 10000) / 10000;
        return String(rounded).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1') + 'x';
    }

    function normalizeStatValue(key, value) {
        const text = String(value || '').trim();
        if (key === '任务等级') {
            return text.replace(/^L\s*/i, '');
        }
        return text;
    }
}

/* ===== 游戏数据提取 ===== */
function extractStatistics() {
    var statistics = [
        ['总局数', '胜局数', '总耗时', '完成的任务', '完成的竞技场', '已解决3BV', '经验', '金币', '宝石', '竞技场门票', '活跃度', '活动物品', '竞技场币'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
    var t0 = 100;
    try {
        startStatsQuery = setInterval(() => {
            var totalGames = document.querySelector("#aggregate > div > div:nth-child(1) > strong:nth-child(1)");
            if (totalGames) {
                clearInterval(startStatsQuery);
                statistics[1][0] = totalGames.textContent.replace(/ /g, "");
                var totalWins = document.querySelector("#aggregate > div > div:nth-child(1) > strong:nth-child(3)");
                statistics[1][1] = totalWins.textContent.replace(/ /g, "");
                var totalTime = document.querySelector("#aggregate > div > div:nth-child(1) > strong:nth-child(5)");
                statistics[1][2] = totalTime.textContent.replace(/ /g, "");
                var quests = document.querySelector("#aggregate > div > div:nth-child(1) > span:nth-child(7)");
                statistics[1][3] = quests.textContent.replace(/ /g, "");
                var arenas = document.querySelector("#aggregate > div > div:nth-child(1) > span:nth-child(9)");
                statistics[1][4] = arenas.textContent.replace(/ /g, "");
                var bv = document.querySelector("#aggregate > div > div:nth-child(1) > strong:nth-child(11)");
                statistics[1][5] = bv.textContent.replace(/ /g, "");
                var experience = document.querySelector("#aggregate > div > div:nth-child(2) > span:nth-child(1)");
                statistics[1][6] = experience.textContent.replace(/ /g, "");
                var minecoins = document.querySelector("#aggregate > div > div:nth-child(2) > span:nth-child(3)");
                statistics[1][7] = minecoins.textContent.replace(/ /g, "");
                var gems = document.querySelector("#aggregate > div > div:nth-child(2) > span:nth-child(5) > span > span");
                statistics[1][8] = gems.textContent.replace(/ /g, "");
                var tickets = document.querySelector("#aggregate > div > div:nth-child(2) > span:nth-child(7)");
                statistics[1][9] = tickets.textContent.replace(/ /g, "");
                var activity = document.querySelector("#aggregate > div > div:nth-child(2) > span:nth-child(9)");
                statistics[1][10] = activity.textContent.replace(/ /g, "");
                var eventPoints = document.querySelector("#aggregate > div > div:nth-child(2) > span:nth-child(11)");
                statistics[1][11] = eventPoints.textContent.replace(/ /g, "");
                var arenaCoins = document.querySelector("#aggregate > div > div:nth-child(2) > span:nth-child(13) > span > span");
                statistics[1][12] = arenaCoins.textContent.replace(/ /g, "");
                
                console.log(statistics);
                chrome.runtime.sendMessage({ action: 'sendStatistics', statistics: statistics });
            }
        }, t0);
    } catch (e) {
        console.error('错误页面', e);
    }
}

/* ===== 个人数据提取 ===== */
function extractPersonalData() {
    var personalData = [
        ['黄玉', '红宝石', '蓝宝石', '紫水晶', '缟玛瑙', '海蓝宝石', '祖母绿', '石榴石', '碧玉', '钻石'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['金竞技场币', '铜竞技场币', '银竞技场币', '镍竞技场币', '钢竞技场币', '铁竞技场币', '钯竞技场币', '钛竞技场币', '锌竞技场币', '铂竞技场币'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['竞技场门票', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'],
        ['速度', 0, 0, 0, 0, 0, 0, 0, 0],
        ['速度NG', 0, 0, 0, 0, 0, 0, 0, 0],
        ['盲扫', 0, 0, 0, 0, 0, 0, 0, 0],
        ['效率', 0, 0, 0, 0, 0, 0, 0, 0],
        ['高难度', 0, 0, 0, 0, 0, 0, 0, 0],
        ['随机难度', 0, 0, 0, 0, 0, 0, 0, 0],
        ['硬核', 0, 0, 0, 0, 0, 0, 0, 0],
        ['硬核NG', 0, 0, 0, 0, 0, 0, 0, 0],
        ['耐力', 0, 0, 0, 0, 0, 0, 0, 0],
        ['噩梦', 0, 0, 0, 0, 0, 0, 0, 0],
        [],
        ['资源'],
        ['金币', '宝石', '竞技场币', '竞技场门票', '装备', '装备碎片', '功勋点', '活动物品'],
        [0, 0, 0, 0, 0, 0, 0, 0],
        ['装备加成'],
        ['经验', '金币', '宝石', '竞技场门票', '每日任务', '赛季任务', '任务等级', '竞技场币', '', '活跃度', '活动物品'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['黄玉', '红宝石', '蓝宝石', '紫水晶', '缟玛瑙', '海蓝宝石', '祖母绿', '石榴石', '碧玉'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['奖杯', 0, '排名', ''],
        ['Time', '效率', '经验', '装备', '动态胜率', '连胜', '竞技场', '难度', '开速', '成就'],
        ['', '', '', '', '', '', '', '', '', ''],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['昵称'],
        ['']
    ];
    var row = 0;        // 当前录入行
    var t0 = 100;
    try {
        startPdQuery = setInterval(() => {
            let userName = document.querySelector("#PlayerBlock > h2 > div.pull-left > span");
            if (userName) {
                clearInterval(startPdQuery);
                let gem = document.querySelector("#PlayerBlock > div:nth-child(3) > div:nth-child(7) > div.col-xs-8.form-text > span > span:nth-child(3)");
                if (gem) {
                    hoverBox(gem);      // 鼠标悬浮展开宝石数量
                }
                let coin = document.querySelector("#PlayerBlock > div:nth-child(3) > div:nth-child(7) > div.col-xs-8.form-text > span > span:nth-child(4)");
                if (coin) {
                    hoverBox(coin);     // 鼠标悬浮展开竞技场币数量
                }
                let ticket = document.querySelector("#PlayerBlock > div:nth-child(3) > div:nth-child(7) > div.col-xs-8.form-text > span > span:nth-child(5)");
                if (ticket) {
                    hoverBox(ticket);   // 鼠标悬浮展开竞技场门票数量
                }
                let equipment = document.querySelector("#PlayerBlock > div:nth-child(3) > div:nth-child(6) > div.col-xs-8.form-text > table > tbody > tr > td:nth-last-child(1) > span > span");
                if (equipment) {
                    hoverBox(equipment);   // 鼠标悬浮展开装备信息
                }
                let trophy = document.querySelector("#PlayerBlock > div:nth-child(3) > div:nth-child(2) > div.col-xs-8.form-text > span");
                if (trophy) {
                    trophy.click(); // 20250120更新改为点击弹出
                    hoverBox(trophy);   // 鼠标悬浮展开奖杯信息
                }
    
                let popoverList = document.querySelectorAll("div.popover.fade.top.in, div.popover.fade.left.in");
    
                let gemList;
                let coinList;
                let ticketList;
                let equipList;
                /* 检查弹窗种类 */
                for (let i = 0; i < popoverList.length; i++) {
                    const judge1 = popoverList[i].querySelector("div.popover-content > table > tbody > tr:nth-child(1) > td:nth-child(3)");
                    const judge2 = popoverList[i].querySelector("div.popover-content > div > span:nth-child(1) > i");
                    const judge3 = popoverList[i].querySelector("div.popover-content > div > div:nth-child(1)");
                    if (judge3) {
                        equipList = popoverList[i].querySelector("div.popover-content > div > div:nth-child(5) > div");
                    } else if (judge2) {
                        ticketList = popoverList[i].querySelector("div.popover-content > div");
                    } else if (judge1) {
                        if (personalData[0].includes(judge1.textContent)) {
                            gemList = popoverList[i].querySelector("div.popover-content > table > tbody");;
                        } else {
                            coinList = popoverList[i].querySelector("div.popover-content > table > tbody");
                        }
                    }
                }
                
                /* 读宝石数量 */
                if (gemList) {
                    let gems = gemList.children;
                    for (let i = 0; i < gems.length; i++) {
                        let gemPrice = gems[i].querySelector("td.text-right");
                        let gemName = gems[i].querySelector("td:nth-child(3)");
                        for (let j = 0; j < 10; j++) {
                            if (gemName && personalData[row][j] == gemName.textContent) {
                                personalData[row + 1][j] = gemPrice.textContent.replace(/ /g, "");
                                break;
                            }
                        }
                    }
                }
                row += 2;
    
                /* 读竞技场币数量 */
                if (coinList) {
                    let coins = coinList.children;
                    for (let i = 0; i < coins.length; i++) {
                        let coinPrice = coins[i].querySelector("td.text-right");
                        let coinName = coins[i].querySelector("td:nth-child(3)");
                        for (let j = 0; j < 10; j++) {
                            if (coinName && personalData[row][j] == coinName.textContent) {
                                personalData[row + 1][j] = coinPrice.textContent.replace(/ /g, "");
                                break;
                            }
                        }
                    }
                }
                row += 3;       // 空一行
    
                /* 读竞技场门票数量 */
                if (ticketList) {
                    let tickets = ticketList.children;
                    for (let i = 0; i < tickets.length; i++) {
                        let typeClass = tickets[i].querySelector("i.fa-ticket");
                        var type = typeClass.className.match(/ticket(\d+)/)[1];
                        if (type > 10) { // 如果有活动票
                            personalData[15][0] = '活动竞技场';
                            type = 11;
                        }
                        var level = tickets[i].textContent.match(/L(\d+)/)[1];
                        var num = tickets[i].querySelector("span.tickets-amount").textContent.match(/\d+/)[0];
                        var n = num.replace(/ /g, "");
                        personalData[row + +type - 1][level] = n;
                    }
                }
                var levelMax = 8; // 最大等级
                if (personalData[15]) {
                    for (let l = 0; l < levelMax; l++) {
                        if (!personalData[15][l + 1]) { 
                            console.log(personalData[15][l + 1]);
                            personalData[15][l + 1] = 0;
                        }
                    }
                }
                row += 12;      // 空一行
    
                /* 读资源数 */
                let resource = document.querySelector("#PlayerBlock > div:nth-child(3) > div:nth-child(7) > div.col-xs-8.form-text > span");
                let coinEle = document.querySelector("#PlayerBlock > div:nth-child(3) > div:nth-child(7) > div.col-xs-8.form-text > span > span:nth-child(1)");
                personalData[row + 1][0] = coinEle.getAttribute('data-original-title').replace(/\s+/g, '');
                const spans = resource.querySelectorAll("span");
                spans.forEach((span) => {
                    if (span.querySelector("img")) {
                        if (span.querySelector("img").className.includes('gem')) {
                            personalData[row + 1][1] = span.querySelector("span").textContent.replace(/\s+/g, '');
                        } else if (span.querySelector("img").className.includes('arena')) {
                            personalData[row + 1][2] = span.querySelector("span").textContent.replace(/\s+/g, '');
                        } else if (span.querySelector("img").className.includes('eq')) {
                            personalData[row + 1][4] = span.querySelector("span").textContent.replace(/\s+/g, '');
                        } else if (span.querySelector("img").className.includes('parts')) {
                            personalData[row + 1][5] = span.textContent.replace(/\s+/g, '');
                        }
                    } else if (span.querySelector("i")) {
                        personalData[row + 1][3] = span.querySelector("span").textContent.replace(/\s+/g, '');
                    }
                });
                let hp = document.querySelector("#PlayerBlock > div:nth-child(3) > div:nth-child(5) > div.col-xs-8.form-text > span:nth-child(2)");
                personalData[row + 1][6] = hp.textContent.replace(/\s+/g, '');
                document.querySelectorAll('.form-group.form-group-player-info').forEach(line => {
                    let lineTitle = line.querySelector('.col-xs-4.control-label');
                    if (lineTitle && (lineTitle.textContent.includes('赛季') || lineTitle.textContent.includes('Season'))) {
                        let ep1 = line.querySelector('div.col-xs-8.form-text > div > span');
                        let ep2 = line.querySelector('div.col-xs-8.form-text > span:nth-child(2) > span');
                        if (ep1 && ep1.textContent) {
                            personalData[row + 1][7] = ep1.textContent;
                        } else if (ep2 && ep2.textContent) {
                            personalData[row + 1][7] = ep2.textContent;
                        }
                    }
                });
                row += 3;       // 空一行
    
                /* 读装备信息 */
                if (equipList) {
                    let equip = equipList.children;
                    for (let i = 0; i < equip.length; i++) {
                        let item = equip[i].className.match(/bonus-(\d+)/)[1];
                        let percent = equip[i].textContent.match(/\+([^+]+)/)[1];
                        if (item < 4) {
                            personalData[row + 1][item] = percent;
                        } else if (item > 10 && item < 14) {
                            personalData[row + 1][item - 7] = percent;
                        } else if (item > 17 && item < 22) {
                            personalData[row + 1][item - 11] = percent;
                        } else if (item > 30 && item < 41) {
                            personalData[row + 3][item - 31] = percent;
                        }
                    }
                }
                row += 4;
    
                /* 读奖杯信息 */
                let trophyList = document.querySelector("#PlayerBlock > div:nth-child(3) > div:nth-child(2) > div.col-xs-8.form-text > div > div.popover-content > table");
                let trs = trophyList.querySelectorAll('tr');
                
                personalData[row][1] = parseInt(document.querySelector("#PlayerBlock > div:nth-child(3) > div:nth-child(2) > div.col-xs-8.form-text > span").textContent, 10);
                let rank = document.querySelector("#PlayerBlock > div:nth-child(3) > div:nth-child(2) > div.col-xs-8.form-text > a");
                if (rank && rank.textContent) {
                    personalData[row][3] = parseInt(rank.textContent.match(/\d+/), 10) || '';
                }
                // 遍历每一行
                var gls = ['', '初', '中', '高', '自'];
                trs.forEach(tr => {
                    let cells = tr.querySelectorAll('td'); // 获取所有td元素
                    let title = cells[0].textContent; // 第一个td为标题
                    let index = personalData[row + 1].indexOf(title); // 匹配标题在personalData中的索引
                    if (index !== -1) {
                        // 填入值和奖杯数
                        personalData[row + 2][index] = cells[1].textContent || '';
                        personalData[row + 3][index] = parseInt(cells[2].textContent, 10) || 0;
                        // 检查初中高级
                        let grade = cells[1].querySelector("i");
                        if (grade) {
                            let cname = grade.className;
                            let glevel = cname.charAt(cname.length - 1);
                            if (!isNaN(glevel)) {
                                personalData[row + 2][index] = gls[glevel] + personalData[row + 2][index];
                            }
                        }
                    }
                });
                row += 5;
                
                /* 读昵称 */
                personalData[row][0] = userName.textContent;
    
                console.log(personalData);
    
                chrome.runtime.sendMessage({ action: 'sendPersonalData', personalData: personalData });
            }
        }, t0);
    } catch (e) {
        console.error('错误页面', e);
    }

    /* 模拟鼠标悬浮在button */
    function hoverBox(button) {
        let event = new MouseEvent("mouseover", {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: button.getBoundingClientRect().left + button.offsetWidth / 2,
            clientY: button.getBoundingClientRect().top + button.offsetHeight / 2
        });
        button.dispatchEvent(event);
    }
}

/* ===== 财产估值提取 ===== */
function extractEconomy() {
    var personalEco = [
        ['总财产', '装备', '金币', '宝石', '功勋点', '活动物品', '竞技场门票', '仓库', '装备碎片', '竞技场币', '代币', '今日增量'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
    var t0 = 100;
    try {
        startEcoQuery = setInterval(() => {
            let myRank = document.querySelector("#stat_my_rank > a");
            if (myRank) {
                clearInterval(startEcoQuery);
                myRank.click();
                checkMyRank = setInterval(() => {
                    let check = document.querySelector("#stat_table_body > tr.stat-my-row > td:nth-child(4) > a > i");
                    if (check) {
                        clearInterval(checkMyRank);
                        let myRow = document.querySelector("#stat_table_body > tr.stat-my-row");
                        let value = myRow.querySelector("td:nth-child(3) > span.help.dotted-underline");
                        personalEco[1][0] = value.textContent;
                        hoverBox(value);
                        let dataDisp = myRow.querySelector("td:nth-child(3) > div > div.popover-content");
                        var data = dataDisp.innerHTML.split(/<[^>]*>/g);
                        for (let i = 0; i < data.length; i++) {
                            for (let j = 1; j <= personalEco[0].length; j++) {
                                if (data[i].includes(personalEco[0][j] + '：')) {
                                    var match = data[i].match(/：(.*)/);
                                    personalEco[1][j] = match[1];
                                    break;
                                }
                            }
                        }
                        let upArrow = document.querySelector("#stat_table_body > tr.stat-my-row > td:nth-child(3) > span.help.price-up > i");
                        let downArrow = document.querySelector("#stat_table_body > tr.stat-my-row > td:nth-child(3) > span.help.price-down > i");
                        if (upArrow) {
                            hoverBox(upArrow);
                        } else if (downArrow) {
                            hoverBox(downArrow);
                        }
                        let growth = document.querySelector("#stat_table_body > tr.stat-my-row > td:nth-child(3) > div > div.tooltip-inner");
                        if (growth) {
                            personalEco[1][11] = growth.textContent;
                            console.log(personalEco);
                            chrome.runtime.sendMessage({ action: 'personalEconomy', personalEco: personalEco });
                        }
                    }
                }, t0)
                
                /* 模拟鼠标悬浮在button */
                function hoverBox(button) {
                    let event = new MouseEvent("mouseover", {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: button.getBoundingClientRect().left + button.offsetWidth / 2,
                        clientY: button.getBoundingClientRect().top + button.offsetHeight / 2
                    });
                    button.dispatchEvent(event);
                }
            }
        }, t0);
    } catch (e) {
        console.log(e);
    }
}

/* ===== 活动任务分析 ===== */
function extractEventQuest() {
    var index = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var name = ['中级效率', '高级效率', '竞技场', '连胜', '盲扫', '无猜', '自定义', '金币', '宝石', '竞速', '初级局数', '中级局数', '高级局数', 'PvP'];
    var keyword = ['中级', '高级', '竞技场', '连胜', '盲扫', 'NG', '自定义', '金币', '获得', '用时', '初级', '中级', '高级', 'PvP'];
    var keywordEff = '效率达到';
    var keywordAt = '门票';
    var typeNum = 14;
    var restrict = ['', [12, 30], '', '', '', '', '', '', '', [4, 6], '', '', '', ''];
    var next = -1;
    var levelRange = [[4, 7], [8, 11], [12, 15], [16, 20], [20, 30]];
    var eqInfo = ['下一任务：', '等级范围：', '可用任务列表：', '', '', '', '', '', '距离机密：', '', '近10个任务：', '', '', '', '', '', '', '', '', '', ''];
    var secShift = 17;
    var secCycle = 19;
    var questTable;
    // 定位任务表
    document.querySelectorAll('.table.table-bordered').forEach(table => {
        const title = table.querySelector("thead > tr > th:nth-child(4)");
        if (title && (title.textContent == '冠军' || title.textContent == 'Winners')) {
            questTable = table;
        }
    });
    if (questTable) {
        // 提取近期任务
        var i = 0;
        questTable.querySelectorAll('tbody > tr[id^="quest_row_"]').forEach(quest => {
            let questLevel = quest.querySelector('td:nth-child(1)');
            let questContent = quest.querySelector('td:nth-child(2)');
            if (questContent && questLevel) {
                let ql = questLevel.textContent;
                let qc = questContent.textContent;
                eqInfo[11+i] = String(i + 1) + '. ' + ql + '  ' + qc;
                if (qc.includes(keywordEff)) {
                    if (qc.includes(keyword[0])) {
                        index[0]++;
                    } else if (qc.includes(keyword[1])) {
                        index[1]++;
                    }
                } else if (qc.includes(keywordAt)) {
                    index[9]++;
                } else {
                    for (let j = 2; j < typeNum; j++) {
                        if (qc.includes(keyword[j])) {
                            index[j]++;
                            break;
                        }
                    }
                }
                i++;
            }
        });
        console.log(index)
        // 分析下一任务等级
        const timeNow = new Date();
        eqInfo[0] = '下一任务：' + (timeNow.getHours() + 1) + ':00';
        var secret;
        let firstId = questTable.querySelector("tbody > tr:nth-child(1)").id.match(/\d+$/)[0];
        if (secShift >= 0) { 
            secret = (secCycle - (parseInt((+firstId + 1) / 2) + secShift) % secCycle) % secCycle; 
        } else {
            secret = '未知'; 
        }
        var nextLevel = [];
        var nextRange = [];
        let firstLevel = questTable.querySelector('tbody > tr:nth-child(1) > td:nth-child(1)').textContent.match(/\d+/)[0];
        if (firstLevel <= levelRange[0][1]) { 
            next = 3;
        } else if (firstLevel <= levelRange[1][1]) {
            next = 4;
        } else if (firstLevel <= levelRange[2][1]) {
            next = 5;
        } else if (firstLevel < levelRange[3][1]) {
            next = 1;
        } else if (firstLevel == levelRange[3][1]) {
            let secondLevelElement = questTable.querySelector('tbody > tr:nth-child(2) > td:nth-child(1)');
            if (secondLevelElement) {
                let secondLevel = secondLevelElement.textContent.match(/\d+/)[0];
                if (secondLevel <= levelRange[1][1]) {
                    next = 1;
                } else if (secondLevel <= levelRange[2][1]) {
                    next = 2;
                }
            }
        } else {
            next = 2;
        }

        if (next < 0) {
            nextRange = '未知';
        } else {
            nextLevel = next - 1;
            nextRange = 'L' + levelRange[nextLevel][0] + '-' + levelRange[nextLevel][1];
        }
        eqInfo[8] = '距离机密：' + secret;
        eqInfo[1] = '等级范围：' + nextRange;
        if (secret == 0) {
            eqInfo[0] = eqInfo[0] + ' 【机密】';
        }

        var row = 3;
        if (next < 0) {
            for (let k = 0; k < typeNum; k++) {
                if (index[k] == 0) {
                    eqInfo[row] = ' √ ' + name[k];
                    row++;
                }
            }
        } else {
            for (let k = 0; k < typeNum; k++) {
                if (index[k] == 0) {
                    if (restrict[k]) {
                        if (restrict[k][0] <= levelRange[nextLevel][0]) {
                            if (restrict[k][1] >= levelRange[nextLevel][1]) {
                                eqInfo[row] = ' √ ' + name[k];
                                row++;
                            } else if (restrict[k][1] >= levelRange[nextLevel][0]) {
                                eqInfo[row] = ' √ ' + name[k] + '（L' + levelRange[nextLevel][0] + '-' + restrict[k][1] + '）';
                                row++;
                            } else {
                                eqInfo[row] = ' × ' + name[k] + '（限制为L' + restrict[k][0] + '-' + restrict[k][1] + '）';
                                row++;
                            }
                        } else if (restrict[k][0] <= levelRange[nextLevel][1]) {
                            if (restrict[k][1] >= levelRange[nextLevel][1]) {
                                eqInfo[row] = ' √ ' + name[k] + '（L' + restrict[k][0] + '-' + levelRange[nextLevel][1] + '）';
                                row++;
                            } else {
                                eqInfo[row] = ' √ ' + name[k] + '（L' + restrict[k][0] + '-' + restrict[k][1] + '）';
                                row++;
                            }
                        } else {
                            eqInfo[row] = ' × ' + name[k] + '（限制为L' + restrict[k][0] + '-' + restrict[k][1] + '）';
                            row++;
                        }
                    } else {
                        eqInfo[row] = ' √ ' + name[k];
                        row++;
                    }
                    if (row > 6) {
                        eqInfo.splice(row, 0, '');
                    }
                }
            }
        }
        console.log(eqInfo);

        chrome.runtime.sendMessage({ action: 'eventQuest', eqInfo: eqInfo });
    }
}

/* ===== 活动竞技场门票价格提取 ===== */
function extractEventArenaPrice() {
    var eaPrice = [
        ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ];
    var t0 = 100;        // 等待间隔
    var levelMax = 8;       // 最大等级
    try {
        function selectEventTicket(level) { // 选择市场中的单个门票条目
            setTimeout(() => {
                let levelMenu = document.querySelector(`#market_search_filters_left > span:nth-child(5) > ul > li:nth-child(${level + 2}) > a`);
                levelMenu.click(); // 选择门票等级
            }, t0 * 1);
        }
        function queryTicket() { // 查询当前页面最低价是否存在
            let price = document.querySelector("#stat_table_body > tr:nth-child(1) > td:nth-child(3)");
            let name = document.querySelector("#stat_table_body > tr:nth-child(1) > td:nth-child(2) > span");
            if (price && name) {
                let queryResult = [name.textContent, price.textContent.replace(/ /g, "")];    // 删去可能的空格 1 200 -> 1200
                return queryResult;
            } else {
                return null;
            }
        }
        function queryProgress(level) { // 递归查询函数
            selectEventTicket(level);
            var count = 1;
            var countMax = 40;
            setTimeout(() => {
                checkInterval = setInterval(() => { // 循环调用queryTicket查找是否有数据
                    let queryResult = queryTicket();
                    if (queryResult) {
                        console.log('找到：L', level + 1, queryResult);
                        clearInterval(checkInterval); // 查询成功后停止循环
                        eaPrice[1][level] = queryResult[1];
                        if (level == levelMax - 1) { // 已到达最后一张
                            console.log(eaPrice);
                            chrome.runtime.sendMessage({ action: 'sendEventArenaPrice', eaPrice: eaPrice });
                        } else {
                            queryProgress(level + 1); // 其他情况递归进入下一张票
                        }
                    } else if (count == countMax) {
                        console.log('暂无L', level + 1, '票价');
                        clearInterval(checkInterval); // 查询超时，停止循环
                        eaPrice[1][level] = '无';
                        if (level == levelMax - 1) { // 已到达最后一张
                            console.log(eaPrice);
                            chrome.runtime.sendMessage({ action: 'sendEventArenaPrice', eaPrice: eaPrice });
                        } else {
                            queryProgress(level + 1); // 其他情况递归进入下一张票
                        }
                    } else {
                        count++;
                        console.log('未找到：L', level + 1);
                    }
                }, t0);
            }, t0 * 2);
        }

        startQueryEa = setInterval(() => {
            let choice1 = document.querySelector("#market_search_filters_left > span > ul > li:nth-child(4) > a");
            if (choice1) {
                clearInterval(startQueryEa);
                choice1.click(); // 选择竞技场门票分类
                setTimeout(() => {
                    let choice2 = document.querySelector("#market_search_filters_left > span:nth-child(4) > ul > li:nth-child(12) > a");
                    choice2.click(); // 选择活动竞技场
                }, t0 * 20);
                setTimeout(() => {
                    queryProgress(0);
                }, t0 * 40);
            }
        }, t0);
    } catch (e) {
        console.error('错误页面', e);
    }
}

/* ===== 友谊任务提取（首页） ===== */
function extractFriendQuest() {
    const currentDate = new Date();
    const newMonth = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    var fqInfo = {[newMonth]: {'fqSend': {}, 'fqReceive': {}}};
    let questSending;
    let questReceived;
    let questSent;
    try {
        let tableList = document.querySelectorAll("#QuestsBlock .table.table-bordered");

        tableList.forEach(table => {
            if (table.querySelector("thead > tr > th:nth-child(4)").textContent == '奖励' 
            || table.querySelector("thead > tr > th:nth-child(4)").textContent == 'Reward') {
                questSending = table;
            } else if (table.querySelector("thead > tr > th:nth-child(6)").textContent == '发送自' 
            || table.querySelector("thead > tr > th:nth-child(6)").textContent == 'Sent by') {
                questReceived = table;
            } else {
                questSent = table;
            }
        });

        if (questSending) {
            Array.from(questSending.getElementsByTagName('tr')).forEach(tr => {
                const id = tr.id;
                const tdValues = Array.from(tr.getElementsByTagName('td')).map(td => td.innerText);
                if (id) {
                    fqInfo[newMonth].fqSend[id] = tdValues;
                }
            });
        }
        if (questReceived) {
            Array.from(questReceived.getElementsByTagName('tr')).forEach(tr => {
                const id = tr.id;
                const tdValues = Array.from(tr.getElementsByTagName('td')).map(td => td.innerText);
                if (id) {
                    fqInfo[newMonth].fqReceive[id] = tdValues;
                }
            });
        }
        if (questSent) {
            Array.from(questSent.getElementsByTagName('tr')).forEach(tr => {
                const id = tr.id;
                const tdValues = Array.from(tr.getElementsByTagName('td')).map(td => td.innerText);
                if (id) {
                    fqInfo[newMonth].fqSend[id] = tdValues;
                }
            });
        }

        let activity = 0;
        const activityP = document.querySelector("#QuestsBlock > p");
        if (activityP) {
            activity = parseInt(activityP.textContent.match(/\d+$/)[0], 10);
        }

        console.log(activity, fqInfo);
        chrome.runtime.sendMessage({ action: 'friendQuest', fqInfo: fqInfo, activity: activity });
    } catch (e) {
        console.error('错误页面', e);
    }
}

/* ===== 友谊任务提取（多页，maxPage 为 0 表示无限制） ===== */
function extractFriendQuestPages(maxPage) {
    const currentDate = new Date();
    const newMonth = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    var fqInfo = {[newMonth]: {'fqSend': {}, 'fqReceive': {}}};
    var t0 = 100;
    try {
        startFqAllQuery = setInterval(() => {
            let activityP = document.querySelector("#QuestsBlock > p");
            if (activityP) {
                clearInterval(startFqAllQuery);
                let activity = parseInt(activityP.textContent.match(/\d+$/)[0], 10);
                const questsBlock = document.querySelector("#QuestsBlock");
                var ti = [[0, 0, 0], [0, 0, 0]]; // tableIndex
                var fqsiFlag = 0;
                var fqrFlag = 0;
                var fqsdFlag = 0;
                for (let i = 0; i < questsBlock.children.length; i++) {
                    const ele = questsBlock.children[i];
                    var currentTable;
                    if (ele.classList.contains('table-bordered')) { // 检查是否为 table
                        if (ele.querySelector("thead > tr > th:nth-child(4)").textContent == '奖励' 
                        || ele.querySelector("thead > tr > th:nth-child(4)").textContent == 'Reward') {
                            ti[0][0] = i + 1;
                            currentTable = 0;
                        } else if (ele.querySelector("thead > tr > th:nth-child(6)").textContent == '发送自' 
                        || ele.querySelector("thead > tr > th:nth-child(6)").textContent == 'Sent by') {
                            ti[0][1] = i + 1;
                            currentTable = 1;
                        } else if (ele.querySelector("thead > tr > th:nth-child(6)").textContent == '发送到' 
                        || ele.querySelector("thead > tr > th:nth-child(6)").textContent == 'Sent to') {
                            ti[0][2] = i + 1;
                            currentTable = 2;
                        }
                        // 检查下一个元素是否为 link
                        if (i + 1 < questsBlock.children.length) {
                            const nextEle = questsBlock.children[i + 1];
                            if (nextEle.classList.contains('pagination')) {
                                ti[1][currentTable] = i + 2;
                                i++; // 跳过已处理的 link
                            }
                        }
                    }
                }
                console.log(ti);
                var t0 = 100;
                if (ti[0][0] > 0) { // 待发送任务
                    if (ti[1][0] > 0) { // 翻页
                        var sipn = 1;
                        sipInterval = setInterval(() => {
                            let sipSet = document.querySelector(`#QuestsBlock > ul:nth-child(${ti[1][0]})`);
                            let sipActive = sipSet.querySelector("li.page.active");
                            if (sipActive.textContent == sipn) {
                                let questSending = document.querySelector(`#QuestsBlock > table:nth-child(${ti[0][0]})`);
                                Array.from(questSending.getElementsByTagName('tr')).forEach(tr => {
                                    const id = tr.id;
                                    const tdValues = Array.from(tr.getElementsByTagName('td')).map(td => td.innerText);
                                    if (id) {
                                        fqInfo[newMonth].fqSend[id] = tdValues;
                                    }
                                });
                                sipn++;
                                const sipLastDisabled = sipSet.querySelector("li.last.disabled");
                                if (sipLastDisabled || (maxPage > 0 && sipn > maxPage)) {
                                    clearInterval(sipInterval);
                                    fqsiFlag = 1;
                                } else {
                                    const sipNext = sipSet.querySelector("li.next");
                                    sipNext.click();
                                }
                            } else if (sipActive.textContent < sipn) {
                                const sipNext = sipSet.querySelector("li.next");
                                sipNext.click();
                            } else if (sipActive.textContent > sipn) {
                                const sipFirst = sipSet.querySelector("li.first");
                                sipFirst.click();
                            }
                        }, t0);
                    } else {
                        let questSending = document.querySelector(`#QuestsBlock > table:nth-child(${ti[0][0]})`);
                        Array.from(questSending.getElementsByTagName('tr')).forEach(tr => {
                            const id = tr.id;
                            const tdValues = Array.from(tr.getElementsByTagName('td')).map(td => td.innerText);
                            if (id) {
                                fqInfo[newMonth].fqSend[id] = tdValues;
                            }
                        });
                        fqsiFlag = 1;
                    }
                } else {
                    fqsiFlag = 1;
                }
                if (ti[0][1] > 0) { // 接收到的任务
                    if (ti[1][1] > 0) { // 翻页
                        var rpn = 1;
                        rpInterval = setInterval(() => {
                            let rpSet = document.querySelector(`#QuestsBlock > ul:nth-child(${ti[1][1]})`);
                            let rpActive = rpSet.querySelector("li.page.active");
                            if (rpActive.textContent == rpn) {
                                let questReceived = document.querySelector(`#QuestsBlock > table:nth-child(${ti[0][1]})`);
                                Array.from(questReceived.getElementsByTagName('tr')).forEach(tr => {
                                    const id = tr.id;
                                    const tdValues = Array.from(tr.getElementsByTagName('td')).map(td => td.innerText);
                                    if (id) {
                                        fqInfo[newMonth].fqReceive[id] = tdValues;
                                    }
                                });
                                rpn++;
                                const rpLastDisabled = rpSet.querySelector("li.last.disabled");
                                if (rpLastDisabled || (maxPage > 0 && rpn > maxPage)) {
                                    clearInterval(rpInterval);
                                    fqrFlag = 1;
                                } else {
                                    const rpNext = rpSet.querySelector("li.next");
                                    rpNext.click();
                                }
                            } else if (rpActive.textContent < rpn) {
                                const rpNext = rpSet.querySelector("li.next");
                                rpNext.click();
                            } else if (rpActive.textContent > rpn) {
                                const rpFirst = rpSet.querySelector("li.first");
                                rpFirst.click();
                            }
                        }, t0);
                    } else {
                        let questReceived = document.querySelector(`#QuestsBlock > table:nth-child(${ti[0][1]})`);
                        Array.from(questReceived.getElementsByTagName('tr')).forEach(tr => {
                            const id = tr.id;
                            const tdValues = Array.from(tr.getElementsByTagName('td')).map(td => td.innerText);
                            if (id) {
                                fqInfo[newMonth].fqReceive[id] = tdValues;
                            }
                        });
                        fqrFlag = 1;
                    }
                } else {
                    fqrFlag = 1;
                }
                if (ti[0][2] > 0) { // 已发送任务
                    if (ti[1][2] > 0) { // 翻页
                        var sdpn = 1;
                        sdpInterval = setInterval(() => {
                            let sdpSet = document.querySelector(`#QuestsBlock > ul:nth-child(${ti[1][2]})`);
                            let sdpActive = sdpSet.querySelector("li.page.active");
                            if (sdpActive.textContent == sdpn) {
                                let questSent = document.querySelector(`#QuestsBlock > table:nth-child(${ti[0][2]})`);
                                Array.from(questSent.getElementsByTagName('tr')).forEach(tr => {
                                    const id = tr.id;
                                    const tdValues = Array.from(tr.getElementsByTagName('td')).map(td => td.innerText);
                                    if (id) {
                                        fqInfo[newMonth].fqSend[id] = tdValues;
                                    }
                                });
                                sdpn++;
                                const sdpLastDisabled = sdpSet.querySelector("li.last.disabled");
                                if (sdpLastDisabled || (maxPage > 0 && sdpn > maxPage)) {
                                    clearInterval(sdpInterval);
                                    fqsdFlag = 1;
                                } else {
                                    const sdpNext = sdpSet.querySelector("li.next");
                                    sdpNext.click();
                                }
                            } else if (sdpActive.textContent < sdpn) {
                                const sdpNext = sdpSet.querySelector("li.next");
                                sdpNext.click();
                            } else if (sdpActive.textContent > sdpn) {
                                const sdpFirst = sdpSet.querySelector("li.first");
                                sdpFirst.click();
                            }
                        }, t0);
                    } else {
                        let questSent = document.querySelector(`#QuestsBlock > table:nth-child(${ti[0][2]})`);
                        Array.from(questSent.getElementsByTagName('tr')).forEach(tr => {
                            const id = tr.id;
                            const tdValues = Array.from(tr.getElementsByTagName('td')).map(td => td.innerText);
                            if (id) {
                                fqInfo[newMonth].fqSend[id] = tdValues;
                            }
                        });
                        fqsdFlag = 1;
                    }
                } else {
                    fqsdFlag = 1;
                }
                checkQueryOver = setInterval(() => {
                    if (fqsiFlag && fqrFlag && fqsdFlag) {
                        clearInterval(checkQueryOver);
                        console.log(activity, fqInfo);
                        chrome.runtime.sendMessage({ action: 'friendQuest', fqInfo: fqInfo, activity: activity });
                    }
                }, t0);
            }
        }, t0);
    } catch (e) {
        console.error('错误页面', e);
    }
}

/* ===== 好友信息提取 ===== */
function extractFriendInfo(uid) {
    try {
        const name = document.querySelector("#PlayerBlock > h2 > div.pull-left > span").textContent;
        var friendInfo = [uid, name];
        console.log(friendInfo);
        chrome.runtime.sendMessage({ action: 'sendFriendInfo', friendInfo: friendInfo });
    } catch (e) {
        console.log(e);
    }
}

/* ===== 命运转盘分析 ===== */
function extractWheelQuest() {
    try {
        var allQuests = [
            ['序号', '发起时间', '月', '日', '任务种类', '任务内容', '活动任务类型']
        ];
        var itemPerPage = 5; // 每页5条
        var pageNum = 1;
        var t1 = 10;
        var t0 = 100;
        wheelInterval = setInterval(() => {
            let testItem = document.querySelector("#stat_table_body > tr:nth-child(1) > td:nth-child(3) > div");
            if (testItem) {
                clearInterval(wheelInterval);
                pageInterval = setInterval(() => {
                    const pageActive = document.querySelector("#stat_pagination > li.page.active");
                    if (pageActive) {
                        if (pageActive.textContent == pageNum) {
                            const statTable = document.querySelector("#stat_table");
                            if (!statTable.classList.contains('stat-loading')) {
                                for (let i = 1; i <= itemPerPage; i++) {
                                    var itemNum = (pageNum - 1) * itemPerPage + i;
                                    allQuests[itemNum] = [];
                                    allQuests[itemNum][0] = itemNum;
                                    const startTime = document.querySelector(`#stat_table_body > tr:nth-child(${i}) > td:nth-child(1)`).textContent;
                                    allQuests[itemNum][1] = startTime;
                                    let date;
                                    // "今天08:00"或"Today 08:00"
                                    if (startTime.includes("今天") || startTime.includes("Today")) {
                                        const timePart = startTime.match(/\d{1,2}:\d{2}/)[0];
                                        const [hours, minutes] = timePart.split(':');
                                        date = new Date();
                                        date.setHours(parseInt(hours, 10));
                                        date.setMinutes(parseInt(minutes, 10));
                                    }
                                    // "03月 06日08:00"或"6 March08:00"
                                    else {
                                        const matchChs = startTime.match(/(\d{1,2})月\s*(\d{1,2})日\s*(\d{1,2}):(\d{2})/);
                                        const matchEn = startTime.match(/(\d{1,2})\s+([A-Za-z]+)\s*(\d{1,2}):(\d{2})/);
                                        if (matchChs) {
                                            const [, month, day, hours, minutes] = matchChs;
                                            date = new Date();
                                            date.setMonth(parseInt(month, 10) - 1);
                                            date.setDate(parseInt(day, 10));
                                            date.setHours(parseInt(hours, 10));
                                            date.setMinutes(parseInt(minutes, 10));
                                        } else if (matchEn) {
                                            const [, day, monthStr, hours, minutes] = matchEn;
                                            const monthMap = {
                                                January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
                                                July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
                                            };
                                            const month = monthMap[monthStr];
                                            date = new Date();
                                            date.setMonth(parseInt(month, 10));
                                            date.setDate(parseInt(day, 10));
                                            date.setHours(parseInt(hours, 10));
                                            date.setMinutes(parseInt(minutes, 10));
                                        }
                                    }
                                    if (date) {
                                        if (date.getUTCDate() < 4 || (itemNum > 1 && date.getUTCMonth() + 1 != allQuests[itemNum - 1][2])) {
                                            clearInterval(pageInterval);
                                            console.log(allQuests);
                                            chrome.runtime.sendMessage({ action: 'sendWheelQuest', allQuests: allQuests });
                                        }
                                        allQuests[itemNum][2] = date.getUTCMonth() + 1;
                                        allQuests[itemNum][3] = date.getUTCDate();
                                    } else {
                                        console.log('匹配日期失败：', startTime);
                                        clearInterval(pageInterval);
                                        console.log(allQuests);
                                    }
                                    const type = document.querySelector(`#stat_table_body > tr:nth-child(${i}) > td:nth-child(2) > span`).textContent;
                                    allQuests[itemNum][4] = type;
                                    const questContent = document.querySelector(`#stat_table_body > tr:nth-child(${i}) > td:nth-child(3) > div`).textContent;
                                    allQuests[itemNum][5] = questContent;
                                    const eventType = document.querySelector(`#stat_table_body > tr:nth-child(${i}) > td:nth-child(5) > span > span > span > span:nth-child(2) > img`);
                                    if (eventType && eventType.className.includes('shard')) {
                                        allQuests[itemNum][6] = eventType.className.match(/shard\d+/)[0];
                                    } else if (eventType && eventType.className.includes('icecream')) {
                                        allQuests[itemNum][6] = eventType.className.match(/icecream\d+/)[0];
                                    } else if (eventType && eventType.className.includes('cake')) {
                                        allQuests[itemNum][6] = eventType.className.match(/cake\d+/)[0];
                                    } else {
                                        allQuests[itemNum][6] = '';
                                    }
                                }
                                pageNum++;
                                const pageLastDisabled = document.querySelector("#stat_pagination > li.last.disabled");
                                if (pageLastDisabled) {
                                    clearInterval(pageInterval);
                                    console.log(allQuests);
                                    chrome.runtime.sendMessage({ action: 'sendWheelQuest', allQuests: allQuests });
                                } else {
                                    setTimeout(() => {
                                        const pageNext = document.querySelector("#stat_pagination > li.next");
                                        pageNext.click();
                                    }, t1);
                                }
                            }
                        } else if (pageActive.textContent < pageNum) {
                            setTimeout(() => {
                                const pageNext = document.querySelector("#stat_pagination > li.next");
                                pageNext.click();
                            }, t1);
                        } else if (pageActive.textContent > pageNum) {
                            setTimeout(() => {
                                const pageFirst = document.querySelector("#stat_pagination > li.first");
                                pageFirst.click();
                            }, t1);
                        }
                    } else {
                        for (let i = 1; i <= itemPerPage; i++) {
                            var itemNum = (pageNum - 1) * itemPerPage + i;
                            allQuests[itemNum] = [];
                            allQuests[itemNum][0] = itemNum;
                            const startTime = document.querySelector(`#stat_table_body > tr:nth-child(${i}) > td:nth-child(1)`).textContent;
                            allQuests[itemNum][1] = startTime;
                            let date;
                            // "今天08:00"或"Today 08:00"
                            if (startTime.includes("今天") || startTime.includes("Today")) {
                                const timePart = startTime.match(/\d{1,2}:\d{2}/)[0];
                                const [hours, minutes] = timePart.split(':');
                                date = new Date();
                                date.setHours(parseInt(hours, 10));
                                date.setMinutes(parseInt(minutes, 10));
                            } else { // "03月 06日08:00"或"6 March08:00"
                                const matchChs = startTime.match(/(\d{1,2})月\s*(\d{1,2})日\s*(\d{1,2}):(\d{2})/);
                                const matchEn = startTime.match(/(\d{1,2})\s+([A-Za-z]+)\s*(\d{1,2}):(\d{2})/);
                                if (matchChs) {
                                    const [, month, day, hours, minutes] = matchChs;
                                    date = new Date();
                                    date.setMonth(parseInt(month, 10) - 1);
                                    date.setDate(parseInt(day, 10));
                                    date.setHours(parseInt(hours, 10));
                                    date.setMinutes(parseInt(minutes, 10));
                                } else if (matchEn) {
                                    const [, day, monthStr, hours, minutes] = matchEn;
                                    const monthMap = {
                                        January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
                                        July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
                                    };
                                    const month = monthMap[monthStr];
                                    date = new Date();
                                    date.setMonth(parseInt(month, 10));
                                    date.setDate(parseInt(day, 10));
                                    date.setHours(parseInt(hours, 10));
                                    date.setMinutes(parseInt(minutes, 10));
                                }
                            }
                            if (date) {
                                if (date.getUTCDate() < 4 || (itemNum > 1 && date.getUTCMonth() + 1 != allQuests[itemNum - 1][2])) {
                                    clearInterval(pageInterval);
                                    console.log(allQuests);
                                    chrome.runtime.sendMessage({ action: 'sendWheelQuest', allQuests: allQuests });
                                }
                                allQuests[itemNum][2] = date.getUTCMonth() + 1;
                                allQuests[itemNum][3] = date.getUTCDate();
                            } else {
                                console.log('匹配日期失败：', startTime);
                                clearInterval(pageInterval);
                                console.log(allQuests);
                            }
                            const type = document.querySelector(`#stat_table_body > tr:nth-child(${i}) > td:nth-child(2) > span`).textContent;
                            allQuests[itemNum][4] = type;
                            const questContent = document.querySelector(`#stat_table_body > tr:nth-child(${i}) > td:nth-child(3) > div`).textContent;
                            allQuests[itemNum][5] = questContent;
                            const eventType = document.querySelector(`#stat_table_body > tr:nth-child(${i}) > td:nth-child(5) > span > span > span > span:nth-child(2) > img`);
                            if (eventType && eventType.className.includes('shard')) {
                                allQuests[itemNum][6] = eventType.className.match(/shard\d+/)[0];
                            } else if (eventType && eventType.className.includes('icecream')) {
                                allQuests[itemNum][6] = eventType.className.match(/icecream\d+/)[0];
                            } else if (eventType && eventType.className.includes('cake')) {
                                allQuests[itemNum][6] = eventType.className.match(/cake\d+/)[0];
                            } else {
                                allQuests[itemNum][6] = '';
                            }
                        }
                        clearInterval(pageInterval);
                        console.log(allQuests);
                        chrome.runtime.sendMessage({ action: 'sendWheelQuest', allQuests: allQuests });
                    }
                }, t0);
            }
        }, t0)
    } catch (e) {
        console.error(e);
    }
}
