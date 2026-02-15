// # setup
const GLOBAL_sep = /\s+|;|・|\(|（|\)|）|～|‐|-|―|－|&|＆|#|＃|映画\s*|劇場版\s*|!|！|\?|？|…|『|』|「|」/g;
// webhook default settings
const webhookDefaultSetting = {
    postUrl: "", webhookNoMatched: true,
    webhookNoWorkId: false, webhookSuccess: false, webhookContentChanged: false, webhookContent: {}
};
const webhookDefaultString = JSON.stringify({ [Date.now()]: webhookDefaultSetting });
// option
const checkValid1 = Object.assign({ "valid_danime": true }, ...["amazon", "abema"].map(key => ({ [`valid_${key}`]: false })));
const checkValid2 = Object.assign({}, ...["danime", "amazon", "abema"].map(key => ({ [`valid_${key}Annict`]: true, [`valid_${key}Webhook`]: true, [`valid_${key}Genre`]: false })));
const checkValid = Object.assign(checkValid1, checkValid2);
const inputObj = Object.assign({
    token: "", sendingTime: 300, annictSend: true,
    withTwitter: false, withFacebook: false, webhookSettings: webhookDefaultString
}, checkValid);
function showMessage(message, dialog_in) {
    const dialog = (dialog_in) ? dialog_in : document.querySelector(".dsa-dialog");
    if (!dialog)
        return;
    dialog.textContent = message;
    dialog.classList.remove('dsa-dialog-show', 'dsa-dialog-fade-in', 'dsa-dialog-fade-out');
    // Fade in
    setTimeout(() => {
        dialog.classList.add('dsa-dialog-show');
        setTimeout(() => {
            dialog.classList.add('dsa-dialog-fade-in');
        }, 10);
    }, 0);
    // Fade out after 5 seconds
    setTimeout(() => {
        dialog.classList.remove('dsa-dialog-fade-in');
        dialog.classList.add('dsa-dialog-fade-out');
        setTimeout(() => {
            dialog.classList.remove('dsa-dialog-show', 'dsa-dialog-fade-out');
        }, 600);
    }, 5000);
}
const getSyncStorage = (key = null) => new Promise(resolve => {
    chrome.storage.sync.get(key, resolve);
});
const setSyncStorage = (key = null) => new Promise(resolve => {
    chrome.storage.sync.set(key, resolve);
});
const obtainVideoSite = () => {
    const siteTmp = Object.entries({
        danime: "https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId", // for danime
        amazon: "https://www.amazon.co.jp/gp/video/detail/", // for Amazon Prime
        amazon_: "https://www.amazon.co.jp/dp/", // for Amazon Prime 2
        netflix: "https://www.netflix.com/episode/", // for Netflix
        abema: "https://abema.tv/video/" // for abemaTV
    }).filter(kv => location.href.indexOf(kv[1]) != -1) || [];
    return (siteTmp.map(kv => kv[0])[0] || "").replace(/_*$/, "");
};
// # async function
(async function () {
    // Load notification styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles/notifications.css');
    document.head.appendChild(link);
    // Add dialog div
    const dialogDiv = document.createElement('div');
    dialogDiv.className = "dsa-dialog";
    dialogDiv.textContent = "Message";
    document.body.appendChild(dialogDiv);
    await getSyncStorage({ token: "" }).then(items => {
        if (items.token == "")
            showMessage("There is no access token of `Annict`.");
    });
    //let firstSendingAmazon = true;
    const functionForInterval = async function (WatchingEpisodeLast) {
        const videoSite = obtainVideoSite();
        if (!videoSite)
            return WatchingEpisodeLast;
        const items = await getSyncStorage(checkValid2);
        const WatchingEpisode = obtainWatching(videoSite, items[`valid_${videoSite}Genre`]);
        const WatchingEpisodeNow = JSON.stringify(WatchingEpisode);
        //console.log(WatchingEpisodeNow, videoSite)
        let workInfo = null;
        let RecordWillBeSent = true;
        async function mainFunc(WatchingEpisode, video) {
            await videoTriggered("start", WatchingEpisode, true).then(d => {
                workInfo = d;
                RecordWillBeSent = false;
            });
            video.addEventListener("ended", async () => {
                await videoTriggered("end", WatchingEpisode, RecordWillBeSent, workInfo).then(() => {
                    RecordWillBeSent = true;
                });
            });
            return JSON.stringify(WatchingEpisode);
        }
        if (WatchingEpisodeNow != WatchingEpisodeLast) {
            //console.log(WatchingEpisodeNow);
            const video = obtainVideoElement(videoSite);
            // video要素がないなら最初から
            // 通信が途切れてるときに{}が返されることも
            if (video == null || WatchingEpisodeNow == "{}")
                return WatchingEpisodeLast;
            // amazon prime videoは一覧ページで既に「続きのエピソード」のvideoなどが用意されているので、実際の再生まで待機
            // played.lengthで判断したのはとてもよかった！
            if (videoSite == "amazon" && video.played.length == 0)
                return WatchingEpisodeLast;
            // danime, abemaは作品内容が変化していればよし
            // また、abemaは一覧からエピソードを再生した場合、playやplayingを取得できないので、
            // videoの挙動とは無関係に進める形に
            else
                return await mainFunc(WatchingEpisode, video); // WatchingEpisodeNow
        }
        return WatchingEpisodeLast;
    };
    const interval = async (WatchingEpisodeLast = "{}") => {
        await functionForInterval(WatchingEpisodeLast)
            .then(WatchingEpisodeLast => {
            setTimeout(interval, 2 * 1000, WatchingEpisodeLast);
        });
    };
    await interval("{}");
});
// -------------------------------------------------
//               # functions for main
// -------------------------------------------------
const obtainVideoElement = (site) => {
    if (site == "danime")
        return document.querySelector("#video");
    else if (site == "amazon")
        return document.querySelector("video[width='100%']");
    else if (site == "netflix")
        return document.querySelector("video");
    else if (site == "abema")
        return document.querySelector("video[preload='metadata']");
    return null;
};
async function videoTriggered(flag, WatchingEpisode, RecordWillBeSent = true, workInfo = null) {
    console.log("start");
    console.log("Watching:\n", WatchingEpisode);
    if (flag == "start") {
        const items = await getSyncStorage({ token: "", sendingTime: 300 });
        if (items.token == "")
            return null;
        const sendingTime = (items.sendingTime - 0 > 0) ? items.sendingTime : 300;
        await obtainWork(WatchingEpisode, items.token).then(async (workInfo) => {
            console.log("Work Information:\n", workInfo);
            if (!workInfo || !workInfo.nodes || workInfo.nodes.length === 0) {
                const error_message = `No Hit Title: ${workInfo.WatchingEpisode.workTitle}`;
                showMessage(error_message);
                await post2webhook(workInfo.webhook);
            }
            setTimeout(async () => {
                if (workInfo && workInfo.nodes && workInfo.nodes.length > 0) {
                    await sendRecord(workInfo, WatchingEpisode, RecordWillBeSent);
                }
                await setSyncStorage({ [`lastWatched_${WatchingEpisode.site}`]: JSON.stringify(WatchingEpisode), lastVideoOver: false });
            }, sendingTime * 1000);
        });
    }
    else if (flag == "end") {
        if (workInfo && workInfo.nodes && workInfo.nodes.length > 0) {
            await sendRecord(workInfo, WatchingEpisode, RecordWillBeSent);
        }
        await setSyncStorage({ [`lastWatched_${WatchingEpisode.site}`]: JSON.stringify(WatchingEpisode), lastVideoOver: true });
        // 最後まで見た場合, lastVideoOver=trueで把握
    }
    return workInfo;
}
async function sendRecord(workInfo, WatchingEpisode, RecordWillBeSent = true) {
    if (!RecordWillBeSent || !workInfo || !workInfo.nodes || workInfo.nodes.length === 0)
        return;
    const items = await getSyncStorage(Object.assign({ [`lastWatched_${WatchingEpisode.site}`]: JSON.stringify({}), lastVideoOver: true }, inputObj));
    const lastWatched = JSON.parse(items[`lastWatched_${WatchingEpisode.site}`]);
    //console.log({lastWatched, WatchingEpisode});
    const IsSuspended = (JSON.stringify(WatchingEpisode) == JSON.stringify(lastWatched)) && !items.lastVideoOver;
    const IsSameMovie = (workInfo.nodes.some(d => d.media == "MOVIE")) && (lastWatched.workTitle == WatchingEpisode.workTitle);
    const IsSplitedEpisode = Object.entries({ workTitle: true, episodeTitle: true, episodeNumber: false, number: true })
        .every(kv => kv[1] == (lastWatched[kv[0]] == WatchingEpisode[kv[0]]));
    console.log("Sending Condition:\n", { RecordWillBeSent, IsSuspended, IsSameMovie, IsSplitedEpisode });
    if (!IsSuspended && !IsSameMovie && !IsSplitedEpisode) {
        await post2webhook(workInfo.webhook, items);
        await sendAnnict(workInfo, items);
    }
}
function obtainWatching(videoSite, genreLimit = true) {
    if (videoSite == "danime") {
        const backInfoTxt2 = document.querySelector(".backInfoTxt2")?.textContent || "";
        const numberFromUrlMatch = location.href.match(/(?<=partId=\d{5})\d{3}/);
        const workIdMatch = location.href.match(/(?<=partId=)\d{5}/);
        return {
            site: videoSite,
            workTitle: document.querySelector(".backInfoTxt1")?.textContent || "",
            episodeTitle: document.querySelector(".backInfoTxt3")?.textContent || "",
            episodeNumber: backInfoTxt2,
            number: title2number(remakeString(backInfoTxt2, "episodeNumber")),
            numberFromUrl: numberFromUrlMatch ? numberFromUrlMatch[0] : "",
            genre: "アニメ",
            workId: workIdMatch ? workIdMatch[0] : "",
            workIds: []
        };
    }
    else if (videoSite == "amazon") {
        const workTitle = document.querySelector("h1[data-automation-id='title']")?.textContent || "";
        // obtain detail scripts
        const script_candidates = Array.from(document.querySelectorAll("script[type='text/template']"));
        const scripts = script_candidates.reduce((acc, cand) => {
            /* if (cand.innerHTML.indexOf(`{"props":{"state":{"features":{"enable`)!=-1){
                return Object.assign(acc, {enable: JSON.parse(cand.textContent)});
            } else */ if (cand.innerHTML.indexOf(`{"props":{"state":{"features":{"isElcano`) != -1) {
                return Object.assign(acc, { isElcano: JSON.parse(cand.textContent || "{}") });
            }
            else
                return acc;
        }, {});
        if (!scripts.isElcano)
            return {};
        const workId = scripts.isElcano.props.state.pageTitleId;
        const workIds = scripts.isElcano.props.state.self[workId].asins;
        const workIdsSub = [].concat(...Object.values(scripts.isElcano.props.state.self).map((d) => d.asins));
        const detailData = (scripts.isElcano.props.state.detail.detail[workId] ||
            scripts.isElcano.props.state.detail.headerDetail[workId]);
        const genresTmp = detailData.genres.map((d) => d.text);
        const genres = (genresTmp.length == 0) ? ["アニメ"] : genresTmp;
        //console.log(detailData, genres)
        if (genres.indexOf("アニメ") == -1 && genreLimit)
            return {};
        // obtain episode numbers
        const candidates = Array.from(document.querySelectorAll("h2"));
        const seasonAndEpisode = candidates.reduce((acc, cand) => {
            if (Array.from(cand.classList).join(" ").indexOf("subtitle") != -1) {
                return acc.concat([cand.textContent || ""]);
            }
            else
                return acc;
        }, []);
        if (seasonAndEpisode.length != 1)
            return {};
        const episodeWriting = seasonAndEpisode[0].match(/(?<=シーズン\d+、エピソード\d+\s).*/);
        if (episodeWriting == null || episodeWriting.length == 0)
            return {};
        const episodeNumebrInd_candidates = episodeWriting[0].split(" ").map((d, ind) => [ind, d])
            .filter(d => isFinite(title2number(remakeString(d[1], "episodeNumber"))));
        if (episodeNumebrInd_candidates.length == 0)
            return {};
        const episodeNumebrInd = Math.min(...episodeNumebrInd_candidates.map(d => d[0]));
        return {
            site: videoSite,
            workTitle: workTitle,
            episodeTitle: episodeWriting[0].split(" ").slice(episodeNumebrInd + 1).join(" "),
            episodeNumber: episodeWriting[0].split(" ")[episodeNumebrInd],
            number: title2number(remakeString(episodeWriting[0].split(" ")[episodeNumebrInd], "episodeNumber")),
            genre: genres.join(" "),
            workId: workId,
            workIds: workIds,
            workIdsSub: workIdsSub
        };
    }
    else if (videoSite == "netflix") {
        const titleArea = document.querySelector(".video-title>div");
        const workTitle = titleArea?.querySelector("h4")?.textContent || "";
        const spans = titleArea?.querySelectorAll("span") || [];
        const episodeWriting = [spans[1]?.textContent || ""];
        const episodeNumebrInd_candidates = episodeWriting[0].split(" ").map((d, ind) => [ind, d])
            .filter(d => isFinite(title2number(remakeString(d[1], "episodeNumber"))));
        if (episodeNumebrInd_candidates.length == 0)
            return {};
        const episodeNumebrInd = Math.min(...episodeNumebrInd_candidates.map(d => d[0]));
        const netflixWorkId = location.href.match(/(?<=netflix\.com\/episode\/)[^?]+/)?.[0] || "";
        return {
            site: videoSite,
            workTitle: workTitle,
            episodeTitle: episodeWriting[0].split(" ").slice(episodeNumebrInd + 1).join(" "),
            episodeNumber: episodeWriting[0].split(" ")[episodeNumebrInd],
            number: title2number(remakeString(episodeWriting[0].split(" ")[episodeNumebrInd], "episodeNumber")),
            genre: "アニメ",
            workId: netflixWorkId,
            workIds: []
        };
    }
    else if (videoSite == "abema") {
        const candidates = document.querySelectorAll("script[type='application/ld+json']");
        const jsonData = JSON.parse(candidates[candidates.length - 1].innerHTML).itemListElement;
        //console.log(jsonData)
        if (!jsonData || jsonData.length < 4 || (jsonData[1].name != "アニメ" && genreLimit))
            return {}; // require アニメ
        const genre = jsonData[1].name;
        const workTitle = jsonData[2].name;
        const episodeWriting = [jsonData[3].name];
        const episodeNumebrInd_candidates = episodeWriting[0].split(" ").map((d, ind) => [ind, d])
            .filter(d => isFinite(title2number(remakeString(d[1], "episodeNumber"))));
        if (episodeNumebrInd_candidates.length == 0)
            return {};
        const episodeNumebrInd = Math.min(...episodeNumebrInd_candidates.map(d => d[0]));
        const workIdMatch = location.href.match(/(?<=abema\.tv\/video\/episode\/)[^_]+/);
        return {
            site: videoSite,
            workTitle: workTitle,
            episodeTitle: episodeWriting[0].split(" ").slice(episodeNumebrInd + 1).join(" "),
            episodeNumber: episodeWriting[0].split(" ")[episodeNumebrInd],
            number: title2number(remakeString(episodeWriting[0].split(" ")[episodeNumebrInd], "episodeNumber")),
            genre: genre,
            workId: workIdMatch ? workIdMatch[0] : "",
            workIds: []
        };
    }
    else
        return {};
}
// -------------------------------------------------
//               # find work
// -------------------------------------------------
async function obtainWork(WatchingEpisode, annictToken) {
    const IsCombinedEpisode = (/～|／/.test(WatchingEpisode.episodeNumber) &&
        WatchingEpisode.episodeNumber.split(/～|／/g).every(d => isFinite(title2number(remakeString(d, "episodeNumber")))));
    if (!IsCombinedEpisode) {
        return await identifyWork(WatchingEpisode, annictToken);
    }
    else {
        const splited_episodeNumbers = WatchingEpisode.episodeNumber.split(/～|／/g)
            .map(d => title2number(remakeString(d, "episodeNumber")));
        const episodeRange = [splited_episodeNumbers[0], splited_episodeNumbers.slice(-1)[0]];
        const episodeNumbers = [...Array(episodeRange[1] - episodeRange[0] + 1).keys()].map(num => num + episodeRange[0]);
        let workInfos = [];
        for (const number of episodeNumbers) {
            const episodeNow = {
                site: WatchingEpisode.site,
                workTitle: WatchingEpisode.workTitle,
                genre: WatchingEpisode.genre,
                workId: WatchingEpisode.workId,
                workIds: WatchingEpisode.workIds,
                episodeTitle: "",
                episodeNumber: `${number}`,
                number: number,
            };
            const workInfoTmp = await identifyWork(episodeNow, annictToken);
            if (workInfoTmp && workInfoTmp.nodes && workInfoTmp.nodes.length > 0)
                workInfos.push(workInfoTmp);
        }
        const errorMessage = Array.from(new Set(workInfos.map(d => d.webhook.error))).sort().join(" ");
        return { WatchingEpisode: WatchingEpisode, webhook: { WatchingEpisode: WatchingEpisode, error: errorMessage }, nodes: [].concat(...workInfos.map(d => d.nodes)) };
    }
}
async function identifyWork(WatchingEpisode, annictToken) {
    const remake = {
        episodeTitle: remakeString(WatchingEpisode.episodeTitle, "title"),
        splitedTitle: WatchingEpisode.workTitle.split(GLOBAL_sep).filter(d => !/^\s*$/.test(d))
    };
    const result_nodes = await fetchWork(remake.splitedTitle[0], annictToken);
    //console.log(result_nodes)
    if (result_nodes.length == 0) {
        return { WatchingEpisode: WatchingEpisode, nodes: [], webhook: { WatchingEpisode: WatchingEpisode, error: "noWorkMatched" } };
    }
    const goodWorkNodesTmp = await checkTitleWithWorkId(WatchingEpisode, result_nodes);
    const workIdIsFound = (goodWorkNodesTmp.length != 0);
    const goodWorkNodes = (workIdIsFound) ? goodWorkNodesTmp : result_nodes;
    console.log("Work Candidates:\n", goodWorkNodes);
    const combinedEpisodeNode = [].concat(...goodWorkNodes.map(workNode => {
        if (workNode.episodes.edges.length > 0) {
            const episodeNodes = workNode.episodes.edges.map(d => d.node);
            const unitNum = Math.min(...episodeNodes.map(d => d.sortNumber).filter(d => d > 0));
            return episodeNodes.map(d => {
                d.sortNumber = d.sortNumber / unitNum;
                return d;
            });
        }
        else
            return { title: workNode.title, number: "", annictId: workNode.annictId, media: workNode.media, IsZeroEpisode: true }; // only 0 episode
    }));
    const episodes_numberAndCheck = combinedEpisodeNode.map(episode_node => [workIdIsFound,
        checkTitle([remake.episodeTitle, episode_node.title], "every"),
        (episode_node.number || episode_node.sortNumber) == WatchingEpisode.number]);
    const episodes_judges = episodes_numberAndCheck.map(d => [d[0] && d[1] && d[2], // workId is found and episode title & number corresponds
        d[0] && d[1], // workId is found and episode title corresponds
        d[0] && d[2], // workId is found and episode number corresponds
        d[1] && d[2], // episode title and number corresponds
        d[1], // episode title corresponds
        d[2]]); // episode number corresponds
    const judge_kinds = episodes_judges[0].length;
    const valid_check_methods = [...Array(judge_kinds).keys()].filter(num => episodes_judges.filter(d => d[num]).length > 0);
    //console.log(WatchingEpisode, combinedEpisodeNode, episodes_numberAndCheck)
    const error_messages = [[valid_check_methods.length == 0, "noEpisodeMatched"], [!workIdIsFound, "noWorkId"]]
        .filter(d => d[0]).map(d => d[1]).join(" ") || "none"; // なにもなければnone
    if (valid_check_methods.length > 0) {
        const episode_node = episodes_judges.map((d, ind) => [d[valid_check_methods[0]], combinedEpisodeNode[ind]])
            .filter(d => d[0]).map(d => d[1])[0];
        const webhookContent = { WatchingEpisode: WatchingEpisode, error: error_messages };
        return { WatchingEpisode: WatchingEpisode, nodes: [episode_node], webhook: webhookContent };
    }
    else {
        return {
            WatchingEpisode: WatchingEpisode, nodes: [],
            webhook: { WatchingEpisode: WatchingEpisode, error: error_messages }
        };
    }
}
async function checkTitleWithWorkId(WatchingEpisode, work_nodes) {
    //現状、vod情報はREST APIやgraphQLから取得できない。(存在はしている)
    const videoSite = WatchingEpisode.site;
    const vod_dic = { danime: 241, amazon: 243, netflix: 244, abema: 260 };
    let good_nodes = [];
    for (const work_node of work_nodes) {
        const annictId = work_node.annictId;
        const db_url = `https://api.annict.com/db/works/${annictId}/programs`;
        const db_html = await fetch(db_url).then(d => d.text());
        // Parse HTML using DOMParser
        const parser = new DOMParser();
        const doc = parser.parseFromString(db_html, 'text/html');
        const vod_info = Array.from(doc.querySelectorAll("tr"))
            .map(el => {
            const tds = el.querySelectorAll("td");
            return [tds[1]?.textContent || "", tds[5]?.textContent || ""];
        })
            .filter(d => d[0].indexOf(vod_dic[videoSite]) != -1);
        if (vod_info.length == 0 || vod_info.filter(d => d[1].match(/\S+/)).length == 0)
            continue;
        const vod_info_ids = vod_info.map(d => d[1].match(/\S+/)).map(d => d[0]); // idは複数存在しうる
        //console.log(annictId, danime_info_id, WatchingEpisode.workIds, danime_info)
        // workIdが見つかった場合
        if (["danime", "abema", "netflix"].indexOf(WatchingEpisode.site) != -1 && vod_info_ids.some(id => id == WatchingEpisode.workId))
            good_nodes.push(work_node);
        else if (WatchingEpisode.site == "amazon" && vod_info_ids.some(id => WatchingEpisode.workIds.indexOf(id) != -1))
            good_nodes.push(work_node);
        // workIdが見つからなかった場合
        // web verの可能性を検討 <- 現在はdanimeの場合のみrest apiから調べる
        if (["danime"].indexOf(WatchingEpisode.site) != -1) {
            const episodeTitle = WatchingEpisode.episodeTitle;
            const episodeNumber = WatchingEpisode.episodeNumber;
            const numberFromUrl = WatchingEpisode.numberFromUrl;
            const danime_infos = await Promise.all(vod_info_ids.map(async (workIdTmp) => {
                const url = "https://animestore.docomo.ne.jp/animestore/rest/WS030101" + `?partId=${workIdTmp}${numberFromUrl}`;
                return await fetch(url).then(d => d.json());
            })).then(infos => infos.filter(info => {
                return (info.partTitle == episodeTitle) && (info.partDispNumber == episodeNumber);
            }));
            if (danime_infos.length == 0)
                continue;
            else
                good_nodes.push(work_node);
        }
    }
    return good_nodes;
}
async function fetchWork(title, annictToken) {
    const query = `
    { searchWorks(
            titles:"${title}",
            orderBy: { field: WATCHERS_COUNT, direction: DESC },
        ) {
            edges {
                node {
                    title
                    annictId
                    media
                    episodes(
                        orderBy: { field: SORT_NUMBER, direction: ASC },
                    ) {
                        edges {
                            node {
                            annictId
                            sortNumber
                            number
                            title
                            }
                        }
                    }
                }
            }
        }
    }`.replace(/\n/g, "").replace(/\s+/g, " ");
    const graphql_url = `https://api.annict.com/graphql?query=${query}`;
    //console.log(graphql_url)
    const headers = {
        'Authorization': `Bearer ${annictToken}`
    };
    return await fetch(graphql_url, { method: "POST", headers: headers })
        .then(res => res.json())
        .then(jsoned => jsoned.errors ? [] : jsoned.data.searchWorks.edges.map(d => d.node));
}
function remakeString(input_str, mode = "title") {
    if (!input_str)
        return "";
    const delete_array = ["「", "」", "『", "』", "｢", "｣"];
    const remake_dic = {
        "〈": "＜", "〉": "＞",
        "Ⅰ": "I", "Ⅱ": "II", "Ⅲ": "III", "Ⅳ": "IV", "Ⅴ": "V", "Ⅵ": "VI", "Ⅶ": "VII", "Ⅷ": "VIII", "Ⅸ": "IX", "Ⅹ": "X"
    };
    if (mode == "episodeNumber") {
        return kanji2arab(input_str).replace(/[０-９]/g, s => // 全角=>半角
         String.fromCharCode(s.charCodeAt(0) - 65248));
    }
    else if (mode == "title") {
        return input_str.replace(/[Ａ-Ｚａ-ｚ０-９：]/g, s => // 全角=>半角
         String.fromCharCode(s.charCodeAt(0) - 65248))
            .replace(new RegExp(delete_array.join("|"), "g"), "")
            .replace(new RegExp(Object.keys(remake_dic).join("|"), "g"), match => remake_dic[match]);
    }
}
function title2number(str) {
    if (!str)
        return 0;
    const str2 = str.match(/\d+/);
    if (!str2)
        return 0;
    return parseInt(str2[0], 10);
}
function checkTitle(titles, mode = "length") {
    if (titles.some(d => !d))
        return false;
    const titles_splited = titles.map(d => (remakeString(d, "title") || "").split(GLOBAL_sep).filter(d => !/^\s*$/.test(d)));
    if (mode == "length")
        return titles_splited[0].filter(d => titles_splited[1].join("").indexOf(d) != -1).length;
    else if (mode == "every")
        return titles_splited[0].every(d => titles_splited[1].join("").indexOf(d) != -1);
    return false;
}
// -------------------------------------------------
//               # send records and webhook
// -------------------------------------------------
async function sendAnnict(workInfo, items) {
    const notSent = (!items.annictSend || !items[`valid_${workInfo.WatchingEpisode.site}Annict`]);
    const IsNotAnime = (workInfo.WatchingEpisode.genre.indexOf("アニメ") == -1);
    if (notSent || IsNotAnime || items.token == "")
        return;
    console.log("sending to Annict");
    const WatchingEpisode = workInfo.WatchingEpisode;
    let statuses = [];
    for (const node of workInfo.nodes) {
        // AnnictへのPOST
        const IsZeroEpisode = (Object.keys(node).indexOf("IsZeroEpisode") != -1 && node.IsZeroEpisode);
        //作品に対する投稿は、status変更で対応
        const parameters = (IsZeroEpisode) ? { "work_id": node.annictId, kind: "watched", "access_token": items.token }
            : { "episode_id": node.annictId, "access_token": items.token, "share_twitter": items.withTwitter, "share_facebook": items.withFacebook };
        const url = (IsZeroEpisode) ? `https://api.annict.com/v1/me/statuses?${Object.entries(parameters).map(d => d.join("=")).join("&")}`
            : `https://api.annict.com/v1/me/records?${Object.entries(parameters).map(d => d.join("=")).join("&")}`;
        statuses.push(await fetch(url, { method: "POST" }).then(res => res.status));
    }
    const result_message = `${WatchingEpisode.workTitle} ${WatchingEpisode.episodeNumber} Annict sending ${statuses.every(d => d) ? 'successed' : 'failed'}.`;
    console.log(result_message);
    showMessage(result_message);
}
async function post2webhook(args_dict, items) {
    console.log("posting webhook");
    const WatchingEpisode = args_dict.WatchingEpisode;
    if (!items || !items[`valid_${WatchingEpisode.site}Webhook`])
        return;
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
    };
    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    const webhookSettings = checkWebhookSettings(webhookSettings_in);
    for (const webhookSetting of Object.values(webhookSettings)) {
        const postData = (webhookSetting.webhookContentChanged) ?
            Object.entries(webhookSetting.webhookContent).reduce((obj, kv) => {
                const val = kv[1].replace(/\{[^\{]+\}/g, s_in => {
                    const s = s_in.slice(1, -1);
                    if (Object.keys(origPostData).indexOf(s) != -1)
                        return origPostData[s];
                    else
                        return s_in;
                });
                return Object.assign(obj, { [kv[0]]: val });
            }, {}) : origPostData;
        //console.log(postData);
        if (!Object.entries(webhookMatchingObj).some(kv => origPostData.error.indexOf(kv[0]) != -1 && webhookSetting[kv[1]]))
            continue;
        let options = { method: "POST", headers: headers, body: JSON.stringify(postData) };
        if (webhookSetting.postUrl.indexOf("://script.google.com/macros/") != -1)
            options.mode = "no-cors";
        const res = await fetch(webhookSetting.postUrl, options);
        //console.log(res);
    }
}
function checkWebhookSettings(webhookSettingsTmp) {
    let webhookSettings = {};
    try {
        webhookSettings = JSON.parse(webhookSettingsTmp);
    }
    catch (e) {
        try {
            webhookSettings = Object.assign({}, ...[...Array(webhookSettingsTmp.length).keys()]
                .map(key => ({ [key]: webhookSettingsTmp[key] })));
        }
        catch (e) {
            webhookSettings = JSON.parse(webhookDefaultString);
        }
    }
    return webhookSettings;
}
// -------------------------------------------------
//               # Kanji2Arab
// modified from http://aok.blue.coocan.jp/jscript/kan2arb.html
// -------------------------------------------------
/********************************************************
 *
 *  漢数字をアラビア数字にする
 *
 *  Copyright (c) 2005 AOK. All Rights Reserved.
 *
 ********************************************************/
