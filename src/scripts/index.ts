// Import types
import { WatchingEpisode, WorkInfo } from '../types';

// Import modules
import { debugLog, showMessage, loadNotificationStyles } from '../modules/ui/notification';
import { getSyncStorage, setSyncStorage, obtainVideoSite, inputObj } from '../modules/storage/storage';
import { obtainWatching } from '../modules/sites';
import { obtainWork, sendAnnict } from '../modules/api/annict';
import { post2webhook } from '../modules/api/webhook';

// Constants from storage
const checkValid2 = Object.assign({}, ...["danime", "amazon", "abema"].map(key =>
    ({ [`valid_${key}Annict`]: true, [`valid_${key}Webhook`]: true, [`valid_${key}Genre`]: false })) as [object, ...object[]]);

// -------------------------------------------------
//               # functions for main
// -------------------------------------------------

const obtainVideoElement = (site: string): HTMLVideoElement | null => {
    if (site == "danime") return document.querySelector<HTMLVideoElement>("#video");
    else if (site == "amazon") return document.querySelector<HTMLVideoElement>("video[width='100%']");
    else if (site == "netflix") return document.querySelector<HTMLVideoElement>("video");
    else if (site == "abema") return document.querySelector<HTMLVideoElement>("video[preload='metadata']");
    return null;
}

async function videoTriggered(flag: string, WatchingEpisode: WatchingEpisode | Record<string, never>, RecordWillBeSent = true, workInfo: WorkInfo | null = null): Promise<WorkInfo | null> {
    debugLog("start");
    debugLog("Watching:\n", WatchingEpisode);
    if (flag == "start") {
        const items = await getSyncStorage({ token: "", sendingTime: 300 });
        if (items.token == "") return null;
        const sendingTime = (items.sendingTime - 0 > 0) ? items.sendingTime : 300;

        await obtainWork(WatchingEpisode as WatchingEpisode, items.token).then(async workInfo => {
            debugLog("Work Information:\n", workInfo);
            if (!workInfo || !workInfo.nodes || workInfo.nodes.length === 0) {
                const error_message = `No Hit Title: ${workInfo.WatchingEpisode.workTitle}`;
                showMessage(error_message);
                await post2webhook(workInfo.webhook);
            }
            setTimeout(async () => { // in 5 min until video started
                if (workInfo && workInfo.nodes && workInfo.nodes.length > 0) {
                    await sendRecord(workInfo, WatchingEpisode as WatchingEpisode, RecordWillBeSent);
                }
                await setSyncStorage({ [`lastWatched_${(WatchingEpisode as WatchingEpisode).site}`]: JSON.stringify(WatchingEpisode), lastVideoOver: false });
            }, sendingTime * 1000);
        })

    } else if (flag == "end") {
        if (workInfo && workInfo.nodes && workInfo.nodes.length > 0) {
            await sendRecord(workInfo, WatchingEpisode as WatchingEpisode, RecordWillBeSent);
        }
        await setSyncStorage({ [`lastWatched_${(WatchingEpisode as WatchingEpisode).site}`]: JSON.stringify(WatchingEpisode), lastVideoOver: true });
        // 最後まで見た場合, lastVideoOver=trueで把握
    }
    return workInfo;
}

async function sendRecord(workInfo: WorkInfo, WatchingEpisode: WatchingEpisode, RecordWillBeSent = true) {
    if (!RecordWillBeSent || !workInfo || !workInfo.nodes || workInfo.nodes.length === 0) return;
    const items = await getSyncStorage(Object.assign({ [`lastWatched_${WatchingEpisode.site}`]: JSON.stringify({}), lastVideoOver: true }, inputObj));
    const lastWatched = JSON.parse(items[`lastWatched_${WatchingEpisode.site}`]);
    const IsSuspended = (JSON.stringify(WatchingEpisode) == JSON.stringify(lastWatched)) && !items.lastVideoOver;
    const IsSameMovie = (workInfo.nodes.some(d => d.media == "MOVIE")) && (lastWatched.workTitle == WatchingEpisode.workTitle);
    const IsSplitedEpisode = Object.entries({ workTitle: true, episodeTitle: true, episodeNumber: false, number: true })
        .every(kv => kv[1] == (lastWatched[kv[0] as keyof WatchingEpisode] == WatchingEpisode[kv[0] as keyof WatchingEpisode]));
    debugLog("Sending Condition:\n", { RecordWillBeSent, IsSuspended, IsSameMovie, IsSplitedEpisode });
    if (!IsSuspended && !IsSameMovie && !IsSplitedEpisode) {
        await post2webhook(workInfo.webhook, items);
        await sendAnnict(workInfo, items);
    }
}

// -------------------------------------------------
//               # Main execution
// -------------------------------------------------

(async function () {
    // Load notification styles
    loadNotificationStyles();

    // Add dialog div
    const dialogDiv = document.createElement('div');
    dialogDiv.className = "dsa-dialog";
    dialogDiv.textContent = "Message";
    document.body.appendChild(dialogDiv);

    await getSyncStorage({ token: "" }).then(items => {
        if (items.token == "") showMessage("There is no access token of `Annict`.");
    })


    //let firstSendingAmazon = true;
    const functionForInterval = async function (WatchingEpisodeLast: string): Promise<string> {
        const videoSite = obtainVideoSite();
        if (!videoSite) return WatchingEpisodeLast;
        const items = await getSyncStorage(checkValid2);
        const WatchingEpisode = obtainWatching(videoSite, items[`valid_${videoSite}Genre`]);
        const WatchingEpisodeNow = JSON.stringify(WatchingEpisode);
        let workInfo: WorkInfo | null = null;
        let RecordWillBeSent = true;
        async function mainFunc(WatchingEpisode: WatchingEpisode | Record<string, never>, video: HTMLVideoElement) {
            await videoTriggered("start", WatchingEpisode, true).then(d => {
                workInfo = d;
                RecordWillBeSent = false;
            })
            video.addEventListener("ended", async () => { // video ended
                await videoTriggered("end", WatchingEpisode, RecordWillBeSent, workInfo).then(()=>{
                    RecordWillBeSent = true;
                });
            })
            return JSON.stringify(WatchingEpisode);
        }

        if (WatchingEpisodeNow != WatchingEpisodeLast) {
            const video = obtainVideoElement(videoSite);
            // video要素がないなら最初から
            // 通信が途切れてるときに{}が返されることも
            if (video == null || WatchingEpisodeNow == "{}") return WatchingEpisodeLast;
            // amazon prime videoは一覧ページで既に「続きのエピソード」のvideoなどが用意されているので、実際の再生まで待機
            // played.lengthで判断したのはとてもよかった！
            if (videoSite == "amazon" && video.played.length == 0) return WatchingEpisodeLast;
            // danime, abemaは作品内容が変化していればよし
            // また、abemaは一覧からエピソードを再生した場合、playやplayingを取得できないので、
            // videoの挙動とは無関係に進める形に
            else return await mainFunc(WatchingEpisode, video); // WatchingEpisodeNow
        } return WatchingEpisodeLast;
    }

    const interval = async (WatchingEpisodeLast = "{}") => {
        await functionForInterval(WatchingEpisodeLast)
            .then(WatchingEpisodeLast => {
                setTimeout(interval, 2 * 1000, WatchingEpisodeLast)
            });
    }
    await interval("{}");
})();
