document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('buttonEquip');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab1) {
        if (tab1[0].url.includes('https://minesweeper.online/') && tab1[0].url.includes('equipment')) {
            setPopupButtonState(button, 'ready');
            button.style.cursor = 'pointer'; // 鼠标指针样式
            button.addEventListener('click', function () {
                setPopupButtonState(button, 'loading');
                const tabId = tab1[0].id;
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: function () {
                        var equipStats = [
                            ['经验', '金币', '竞技场门票', '每日任务', '赛季任务', '任务等级', '竞技场币', '活跃度', '活动物品', '精英任务'],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            ['黄玉', '红宝石', '蓝宝石', '紫水晶', '缟玛瑙', '海蓝宝石', '祖母绿', '石榴石', '碧玉'],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0]
                        ];
                        try {
                            let allStats = document.querySelector("#EquipmentBlock > div:nth-child(1) > div.pull-right > span:nth-child(3) > img");
                            hoverBox(allStats);      // 鼠标悬浮展开宝石数量
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
                        } catch (error) {
                            console.log(error);
                            window.alert('错误页面');
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
                });
            });
        } else {
            setPopupButtonState(button, 'disabled');
        }
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'sendEquipStats') {
        let equipStats = request.equipStats;
        console.log('收到装备加成：', equipStats);
        chrome.storage.local.set({ equipStats: equipStats });
        /* 按日期保存 */
        chrome.storage.local.get(['equipStatsMap'], function(result) {
            const equipStatsMap = result.equipStatsMap || {}; // 确保存在数据，防止为 undefined
            const currentDate = new Date();
            const newDate = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0') + String(currentDate.getUTCDate()).padStart(2, '0');
            // 更新数据
            equipStatsMap[newDate] = equipStats;
        
            // 保存更新后的数据
            chrome.storage.local.set({ equipStatsMap: equipStatsMap });
        });

        setPopupButtonState('buttonEquip', 'success');
    }
});