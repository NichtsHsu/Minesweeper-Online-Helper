(function () {
    /* Toast & 按钮状态 —— 基于 uiShared.js */
    var showPopupToast = createToastNotifier({
        hostId: 'popupToastHost',
        cssClass: 'popupToast',
        displayMs: 2200,
        closeMs: 180
    });

    var popupButtons = createButtonStateManager({
        showToast: showPopupToast,
        loadingTimeoutMs: 25000,
        normalizeLabel: function (text) {
            if (!text) {
                return '';
            }
            return text.replace(/（500页）/g, '').trim();
        }
    });

    window.setPopupButtonState = popupButtons.setState;
    window.getPopupButtonState = popupButtons.getState;
    window.showPopupToast = showPopupToast;

    /* 弹出页主题 */
    function applyPopupThemeVars(themeVars) {
        if (!themeVars || typeof themeVars !== 'object') {
            return;
        }
        const root = document.documentElement;
        for (const [key, value] of Object.entries(themeVars)) {
            if (key !== 'themeName' && key !== 'introduce' && Array.isArray(value)) {
                root.style.setProperty(`--${key}`, value[0]);
            } else if (key !== 'themeName' && key !== 'introduce' && typeof value === 'string') {
                root.style.setProperty(`--${key}`, value);
            }
        }
    }

    function initPopupTheme() {
        if (!chrome || !chrome.storage || !chrome.storage.local) {
            return;
        }
        chrome.storage.local.get(['activeThemeVars', 'themeMap', 'theme'], function(result) {
            const themeEntry = resolveThemeEntry(result);
            applyPopupThemeVars(themeEntry);
        });

        if (chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener(function(changes, areaName) {
                if (areaName !== 'local') {
                    return;
                }
                if (changes.activeThemeVars || changes.theme || changes.themeMap) {
                    chrome.storage.local.get(['activeThemeVars', 'themeMap', 'theme'], function(result) {
                        const themeEntry = resolveThemeEntry(result);
                        applyPopupThemeVars(themeEntry);
                    });
                }
            });
        }
    }

    function resolveThemeEntry(result) {
        if (result && result.activeThemeVars && typeof result.activeThemeVars === 'object') {
            return result.activeThemeVars;
        }

        const themeMap = result && result.themeMap && typeof result.themeMap === 'object' ? result.themeMap : {};
        const themeName = result && result.theme ? result.theme : '默认';
        return themeMap[themeName] || themeMap['默认'] || null;
    }

    document.addEventListener('DOMContentLoaded', function() {
        initPopupTheme();
    });
})();
