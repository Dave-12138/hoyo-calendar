import { computed, ref, watch } from "vue";

export interface UpdateInfo {
    game: string;
    date: string;
    desc: string;
}
export const updateDates = ref<UpdateInfo[]>([]);
function deletingfilter(list: UpdateInfo[]) {
    const delList = list.filter(e => e.desc.startsWith("del:"));
    return list.filter(e => !delList.some(todel => todel.date == e.date && todel.desc.endsWith(e.desc)));
}
function initListWith(list: UpdateInfo[]) {
    updateDates.value = deletingfilter(list);
}
(async () => {
    const githubIOSource = "/api/proxy/https://dave-12138.github.io/cdns/miyoushe-calendar.json";
    if (new URLSearchParams(location.search).get("session") !== null) {
        // 当初截图用的，用其他手段将数据存到 sessionStorage 里
        const datesTmp = ref<string>("[]");
        watch(datesTmp, v => {
            initListWith(JSON.parse(v));
        })
        setInterval(() => {
            const str = sessionStorage.getItem("festivals");
            if (str) {
                datesTmp.value = str;
            }
        }, 500);
    } else {
        const customSource = /**@type {string} */(new URLSearchParams(location.search).get("source"));
        // 获取用github action定时抓取的数据
        initListWith(await fetch(customSource ?? githubIOSource).then(x => x.json()));
    }
    // console.info(updateDates.value);
})();

export interface DayData {
    day: number;
    date: number;
    month: number;
    str: string;
}
export const now = ref(new Date());
const hash = ref(new Date(location.hash || now.value))
window.addEventListener("hashchange", () => {
    hash.value = new Date(location.hash || now.value)
});
document.addEventListener("keydown", e => {
    const cur = new Date(location.hash || now.value);
    switch (e.key) {
        case "ArrowLeft":
            cur.setMonth(cur.getMonth() - 1);
            break;
        case "ArrowRight":
            cur.setMonth(cur.getMonth() + 1);
            break;

        default:
            break;
    }
    location.hash = cur.toLocaleDateString();
});
export const calendar = computed(() => {
    const start = new Date(hash.value);
    start.setDate(1);
    // 周一
    if (start.getDay() != 1) {
        start.setDate(start.getDate() - (start.getDay() + 6) % 7);
    }
    const end = new Date(hash.value);
    end.setMonth(end.getMonth() + 2);
    end.setDate(0);
    if (end.getDay() != 0) {
        end.setDate(end.getDate() + 7 - end.getDay());
    }
    const pointer = new Date(Date.parse(start.toLocaleDateString()));
    const calendar: DayData[][] = [];
    while (pointer <= end) {
        if (pointer.getDay() == 1) {
            calendar.push([]);
        }
        calendar[calendar.length - 1].push({ day: pointer.getDay(), date: pointer.getDate(), month: pointer.getMonth() + 1, str: pointer.toLocaleDateString() });
        pointer.setDate(pointer.getDate() + 1);
    }
    return calendar;
});
