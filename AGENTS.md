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
- node --experimental-transform-types --import ./tmp/ts-hook.mjs <脚本>.mts —— 容器内不构建、直跑 src 下 TS 模块做行为测试（依赖 tmp/ts-hook.mjs + tmp/ts-resolve.mjs 两个 hook，tmp/ 已 gitignore；配合 stub globalThis.fetch 可验证重试/超时逻辑）。
- node node_modules/.pnpm/typescript@*/node_modules/typescript/bin/tsc -p tmp/tsconfig.check.json —— 容器内类型检查：顶层 node_modules 软链已断，必须直接调用 .pnpm store 里的 tsc，并用 --typeRoots 指向 store 的 @types（见 tmp/tsconfig.check.json）。vue 的类型在本容器解析不出来，src/components/data.ts 会报假错；src/data-fetcher 下应 0 错。
- 本容器内宿主的 pnpm 依赖软链接指向不可达的 /mnt/host 路径，构建请按全局 AGENTS.md 约定在宿主执行，不要在容器里重装依赖破坏宿主安装。

## Architecture
- src/index.ts —— mount Vue 应用 (#app)。
- src/components/data.ts —— 拉取 miyoushe-calendar.json（默认经 https://dave-12138.cn/api/proxy/... 绕 CORS，支持 ?source= 覆盖、?session 截图调试），按周一开头跨两月生成日历网格；键盘 ←/→ 切月，location.hash 记当前月。
- src/components/Calendar.vue / OneDay.vue / util.ts / today.svg —— 渲染；today.svg 会被 vite 内联进 style.css（base64），部署目录里没有独立 svg 文件。
- src/data-fetcher/index.ts —— Promise.all(米游社抓取, 读 custom_fes.json) 合并后写 miyoushe-calendar.json；resolveEachDate 用运行日期补全 * 通配的年/月/日。
- src/data-fetcher/miyoushe/api.ts —— 封装 searchPosts 接口 search(keyword, gids, last_id, size)，只保留 forum.name == "官方"；抓取端唯一网络出口：node 下第 1 次直连 bbs-api.miyoushe.com、第 2/3 次改走 https://proxy.dave-12138.cn/（带含 DaveNoCaptcha 的 UA），浏览器环境始终走代理且不设 UA（浏览器禁止自定义 User-Agent）。内置 15s 超时 + 最多 3 次尝试，仅网络异常/429/5xx/非 JSON/retcode≠0 重试，其余 4xx 立即失败。该模块只被 src/data-fetcher/index.ts 引用，默认（浏览器）构建不打包它。
- bbb.ts（崩3 作战凭证）、yuan-hsr-zzz.ts（原/铁/绝 版本更新，含 ++0.1 的下一版本号与 42 天后版本日推导）、live.ts（前瞻特别节目）——各自用正则从公告内容/标题解析日期与描述。
- src/types.ts —— Game enum（别名）与 nameMap（数字→单字简称 崩/原/铁/绝）。enum 不是可擦除语法，Node 直跑 .ts 需 --experimental-transform-types。
- .github/workflows/pages.yml —— 检出 → 另检出 Dave-12138/cdns 取 custom_fes.json → pnpm/setup@v2（pnpm 11 + node24，自动 install）→ 构建两端 → node 抓取（continue-on-error，网络失败静默跳过，不回退备份）→ 检查数据文件（exists 输出）→ mv 产物到 calendar/ → upload-pages-artifact → deploy-pages。

## Conventions
- 日期必须用 zh-Hans-CN 的 YYYY/M/D 字符串（2026/9/1），展示端与抓取端格式必须一致，否则事件匹配不上（展示端代码已固定 locale，勿改回默认 locale）。
- custom_fes.json：date 支持 * 通配；desc 以 del: 开头的条目用于从展示中删除对应节点。
- Commit message 用中文 Angular 规范（当前历史全是中文摘要）。

## Pitfalls
- 抓取失败静默跳过（有意设计）：网络波动导致抓取失败是常态，故「查询并合并数据」为 continue-on-error，「检查数据文件」只写 file_check.outputs.exists 并打 ::warning::（不 exit 1），move / 上传 artifact / deploy 全部用 if 门控，整轮以 success 收尾，避免失败邮件。代价是长期抓取失败不会变红，只能看 run 摘要的 warning。custom_fes.json 缺失不致命：抓取端 readCustom 兜底为空数组。
- .vue 模板里 :="day" 是 v-bind 对象展开的合法简写（编译产物为 mergeProps），不要改写成旧写法。
- index.html 通过 importmap 把 vue 映射到 CDN，构建产物 calendar.js 以裸说明符 "vue" 引用——部署必须带 index.html 和 importmap。
- 全局环境注意：宿主装好的 pnpm 依赖在本容器不可用（软链接指向 /mnt/host），切勿为本地构建擅自重装；.pnpm store 里的包本体还在，但顶层软链（node_modules/typescript 等）断了，所以 tsc/vite/esbuild 都跑不起来。
- GitHub 海外 runner 直连 bbs-api.miyoushe.com（国内 CDN 211.162.167.x）常报 UND_ERR_CONNECT_TIMEOUT；undici 的 connect timeout 固定 10s 且 Node 里 undici 不可 import（ERR_UNKNOWN_BUILTIN_MODULE），调大自己的超时没用，所以重试必须换路径（见 api.ts 的 CANDIDATES）。重试只在 search() 内，上层仍是 all-or-nothing。
- 代理 https://proxy.dave-12138.cn/ 在非 CN IP 访问时要求请求 UA 含 DaveNoCaptcha 字样，否则被验证码拦（多半表现为 403 或非 JSON 页，本端按 FatalError 只试 1 次）。
- node 的类型剥离不做类型消歧：`import { Game, UpdateInfo } from "../../types"` 这种混合类型导入会报 "does not provide an export named 'UpdateInfo'"，直跑 src 模块时需在 loader 的 load hook 里剥掉类型名（见 tmp/ts-resolve.mjs）。

## Maintenance
- 未来会话发现新的命令/约定/坑时，原地更新本文档并保持简洁。