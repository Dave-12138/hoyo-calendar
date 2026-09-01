# 米游社更新日历

展示米游社几款游戏版本更新与前瞻节目的网页日历，用于个人站：**[https://dave-12138.cn/test/calendar/](https://dave-12138.cn/test/calendar/)**

## 数据从哪来

- **来源**：米游社的搜索接口（`bbs-api.miyoushe.com/post/wapi/searchPosts`），抓取各游戏官方板块的公告，用正则解析出版本更新/前瞻的日期与描述。
- **更新**：数据由 GitHub Actions 定时抓取，每天几次（`pages.yml` 的 schedule 为 12:05 / 19:05 / 20:05 / 21:05，UTC+8），抓取失败时自动回退下载上一份已发布的数据，保证页面不空白。

## 日期怎么推算

- **原神 / 星穹铁道 / 绝区零**：下一版本日期是简单地把已知的上一版本日期 +42 天推测出来的（可能不准）。
- **崩坏3**：不是加天数，而是用「作战凭证开启」公告里的日期计算。

## 操作

- **有键盘**：在日历界面内按 `←` / `→` 切换月份。
- **没键盘（如手机上）**：直接改地址栏的 hash 就行，把 `#` 后面的日期换成目标月份任意一天，如 `#2026/9/1`。
- 还支持 `?source=<url>` 覆盖数据加载地址（调试用）。

## 技术信息

- **展示端**：Vue 3（单文件组件 + less），Vite 构建出纯静态的 `calendar/`（`calendar.js` + `style.css` + `index.html`），页面加载 `miyoushe-calendar.json` 渲染月历网格（周一起始、同时显示两月）。Vue 走 CDN importmap，无第三方服务端。
- **数据抓取端**：一个 Node 脚本（`src/data-fetcher/`），构建成 `node/fetch-calendar.cjs`，只在 GitHub Actions 里运行，把抓取到的数据合并 `custom_fes.json` 后写成 `miyoushe-calendar.json`。
- **CI/托管**：`.github/workflows/pages.yml` 负责定时抓取并发布到 GitHub Pages（数据副本/备份：<https://dave-12138.github.io/hoyo-calendar/miyoushe-calendar.json>）。
- **数据格式**：`miyoushe-calendar.json` 为 `{ game, date, desc }[]`；`date` 固定为 `zh-Hans-CN` 的 `YYYY/M/D` 字符串（如 `2026/9/1`），展示端与抓取端必须一致，否则事件对不上日期格。

## 备忘

- 手动修正的数据**没有挪进本仓库**，仍在 [Dave-12138/cdns](https://github.com/Dave-12138/cdns) 的 `custom_fes.json` 里，工作流每次构建时从那里检出合并；格式 `{ game, date, desc }`，`date` 用 `YYYY/M/D` 可写 `*` 通配（按运行当天补全），`desc` 写 `del:xxx` 让该节点不显示。
- 有考虑过加《未定事件簿》的更新日期，但没看懂所以放弃了。
- 这个 README 是 AI 写的。
