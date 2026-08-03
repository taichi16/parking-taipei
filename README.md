# 泊台北｜台北市即時停車位

[![GitHub Pages](https://img.shields.io/badge/網站-GitHub%20Pages-178c6a)](https://taichi16.github.io/parking-taipei/)
[![資料來源](https://img.shields.io/badge/資料來源-臺北市資料大平臺-e88436)](https://data.taipei/dataset/detail?id=d5c0656b-5250-4179-a491-c94daa56ef2c)

![泊台北社群預覽圖](public/og.png)

「泊台北」是手機優先的台北市停車場查詢網站，整合停車場基本資料與即時剩餘汽車位，可透過地圖、行政區或關鍵字快速尋找停車場。

## 線上網站

**https://taichi16.github.io/parking-taipei/**

網站不需登入即可使用。

## 主要功能

- 地圖直接顯示各停車場剩餘汽車位數
- 依台北市 12 個行政區篩選
- 以停車場名稱、地址或地標關鍵字搜尋
- 地圖與列表兩種檢視方式
- 顯示地址、總車位、即時空位、開放時間及收費資訊
- 連結 Google Maps 開啟導航
- 「常用停車場」收藏功能
- 自訂收藏分類，例如「公司附近」、「假日常去」
- 響應式手機、平板及桌面版面

## 使用方式

### 搜尋停車場

1. 開啟[泊台北網站](https://taichi16.github.io/parking-taipei/)。
2. 在搜尋框輸入停車場名稱、地址或附近地標。
3. 也可點選行政區，只顯示該區域的停車場。
4. 點選地圖上的數字圖釘或列表項目查看詳細資訊。
5. 點選「開啟導航」前往 Google Maps 規劃路線。

### 圖釘及車位狀態

| 顯示 | 意義 |
| --- | --- |
| 綠色 | 有即時車位，且數量較充足 |
| 橙色 | 剩餘 10 格以下或官方標示少於半數 |
| 紅色 | 已滿或即將滿位 |
| 灰色 | 官方目前未提供即時數字 |
| `足` | 無明確格數，但官方標示車位充足 |
| `少` | 無明確格數，但官方標示少於半數 |
| `滿` | 無明確格數，但官方標示即將滿位 |

### 常用停車場

1. 點選任一停車場開啟詳細資料。
2. 選擇「加入常用停車場」。
3. 輸入自訂分類名稱，或選擇既有分類。
4. 從頁面上方的「常用停車場」快速查看收藏。

常用停車場資料使用瀏覽器 `localStorage` 儲存在目前裝置。更換瀏覽器、使用其他裝置或清除瀏覽器資料時，收藏不會自動同步。

## 資料來源

資料集由**臺北市政府交通局停車管理工程處**提供：

- [臺北市停車場資訊｜臺北市資料大平臺](https://data.taipei/dataset/detail?id=d5c0656b-5250-4179-a491-c94daa56ef2c)
- 停車場基本資料：[`TCMSV_alldesc.json`](https://tcgbusfs.blob.core.windows.net/blobtcmsv/TCMSV_alldesc.json)
- 即時剩餘車位：[`TCMSV_allavailable.json`](https://tcgbusfs.blob.core.windows.net/blobtcmsv/TCMSV_allavailable.json)

基本資料包含停車場名稱、行政區、地址、總車位、收費方式、開放時間及 TWD97 座標；即時資料包含汽車剩餘車位與資料更新時間。

### 官方特殊車位代碼

| 原始值 | 處理方式 |
| --- | --- |
| `-9` | 暫時無法提供即時車位資訊 |
| `-11` | 無格數，但可顯示「車位充足」 |
| `-12` | 無格數，但可顯示「少於半數」 |
| `-13` | 無格數，但可顯示「即將滿位」 |

網站不會將上述負值誤顯示為負車位。

## 資料更新方式

GitHub Actions 工作流程位於 [`.github/workflows/pages.yml`](.github/workflows/pages.yml)：

1. 每次推送至 `main` 分支時執行。
2. 排程每 10 分鐘執行一次。
3. 由 [`scripts/update-pages-data.mjs`](scripts/update-pages-data.mjs) 下載兩份官方資料。
4. 合併基本資料與即時剩餘車位。
5. 修正來源中文字元編碼。
6. 將 TWD97 座標轉換為 WGS84 經緯度。
7. 產生 `docs/data/parking.json` 並發布至 GitHub Pages。

GitHub 排程屬於非即時排程，繁忙時可能延遲。網站顯示的是最近一次成功同步的資料，實際車位仍應以停車場現場資訊為準。

## 專案結構

```text
parking-taipei/
├─ docs/                         # GitHub Pages 靜態網站
│  ├─ index.html
│  ├─ styles.css
│  ├─ app.js
│  └─ data/parking.json
├─ scripts/
│  └─ update-pages-data.mjs      # 官方資料同步與轉換
├─ .github/workflows/
│  └─ pages.yml                  # 自動更新及發布流程
├─ app/                          # Next.js / Vinext 原始應用程式
└─ public/og.png                 # 社群分享預覽圖
```

## 本機更新資料

需求：Node.js 22 以上。

```bash
node scripts/update-pages-data.mjs
```

Windows 若出現憑證鏈錯誤，可使用：

```powershell
node --use-system-ca scripts/update-pages-data.mjs
```

執行後可用任一靜態伺服器預覽 `docs` 目錄。

## 更新並發布

```bash
git add .
git commit -m "Update parking website"
git push
```

推送後 GitHub Actions 會自動更新資料並重新發布網站。執行狀態可在 [Actions](https://github.com/taichi16/parking-taipei/actions) 查看。

## 注意事項

- 本專案為公開資料的查詢介面，並非臺北市政府官方網站。
- 剩餘車位可能因來源更新、網路或排程延遲而與現場不同。
- 收費與開放時間可能臨時調整，請以停車場現場公告為準。
- 導航目的地依官方地址產生，使用前請確認實際入口位置。
- 本網站不收集使用者帳號、位置或收藏資料。

## 授權與資料使用

程式碼目前未另行指定開源授權。臺北市公開資料的使用及授權條款，請以[臺北市資料大平臺](https://data.taipei/)公告為準。
