/* 页面显示 */
function displayFriendQuest() {
    chrome.storage.local.get(['friendQuestInfo', 'activityMap', 'friendQuestDaily', 'contactsList'], function(result) {
        let fqInfoAll = result.friendQuestInfo || {}; // 确保存在数据，防止为 undefined
        let contactsList = result.contactsList || {};
        // 获取当前月份
        const currentDate = new Date();
        const dateMinus2 = new Date(currentDate);
        dateMinus2.setUTCDate(currentDate.getUTCDate() - 2);  // 每个月前两天划给上一个月
        const newMonth = dateMinus2.getUTCFullYear() + String(dateMinus2.getUTCMonth() + 1).padStart(2, '0');
        if (fqInfoAll[newMonth]) {
            /* 所有任务 */
            // 对任务id排序
            const fqSendSortedKeys = Object.keys(fqInfoAll[newMonth].fqSend).sort().reverse();
            // 按顺序合并表格
            const fqSendMap = fqSendSortedKeys.map(key => fqInfoAll[newMonth].fqSend[key]);
            const sendTitle = ["等级", "任务", "进度", "奖励", "发送到", "失效"];
            fqSendMap.unshift(sendTitle);
            console.log('发任务汇总：', fqSendMap);
            displayMatrix(fqSendMap, 'tableFqs');
            // 对任务id排序
            const fqReceiveSortedKeys = Object.keys(fqInfoAll[newMonth].fqReceive).sort().reverse();
            // 按顺序合并表格
            const fqReceiveMap = fqReceiveSortedKeys.map(key => fqInfoAll[newMonth].fqReceive[key]);
            const ReceiveTitle = ["等级", "任务", "进度", "奖励", "发送自", "失效"];
            fqReceiveMap.unshift(ReceiveTitle);
            console.log('收任务汇总：', fqReceiveMap);
            displayMatrix(fqReceiveMap, 'tableFqr');
    
            /* 统计 */
            const dataSend = fqSendMap.slice(1);
            const dataReceive = fqReceiveMap.slice(1);
            // let countS = dataSend.length; // 发任务总数
            let countS = 0;
            let selectedCountS = 0;
            let sumLevelS = 0; // 发任务总等级
            let selectedLevelS = 0;
            let sumChangeRate = 0; // 总转化率（新增）
            // let countR = dataReceive.length; // 收任务总数
            let countR = 0;
            let selectedCountR = 0;
            let sumLevelR = 0; // 收任务总等级
            let selectedLevelR = 0;
            let sumRsRate = 0; // 总收发比（新增）
            let selectedRsRate = 0;
            let sumActivity = 0; // 总活跃（用于计算转化率）
            
            /* 每日统计 */
            let fqDailyMap = [['日期', '昨日活跃度', '发任务数', 'E数', '发任务等级', '转化率', '收任务数', '收任务等级', '收发比']];
            let activityMap = result.activityMap || {}; // 确保存在数据，防止为 undefined
            // 当前UTC时间
            const currentDate = new Date();
            const newDate = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0') + String(currentDate.getUTCDate()).padStart(2, '0');
            const lastAct = activityMap[newDate];
            if (lastAct) {
                document.getElementById('lastActNew').placeholder = lastAct;
            }
            // delete activityMap['20241015'];
            // activityMap['20241017'] = 303; // 修改数据用
            // chrome.storage.local.set({ activityMap: activityMap });
            let fqDaily = result.friendQuestDaily || {}; // 确保存在数据，防止为 undefined

            const dates = Object.keys(fqDaily).sort().reverse();
            // 按顺序遍历
            dates.forEach(date => {
                if (date.includes(newMonth) && (date.slice(-2) == '04' || typeof activityMap[date] === 'number')) {
                    if (activityMap[date]) {
                        sumActivity += Number(activityMap[date]);
                    }
                    let countS = Object.keys(fqDaily[date].fqSend).length; // 发任务总数
                    let dailyLevelS = 0; // 发任务总等级
                    let countR = Object.keys(fqDaily[date].fqReceive).length; // 收任务总数
                    let dailyLevelR = 0; // 收任务总等级
                    let eNum = 0; // E的个数（新增）
                    Object.values(fqDaily[date].fqSend).forEach(entry => {
                        const lsMatch = entry[0].match(/L(\d+)?(E)?/); // 提取 L 后面的数字和 E
                        var levelS;
                        if (lsMatch[1]) {
                            levelS = parseInt(lsMatch[1], 10);
                        } else {
                            levelS = 66;
                            eNum++;
                        }
                        if (lsMatch[2]) { // 如果有 E 等级乘3
                            eNum++;
                            levelS *= 3;
                        }
                        // 累加等级
                        dailyLevelS += levelS;
                    });
                    if (date.slice(-2) == '04') {
                        activityMap[date] = dailyLevelS;
                    }
                    Object.values(fqDaily[date].fqReceive).forEach(entry => {
                        const lrMatch = entry[0].match(/L(\d+)?(E)?/); // 提取 L 后面的数字和 E
                        var levelR;
                        if (lrMatch[1]) {
                            levelR = parseInt(lrMatch[1], 10);
                        } else {
                            levelR = 66;
                        }
                        if (lrMatch[2]) { // 如果有 E 等级乘3
                            levelR *= 3;
                        }
                        // 累加等级
                        dailyLevelR += levelR;
                    });
                    let changeRate = dailyLevelS / activityMap[date];
                    let rsRate = dailyLevelR / dailyLevelS;
                    const daylyRow = [date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"), activityMap[date], countS, eNum, dailyLevelS, changeRate.toFixed(3), countR, dailyLevelR, rsRate.toFixed(3)];
                    fqDailyMap.push(daylyRow);
                }
            });
            // 按用户分类
            const personStats = {};
            const fqContactFlag = document.getElementById('fqContactFlag').textContent;
            // 发任务统计
            dataSend.forEach(entry => {
                const lsMatch = entry[0].match(/L(\d+)?(E)?/); // 提取 L 后面的数字和 E
                var levelS;
                if (lsMatch[1]) {
                    levelS = parseInt(lsMatch[1], 10);
                } else {
                    levelS = 66;
                }
                if (lsMatch[2]) { // 如果有 E 等级乘3
                    levelS *= 3;
                }
                let person = entry[4]; // 用户id
                if (person === undefined) {
                    person = '待发送';
                }
            
                // 按用户分类
                if (!personStats[person]) {
                    var personValid = 1;
                    if (fqContactFlag == 1) {
                        personValid = 0;
                        for (let id in contactsList) {
                            if (person.includes(contactsList[id][0])) {
                                personValid = 1;
                                break;
                            }
                        }
                    } else if (fqContactFlag == 2) {
                        personValid = 1;
                        for (let id in contactsList) {
                            if (person.includes(contactsList[id][0])) {
                                personValid = 0;
                                break;
                            }
                        }
                    }
                    personStats[person] = {
                        countS: 0,
                        sumLevelS: 0,
                        countR: 0,
                        sumLevelR: 0,
                        valid: personValid
                    };
                }
                countS++;
                sumLevelS += levelS;
                if (personStats[person].valid == 1) {
                    selectedCountS++;
                    // 累加等级
                    selectedLevelS += levelS;
                
                    personStats[person].countS += 1;
                    personStats[person].sumLevelS += levelS;
                }
            });
            // 收任务统计
            var qrClassify = [
                ['自定义', '场币', '竞技场', '宝石', '金币', '经验', 
                    '初盲', '中盲', '高盲', '困盲', '地盲', 
                    '初效', '中效', '高效', '初连', '中连', '高连', 
                    '初局', '中局', '高局', '中等', '困难', '地狱', 'PvP'],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ];
            const qrcKeyWords = [['自定义'], ['竞技场币'], ['竞技场'], ['宝石'], ['金币'], ['经验'], 
                ['初级', '盲扫'], ['中级', '盲扫'], ['高级', '盲扫'], ['困难', '盲扫'], ['地狱', '盲扫'], 
                ['初级', '效率'], ['中级', '效率'], ['高级', '效率'], ['初级', '连胜'], ['中级', '连胜'], ['高级', '连胜'], 
                ['初级'], ['中级'], ['高级'], ['中等'], ['困难'], ['地狱'], ['PvP']];
            dataReceive.forEach(entry => {
                const lrMatch = entry[0].match(/L(\d+)?(E)?/); // 提取 L 后面的数字和 E
                var levelR;
                if (lrMatch[1]) {
                    levelR = parseInt(lrMatch[1], 10);
                } else {
                    levelR = 66;
                }
                if (lrMatch[2]) { // 如果有 E 等级乘3
                    levelR *= 3;
                }
                // 按类型分类
                var matchFinal = 0;
                for (let cl = 0; cl < qrClassify[0].length; cl++) {
                    var match = 1;
                    for (let it = 0; it < qrcKeyWords[cl].length; it++) {
                        if (!entry[1].includes(qrcKeyWords[cl][it])) {
                            match = 0;
                            break;
                        }
                    }
                    if (match == 1) {
                        qrClassify[1][cl] += levelR;
                        matchFinal = 1;
                        break;
                    }
                }
                if (matchFinal == 0) { // 剩下的都是宝石
                    qrClassify[1][3] += levelR;
                }
            
                // 按用户分类
                const person = entry[4]; // 用户id
                if (!personStats[person]) {
                    var personValid = 1;
                    if (fqContactFlag == 1) {
                        personValid = 0;
                        for (let id in contactsList) {
                            if (person.includes(contactsList[id][0])) {
                                personValid = 1;
                                break;
                            }
                        }
                    } else if (fqContactFlag == 2) {
                        personValid = 1;
                        for (let id in contactsList) {
                            if (person.includes(contactsList[id][0])) {
                                personValid = 0;
                                break;
                            }
                        }
                    }
                    personStats[person] = {
                        countS: 0,
                        sumLevelS: 0,
                        countR: 0,
                        sumLevelR: 0,
                        valid: personValid
                    };
                }
                countR++;
                sumLevelR += levelR;
                if (personStats[person].valid == 1) {
                    selectedCountR++;
                    // 累加等级
                    selectedLevelR += levelR;
                
                    personStats[person].countR += 1; // 条目数加一
                    personStats[person].sumLevelR += levelR; // a 列的和加上
                }
            });
    
            // 显示表格
            // let fqStats = Object.entries(personStats).map(([name, stats]) => [
            //     name, 
            //     stats.countS, 
            //     stats.sumLevelS, 
            //     stats.countR, 
            //     stats.sumLevelR,
            //     (stats.sumLevelR / stats.sumLevelS).toFixed(3)
            // ]);
            let fqStats = Object.entries(personStats).map(([name, stats]) => {
                    if (stats.valid == 1) {
                        return [
                            name,
                            stats.countS,
                            stats.sumLevelS,
                            stats.countR,
                            stats.sumLevelR,
                            stats.sumLevelS > 0 ? (stats.sumLevelR / stats.sumLevelS).toFixed(3) : 'Inf'
                        ];
                    } else {
                        return null;
                    }
            })
            .filter(entry => entry != null);
    
            // 按照 sumLevelR 降序排列
            fqStats.sort((a, b) => {
                return b[1] - a[1]; // 进行降序比较
            });

            sumChangeRate = sumLevelS / sumActivity;
            if (sumLevelS > 0) {
                sumRsRate = (sumLevelR / sumLevelS).toFixed(3);
            } else {
                sumRsRate = 'Inf';
            }
            if (selectedLevelS > 0) {
                selectedRsRate = (selectedLevelR / selectedLevelS).toFixed(3);
            } else {
                selectedRsRate = 'Inf';
            }
            let fqStasTitle = ['id', '发任务数', '发任务等级', '总转化率（新增）', '收任务数', '收任务等级', '总收发比（新增）'];
            let fqStasTotalNew = ['总计', countS, sumLevelS, sumChangeRate.toFixed(3), countR, sumLevelR, sumRsRate];
            displayMatrixBody([fqStasTotalNew, []], 'shortTableFqStats');
            displayMatrix(fqDailyMap, 'tableFqDaily');
            let fqStasTotal = ['总计', selectedCountS, selectedLevelS, selectedCountR, selectedLevelR, selectedRsRate];
            fqStats.unshift(fqStasTotal);
            displayMatrixBody(fqStats, 'tableFqStats');
            currentFqStats = fqStats;
            
            /* 树状图 */
            let questTreemap = document.getElementById('questReceivedClassifyTreemap');
            if (questTreemap) {
                questTreemap.innerHTML = '';
            }
            // 转换数据格式
            const data = qrClassify[0].map((title, index) => ({
                title: title,
                value: qrClassify[1][index]
            }));

            // 设置尺寸
            const width = 900;
            const height = 500;

            // 创建容器
            const svg = d3.select("#questReceivedClassifyTreemap")
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            // 创建tooltip
            const treeMapTooltip = d3.select("body")
                .append("div")
                .attr("class", "treeMapTooltip")
                .style("opacity", 0);

            // 创建层级结构
            const root = d3.hierarchy({ children: data })
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value);

            // 创建树状图布局
            d3.treemap()
                .size([width, height])
                .tile(d3.treemapSquarify)
                .round(true)
                (root);

            // 创建颜色比例尺
            const color = d3.scaleOrdinal(d3.schemeCategory10);

            // 绘制节点
            const nodes = svg.selectAll("g")
                .data(root.leaves())
                .enter().append("g")
                .attr("transform", d => `translate(${d.x0},${d.y0})`);

            // 绘制矩形
            nodes.append("rect")
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0)
                .attr("fill", (d, i) => color(i))
                .on("mouseover", showTooltip)
                .on("mouseout", hideTooltip);

            // 添加文本
            nodes.each(function (d) {
                const node = d3.select(this);
                const rectWidth = d.x1 - d.x0;
                const rectHeight = d.y1 - d.y0;

                // 根据矩形尺寸决定显示内容
                if (rectWidth > 40 && rectHeight > 30) {
                    addMultiLineText(node, d, rectWidth, rectHeight);
                } else if (rectWidth > 30 && rectHeight > 20) {
                    addSingleLineText(node, d, rectWidth, rectHeight);
                }
            });

            function addMultiLineText(node, d, width, height) {
                node.append("text")
                    .attr("fill", "white")
                    .attr("x", 10)
                    .attr("y", 20)
                    .html(`${d.data.title}<tspan x="10" dy="20">${d.data.value}</tspan>`)
                    .style("font-size", Math.min(16, Math.min(width / 5, height / 3)) + "px");
            }

            function addSingleLineText(node, d, width, height) {
                node.append("text")
                    .attr("fill", "white")
                    .attr("x", width / 2)
                    .attr("y", height / 2)
                    .attr("text-anchor", "middle")
                    .text(d.data.title)
                    .style("font-size", Math.min(12, Math.min(width / 4, height / 2)) + "px");
            }

            function showTooltip(event, d) {
                treeMapTooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                treeMapTooltip.html(`${d.data.title}: ${d.data.value}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }

            function hideTooltip() {
                treeMapTooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            }
        }
    });
}

const defaltTitleFqStats = ['id', '发任务数', '发任务等级', '收任务数', '收任务等级', '收发比'];
let currentSortOrder = [true, true, true, true, true]; // 用于跟踪每列的排序状态
let currentFqStats = []; // 用于存储当前显示的数据

/* 处理矩阵并显示为表格 不动表头 */
function displayMatrixBody(matrix, tableId, width = 0, editable = []) {
    
    let rows = matrix.length;
    let cols = matrix[0].length;
    if (width) {
        cols = width;
    }

    const table = document.getElementById(tableId);    // 定位表格

    /* 表格主体 */
    let tbody = table.querySelector('tbody'); // 获取表格主体
    tbody.innerHTML = ''; // 清空tbody
    for (let i = 0; i < rows; i++) {
        let row = tbody.insertRow();
        for (let j = 0; j < cols; j++) {
            let cell = row.insertCell();
            const integerPattern = /^[+-]?\d+$/;
            const strValue = String(matrix[i][j]).trim();
            if (integerPattern.test(strValue)) {
                cell.textContent = num(strValue);
            } else {
                cell.textContent = matrix[i][j];
            }
        }
    }
}

function sortTable(colIndex) {
    const titleFqStats = document.querySelector('#tableFqStats thead').rows[0].cells;
    // 切换当前列的排序顺序
    if (currentSortOrder[colIndex]) {
        currentSortOrder[colIndex] = false; // false为降序
        titleFqStats[colIndex].textContent = defaltTitleFqStats[colIndex] + '▼';
    } else {
        currentSortOrder[colIndex] = true; // true为升序
        titleFqStats[colIndex].textContent = defaltTitleFqStats[colIndex] + '▲';
    }
    for (let i = 0; i < titleFqStats.length; i++) {
        if (i != colIndex) {
            currentSortOrder[i] = true; // 默认设置为升序
            titleFqStats[i].textContent = defaltTitleFqStats[i];
        }
    }
    const totalRow = currentFqStats.shift();
    // currentFqStats = currentFqStats.slice(1);
    currentFqStats.sort((a, b) => {
        var aValue = a[colIndex];
        var bValue = b[colIndex];
        if (aValue === bValue) {
            return 0;
        }
        if (currentSortOrder[colIndex]) {
            if (aValue === 'Inf') {
                return 1;
            } else {
                aValue = Number(aValue);
            }
            if (bValue === 'Inf') {
                return -1;
            } else {
                bValue = Number(bValue);
            }
            return (aValue > bValue) ? 1 : -1;
        } else {
            if (aValue === 'Inf') {
                return -1;
            } else {
                aValue = Number(aValue);
            }
            if (bValue === 'Inf') {
                return 1;
            } else {
                bValue = Number(bValue);
            }
            return (aValue > bValue) ? -1 : 1;
        }
        // return (currentSortOrder[colIndex] ? aValue > bValue : aValue < bValue) ? 1 : -1;
    });
    currentFqStats.unshift(totalRow);

    displayMatrixBody(currentFqStats, 'tableFqStats'); // 重新渲染排序后的表格
}

document.addEventListener('DOMContentLoaded', function() {
    displayFriendQuest();

    const headers = document.querySelectorAll('th[data-index]');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const index = parseInt(header.getAttribute('data-index'));
            sortTable(index);
        });
    });
    // 默认显示详情表
    document.getElementById('shortTableFqStats').style.display = "none";
    document.getElementById('tableFqStats').style.display = "table";
    document.getElementById('detailFlag').textContent = 1;
    document.getElementById('fqShowContact').style.display = "inline";
    // 手动修改昨日活跃度
    document.getElementById('updateLastAct').addEventListener('click', function () {
        const lastActNew = document.getElementById('lastActNew').value;
        if (lastActNew) {
            chrome.storage.local.get(['activityMap'], function(result) {
                let activityMap = result.activityMap || {};
                const currentDate = new Date();
                const newDate = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0') + String(currentDate.getUTCDate()).padStart(2, '0');
                activityMap[newDate] = lastActNew;
                chrome.storage.local.set({ activityMap: activityMap });
                displayFriendQuest();
            });
        }
    });
    // 只看和不看好友
    document.getElementById('fqShowContact').addEventListener('click', function () {
        const fqContactFlag = document.getElementById('fqContactFlag');
        if (fqContactFlag.textContent == 0) {
            fqContactFlag.textContent = 1;
            document.getElementById('fqShowContact').textContent = '不看好友';
            displayFriendQuest();
        } else if (fqContactFlag.textContent == 1) {
            fqContactFlag.textContent = 2;
            document.getElementById('fqShowContact').textContent = '查看全部';
            displayFriendQuest();
        } else {
            fqContactFlag.textContent = 0;
            document.getElementById('fqShowContact').textContent = '只看好友';
            displayFriendQuest();
        }
    });
});

/* 接收网页传回的数据 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const timeStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    if (request.action === 'friendQuest') {
        let fqInfo = request.fqInfo;
        let activity = request.activity;
        console.log(timeStr, '提取活跃度:', activity, '友谊任务信息：', fqInfo);   // 在控制台打出结果
        chrome.storage.local.get(['friendQuestInfo', 'activityMap', 'friendQuestDaily'], function(result) {
            let fqInfoAll = result.friendQuestInfo || {}; // 确保存在数据，防止为 undefined
            let activityMap = result.activityMap || {}; // 确保存在数据，防止为 undefined
            let fqDaily = result.friendQuestDaily || {}; // 确保存在数据，防止为 undefined

            // 当前UTC时间
            const currentDate = new Date();
            const newMonth = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0');
            const newDate = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0') + String(currentDate.getUTCDate()).padStart(2, '0');
            // 日期+1
            const nextDateObj = new Date(currentDate);
            nextDateObj.setUTCDate(currentDate.getUTCDate() + 1);  // 增加一天
            const nextDate = nextDateObj.getUTCFullYear() + String(nextDateObj.getUTCMonth() + 1).padStart(2, '0') + String(nextDateObj.getUTCDate()).padStart(2, '0');

            if (!activityMap[nextDate]) {
                activityMap[nextDate] = activity;
            } else if (activityMap[nextDate] < activity) {
                activityMap[nextDate] = activity;
            }
            if (!fqDaily[newDate]) {
                fqDaily[newDate] = {'fqSend': {}, 'fqReceive': {}};
            }
            if (!fqInfoAll[newMonth]) {
                fqInfoAll[newMonth] = {'fqSend': {}, 'fqReceive': {}}
            }
            if (fqInfo[newMonth]) {
                for (const id in fqInfo[newMonth].fqSend) {
                    if (!fqInfoAll[newMonth].fqSend.hasOwnProperty(id)) { 
                        fqDaily[newDate].fqSend[id] = fqInfo[newMonth].fqSend[id];
                    }
                    fqInfoAll[newMonth].fqSend[id] = fqInfo[newMonth].fqSend[id];
                }
                for (const id in fqInfo[newMonth].fqReceive) {
                    if (!fqInfoAll[newMonth].fqReceive.hasOwnProperty(id)) { 
                        fqDaily[newDate].fqReceive[id] = fqInfo[newMonth].fqReceive[id];
                    }
                    fqInfoAll[newMonth].fqReceive[id] = fqInfo[newMonth].fqReceive[id];
                }
            }
            // fqInfoAll[newMonth].fqSend = { ...fqInfoAll[newMonth].fqSend, ...fqInfo[newMonth].fqSend };
            // fqInfoAll[newMonth].fqReceive = { ...fqInfoAll[newMonth].fqReceive, ...fqInfo[newMonth].fqReceive };
            // 保存更新后的数据
            chrome.storage.local.set({ friendQuestInfo: fqInfoAll });
            chrome.storage.local.set({ activityMap: activityMap });
            chrome.storage.local.set({ friendQuestDaily: fqDaily });
            console.log('友谊任务信息汇总:', fqInfoAll);   // 在控制台打出结果
        });
        document.getElementById('flagFq').textContent = 1;   // 设置成功标记
        document.getElementById('flagFqAll').textContent = 1;   // 设置成功标记
        setTimeout(() => {
            displayFriendQuest();
        }, 10);
    }
});

/* 刷新友谊任务（第一页） */
function updateFriendQuest() {
    document.getElementById('flagFq').textContent = 0;
    chrome.tabs.create({ url: 'https://minesweeper.online/cn/friend-quests', active: false }, function (tabFq) {
        const ti0 = tabFq.id;
        recur(ti0, 1);

        function recur(tabId, i) {
            var maxI = 50;
            var t0 = 200;
            setTimeout(() => {
                extract(tabId);
                const flag = document.getElementById('flagFq').textContent;
                if (flag == 1 || i > maxI) {
                    chrome.tabs.remove(tabId, function() {});
                } else {
                    recur(tabId, i + 1);
                }
            }, i * t0);
        }

        function extract(tabId) {
            chrome.scripting.executeScript({
                target: { tabId },
                function: extractFriendQuest
            });
        }
    });
}

/* 刷新友谊任务（指定页） */
function updateFriendQuest5Pages() {
    document.getElementById('flagFqAll').textContent = 0;
    chrome.tabs.create({ url: 'https://minesweeper.online/cn/friend-quests', active: false }, function (tabFq) {
        const ti0 = tabFq.id;
        var t1 = 1000;
        var flag;
        var count = 1;
        var countMax = 60;
        extractFqAll(ti0);
        intervalFqAll = setInterval(() => {
            flag = document.getElementById('flagFqAll').textContent;
            if (flag == 1 || count > countMax) {
                clearInterval(intervalFqAll);
                chrome.tabs.remove(ti0, function() {});
            } else {
                count++;
            }
        }, t1);

        function extractFqAll(tabId) {
            chrome.scripting.executeScript({
                target: { tabId },
                function: extractFriendQuestPages,
                args: [5]
            });
        }
    });
}

/* 刷新友谊任务（全部） */
function updateFriendQuestAll() {
    document.getElementById('flagFqAll').textContent = 0;
    chrome.tabs.create({ url: 'https://minesweeper.online/cn/friend-quests', active: false }, function (tabFq) {
        const ti0 = tabFq.id;
        var t1 = 1000;
        var flag;
        var count = 1;
        var countMax = 60;
        extractFqAll(ti0);
        intervalFqAll = setInterval(() => {
            flag = document.getElementById('flagFqAll').textContent;
            if (flag == 1 || count > countMax) {
                clearInterval(intervalFqAll);
                chrome.tabs.remove(ti0, function() {});
            } else {
                count++;
            }
        }, t1);

        function extractFqAll(tabId) {
            chrome.scripting.executeScript({
                target: { tabId },
                function: extractFriendQuestPages,
                args: [0]
            });
        }
    });
}

/* 刷新任务 */
document.getElementById('updateFq').addEventListener('click', function () {
    updateFriendQuest5Pages();
});
document.getElementById('updateFqAll').addEventListener('click', function () {
    updateFriendQuestAll();
});