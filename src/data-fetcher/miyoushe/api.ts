import { Game } from "../../types";
import bbb from "./bbb";
import ytj from "./yuan-hsr-zzz";
import ytjLive from "./live";

const DIRECT = "https://bbs-api.miyoushe.com/post/wapi/searchPosts?";
const PROXY = "https://proxy.dave-12138.cn/" + DIRECT;
const IS_NODE = typeof process !== "undefined";
/** 代理在非 CN IP 访问时要求 UA 里含 DaveNoCaptcha 字样，否则会被验证码拦截 */
const PROXY_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 DaveNoCaptcha";

const REQUEST_TIMEOUT_MS = 15_000;
const BASE_DELAY_MS = 800;
const MAX_RETRY_AFTER_MS = 10_000;
const MAX_ATTEMPTS = 3;

interface Candidate {
    url: string;
    label: string;
    headers?: Record<string, string>;
}

/**
 * 候选请求路径：第 1 次直连，之后改走代理。
 * GitHub 的海外 runner 直连 bbs-api（国内 CDN）常报 UND_ERR_CONNECT_TIMEOUT，
 * 而 undici 的 connect timeout 固定 10s 改不了，所以同路径重试无意义，必须换路径。
 * 浏览器里不允许自定义 User-Agent，故浏览器环境始终走代理、不带 headers。
 */
const CANDIDATES: Candidate[] = IS_NODE
    ? [
        { url: DIRECT, label: "直连" },
        { url: PROXY, label: "代理", headers: { "user-agent": PROXY_UA } },
    ]
    : [{ url: PROXY, label: "代理" }];

function candidateAt(attempt: number): Candidate {
    return CANDIDATES[Math.min(attempt - 1, CANDIDATES.length - 1)];
}

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

/** 可重试：网络异常、429/5xx、响应不是 JSON、retcode 非 0 */
class RetryableError extends Error {
    retryAfterMs?: number;
    constructor(message: string, retryAfterMs?: number) {
        super(message);
        this.retryAfterMs = retryAfterMs;
    }
}
/** 不可重试：其余 4xx（如缺 UA 被拦的 403） */
class FatalError extends Error { }

function describeError(error: unknown): string {
    if (error instanceof Error) {
        // 不用 Error.cause：tsconfig 的 target/lib 是 ES2016，ES2022 才有该属性
        const code = (error as Error & { cause?: { code?: string } }).cause?.code;
        return code ? `${error.message}（${code}）` : error.message;
    }
    return String(error);
}

async function requestOnce(url: string, headers?: Record<string, string>): Promise<ApiSearchData> {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) {
        const message = `HTTP ${res.status} ${res.statusText}`;
        if (res.status === 429 || res.status >= 500) {
            const retryAfter = Number(res.headers.get("retry-after"));
            throw new RetryableError(message, Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, MAX_RETRY_AFTER_MS) : undefined);
        }
        throw new FatalError(message);
    }
    let body: ApiSearchData;
    try {
        body = await res.json() as ApiSearchData;
    } catch (error) {
        throw new RetryableError(`响应不是 JSON：${describeError(error)}`);
    }
    if (body.retcode !== 0 || !body.data?.posts) {
        throw new RetryableError(`retcode=${body.retcode} message=${body.message}`);
    }
    return body;
}

async function searchRaw(param: URLSearchParams): Promise<ApiSearchData> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const candidate = candidateAt(attempt);
        try {
            return await requestOnce(candidate.url + param, candidate.headers);
        } catch (error) {
            lastError = error;
            const reason = describeError(error);
            if (error instanceof FatalError || attempt === MAX_ATTEMPTS) {
                console.error(`[miyoushe] 尝试 ${attempt}/${MAX_ATTEMPTS}（${candidate.label}）失败：${reason}`);
                break;
            }
            const wait = error instanceof RetryableError && error.retryAfterMs != null
                ? error.retryAfterMs
                : BASE_DELAY_MS * 2 ** (attempt - 1) * (0.75 + Math.random() * 0.5);
            console.warn(`[miyoushe] 尝试 ${attempt}/${MAX_ATTEMPTS}（${candidate.label}）失败：${reason}，${Math.round(wait)}ms 后改用${candidateAt(attempt + 1).label}重试`);
            await new Promise(resolve => setTimeout(resolve, wait));
        }
    }
    throw lastError;
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
    const body = await searchRaw(param);
    return body.data.posts.filter(x => x.forum.name == "官方");
}

export async function getFestivals(): Promise<import('../../components/data').UpdateInfo[]> {
    return (await Promise.all([bbb(), ytj(), ytjLive()])).flat().map(x => ({ game: x.game, date: x.date.toLocaleDateString('zh-Hans-CN'), desc: x.desc }));
}
