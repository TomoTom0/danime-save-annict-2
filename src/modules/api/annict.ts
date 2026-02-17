import { WatchingEpisode, WorkNode, WorkInfo, EpisodeNode, StorageItems } from '../../types';
import { remakeString, title2number, checkTitle, splitTitle } from '../utils/string';
import { debugLog } from '../ui/notification';
import { showMessage } from '../ui/notification';

export async function fetchWork(title: string, annictToken: string): Promise<WorkNode[]> {
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
    const headers = {
        'Authorization': `Bearer ${annictToken}`
    };
    return await fetch(graphql_url, { method: "POST", headers: headers })
        .then(res => res.json())
        .then(jsoned => jsoned.errors ? [] : jsoned.data.searchWorks.edges.map((d: { node: WorkNode }) => d.node));
}

export async function checkTitleWithWorkId(WatchingEpisode: WatchingEpisode, work_nodes: WorkNode[]): Promise<WorkNode[]> {
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
            .filter(d => d[0].indexOf(String(vod_dic[videoSite as keyof typeof vod_dic])) != -1)
        if (vod_info.length == 0 || vod_info.filter(d => d[1].match(/\S+/)).length == 0) continue;
        const vod_info_ids = vod_info.map(d => d[1].match(/\S+/)).filter(d => d !== null).map(d => d![0]); // idは複数存在しうる
        // workIdが見つかった場合
        if (["danime", "abema", "netflix"].indexOf(WatchingEpisode.site) != -1 && vod_info_ids.some(id => id == WatchingEpisode.workId)) good_nodes.push(work_node);
        else if (WatchingEpisode.site == "amazon" && vod_info_ids.some(id => WatchingEpisode.workIds.indexOf(id) != -1)) good_nodes.push(work_node);
        // workIdが見つからなかった場合
        // web verの可能性を検討 <- 現在はdanimeの場合のみrest apiから調べる
        if (["danime"].indexOf(WatchingEpisode.site) != -1) {
            const episodeTitle = WatchingEpisode.episodeTitle;
            const episodeNumber = WatchingEpisode.episodeNumber;
            const numberFromUrl = WatchingEpisode.numberFromUrl;

            const danime_infos = await Promise.all(vod_info_ids.map(async workIdTmp => {
                const url = "https://animestore.docomo.ne.jp/animestore/rest/WS030101" + `?partId=${workIdTmp}${numberFromUrl}`
                return await fetch(url).then(d => d.json())
            })).then(infos => infos.filter(info => {
                return (info.partTitle == episodeTitle) && (info.partDispNumber == episodeNumber);
            }));
            if (danime_infos.length == 0) continue;
            else good_nodes.push(work_node);
        }

    }
    return good_nodes;
}

export async function identifyWork(WatchingEpisode: WatchingEpisode, annictToken: string): Promise<WorkInfo> {
    const remake = {
        episodeTitle: remakeString(WatchingEpisode.episodeTitle, "title"),
        splitedTitle: splitTitle(WatchingEpisode.workTitle)
    };
    const result_nodes = await fetchWork(remake.splitedTitle[0], annictToken);
    if (result_nodes.length == 0) {
        return { WatchingEpisode: WatchingEpisode, nodes: [], webhook: { WatchingEpisode: WatchingEpisode, error: "noWorkMatched" } } as WorkInfo
    }
    const goodWorkNodesTmp = await checkTitleWithWorkId(WatchingEpisode, result_nodes);
    const workIdIsFound = (goodWorkNodesTmp.length != 0);
    const goodWorkNodes = (workIdIsFound) ? goodWorkNodesTmp : result_nodes;
    debugLog("Work Candidates:\n", goodWorkNodes);

    const combinedEpisodeNode: EpisodeNode[] = ([] as EpisodeNode[]).concat(...goodWorkNodes.map(workNode => {
        if (workNode.episodes.edges.length > 0) {
            const episodeNodes = workNode.episodes.edges.map(d => d.node);
            const unitNum = Math.min(...episodeNodes.map(d => d.sortNumber).filter((d): d is number => d !== undefined && d > 0));
            return episodeNodes.map(d => {
                if (d.sortNumber !== undefined) d.sortNumber = d.sortNumber / unitNum;
                return d;
            })
        }
        else return { title: workNode.title, number: "", annictId: workNode.annictId, media: workNode.media, IsZeroEpisode: true }; // only 0 episode
    }));
    const episodes_numberAndCheck = combinedEpisodeNode.map((episode_node: EpisodeNode) =>
        [workIdIsFound,
            checkTitle([remake.episodeTitle, episode_node.title], "every"),
            (episode_node.number || episode_node.sortNumber) == WatchingEpisode.number]);
    const episodes_judges = episodes_numberAndCheck.map(d =>
        [d[0] && d[1] && d[2], // workId is found and episode title & number corresponds
        d[0] && d[1], // workId is found and episode title corresponds
        d[0] && d[2], // workId is found and episode number corresponds
        d[1] && d[2], // episode title and number corresponds
        d[1], // episode title corresponds
        d[2]]); // episode number corresponds
    const judge_kinds = episodes_judges[0].length;
    const valid_check_methods = [...Array(judge_kinds).keys()].filter(num => episodes_judges.filter(d => d[num]).length > 0);
    const error_messages = [[valid_check_methods.length == 0, "noEpisodeMatched"], [!workIdIsFound, "noWorkId"]]
        .filter(d => d[0]).map(d => d[1]).join(" ") || "none"; // なにもなければnone
    if (valid_check_methods.length > 0) {
        const episode_node: EpisodeNode = episodes_judges.map((d, ind) => [d[valid_check_methods[0]], combinedEpisodeNode[ind]])
            .filter(d => d[0]).map(d => d[1])[0] as EpisodeNode;
        const webhookContent = { WatchingEpisode: WatchingEpisode, error: error_messages };
        return { WatchingEpisode: WatchingEpisode, nodes: [episode_node], webhook: webhookContent };
    } else {
        return {
            WatchingEpisode: WatchingEpisode, nodes: [],
            webhook: { WatchingEpisode: WatchingEpisode, error: error_messages }
        };
    }
}

