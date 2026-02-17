import { WatchingEpisode, AmazonScriptData, Genre, AmazonSelfItem } from '../../types';
import { title2number, remakeString } from '../utils/string';

export function obtainWatchingFromAmazon(genreLimit: boolean): WatchingEpisode | Record<string, never> {
    const videoSite = "amazon";
    const workTitle = document.querySelector("h1[data-automation-id='title']")?.textContent || "";
    // obtain detail scripts
    const script_candidates = Array.from(document.querySelectorAll("script[type='text/template']"));
    const scripts = script_candidates.reduce((acc: { isElcano?: AmazonScriptData }, cand) => {
        /* if (cand.innerHTML.indexOf(`{"props":{"state":{"features":{"enable`)!=-1){
            return Object.assign(acc, {enable: JSON.parse(cand.textContent)});
        } else */ if (cand.innerHTML.indexOf(`{"props":{"state":{"features":{"isElcano`) != -1) {
            return Object.assign(acc, { isElcano: JSON.parse(cand.textContent || "{}") })
        } else return acc;
    }, {});
    if (!scripts.isElcano) return {};
    const workId = scripts.isElcano.props.state.pageTitleId;
    const workIds = scripts.isElcano.props.state.self[workId].asins;
    const workIdsSub: string[] = ([] as string[]).concat(...Object.values(scripts.isElcano.props.state.self).map((d: AmazonSelfItem) => d.asins))
    const detailData = (scripts.isElcano.props.state.detail.detail[workId] ||
        scripts.isElcano.props.state.detail.headerDetail[workId]);
    const genresTmp = detailData.genres.map((d: Genre) => d.text);
    const genres = (genresTmp.length == 0) ? ["アニメ"] : genresTmp;
    if (genres.indexOf("アニメ") == -1 && genreLimit) return {};

    // obtain episode numbers
    const candidates = Array.from(document.querySelectorAll("h2"));
    const seasonAndEpisode = candidates.reduce((acc: string[], cand) => {
        if (Array.from(cand.classList).join(" ").indexOf("subtitle") != -1) {
            return acc.concat([cand.textContent || ""]);
        } else return acc;
    }, []);

    if (seasonAndEpisode.length != 1) return {};
    const episodeWriting = seasonAndEpisode[0].match(/(?<=シーズン\d+、エピソード\d+\s).*/);
    if (episodeWriting == null || episodeWriting.length == 0) return {};
    const episodeNumebrInd_candidates = episodeWriting[0].split(" ").map((d, ind): [number, string] => [ind, d])
        .filter(d => isFinite(title2number(remakeString(d[1], "episodeNumber"))))
    if (episodeNumebrInd_candidates.length == 0) return {};
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
    }
}
