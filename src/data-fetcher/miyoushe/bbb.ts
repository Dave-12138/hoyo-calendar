
import { Game, UpdateInfo } from "../../types";
import { search } from "./api";
/**
 * 修正没有年份的日期，然后追溯前一天定位到周四
 * @param str 
 * @param createAt 
 * @returns 
 */
function fixDate(str: string, createAt: number): Date {
    const year = new Date(createAt * 1000).getFullYear();
    const fullStr = str.includes("年") ? str : year + "年" + str;
    const bp = new Date(fullStr.replace(/[^\d]/g, "/"));
    while (bp.getDay() != 4) {
        bp.setDate(bp.getDate() - 1);
    }
    return bp;
}
function toYMDString(date: Date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
const patt = /(?:((?:\d{1,4}年)?\d{1,2}月\d{1,2}日)\d{1,2}:00|.*版本更新后)~((?:\d{1,4}年)?\d{1,2}月\d{1,2}日)\d{1,2}:00/;
export default async function getUpdateData(): Promise<UpdateInfo[]> {
    const game = Game.bh3;
    const raw = (await search("作战凭证开启", game))
        .filter(x => patt.test(x.post.structured_content));
    const updList = raw.map(v => {
        const [_, d, n] = patt.exec(v.post.structured_content) ?? [];
        const date = fixDate(d || toYMDString(new Date((v.post.created_at + 7 * 24 * 3600) * 1000)), v.post.created_at);
        const next = fixDate(n, v.post.created_at);
        return {
            date,
            next,
            desc: v.post.subject.replace(/【公告】(.*)作战凭证开启/, "$1")
        }
    });
    const last = updList.reduce((pv, v) => pv.next > v.next ? pv : v);
    const rst = updList.map(x => {
        return { desc: x.desc, date: x.date, game: "崩", };
    })
    const verNum = last.desc.match(/\d\.\d/)?.map(x => Number.parseFloat(x)) ?? [NaN];
    verNum[0] = (verNum[0] * 10 + 1) / 10;
    rst.unshift({ desc: `v${verNum[0].toFixed(1)}`, date: last.next, game: "崩", })
    const lives = rst.map<UpdateInfo>(f => ({ date: new Date(f.date.valueOf() - 5 * 24 * 3600 * 1000), desc: f.desc + "前瞻", game: "崩" }))
    rst.push(...lives);
    return rst;
}