import { useEffect, useMemo, useState } from "react";

type GeoResult = {
  results?: Array<{
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }>;
};

type Weather = {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
};

export default function App() {
  const [city, setCity] = useState("Taipei");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{
    location: string;
    temperature: number;
    apparent: number;
    updatedAt: string;
    nextHours: Array<{ time: string; temp: number }>;
  } | null>(null);

  const canSearch = useMemo(() => city.trim().length >= 2, [city]);

  async function fetchWeather() {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      // 1) 先找地理座標
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1&language=zh&format=json`
      );
      if (!geoRes.ok) throw new Error("地理查詢失敗");
      const geo = (await geoRes.json()) as GeoResult;
      if (!geo.results?.length) throw new Error("找不到此城市，請換個名稱");

      const g = geo.results[0];

      // 2) 查天氣
      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,apparent_temperature&hourly=temperature_2m&timezone=auto`
      );
      if (!wRes.ok) throw new Error("天氣查詢失敗");
      const w = (await wRes.json()) as Weather;

      const next = w.hourly.time.slice(0, 8).map((t, i) => ({
        time: t,
        temp: w.hourly.temperature_2m[i],
      }));

      setInfo({
        location: `${g.name}${g.admin1 ? `, ${g.admin1}` : ""}${
          g.country ? `, ${g.country}` : ""
        }`,
        temperature: w.current.temperature_2m,
        apparent: w.current.apparent_temperature,
        updatedAt: w.current.time,
        nextHours: next,
      });
    } catch (e: any) {
      setError(e?.message || "發生錯誤");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWeather(); // 預設載入一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",   // 水平置中
        alignItems: "center",       // 垂直置中
        minHeight: "100vh",         // 滿版高度
        background: "#f7f7f8",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 500,            // 卡片最大寬度
          padding: 24,
          borderRadius: 16,
          background: "white",
          boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginBottom: 16, textAlign: "center" }}>
          Cloud Frontend — 天氣查詢
        </h1>
        <p style={{ marginTop: 6, color: "#666", textAlign: "center" }}>
          輸入城市名稱（例：Taipei、Tokyo、New York），按 Enter 或點查詢
        </p>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSearch && fetchWeather()}
            placeholder="輸入城市名稱"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              marginBottom: 12,
            }}
            aria-label="城市名稱輸入框"
          />
          <button
            onClick={fetchWeather}
            disabled={!canSearch || loading}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: "#111",
              color: "white",
              cursor: canSearch && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "查詢中…" : "查詢"}
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          {!loading && !error && !info && (
            <p style={{ color: "#888" }}>請輸入城市並查詢。</p>
          )}
          {error && (
            <p style={{ color: "#c0392b" }}>⚠️ {error}</p>
          )}
          {info && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <div>
                  <h2 style={{ margin: "12px 0 2px", fontSize: 20 }}>
                    {info.location}
                  </h2>
                  <div style={{ color: "#666", fontSize: 13 }}>
                    更新：{new Date(info.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 40, fontWeight: 800 }}>
                    {Math.round(info.temperature)}°C
                  </div>
                  <div style={{ color: "#666", fontSize: 13 }}>
                    體感 {Math.round(info.apparent)}°C
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                {info.nextHours.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <div style={{ color: "#777", fontSize: 12 }}>
                      {new Date(h.time).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>
                      {Math.round(h.temp)}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {loading && <p>載入中…</p>}
        </div>
      </div>
    </div>
  );
}
