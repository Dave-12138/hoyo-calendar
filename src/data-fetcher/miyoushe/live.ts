import { Game, nameMap, UpdateInfo } from "../../types";
import { search } from "./api";

const patt = /》(.*)前瞻特别节目，?将于((?:\d+年)?\d+月\d+日)(?:（.+?）)?\s?(\d{1,2}:\d{1,2})/;

function fixDate(str: string, createAt: number): Date {
    const year = new Date(createAt * 1000).getFullYear();
    const fullStr = str.includes("年") ? str : year + "年" + str;
    const bp = new Date(fullStr.replace(/[^\d]/g, "/"));
    return bp;
}
const G = async (game: Game) => {

    const rawList = (await search("前瞻特别节目预告", game))
        .filter(r => r.forum.name == "官方" && patt.test(r.post.content));
    const lives = rawList.map<UpdateInfo>(post => {
        const [_, ver, day, time] = patt.exec(post.post.content) ?? [];
        return { desc: ver.replace(/(?<=版本).*/, "") + "前瞻" + time, date: fixDate(day, post.post.created_at), game: nameMap[game] };
    });
    return lives;

}
export default async function getUpdateData(): Promise<UpdateInfo[]> {

    return (await Promise.all([G(Game.ys), G(Game.hsr), G(Game.zzz)])).flat();
}