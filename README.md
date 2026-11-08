# Seller Insight · 亚马逊经营统计看板

参考电商 BI 看板的浅色布局，面向亚马逊卖家的静态经营看板。无框架、无外部字体、无 CDN、无服务器接口。示例商品及数据均为虚构，不包含原参考文件中的真实经营数据。

## 使用

下载所有文件，双击 `index.html` 即可。或在本目录运行 `python3 -m http.server 8080`，访问 http://localhost:8080 。

支持经营总览、每日销售趋势、SKU 排名、商品明细排序、广告统计、销售目标、站点/日期/商品筛选、CSV 模板下载及导入导出。支持手机屏幕。

## 数据

点击「数据与口径」下载 CSV 模板。UTF-8 编码；每行代表一个日期、站点、SKU 的汇总数据，重复组合会被拒绝。支持 US/USD、UK/GBP、DE/EUR、JP/JPY。一次只统计一个站点，不换汇。导入前请将业务与广告报告按日期及 SKU 汇总匹配；不直接兼容所有亚马逊原始报表。

必填列：`date,marketplace,asin,sku,product,sales,orders,units,sessions,adSpend,adSales,impressions,clicks`。日期为 YYYY-MM-DD；金额为无货币符号的非负数字；数量为非负整数。单文件不超过 15 MB / 50,000 行。

ACOS = 广告花费 / 广告销售额；TACOS = 广告花费 / 总销售额；ROAS = 广告销售额 / 广告花费；转化率 = 订单 / 访问次数。先汇总后计算，零分母显示 —。广告归因窗口与业务报告可能不同，广告销售超过总销售时不绘制销售结构拆分。剩余销售额不应直接视作自然销售。

数据仅保存在当前页面内存，不上传，不持久存储；刷新后恢复演示数据。更改筛选后清空目标，避免错用目标金额。未对接亚马逊后台，不含利润、库存、退款或环比分析。

## 文件与验证

- `index.html`：页面结构
- `styles.css`：响应式样式
- `core.js`：计算、CSV 解析和校验
- `app.js`：筛选、图表及交互
- `core.test.cjs`：使用 `node --test core.test.cjs` 验证核心行为

## GitHub Pages（可选）

在仓库 Settings → Pages，选择从分支部署，分支 main、目录 / (root)，即可由 GitHub 托管。提交源代码不等于已开启 Pages。


## 仓库内的其他项目

- [Amazon WBR / SQP 项目](amazon-wbr-sqp/中文开始.md)：Theseus Workshop / HyVoid 的 Apache-2.0 开源项目，包含虚构的两周测试数据、分表 CSV 和中文启动说明。进入该目录后按说明安装、构建和预览。
- 原来的 Seller Insight 静态看板仍在仓库根目录，从 `index.html` 打开。
