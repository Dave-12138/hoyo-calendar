import { Game } from "../../types";
import bbb from "./bbb";
import ytj from "./yuan-hsr-zzz";
import ytjLive from "./live";

const _link = "https://bbs-api.miyoushe.com/post/wapi/searchPosts?";
const link = typeof window == "undefined" ? _link : "/api/proxy/" + _link;
interface PostData {
    post: {
        content: string;
        subject: string;
        uid: string;
        structured_content: string;
        created_at: number;
    };
    forum: {
        game_id: number;
        name: "官方" | string;
    };
    user: {
        uid: string;
        nickname: string;
    };
}
interface ApiSearchData {
    message: string;
    retcode: number;
    data: {
        databox: {};
        is_last: boolean;
        last_id: string;
        posts: PostData[];
    }
}

/**
 * 
 * @param keyword 
 * @param gids 
 * @param last_id 页码，从1开始
 * @returns 
 */
export async function search(keyword: string, gids: Game, last_id = "1", size = "50"): Promise<PostData[]> {
    const param = new URLSearchParams({ gids, size, keyword, last_id })
    return await fetch(link + param).then(x => x.json()).then((r: ApiSearchData) => r.data.posts.filter(x => x.forum.name == "官方"))
}

export async function getFestivals(): Promise<import('../../components/data').UpdateInfo[]> {
    return (await Promise.all([bbb(), ytj(), ytjLive()])).flat().map(x => ({ game: x.game, date: x.date.toLocaleDateString('zh-Hans-CN'), desc: x.desc }));
}