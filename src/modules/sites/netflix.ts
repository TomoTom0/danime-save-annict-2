import { WatchingEpisode } from '../../types';
import { title2number, remakeString } from '../utils/string';

export function obtainWatchingFromNetflix(): WatchingEpisode | Record<string, never> {
    const videoSite = "netflix";
    const titleArea = document.querySelector(".video-title>div");
    const workTitle = titleArea?.querySelector("h4")?.textContent || "";
    const spans: NodeListOf<HTMLSpanElement> | HTMLSpanElement[] = titleArea?.querySelectorAll("span") || [];
    const episodeWriting = [spans[1]?.textContent || ""];
    const episodeNumebrInd_candidates = episodeWriting[0].split(" ").map((d: string, ind: number): [number, string] => [ind, d])
        .filter((d: [number, string]) => isFinite(title2number(remakeString(d[1], "episodeNumber"))));
    if (episodeNumebrInd_candidates.length == 0) return {};
    const episodeNumebrInd = Math.min(...episodeNumebrInd_candidates.map((d: [number, string]) => d[0]));
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
    }
}
