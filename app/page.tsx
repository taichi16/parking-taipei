"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const ParkingMap = dynamic(() => import("./parking-map"), {
  ssr: false,
  loading: () => <div className="map-loading">地圖載入中…</div>,
});

export type Parking = {
  id: string;
  area: string;
  name: string;
  address: string;
  payex: string;
  serviceTime: string;
  totalCar: number;
  availableCar: number | null;
  availabilityCode: number | null;
  lat: number | null;
  lng: number | null;
  updateTime: string;
};

const districts = ["全部地區", "松山區", "信義區", "大安區", "中山區", "中正區", "大同區", "萬華區", "文山區", "南港區", "內湖區", "士林區", "北投區"];

function availabilityLabel(p: Parking) {
  if (p.availableCar !== null) return `${p.availableCar} 格`;
  if (p.availabilityCode === -11) return "車位充足";
  if (p.availabilityCode === -12) return "少於半數";
  if (p.availabilityCode === -13) return "即將滿位";
  return "暫無資訊";
}

function statusClass(p: Parking) {
  if (p.availableCar === 0 || p.availabilityCode === -13) return "danger";
  if ((p.availableCar !== null && p.availableCar <= 10) || p.availabilityCode === -12) return "warn";
  if (p.availableCar !== null || p.availabilityCode === -11) return "good";
  return "muted";
}

export default function Home() {
  const [parks, setParks] = useState<Parking[]>([]);
  const [district, setDistrict] = useState("全部地區");
  const [keyword, setKeyword] = useState("");
  const [mode, setMode] = useState<"map" | "list">("map");
  const [selected, setSelected] = useState<Parking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/parking", { cache: "no-store" });
      if (!response.ok) throw new Error("資料讀取失敗");
      const data = await response.json();
      setParks(data.parks);
    } catch {
      setError("目前無法取得即時資料，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLocaleLowerCase("zh-TW");
    return parks
      .filter((p) => district === "全部地區" || p.area === district)
      .filter((p) => !q || `${p.name} ${p.address} ${p.area}`.toLocaleLowerCase("zh-TW").includes(q))
      .sort((a, b) => {
        const av = a.availableCar ?? -999;
        const bv = b.availableCar ?? -999;
        return bv - av;
      });
  }, [parks, district, keyword]);

  const updateTime = parks[0]?.updateTime;

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">P</span>
          <div><strong>泊台北</strong><small>即時停車位查詢</small></div>
        </div>
        <button className="refresh" onClick={load} disabled={loading} aria-label="重新整理即時車位">
          <span className={loading ? "spin" : ""}>↻</span> 更新
        </button>
      </header>

      <section className="hero">
        <p className="eyebrow">TAIPEI PARKING</p>
        <h1>找到空位，<br /><em>少繞一圈。</em></h1>
        <p className="intro">整合台北市官方停車場與即時剩餘車位，出發前先看一眼。</p>

        <div className="search-panel">
          <label className="search-box">
            <span>⌕</span>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜尋停車場、地址或地標" aria-label="關鍵字搜尋" />
            {keyword && <button onClick={() => setKeyword("")} aria-label="清除搜尋">×</button>}
          </label>
          <div className="districts" aria-label="行政區篩選">
            {districts.map((name) => (
              <button key={name} className={district === name ? "active" : ""} onClick={() => setDistrict(name)}>{name}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="workspace">
        <div className="result-head">
          <div>
            <p>{district === "全部地區" ? "台北市全區" : district}</p>
            <h2>{loading ? "正在取得資料" : `找到 ${filtered.length} 個停車場`}</h2>
          </div>
          <div className="view-toggle" role="group" aria-label="檢視方式">
            <button className={mode === "map" ? "active" : ""} onClick={() => setMode("map")}>地圖</button>
            <button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}>列表</button>
          </div>
        </div>

        {error ? (
          <div className="notice"><p>{error}</p><button onClick={load}>再試一次</button></div>
        ) : mode === "map" ? (
          <div className="map-wrap">
            <ParkingMap parks={filtered.filter((p) => p.lat && p.lng)} selected={selected} onSelect={setSelected} />
            <div className="legend"><span><i className="good" />有空位</span><span><i className="warn" />少量</span><span><i className="danger" />已滿／近滿</span></div>
          </div>
        ) : (
          <div className="cards">
            {filtered.slice(0, 100).map((p) => (
              <button className="parking-card" key={p.id} onClick={() => setSelected(p)}>
                <span className={`availability ${statusClass(p)}`}><strong>{availabilityLabel(p)}</strong><small>汽車空位</small></span>
                <span className="card-copy"><small>{p.area}</small><strong>{p.name}</strong><span>{p.address}</span></span>
                <span className="chevron">›</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className="sheet-backdrop" onClick={() => setSelected(null)}>
          <article className="detail-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="sheet-close" onClick={() => setSelected(null)} aria-label="關閉詳細資料">×</button>
            <p className="district-label">{selected.area}</p>
            <h2>{selected.name}</h2>
            <div className={`big-status ${statusClass(selected)}`}><span>{availabilityLabel(selected)}</span><small>汽車即時空位／共 {selected.totalCar} 格</small></div>
            <dl>
              <div><dt>地址</dt><dd>{selected.address || "未提供"}</dd></div>
              <div><dt>開放時間</dt><dd>{selected.serviceTime || "請依現場公告"}</dd></div>
              <div><dt>收費方式</dt><dd>{selected.payex || "請依現場公告"}</dd></div>
            </dl>
            <a className="navigate" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selected.address || `${selected.lat},${selected.lng}`)}`} target="_blank" rel="noreferrer">開啟導航 ↗</a>
          </article>
        </div>
      )}

      <footer>
        <span>{updateTime ? `車位資料更新：${updateTime}` : "正在同步官方資料"}</span>
        <a href="https://data.taipei/dataset/detail?id=d5c0656b-5250-4179-a491-c94daa56ef2c" target="_blank" rel="noreferrer">資料來源：臺北市資料大平臺 ↗</a>
      </footer>
    </main>
  );
}
