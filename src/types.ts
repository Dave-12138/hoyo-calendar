
export enum Game {
    /**崩坏3 */
    bbb = "1",
    /**崩坏3 */
    bh3 = "1",
    /**崩坏3 */
    b3 = "1",
    /**原神 */
    ys = "2",
    /**原神 */
    genshin = "2",
    /**崩2 */
    bb = "3",
    /**崩2 */
    b2 = "3",
    /**未定事件簿 */
    wd = "4",
    /**大别野 */
    dby = "5",
    /**星穹铁道 */
    hsr = "6",
    /**星穹铁道 */
    bt = "6",
    /**绝区零 */
    zzz = "8",
}
export interface UpdateInfo {
    desc: string;
    date: Date;
    game: string;
}
export const nameMap: Record<number, string> = {};
nameMap[Game.b3] = "崩";
nameMap[Game.ys] = "原";
nameMap[Game.hsr] = "铁";
nameMap[Game.zzz] = "绝";