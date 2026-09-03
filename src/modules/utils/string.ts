// Constants
const GLOBAL_sep: RegExp = /\s+|;|・|\(|（|\)|）|～|‐|-|―|－|&|＆|#|＃|映画\s*|劇場版\s*|!|！|\?|？|…|『|』|「|」/g;

const const_kanji = {
    num: { char: "〇一二三四五六七八九零壱弐参肆伍陸質捌玖零壹貳參", limit: 10 },
    mag1: { char: "十百千拾佰仟十陌阡", limit: 3 },
    mag2: { char: "万億兆萬", limit: 3 }
};

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

export function kanji2arab(src: string): string {
    const reg = new RegExp(`[${const_kanji.num.char}${const_kanji.mag1.char}][${const_kanji.num.char}${const_kanji.mag1.char}${const_kanji.mag2.char}]*`, "g");
    return src.replace(reg, $0 => String(toArb($0)));
}

function toArb(input_kanji: string): number | string {
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
            } else {
                output_num = output_num * 10 + numIn % 10;
            }
        } else if (numMag1 != -1) { // 10^[1-3]
            output_includeMag += output_num;
            output_num = 0;
            const mag_tmp = output_includeMag % 10;
            const num_tmp = (mag_tmp == 0 ? 1 : mag_tmp) * 10 ** (numMag1 % const_kanji.mag1.limit + 1);
            output_includeMag += num_tmp - mag_tmp;
            IsAfterMag = true;
        } else if (numMag2 != -1) { // 10^4n
            output_includeMag += output_num;
            output_num = 0;
            const mag_tmp = output_includeMag % 10000;
            const num_tmp = mag_tmp * 10000 ** (numMag2 % const_kanji.mag2.limit + 1);
            output_includeMag += num_tmp - mag_tmp;
            IsAfterMag = true;
        } else return input_kanji; // can't convert
    }
    return output_includeMag + output_num; // return output
}

export function remakeString(input_str: string | null | undefined, mode = "title"): string {
    if (!input_str) return "";
    const delete_array = ["「", "」", "『", "』", "｢", "｣"];
    const remake_dic = {
        "〈": "＜", "〉": "＞",
        "Ⅰ": "I", "Ⅱ": "II", "Ⅲ": "III", "Ⅳ": "IV", "Ⅴ": "V", "Ⅵ": "VI", "Ⅶ": "VII", "Ⅷ": "VIII", "Ⅸ": "IX", "Ⅹ": "X"
    };
    if (mode == "episodeNumber") {
        return kanji2arab(input_str).replace(/[０-９]/g, s => // 全角=>半角
            String.fromCharCode(s.charCodeAt(0) - 65248));
    } else if (mode == "title") {
        return input_str.replace(/[Ａ-Ｚａ-ｚ０-９：]/g, s => // 全角=>半角
            String.fromCharCode(s.charCodeAt(0) - 65248))
            .replace(new RegExp(delete_array.join("|"), "g"), "")
            .replace(new RegExp(Object.keys(remake_dic).join("|"), "g"), match => remake_dic[match as keyof typeof remake_dic]);
    }
    return "";
}

export function title2number(str: string | null | undefined): number {
    if (!str) return 0;
    const str2 = str.match(/\d+/);
    if (!str2) return 0;
    return parseInt(str2[0], 10);
}

export function checkTitle(titles: (string | null | undefined)[], mode = "length"): number | boolean {
    if (titles.some(d => !d)) return false;
    const titles_splited = titles.map(d => (remakeString(d, "title") || "").split(GLOBAL_sep).filter(d => !/^\s*$/.test(d)));
    if (mode == "length") return titles_splited[0].filter(d => titles_splited[1].join("").indexOf(d) != -1).length;
    else if (mode == "every") return titles_splited[0].every(d => titles_splited[1].join("").indexOf(d) != -1);
    return false;
}

export function splitTitle(title: string): string[] {
    return title.split(GLOBAL_sep).filter(d => !/^\s*$/.test(d));
}