export async function obtainWork(WatchingEpisode: WatchingEpisode, annictToken: string): Promise<WorkInfo> {
    const IsCombinedEpisode = (/～|／/.test(WatchingEpisode.episodeNumber) &&
        WatchingEpisode.episodeNumber.split(/～|／/g).every(d => isFinite(title2number(remakeString(d, "episodeNumber")))));
    if (!IsCombinedEpisode) {
        return await identifyWork(WatchingEpisode, annictToken);
    } else {
        const splited_episodeNumbers = WatchingEpisode.episodeNumber.split(/～|／/g)
            .map(d => title2number(remakeString(d, "episodeNumber")));
        const episodeRange = [splited_episodeNumbers[0], splited_episodeNumbers.slice(-1)[0]];
        const episodeNumbers = [...Array(episodeRange[1] - episodeRange[0] + 1).keys()].map(num => num + episodeRange[0]);
        let workInfos: WorkInfo[] = [];
        for (const number of episodeNumbers) {
            const episodeNow: WatchingEpisode = {
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
            if (workInfoTmp && workInfoTmp.nodes && workInfoTmp.nodes.length > 0) workInfos.push(workInfoTmp);
        }
        const errorMessage = Array.from(new Set(workInfos.map(d => d.webhook.error))).sort().join(" ");
        return { WatchingEpisode: WatchingEpisode, webhook: { WatchingEpisode: WatchingEpisode, error: errorMessage }, nodes: ([] as EpisodeNode[]).concat(...workInfos.map(d => d.nodes)) };
    }
}

export async function sendAnnict(workInfo: WorkInfo, items: StorageItems) {
    const notSent = (!items.annictSend || !items[`valid_${workInfo.WatchingEpisode.site}Annict`]);
    const IsNotAnime = (workInfo.WatchingEpisode.genre.indexOf("アニメ") == -1)
    if (notSent || IsNotAnime || items.token == "") return;
    debugLog("sending to Annict");
    const WatchingEpisode = workInfo.WatchingEpisode;
    let statuses = [];
    for (const node of workInfo.nodes) {
        // AnnictへのPOST
        const IsZeroEpisode = (Object.keys(node).indexOf("IsZeroEpisode") != -1 && node.IsZeroEpisode)
        //作品に対する投稿は、status変更で対応
        const parameters = (IsZeroEpisode) ? { "work_id": node.annictId, kind: "watched", "access_token": items.token }
            : { "episode_id": node.annictId, "access_token": items.token, "share_twitter": items.withTwitter, "share_facebook": items.withFacebook };
        const url = (IsZeroEpisode) ? `https://api.annict.com/v1/me/statuses?${Object.entries(parameters).map(d => d.join("=")).join("&")}`
            : `https://api.annict.com/v1/me/records?${Object.entries(parameters).map(d => d.join("=")).join("&")}`;
        statuses.push(await fetch(url, { method: "POST" }).then(res => res.status));
    }
    const result_message = `${WatchingEpisode.workTitle} ${WatchingEpisode.episodeNumber} Annict sending ${statuses.every(d => d) ? 'successed' : 'failed'}.`;
    debugLog(result_message);
    showMessage(result_message);
}
