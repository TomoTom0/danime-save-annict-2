import { WatchingEpisode } from '../../types';
import { title2number, remakeString } from '../utils/string';

export function obtainWatchingFromAbema(genreLimit: boolean): WatchingEpisode | Record<string, never> {
    const videoSite = "abema";
    const candidates = document.querySelectorAll("script[type='application/ld+json']");
    const jsonData = JSON.parse(candidates[candidates.length - 1].innerHTML).itemListElement;
    if (!jsonData || jsonData.length < 4 || (jsonData[1].name != "アニメ" && genreLimit)) return {}; // require アニメ
    const genre = jsonData[1].name;
    const workTitle = jsonData[2].name;
    const episodeWriting = [jsonData[3].name];
    const episodeNumebrInd_candidates = episodeWriting[0].split(" ").map((d: string, ind: number): [number, string] => [ind, d])
        .filter((d: [number, string]) => isFinite(title2number(remakeString(d[1], "episodeNumber"))));
    if (episodeNumebrInd_candidates.length == 0) return {};
    const episodeNumebrInd = Math.min(...episodeNumebrInd_candidates.map((d: [number, string]) => d[0]));
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
    }
}
