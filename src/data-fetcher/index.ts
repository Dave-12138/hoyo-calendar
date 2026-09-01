
import { getFestivals as getFromMiyoushe } from "./miyoushe/api";
import type { UpdateInfo } from '../components/data';
import fs from "node:fs";
(async function () {
    const now = new Date();
    function resolveEachDate(v: UpdateInfo): UpdateInfo {
        const [_, y, m, d] = v.date.match(/^(\d+|\*)\/(\d+|\*)\/(\d+|\*)$/) ?? [];
        const ds = { y, m, d };
        function doResolve(key: 'y' | 'm' | 'd') {
            if (ds[key] == '*') {
                switch (key) {
                    case "y":
                        return now.getFullYear().toString();
                    case "m":
                        return String(now.getMonth() + 1);
                    case "d":
                        return String(now.getDate());
                }
            }
            return ds[key];
        }
        v.date = (Object.keys(ds) as (keyof typeof ds)[]).reduce((pv, v, i) => pv + (i ? '/' : '') + doResolve(v), "");
        return v;
    }
    fs.writeFileSync("miyoushe-calendar.json", await Promise.all([
        getFromMiyoushe(),
        JSON.parse(fs.readFileSync('custom_fes.json', "utf-8")) as UpdateInfo[]
    ]).then(([miyoushe, github]) => JSON.stringify([...miyoushe, ...github.map(resolveEachDate)])));
})()