const const_kanji = {
    num: { char: "〇一二三四五六七八九零壱弐参肆伍陸質捌玖零壹貳參", limit: 10 },
    mag1: { char: "十百千拾佰仟十陌阡", limit: 3 },
    mag2: { char: "万億兆萬", limit: 3 }
};
function kanji2arab(src) {
    const reg = new RegExp(`[${const_kanji.num.char}${const_kanji.mag1.char}][${const_kanji.num.char}${const_kanji.mag1.char}${const_kanji.mag2.char}]*`, "g");
    return src.replace(reg, $0 => String(toArb($0)));
}
;
function toArb(input_kanji) {
    let IsAfterMag = false;
    let output_num = 0;
    let output_includeMag = 0;
    for (const input_char of input_kanji) {
        const numIn = const_kanji.num.char.indexOf(input_char);
        const numMag1 = const_kanji.mag1.char.indexOf(input_char);
        const numMag2 = const_kanji.mag2.char.indexOf(input_char);
        if (numIn != -1) { //0-9
            if (IsAfterMag) {
                output_num += numIn % 10;
                IsAfterMag = false;
            }
            else {
                output_num = output_num * 10 + numIn % 10;
            }
        }
        else if (numMag1 != -1) { // 10^[1-3]
            output_includeMag += output_num;
            output_num = 0;
            const mag_tmp = output_includeMag % 10;
            const num_tmp = (mag_tmp == 0 ? 1 : mag_tmp) * 10 ** (numMag1 % const_kanji.mag1.limit + 1);
            output_includeMag += num_tmp - mag_tmp;
            IsAfterMag = true;
        }
        else if (numMag2 != -1) { // 10^4n
            output_includeMag += output_num;
            output_num = 0;
            const mag_tmp = output_includeMag % 10000;
            const num_tmp = mag_tmp * 10000 ** (numMag2 % const_kanji.mag2.limit + 1);
            output_includeMag += num_tmp - mag_tmp;
            IsAfterMag = true;
        }
        else
            return input_kanji; // can't convert
    }
    return output_includeMag + output_num; // return output
}
;
export {};
//# sourceMappingURL=index.js.map