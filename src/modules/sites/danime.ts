import { WatchingEpisode } from '../../types';
import { title2number, remakeString } from '../utils/string';

export function obtainWatchingFromDanime(): WatchingEpisode | Record<string, never> {
    const videoSite = "danime";
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
