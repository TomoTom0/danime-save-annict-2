import { WatchingEpisode, StorageItems, WebhookSetting } from '../../types';
import { debugLog } from '../ui/notification';
import { webhookDefaultString } from '../storage/storage';

export function checkWebhookSettings(webhookSettingsTmp: string | any): Record<string, WebhookSetting> {
    let webhookSettings: Record<string, WebhookSetting> = {};
    try { webhookSettings = JSON.parse(webhookSettingsTmp); }
    catch (e) {
        try {
            webhookSettings = Object.assign({}, ...[...Array(webhookSettingsTmp.length).keys()]
                .map(key => ({ [key]: webhookSettingsTmp[key] })) as [object, ...object[]]);
        } catch (e) { webhookSettings = JSON.parse(webhookDefaultString); }
    }
    return webhookSettings;
}

export async function post2webhook(args_dict: { WatchingEpisode: WatchingEpisode; error: string }, items?: StorageItems) {
    debugLog("posting webhook");
    const WatchingEpisode = args_dict.WatchingEpisode;
    if (!items || !items[`valid_${WatchingEpisode.site}Webhook`]) return;
    const webhookSettings_in = items.webhookSettings;
    const origPostData = {
        workTitle: WatchingEpisode.workTitle, episodeNumber: WatchingEpisode.episodeNumber,
        episodeTitle: WatchingEpisode.episodeTitle, vodWorkId: WatchingEpisode.workId,
        danimeWorkId: WatchingEpisode.workId,
        site: WatchingEpisode.site, error: args_dict.error
    };
    const webhookMatchingObj = {
        "noWorkMatched": "webhookNoMatched", "noEpisodeMatched": "webhookNoMatched",
        "noWorkId": "webhookNoWorkId", "none": "webhookSuccess"
    }
    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    const webhookSettings = checkWebhookSettings(webhookSettings_in);
    for (const webhookSetting of Object.values(webhookSettings)) {
        const postData = (webhookSetting.webhookContentChanged) ?
            Object.entries(webhookSetting.webhookContent).reduce((obj, kv) => {
                const val = kv[1].replace(/\{[^\{]+\}/g, s_in => {
                    const s = s_in.slice(1, -1);
                    if (Object.keys(origPostData).indexOf(s) != -1) return origPostData[s as keyof typeof origPostData];
                    else return s_in;
                });
                return Object.assign(obj, { [kv[0]]: val });
            }, {}) : origPostData;
        if (!Object.entries(webhookMatchingObj).some(kv => origPostData.error.indexOf(kv[0]) != -1 && webhookSetting[kv[1] as keyof WebhookSetting])) continue;
        let options: RequestInit = { method: "POST", headers: headers, body: JSON.stringify(postData) };
        if (webhookSetting.postUrl.indexOf("://script.google.com/macros/") != -1) options.mode = "no-cors";
        await fetch(webhookSetting.postUrl, options);
    }
}
