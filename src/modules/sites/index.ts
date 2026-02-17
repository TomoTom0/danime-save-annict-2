import { WatchingEpisode } from '../../types';
import { obtainWatchingFromDanime } from './danime';
import { obtainWatchingFromAmazon } from './amazon';
import { obtainWatchingFromNetflix } from './netflix';
import { obtainWatchingFromAbema } from './abema';

export function obtainWatching(videoSite: string, genreLimit = true): WatchingEpisode | Record<string, never> {
    if (videoSite == "danime") return obtainWatchingFromDanime();
    else if (videoSite == "amazon") return obtainWatchingFromAmazon(genreLimit);
    else if (videoSite == "netflix") return obtainWatchingFromNetflix();
    else if (videoSite == "abema") return obtainWatchingFromAbema(genreLimit);
    else return {};
}

export { obtainWatchingFromDanime, obtainWatchingFromAmazon, obtainWatchingFromNetflix, obtainWatchingFromAbema };
