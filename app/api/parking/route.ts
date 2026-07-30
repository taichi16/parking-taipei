const STATIC_URL = "https://tcgbusfs.blob.core.windows.net/blobtcmsv/TCMSV_alldesc.json";
const LIVE_URL = "https://tcgbusfs.blob.core.windows.net/blobtcmsv/TCMSV_allavailable.json";

async function readJson(url: string) {
  const response = await fetch(url, { cf: { cacheTtl: 30 } } as RequestInit);
  if (!response.ok) throw new Error(`Upstream ${response.status}`);
  const buffer = await response.arrayBuffer();
  return JSON.parse(new TextDecoder("utf-8").decode(buffer));
}

function twd97ToWgs84(x: number, y: number) {
  const a = 6378137.0, b = 6356752.314245, lng0 = 121 * Math.PI / 180;
  const k0 = 0.9999, dx = 250000;
  const e = Math.sqrt(1 - (b * b) / (a * a));
  x -= dx;
  const m = y / k0;
  const mu = m / (a * (1 - e * e / 4 - 3 * Math.pow(e, 4) / 64 - 5 * Math.pow(e, 6) / 256));
  const e1 = (1 - Math.sqrt(1 - e * e)) / (1 + Math.sqrt(1 - e * e));
  const j1 = 3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32;
  const j2 = 21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32;
  const j3 = 151 * Math.pow(e1, 3) / 96;
  const j4 = 1097 * Math.pow(e1, 4) / 512;
  const fp = mu + j1 * Math.sin(2 * mu) + j2 * Math.sin(4 * mu) + j3 * Math.sin(6 * mu) + j4 * Math.sin(8 * mu);
  const e2 = e * e / (1 - e * e), c1 = e2 * Math.cos(fp) ** 2;
  const t1 = Math.tan(fp) ** 2, r1 = a * (1 - e * e) / Math.pow(1 - e * e * Math.sin(fp) ** 2, 1.5);
  const n1 = a / Math.sqrt(1 - e * e * Math.sin(fp) ** 2), d = x / (n1 * k0);
  const lat = fp - (n1 * Math.tan(fp) / r1) * (d * d / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * e2) * Math.pow(d, 4) / 24 + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * e2 - 3 * c1 * c1) * Math.pow(d, 6) / 720);
  const lng = lng0 + (d - (1 + 2 * t1 + c1) * Math.pow(d, 3) / 6 + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * e2 + 24 * t1 * t1) * Math.pow(d, 5) / 120) / Math.cos(fp);
  return { lat: lat * 180 / Math.PI, lng: lng * 180 / Math.PI };
}

function repairText(value: unknown) {
  if (typeof value !== "string") return String(value ?? "");
  let text = value;
  try {
    for (let pass = 0; pass < 3 && /[ÃÂåäæçéè]/.test(text); pass++) {
      const chars = Array.from(text);
      if (chars.some((char) => char.charCodeAt(0) > 255)) break;
      text = new TextDecoder("utf-8").decode(Uint8Array.from(chars, (char) => char.charCodeAt(0)));
    }
    return text;
  } catch {
    return text;
  }
}

export async function GET() {
  try {
    const [staticData, liveData] = await Promise.all([readJson(STATIC_URL), readJson(LIVE_URL)]);
    const liveParks = liveData.data?.park ?? liveData.DATA?.PARK ?? [];
    const liveMap = new Map(liveParks.map((p: Record<string, unknown>) => [String(p.id ?? p.ID), p]));
    const records = staticData.data?.park ?? staticData.DATA?.PARK ?? [];
    const parks = records.map((p: Record<string, any>) => {
      const live: any = liveMap.get(String(p.id ?? p.ID)) || {};
      const code = Number(live.availablecar ?? live.AVAILABLECAR);
      const x = Number(p.tw97x ?? p.TW97X), y = Number(p.tw97y ?? p.TW97Y);
      const coord = Number.isFinite(x) && Number.isFinite(y) ? twd97ToWgs84(x, y) : { lat: null, lng: null };
      return {
        id: String(p.id ?? p.ID), area: repairText(p.area ?? p.AREA), name: repairText(p.name ?? p.NAME),
        address: repairText(p.address ?? p.ADDRESS), payex: repairText(p.payex ?? p.PAYEX),
        serviceTime: repairText(p.serviceTime ?? p.SERVICETIME), totalCar: Number(p.totalcar ?? p.TOTALCAR) || 0,
        availableCar: Number.isFinite(code) && code >= 0 ? code : null,
        availabilityCode: Number.isFinite(code) && code < 0 ? code : null,
        lat: coord.lat, lng: coord.lng, updateTime: liveData.data?.UPDATETIME ?? liveData.DATA?.UPDATETIME ?? "",
      };
    });
    return Response.json({ parks }, { headers: { "Cache-Control": "public, max-age=20, s-maxage=30" } });
  } catch {
    return Response.json({ error: "Unable to load parking data" }, { status: 502 });
  }
}
