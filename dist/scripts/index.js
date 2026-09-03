"use strict";
(() => {
  // src/modules/ui/notification.ts
  var DEBUG_MODE = false;
  function debugLog(...args) {
    if (DEBUG_MODE) {
      console.log(...args);
    }
  }
  function resetNotificationClasses(dialog) {
    dialog.classList.remove("dsa-dialog-show", "dsa-dialog-fade-in", "dsa-dialog-fade-out");
  }
  function fadeIn(dialog) {
    setTimeout(() => {
      dialog.classList.add("dsa-dialog-show");
      setTimeout(() => {
        dialog.classList.add("dsa-dialog-fade-in");
      }, 10);
    }, 0);
  }
  function fadeOut(dialog, delay = 5e3) {
    setTimeout(() => {
      dialog.classList.remove("dsa-dialog-fade-in");
      dialog.classList.add("dsa-dialog-fade-out");
      setTimeout(() => {
        dialog.classList.remove("dsa-dialog-show", "dsa-dialog-fade-out");
      }, 600);
    }, delay);
  }
  function showMessage(message, dialog_in) {
    const dialog = dialog_in ? dialog_in : document.querySelector(".dsa-dialog");
    if (!dialog) return;
    dialog.textContent = message;
    resetNotificationClasses(dialog);
    fadeIn(dialog);
    fadeOut(dialog);
  }
  function loadNotificationStyles() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/notifications.css");
    document.head.appendChild(link);
  }

  // src/modules/storage/storage.ts
  var webhookDefaultSetting = {
    postUrl: "",
    webhookNoMatched: true,
    webhookNoWorkId: false,
    webhookSuccess: false,
    webhookContentChanged: false,
    webhookContent: {}
  };
  var webhookDefaultString = JSON.stringify({ [Date.now()]: webhookDefaultSetting });
  var checkValid1 = Object.assign({ "valid_danime": true }, ...["amazon", "abema"].map((key) => ({ [`valid_${key}`]: false })));
  var checkValid2 = Object.assign({}, ...["danime", "amazon", "abema"].map((key) => ({ [`valid_${key}Annict`]: true, [`valid_${key}Webhook`]: true, [`valid_${key}Genre`]: false })));
  var checkValid = Object.assign(checkValid1, checkValid2);
  var inputObj = Object.assign({
    token: "",
    sendingTime: 300,
    annictSend: true,
    withTwitter: false,
    withFacebook: false,
    webhookSettings: webhookDefaultString
  }, checkValid);
  var getSyncStorage = (keys) => new Promise((resolve) => {
    chrome.storage.sync.get(keys, (items) => resolve(items));
  });
  var setSyncStorage = (items) => new Promise((resolve) => {
    chrome.storage.sync.set(items, resolve);
  });
  function obtainVideoSite() {
    const siteTmp = Object.entries({
      danime: "https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId",
      // for danime
      amazon: "https://www.amazon.co.jp/gp/video/detail/",
      // for Amazon Prime
      amazon_: "https://www.amazon.co.jp/dp/",
      // for Amazon Prime 2
      netflix: "https://www.netflix.com/episode/",
      // for Netflix
      abema: "https://abema.tv/video/"
      // for abemaTV
    }).filter((kv) => location.href.indexOf(kv[1]) != -1) || [];
    return (siteTmp.map((kv) => kv[0])[0] || "").replace(/_*$/, "");
  }

  // src/modules/utils/string.ts
  var GLOBAL_sep = /\s+|;|・|\(|（|\)|）|～|‐|-|―|－|&|＆|#|＃|映画\s*|劇場版\s*|!|！|\?|？|…|『|』|「|」/g;
  var const_kanji = {
    num: { char: "\u3007\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u96F6\u58F1\u5F10\u53C2\u8086\u4F0D\u9678\u8CEA\u634C\u7396\u96F6\u58F9\u8CB3\u53C3", limit: 10 },
    mag1: { char: "\u5341\u767E\u5343\u62FE\u4F70\u4EDF\u5341\u964C\u9621", limit: 3 },
    mag2: { char: "\u4E07\u5104\u5146\u842C", limit: 3 }
  };
  function kanji2arab(src) {
    const reg = new RegExp(`[${const_kanji.num.char}${const_kanji.mag1.char}][${const_kanji.num.char}${const_kanji.mag1.char}${const_kanji.mag2.char}]*`, "g");
    return src.replace(reg, ($0) => String(toArb($0)));
  }
  function toArb(input_kanji) {
    let IsAfterMag = false;
    let output_num = 0;
    let output_includeMag = 0;
    for (const input_char of input_kanji) {
      const numIn = const_kanji.num.char.indexOf(input_char);
      const numMag1 = const_kanji.mag1.char.indexOf(input_char);
      const numMag2 = const_kanji.mag2.char.indexOf(input_char);
      if (numIn != -1) {
        if (IsAfterMag) {
          output_num += numIn % 10;
          IsAfterMag = false;
        } else {
          output_num = output_num * 10 + numIn % 10;
        }
      } else if (numMag1 != -1) {
        output_includeMag += output_num;
        output_num = 0;
        const mag_tmp = output_includeMag % 10;
        const num_tmp = (mag_tmp == 0 ? 1 : mag_tmp) * 10 ** (numMag1 % const_kanji.mag1.limit + 1);
        output_includeMag += num_tmp - mag_tmp;
        IsAfterMag = true;
      } else if (numMag2 != -1) {
        output_includeMag += output_num;
        output_num = 0;
        const mag_tmp = output_includeMag % 1e4;
        const num_tmp = mag_tmp * 1e4 ** (numMag2 % const_kanji.mag2.limit + 1);
        output_includeMag += num_tmp - mag_tmp;
        IsAfterMag = true;
      } else return input_kanji;
    }
    return output_includeMag + output_num;
  }
  function remakeString(input_str, mode = "title") {
    if (!input_str) return "";
    const delete_array = ["\u300C", "\u300D", "\u300E", "\u300F", "\uFF62", "\uFF63"];
    const remake_dic = {
      "\u3008": "\uFF1C",
      "\u3009": "\uFF1E",
      "\u2160": "I",
      "\u2161": "II",
      "\u2162": "III",
      "\u2163": "IV",
      "\u2164": "V",
      "\u2165": "VI",
      "\u2166": "VII",
      "\u2167": "VIII",
      "\u2168": "IX",
      "\u2169": "X"
    };
    if (mode == "episodeNumber") {
      return kanji2arab(input_str).replace(/[０-９]/g, (s) => (
        // 全角=>半角
        String.fromCharCode(s.charCodeAt(0) - 65248)
      ));
    } else if (mode == "title") {
      return input_str.replace(/[Ａ-Ｚａ-ｚ０-９：]/g, (s) => (
        // 全角=>半角
        String.fromCharCode(s.charCodeAt(0) - 65248)
      )).replace(new RegExp(delete_array.join("|"), "g"), "").replace(new RegExp(Object.keys(remake_dic).join("|"), "g"), (match) => remake_dic[match]);
    }
    return "";
  }
  function title2number(str) {
    if (!str) return 0;
    const str2 = str.match(/\d+/);
    if (!str2) return 0;
    return parseInt(str2[0], 10);
  }
  function checkTitle(titles, mode = "length") {
    if (titles.some((d) => !d)) return false;
    const titles_splited = titles.map((d) => (remakeString(d, "title") || "").split(GLOBAL_sep).filter((d2) => !/^\s*$/.test(d2)));
    if (mode == "length") return titles_splited[0].filter((d) => titles_splited[1].join("").indexOf(d) != -1).length;
    else if (mode == "every") return titles_splited[0].every((d) => titles_splited[1].join("").indexOf(d) != -1);
    return false;
  }
  function splitTitle(title) {
    return title.split(GLOBAL_sep).filter((d) => !/^\s*$/.test(d));
  }

  // src/modules/sites/danime.ts
  function obtainWatchingFromDanime() {
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
      genre: "\u30A2\u30CB\u30E1",
      workId: workIdMatch ? workIdMatch[0] : "",
      workIds: []
    };
  }

  // src/modules/sites/amazon.ts
  function obtainWatchingFromAmazon(genreLimit) {
    const videoSite = "amazon";
    const workTitle = document.querySelector("h1[data-automation-id='title']")?.textContent || "";
    const script_candidates = Array.from(document.querySelectorAll("script[type='text/template']"));
    const scripts = script_candidates.reduce((acc, cand) => {
      if (cand.innerHTML.indexOf(`{"props":{"state":{"features":{"isElcano`) != -1) {
        return Object.assign(acc, { isElcano: JSON.parse(cand.textContent || "{}") });
      } else return acc;
    }, {});
    if (!scripts.isElcano) return {};
    const workId = scripts.isElcano.props.state.pageTitleId;
    const workIds = scripts.isElcano.props.state.self[workId].asins;
    const workIdsSub = [].concat(...Object.values(scripts.isElcano.props.state.self).map((d) => d.asins));
    const detailData = scripts.isElcano.props.state.detail.detail[workId] || scripts.isElcano.props.state.detail.headerDetail[workId];
    const genresTmp = detailData.genres.map((d) => d.text);
    const genres = genresTmp.length == 0 ? ["\u30A2\u30CB\u30E1"] : genresTmp;
    if (genres.indexOf("\u30A2\u30CB\u30E1") == -1 && genreLimit) return {};
    const candidates = Array.from(document.querySelectorAll("h2"));
    const seasonAndEpisode = candidates.reduce((acc, cand) => {
      if (Array.from(cand.classList).join(" ").indexOf("subtitle") != -1) {
        return acc.concat([cand.textContent || ""]);
      } else return acc;
    }, []);
    if (seasonAndEpisode.length != 1) return {};
    const episodeWriting = seasonAndEpisode[0].match(/(?<=シーズン\d+、エピソード\d+\s).*/);
    if (episodeWriting == null || episodeWriting.length == 0) return {};
    const episodeNumebrInd_candidates = episodeWriting[0].split(" ").map((d, ind) => [ind, d]).filter((d) => isFinite(title2number(remakeString(d[1], "episodeNumber"))));
    if (episodeNumebrInd_candidates.length == 0) return {};
    const episodeNumebrInd = Math.min(...episodeNumebrInd_candidates.map((d) => d[0]));
    return {
      site: videoSite,
      workTitle,
      episodeTitle: episodeWriting[0].split(" ").slice(episodeNumebrInd + 1).join(" "),
      episodeNumber: episodeWriting[0].split(" ")[episodeNumebrInd],
      number: title2number(remakeString(episodeWriting[0].split(" ")[episodeNumebrInd], "episodeNumber")),
      genre: genres.join(" "),
      workId,
      workIds,
      workIdsSub
    };
  }

  // src/modules/sites/netflix.ts
  function obtainWatchingFromNetflix() {
    const videoSite = "netflix";
    const titleArea = document.querySelector(".video-title>div");
    const workTitle = titleArea?.querySelector("h4")?.textContent || "";
    const spans = titleArea?.querySelectorAll("span") || [];
    const episodeWriting = [spans[1]?.textContent || ""];
    const episodeNumebrInd_candidates = episodeWriting[0].split(" ").map((d, ind) => [ind, d]).filter((d) => isFinite(title2number(remakeString(d[1], "episodeNumber"))));
    if (episodeNumebrInd_candidates.length == 0) return {};
    const episodeNumebrInd = Math.min(...episodeNumebrInd_candidates.map((d) => d[0]));
    const netflixWorkId = location.href.match(/(?<=netflix\.com\/episode\/)[^?]+/)?.[0] || "";
    return {
      site: videoSite,
      workTitle,
      episodeTitle: episodeWriting[0].split(" ").slice(episodeNumebrInd + 1).join(" "),
      episodeNumber: episodeWriting[0].split(" ")[episodeNumebrInd],
      number: title2number(remakeString(episodeWriting[0].split(" ")[episodeNumebrInd], "episodeNumber")),
      genre: "\u30A2\u30CB\u30E1",
      workId: netflixWorkId,
      workIds: []
    };
  }

  // src/modules/sites/abema.ts
  function obtainWatchingFromAbema(genreLimit) {
    const videoSite = "abema";
    const candidates = document.querySelectorAll("script[type='application/ld+json']");
    const jsonData = JSON.parse(candidates[candidates.length - 1].innerHTML).itemListElement;
    if (!jsonData || jsonData.length < 4 || jsonData[1].name != "\u30A2\u30CB\u30E1" && genreLimit) return {};
    const genre = jsonData[1].name;
    const workTitle = jsonData[2].name;
    const episodeWriting = [jsonData[3].name];
    const episodeNumebrInd_candidates = episodeWriting[0].split(" ").map((d, ind) => [ind, d]).filter((d) => isFinite(title2number(remakeString(d[1], "episodeNumber"))));
    if (episodeNumebrInd_candidates.length == 0) return {};
    const episodeNumebrInd = Math.min(...episodeNumebrInd_candidates.map((d) => d[0]));
    const workIdMatch = location.href.match(/(?<=abema\.tv\/video\/episode\/)[^_]+/);
    return {
      site: videoSite,
      workTitle,
      episodeTitle: episodeWriting[0].split(" ").slice(episodeNumebrInd + 1).join(" "),
      episodeNumber: episodeWriting[0].split(" ")[episodeNumebrInd],
      number: title2number(remakeString(episodeWriting[0].split(" ")[episodeNumebrInd], "episodeNumber")),
      genre,
      workId: workIdMatch ? workIdMatch[0] : "",
      workIds: []
    };
  }

  // src/modules/sites/index.ts
  function obtainWatching(videoSite, genreLimit = true) {
    if (videoSite == "danime") return obtainWatchingFromDanime();
    else if (videoSite == "amazon") return obtainWatchingFromAmazon(genreLimit);
    else if (videoSite == "netflix") return obtainWatchingFromNetflix();
    else if (videoSite == "abema") return obtainWatchingFromAbema(genreLimit);
    else return {};
  }

  // src/modules/api/annict.ts
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
    const headers = {
      "Authorization": `Bearer ${annictToken}`
    };
    return await fetch(graphql_url, { method: "POST", headers }).then((res) => res.json()).then((jsoned) => jsoned.errors ? [] : jsoned.data.searchWorks.edges.map((d) => d.node));
  }
  async function checkTitleWithWorkId(WatchingEpisode9, work_nodes) {
    const videoSite = WatchingEpisode9.site;
    const vod_dic = { danime: 241, amazon: 243, netflix: 244, abema: 260 };
    let good_nodes = [];
    for (const work_node of work_nodes) {
      const annictId = work_node.annictId;
      const db_url = `https://api.annict.com/db/works/${annictId}/programs`;
      const db_html = await fetch(db_url).then((d) => d.text());
      const parser = new DOMParser();
      const doc = parser.parseFromString(db_html, "text/html");
      const vod_info = Array.from(doc.querySelectorAll("tr")).map((el) => {
        const tds = el.querySelectorAll("td");
        return [tds[1]?.textContent || "", tds[5]?.textContent || ""];
      }).filter((d) => d[0].indexOf(String(vod_dic[videoSite])) != -1);
      if (vod_info.length == 0 || vod_info.filter((d) => d[1].match(/\S+/)).length == 0) continue;
      const vod_info_ids = vod_info.map((d) => d[1].match(/\S+/)).filter((d) => d !== null).map((d) => d[0]);
      if (["danime", "abema", "netflix"].indexOf(WatchingEpisode9.site) != -1 && vod_info_ids.some((id) => id == WatchingEpisode9.workId)) good_nodes.push(work_node);
      else if (WatchingEpisode9.site == "amazon" && vod_info_ids.some((id) => WatchingEpisode9.workIds.indexOf(id) != -1)) good_nodes.push(work_node);
      if (["danime"].indexOf(WatchingEpisode9.site) != -1) {
        const episodeTitle = WatchingEpisode9.episodeTitle;
        const episodeNumber = WatchingEpisode9.episodeNumber;
        const numberFromUrl = WatchingEpisode9.numberFromUrl;
        const danime_infos = await Promise.all(vod_info_ids.map(async (workIdTmp) => {
          const url = `https://animestore.docomo.ne.jp/animestore/rest/WS030101?partId=${workIdTmp}${numberFromUrl}`;
          return await fetch(url).then((d) => d.json());
        })).then((infos) => infos.filter((info) => {
          return info.partTitle == episodeTitle && info.partDispNumber == episodeNumber;
        }));
        if (danime_infos.length == 0) continue;
        else good_nodes.push(work_node);
      }
    }
    return good_nodes;
  }
  async function identifyWork(WatchingEpisode9, annictToken) {
    const remake = {
      episodeTitle: remakeString(WatchingEpisode9.episodeTitle, "title"),
      splitedTitle: splitTitle(WatchingEpisode9.workTitle)
    };
    const result_nodes = await fetchWork(remake.splitedTitle[0], annictToken);
    if (result_nodes.length == 0) {
      return { WatchingEpisode: WatchingEpisode9, nodes: [], webhook: { WatchingEpisode: WatchingEpisode9, error: "noWorkMatched" } };
    }
    const goodWorkNodesTmp = await checkTitleWithWorkId(WatchingEpisode9, result_nodes);
    const workIdIsFound = goodWorkNodesTmp.length != 0;
    const goodWorkNodes = workIdIsFound ? goodWorkNodesTmp : result_nodes;
    debugLog("Work Candidates:\n", goodWorkNodes);
    const combinedEpisodeNode = [].concat(...goodWorkNodes.map((workNode) => {
      if (workNode.episodes.edges.length > 0) {
        const episodeNodes = workNode.episodes.edges.map((d) => d.node);
        const unitNum = Math.min(...episodeNodes.map((d) => d.sortNumber).filter((d) => d !== void 0 && d > 0));
        return episodeNodes.map((d) => {
          if (d.sortNumber !== void 0) d.sortNumber = d.sortNumber / unitNum;
          return d;
        });
      } else return { title: workNode.title, number: "", annictId: workNode.annictId, media: workNode.media, IsZeroEpisode: true };
    }));
    const episodes_numberAndCheck = combinedEpisodeNode.map((episode_node) => [
      workIdIsFound,
      checkTitle([remake.episodeTitle, episode_node.title], "every"),
      (episode_node.number || episode_node.sortNumber) == WatchingEpisode9.number
    ]);
    const episodes_judges = episodes_numberAndCheck.map((d) => [
      d[0] && d[1] && d[2],
      // workId is found and episode title & number corresponds
      d[0] && d[1],
      // workId is found and episode title corresponds
      d[0] && d[2],
      // workId is found and episode number corresponds
      d[1] && d[2],
      // episode title and number corresponds
      d[1],
      // episode title corresponds
      d[2]
    ]);
    const judge_kinds = episodes_judges[0].length;
    const valid_check_methods = [...Array(judge_kinds).keys()].filter((num) => episodes_judges.filter((d) => d[num]).length > 0);
    const error_messages = [[valid_check_methods.length == 0, "noEpisodeMatched"], [!workIdIsFound, "noWorkId"]].filter((d) => d[0]).map((d) => d[1]).join(" ") || "none";
    if (valid_check_methods.length > 0) {
      const episode_node = episodes_judges.map((d, ind) => [d[valid_check_methods[0]], combinedEpisodeNode[ind]]).filter((d) => d[0]).map((d) => d[1])[0];
      const webhookContent = { WatchingEpisode: WatchingEpisode9, error: error_messages };
      return { WatchingEpisode: WatchingEpisode9, nodes: [episode_node], webhook: webhookContent };
    } else {
      return {
        WatchingEpisode: WatchingEpisode9,
        nodes: [],
        webhook: { WatchingEpisode: WatchingEpisode9, error: error_messages }
      };
    }
  }
  async function obtainWork(WatchingEpisode9, annictToken) {
    const IsCombinedEpisode = /～|／/.test(WatchingEpisode9.episodeNumber) && WatchingEpisode9.episodeNumber.split(/～|／/g).every((d) => isFinite(title2number(remakeString(d, "episodeNumber"))));
    if (!IsCombinedEpisode) {
      return await identifyWork(WatchingEpisode9, annictToken);
    } else {
      const splited_episodeNumbers = WatchingEpisode9.episodeNumber.split(/～|／/g).map((d) => title2number(remakeString(d, "episodeNumber")));
      const episodeRange = [splited_episodeNumbers[0], splited_episodeNumbers.slice(-1)[0]];
      const episodeNumbers = [...Array(episodeRange[1] - episodeRange[0] + 1).keys()].map((num) => num + episodeRange[0]);
      let workInfos = [];
      for (const number of episodeNumbers) {
        const episodeNow = {
          site: WatchingEpisode9.site,
          workTitle: WatchingEpisode9.workTitle,
          genre: WatchingEpisode9.genre,
          workId: WatchingEpisode9.workId,
          workIds: WatchingEpisode9.workIds,
          episodeTitle: "",
          episodeNumber: `${number}`,
          number
        };
        const workInfoTmp = await identifyWork(episodeNow, annictToken);
        if (workInfoTmp && workInfoTmp.nodes && workInfoTmp.nodes.length > 0) workInfos.push(workInfoTmp);
      }
      const errorMessage = Array.from(new Set(workInfos.map((d) => d.webhook.error))).sort().join(" ");
      return { WatchingEpisode: WatchingEpisode9, webhook: { WatchingEpisode: WatchingEpisode9, error: errorMessage }, nodes: [].concat(...workInfos.map((d) => d.nodes)) };
    }
  }
  async function sendAnnict(workInfo, items) {
    const notSent = !items.annictSend || !items[`valid_${workInfo.WatchingEpisode.site}Annict`];
    const IsNotAnime = workInfo.WatchingEpisode.genre.indexOf("\u30A2\u30CB\u30E1") == -1;
    if (notSent || IsNotAnime || items.token == "") return;
    debugLog("sending to Annict");
    const WatchingEpisode9 = workInfo.WatchingEpisode;
    let statuses = [];
    for (const node of workInfo.nodes) {
      const IsZeroEpisode = Object.keys(node).indexOf("IsZeroEpisode") != -1 && node.IsZeroEpisode;
      const parameters = IsZeroEpisode ? { "work_id": node.annictId, kind: "watched", "access_token": items.token } : { "episode_id": node.annictId, "access_token": items.token, "share_twitter": items.withTwitter, "share_facebook": items.withFacebook };
      const url = IsZeroEpisode ? `https://api.annict.com/v1/me/statuses?${Object.entries(parameters).map((d) => d.join("=")).join("&")}` : `https://api.annict.com/v1/me/records?${Object.entries(parameters).map((d) => d.join("=")).join("&")}`;
      statuses.push(await fetch(url, { method: "POST" }).then((res) => res.status));
    }
    const result_message = `${WatchingEpisode9.workTitle} ${WatchingEpisode9.episodeNumber} Annict sending ${statuses.every((d) => d) ? "successed" : "failed"}.`;
    debugLog(result_message);
    showMessage(result_message);
  }

  // src/modules/api/webhook.ts
  function checkWebhookSettings(webhookSettingsTmp) {
    let webhookSettings = {};
    try {
      webhookSettings = JSON.parse(webhookSettingsTmp);
    } catch (e) {
      try {
        webhookSettings = Object.assign({}, ...[...Array(webhookSettingsTmp.length).keys()].map((key) => ({ [key]: webhookSettingsTmp[key] })));
      } catch (e2) {
        webhookSettings = JSON.parse(webhookDefaultString);
      }
    }
    return webhookSettings;
  }
  async function post2webhook(args_dict, items) {
    debugLog("posting webhook");
    const WatchingEpisode9 = args_dict.WatchingEpisode;
    if (!items || !items[`valid_${WatchingEpisode9.site}Webhook`]) return;
    const webhookSettings_in = items.webhookSettings;
    const origPostData = {
      workTitle: WatchingEpisode9.workTitle,
      episodeNumber: WatchingEpisode9.episodeNumber,
      episodeTitle: WatchingEpisode9.episodeTitle,
      vodWorkId: WatchingEpisode9.workId,
      danimeWorkId: WatchingEpisode9.workId,
      site: WatchingEpisode9.site,
      error: args_dict.error
    };
    const webhookMatchingObj = {
      "noWorkMatched": "webhookNoMatched",
      "noEpisodeMatched": "webhookNoMatched",
      "noWorkId": "webhookNoWorkId",
      "none": "webhookSuccess"
    };
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };
    const webhookSettings = checkWebhookSettings(webhookSettings_in);
    for (const webhookSetting of Object.values(webhookSettings)) {
      const postData = webhookSetting.webhookContentChanged ? Object.entries(webhookSetting.webhookContent).reduce((obj, kv) => {
        const val = kv[1].replace(/\{[^\{]+\}/g, (s_in) => {
          const s = s_in.slice(1, -1);
          if (Object.keys(origPostData).indexOf(s) != -1) return origPostData[s];
          else return s_in;
        });
        return Object.assign(obj, { [kv[0]]: val });
      }, {}) : origPostData;
      if (!Object.entries(webhookMatchingObj).some((kv) => origPostData.error.indexOf(kv[0]) != -1 && webhookSetting[kv[1]])) continue;
      let options = { method: "POST", headers, body: JSON.stringify(postData) };
      if (webhookSetting.postUrl.indexOf("://script.google.com/macros/") != -1) options.mode = "no-cors";
      await fetch(webhookSetting.postUrl, options);
    }
  }

  // src/scripts/index.ts
  var checkValid22 = Object.assign({}, ...["danime", "amazon", "abema"].map((key) => ({ [`valid_${key}Annict`]: true, [`valid_${key}Webhook`]: true, [`valid_${key}Genre`]: false })));
  var obtainVideoElement = (site) => {
    if (site == "danime") return document.querySelector("#video");
    else if (site == "amazon") return document.querySelector("video[width='100%']");
    else if (site == "netflix") return document.querySelector("video");
    else if (site == "abema") return document.querySelector("video[preload='metadata']");
    return null;
  };
  async function videoTriggered(flag, WatchingEpisode9, RecordWillBeSent = true, workInfo = null) {
    debugLog("start");
    debugLog("Watching:\n", WatchingEpisode9);
    if (flag == "start") {
      const items = await getSyncStorage({ token: "", sendingTime: 300 });
      if (items.token == "") return null;
      const sendingTime = items.sendingTime - 0 > 0 ? items.sendingTime : 300;
      await obtainWork(WatchingEpisode9, items.token).then(async (workInfo2) => {
        debugLog("Work Information:\n", workInfo2);
        if (!workInfo2 || !workInfo2.nodes || workInfo2.nodes.length === 0) {
          const error_message = `No Hit Title: ${workInfo2.WatchingEpisode.workTitle}`;
          showMessage(error_message);
          await post2webhook(workInfo2.webhook);
        }
        setTimeout(async () => {
          if (workInfo2 && workInfo2.nodes && workInfo2.nodes.length > 0) {
            await sendRecord(workInfo2, WatchingEpisode9, RecordWillBeSent);
          }
          await setSyncStorage({ [`lastWatched_${WatchingEpisode9.site}`]: JSON.stringify(WatchingEpisode9), lastVideoOver: false });
        }, sendingTime * 1e3);
      });
    } else if (flag == "end") {
      if (workInfo && workInfo.nodes && workInfo.nodes.length > 0) {
        await sendRecord(workInfo, WatchingEpisode9, RecordWillBeSent);
      }
      await setSyncStorage({ [`lastWatched_${WatchingEpisode9.site}`]: JSON.stringify(WatchingEpisode9), lastVideoOver: true });
    }
    return workInfo;
  }
  async function sendRecord(workInfo, WatchingEpisode9, RecordWillBeSent = true) {
    if (!RecordWillBeSent || !workInfo || !workInfo.nodes || workInfo.nodes.length === 0) return;
    const items = await getSyncStorage(Object.assign({ [`lastWatched_${WatchingEpisode9.site}`]: JSON.stringify({}), lastVideoOver: true }, inputObj));
    const lastWatched = JSON.parse(items[`lastWatched_${WatchingEpisode9.site}`]);
    const IsSuspended = JSON.stringify(WatchingEpisode9) == JSON.stringify(lastWatched) && !items.lastVideoOver;
    const IsSameMovie = workInfo.nodes.some((d) => d.media == "MOVIE") && lastWatched.workTitle == WatchingEpisode9.workTitle;
    const IsSplitedEpisode = Object.entries({ workTitle: true, episodeTitle: true, episodeNumber: false, number: true }).every((kv) => kv[1] == (lastWatched[kv[0]] == WatchingEpisode9[kv[0]]));
    debugLog("Sending Condition:\n", { RecordWillBeSent, IsSuspended, IsSameMovie, IsSplitedEpisode });
    if (!IsSuspended && !IsSameMovie && !IsSplitedEpisode) {
      await post2webhook(workInfo.webhook, items);
      await sendAnnict(workInfo, items);
    }
  }
  (async function() {
    loadNotificationStyles();
    const dialogDiv = document.createElement("div");
    dialogDiv.className = "dsa-dialog";
    dialogDiv.textContent = "Message";
    document.body.appendChild(dialogDiv);
    await getSyncStorage({ token: "" }).then((items) => {
      if (items.token == "") showMessage("There is no access token of `Annict`.");
    });
    const functionForInterval = async function(WatchingEpisodeLast) {
      const videoSite = obtainVideoSite();
      if (!videoSite) return WatchingEpisodeLast;
      const items = await getSyncStorage(checkValid22);
      const WatchingEpisode9 = obtainWatching(videoSite, items[`valid_${videoSite}Genre`]);
      const WatchingEpisodeNow = JSON.stringify(WatchingEpisode9);
      let workInfo = null;
      let RecordWillBeSent = true;
      async function mainFunc(WatchingEpisode10, video) {
        await videoTriggered("start", WatchingEpisode10, true).then((d) => {
          workInfo = d;
          RecordWillBeSent = false;
        });
        video.addEventListener("ended", async () => {
          await videoTriggered("end", WatchingEpisode10, RecordWillBeSent, workInfo).then(() => {
            RecordWillBeSent = true;
          });
        });
        return JSON.stringify(WatchingEpisode10);
      }
      if (WatchingEpisodeNow != WatchingEpisodeLast) {
        const video = obtainVideoElement(videoSite);
        if (video == null || WatchingEpisodeNow == "{}") return WatchingEpisodeLast;
        if (videoSite == "amazon" && video.played.length == 0) return WatchingEpisodeLast;
        else return await mainFunc(WatchingEpisode9, video);
      }
      return WatchingEpisodeLast;
    };
    const interval = async (WatchingEpisodeLast = "{}") => {
      await functionForInterval(WatchingEpisodeLast).then((WatchingEpisodeLast2) => {
        setTimeout(interval, 2 * 1e3, WatchingEpisodeLast2);
      });
    };
    await interval("{}");
  })();
})();
//# sourceMappingURL=index.js.map
