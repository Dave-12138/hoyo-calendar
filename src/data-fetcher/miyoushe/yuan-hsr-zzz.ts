
import { Game, nameMap, UpdateInfo } from "../../types";
import { search } from "./api";
function toVdesc(verNum: number): string {
    if (typeof verNum === "string") {
        return verNum;
    }
    if (verNum == 6.4) {
        return "月之版本";
    }
    if (isNaN(verNum as number)) {
        return "没有数字版本号的新版本";
    }
    return `v${verNum.toFixed(1)}`;
}
function toNextVer(last: UpdateInfo): number {
    const verNum = last.desc.match(/\d\.\d/)?.map(x => Number.parseFloat(x)) ?? [NaN];
    if (isNaN(verNum[0])) {
        const mp: Record<string, number> = {
            "呈示": 6.0,
            "复演": 6.1,
            "间奏": 6.2,
            "终曲": 6.3,
            "变奏": 6.4,
            "旋舞": 6.5,
            "行律": 6.6,
            "谐谑": 6.7,
        };
        verNum[0] = mp[last.desc.match(/(?<=『空月之歌·).+(?=』)/)?.[0] ?? "?"];
    }
    if (verNum[0] * 10 % 10 == 8) {
        verNum[0] = (verNum[0] * 10 + 1) / 10;
    }
    verNum[0] = (verNum[0] * 10 + 1) / 10;
    return verNum[0];
}
/**
 * 原，铁，绝
 */
export default async function getUpdateData(): Promise<UpdateInfo[]> {
    const G = async (game: Game, key: string) => {
        const rawList = (await search(key, game)).filter(r => r.forum.name == "官方");
        const updList = rawList.map<[(typeof rawList)[number], string, string] | null>(r => {
            if (r.post.subject.includes("节目预告")) {
                return null;
            }
            const r1 = /(?<=》)((?:\d\.\d\s*?版本)?.*)将于((?:\d{4}年)?\d{1,2}月\d{1,2}日)(?:正式)?上线/.exec(r.post.content)
            if (r1) {
                return [r, r1[1], r1[2]];
            }
            const r2 = /(?:》\s*)((?:\d\.\d\s*?版本)?.*?)(?:\s*前瞻)/.exec(r.post.subject);
            if (r2) {
                const desc = r2[1];
                const r2date = /((?:\d{4}年)?\d{1,2}月\d{1,2}日)/.exec(r.post.content);
                const fallbackDate = (d => {
                    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
                })(new Date(r.post.created_at * 1000))
                return [r, desc, r2date?.[1] ?? fallbackDate];
            }
            return null;

        }).filter(x => x !== null).map(([_, desc, t]) => ({
            game: nameMap[game], desc, date: new Date(t.replace(/^(?=\d{1,2}月)/, () => {
                let x = (_.post.created_at ?? Date.now() / 1000) * 1000;
                return new Date(x).getFullYear() + '年';
            }).replace(/[^\d]/g, "/"))
        } as UpdateInfo))
        const last = updList.reduce((pv, v) => pv.date > v.date ? pv : v);
        const verCode = toNextVer(last);
        updList.unshift({ game: nameMap[game], desc: toVdesc(verCode), date: new Date(42 * 24 * 3600 * 1000 + Date.parse(last.date.toJSON())) })
        return updList.filter((v, i, a) => a.findIndex(u => u.desc == v.desc) == i)
    }
    return (await Promise.all([
        G(Game.ys, "感谢各位旅行者的支持与陪伴，我们将为大家带来更多"),
        G(Game.hsr, "本次特别节目中的一切人物、故事、设定仅为节目包装"),
        G(Game.zzz, "前瞻特别节目 日正式上线")
    ])).flat();

}