import { WebhookSetting } from '../../types';

// Webhook default settings
export const webhookDefaultSetting: WebhookSetting = {
    postUrl: "", webhookNoMatched: true,
    webhookNoWorkId: false, webhookSuccess: false, webhookContentChanged: false, webhookContent: {}
};

export const webhookDefaultString = JSON.stringify({ [Date.now()]: webhookDefaultSetting });

// Option defaults
const checkValid1 = Object.assign({ "valid_danime": true }, ...["amazon", "abema"].map(key => ({ [`valid_${key}`]: false })) as [object, ...object[]])
const checkValid2 = Object.assign({}, ...["danime", "amazon", "abema"].map(key =>
    ({ [`valid_${key}Annict`]: true, [`valid_${key}Webhook`]: true, [`valid_${key}Genre`]: false })) as [object, ...object[]]);
const checkValid = Object.assign(checkValid1, checkValid2);

export const inputObj = Object.assign({
    token: "", sendingTime: 300, annictSend: true,
    withTwitter: false, withFacebook: false, webhookSettings: webhookDefaultString
}, checkValid);

export const getSyncStorage = <T extends Record<string, any>>(keys: T): Promise<T> => new Promise(resolve => {
    chrome.storage.sync.get(keys, (items) => resolve(items as T));
});

export const setSyncStorage = (items: Record<string, any>): Promise<void> => new Promise(resolve => {
    chrome.storage.sync.set(items, resolve);
});

export function obtainVideoSite(): string {
    const siteTmp = Object.entries({
        danime: "https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId", // for danime
        amazon: "https://www.amazon.co.jp/gp/video/detail/", // for Amazon Prime
        amazon_: "https://www.amazon.co.jp/dp/", // for Amazon Prime 2
        netflix: "https://www.netflix.com/episode/", // for Netflix
        abema: "https://abema.tv/video/" // for abemaTV
    }).filter(kv => location.href.indexOf(kv[1]) != -1) || [];
    return (siteTmp.map(kv => kv[0])[0] || "").replace(/_*$/, "")
}
