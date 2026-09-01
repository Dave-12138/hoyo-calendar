# hoyo-calendar（米游社更新日历）

## Project
- 米游社（崩坏3/原神/星穹铁道/绝区零）版本更新与前瞻的网页日历，分两部分独立构建：展示端（Vue 3 静态页）+ 数据抓取端（Node 脚本，仅由 GitHub Actions 运行）。
- 构建产物：展示端 calendar/（calendar.js + style.css + index.html），抓取端 node/fetch-calendar.cjs，数据 miyoushe-calendar.json；三者均 gitignore，不入库。
- 部署：GitHub Pages（dave-12138.github.io/hoyo-calendar），由 .github/workflows/pages.yml 每轮发布。

## Commands
- pnpm install —— 安装依赖。CI 中由 pnpm/setup@v2 自动执行（install 输入默认 true），工作流里不要再加 install 步骤。
- pnpm build —— 构建展示端到 calendar/。
- pnpm run calendar-node:build —— 构建抓取端到 node/fetch-calendar.cjs。
- node ./node/fetch-calendar.cjs —— 运行抓取（cwd 需有 custom_fes.json），产出 miyoushe-calendar.json。
- pnpm run calendar —— 仅 Windows 宿主：构建后复制到本地 Web 根目录。
- 本容器内宿主的 pnpm 依赖软链接指向不可达的 /mnt/host 路径，构建请按全局 AGENTS.md 约定在宿主执行，不要在容器里重装依赖破坏宿主安装。

## Architecture
- src/index.ts —— mount Vue 应用 (#app)。
- src/components/data.ts —— 拉取 miyoushe-calendar.json（默认经 https://dave-12138.cn/api/proxy/... 绕 CORS，支持 ?source= 覆盖、?session 截图调试），按周一开头跨两月生成日历网格；键盘 ←/→ 切月，location.hash 记当前月。
- src/components/Calendar.vue / OneDay.vue / util.ts / today.svg —— 渲染；today.svg 会被 vite 内联进 style.css（base64），部署目录里没有独立 svg 文件。
- src/data-fetcher/index.ts —— Promise.all(米游社抓取, 读 custom_fes.json) 合并后写 miyoushe-calendar.json；resolveEachDate 用运行日期补全 * 通配的年/月/日。
- src/data-fetcher/miyoushe/api.ts —— 封装 searchPosts 接口 search(keyword, gids, last_id, size)，只保留 forum.name == "官方"；Node 环境直连 bbs-api.miyoushe.com，浏览器环境走 /api/proxy/（因此该模块不能直接搬进浏览器跑）。
- bbb.ts（崩3 作战凭证）、yuan-hsr-zzz.ts（原/铁/绝 版本更新，含 ++0.1 的下一版本号与 42 天后版本日推导）、live.ts（前瞻特别节目）——各自用正则从公告内容/标题解析日期与描述。
- src/types.ts —— Game enum（别名）与 nameMap（数字→单字简称 崩/原/铁/绝）。enum 不是可擦除语法，Node 直跑 .ts 需 --experimental-transform-types。
- .github/workflows/pages.yml —— 检出 → 另检出 Dave-12138/cdns 取 custom_fes.json → pnpm/setup@v2（pnpm 11 + node24，自动 install）→ 构建两端 → node 抓取（continue-on-error，失败则回退下载已发布数据副本）→ mv 产物到 calendar/ → upload-pages-artifact → deploy-pages。

## Conventions
- 日期必须用 zh-Hans-CN 的 YYYY/M/D 字符串（2026/9/1），展示端与抓取端格式必须一致，否则事件匹配不上（展示端代码已固定 locale，勿改回默认 locale）。
- custom_fes.json：date 支持 * 通配；desc 以 del: 开头的条目用于从展示中删除对应节点。
- Commit message 用中文 Angular 规范（当前历史全是中文摘要）。

## Pitfalls
- 工作流抓取失败是常态设计：fetch 崩溃/无文件 → 走 curl 备份 → 仍无文件则不发布。custom_fes.json 缺失会让 Promise.all 直接失败，同样靠备份兜底。
- .vue 模板里 :="day" 是 v-bind 对象展开的合法简写（编译产物为 mergeProps），不要改写成旧写法。
- index.html 通过 importmap 把 vue 映射到 CDN，构建产物 calendar.js 以裸说明符 "vue" 引用——部署必须带 index.html 和 importmap。
- 全局环境注意：宿主装好的 pnpm 依赖在本容器不可用（软链接指向 /mnt/host），切勿为本地构建擅自重装。

## Maintenance
- 未来会话发现新的命令/约定/坑时，原地更新本文档并保持简洁。