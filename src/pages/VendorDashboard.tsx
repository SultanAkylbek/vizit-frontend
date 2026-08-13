// src/pages/VendorDashboard.tsx
// Зависит только от ../api/index.ts и ../hooks/usePlaces.ts
// Никаких ../components/ui, никаких ../types

import { useState } from "react";
import { placesApi, offersApi, importApi, geoApi, ApiError } from "../api/index";
import type { VendorPlaceInput, Place } from "../api/index";
import { usePlaces } from "../hooks/usePlaces";
import { normalizeTags } from "../geo/tags";

// ── Стили из App.tsx (скопированы, чтобы не зависеть от ui.tsx) ──
const C = {
  bg: "var(--color-background-tertiary)",
  surface: "var(--color-background-primary)",
  border: "var(--color-border-tertiary)",
  border2: "var(--color-border-secondary)",
  text: "var(--color-text-primary)",
  muted: "var(--color-text-secondary)",
  hint: "var(--color-text-tertiary)",
  blue: "#378ADD",
  green: "#1D9E75",
  red: "#D85A30",
  redBg: "rgba(216,90,48,0.08)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 13,
  borderRadius: 8,
  border: "0.5px solid " + C.border2,
  background: C.surface,
  color: C.text,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: C.muted,
  marginBottom: 5,
};

const fieldWrap: React.CSSProperties = { marginBottom: 12 };

// ── GEO pipeline (Saved → Schema Generated → Indexed → GEO Ready) ──
type GeoStage = "pending" | "running" | "done" | "unavailable" | "error";
type GeoState = { saved: GeoStage; schema: GeoStage; indexed: GeoStage; ready: GeoStage; note?: string };
const GEO_IDLE: GeoState = { saved: "pending", schema: "pending", indexed: "pending", ready: "pending" };

async function runGeoPipeline(
  fields: { name: string; category: string; ambient_description: string; address: string; district: string; two_gis_url?: string },
  setGeo: (s: GeoState) => void
) {
  setGeo({ saved: "done", schema: "running", indexed: "running", ready: "running" });
  try {
    const result = await geoApi.generate({
      business_name: fields.name,
      niche: fields.category,
      city: "Астана",
      district: fields.district || undefined,
      usp: fields.ambient_description.slice(0, 300) || fields.name,
      address_2gis_url: fields.two_gis_url || fields.address,
    });
    setGeo({
      saved: "done",
      schema: "done",
      indexed: result.indexnow_submitted ? "done" : "unavailable",
      ready: result.indexnow_submitted ? "done" : "unavailable",
    });
  } catch (e) {
    const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : "Ошибка сети";
    setGeo({ saved: "done", schema: "error", indexed: "error", ready: "error", note: msg });
  }
}

function geoDot(s: GeoStage): string {
  return s === "done" ? "●" : s === "running" ? "○" : s === "error" ? "✕" : "–";
}

function GeoBar({ geo }: { geo: GeoState }) {
  if (geo.saved === "pending") return null;
  const stages: [string, GeoStage][] = [
    ["Saved", geo.saved],
    ["Schema Generated", geo.schema],
    ["Indexed", geo.indexed],
    ["GEO Ready", geo.ready],
  ];
  return (
    <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "0.5px solid " + C.border2, background: C.bg }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        {stages.map(([label, s]) => (
          <span key={label} style={{ fontSize: 12, color: s === "done" ? C.text : C.muted }}>
            {geoDot(s)} {label}
          </span>
        ))}
      </div>
      {geo.note && <div style={{ marginTop: 6, fontSize: 11, color: C.hint }}>{geo.note}</div>}
      <div style={{ marginTop: 6, fontSize: 11, color: C.hint }}>
        Это инфраструктура по GEO best-practices, не гарантия топа в ответах LLM.
      </div>
    </div>
  );
}

const CATEGORIES = ["cafe", "restaurant", "barbershop", "sto", "gym", "other"];

const EMPTY: VendorPlaceInput = {
  name: "",
  category: "cafe",
  address: "",
  district: "",
  ambient_description: "",
  tags: [],
  lat: null,
  lng: null,
  two_gis_url: "",
  avg_check_kzt: null,
  has_outlets: false,
  has_wifi: false,
};

function genKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const TEXT = {
  addPlaceTitle: "Добавить заведение",
  editor: "Редактор заведения",
  addPlace: "Добавить место",
  offers: "Офферы",
  fieldName: "Название",
  fieldCat: "Категория",
  fieldAddr: "Адрес",
  fieldDist: "Район",
  fieldDesc: "Описание",
  tagsLabel: "Теги (через запятую)",
  fieldGis: "2GIS ссылка",
  fieldCheck: "Средний чек",
  fieldWifi: "Wi-Fi",
  fieldOutlets: "Розетки",
  submitting: "Сохраняю...",
  added: "Сохранено",
  submit: "Сохранить",
  offerTitle: "Название оффера",
  bonusText: "Текст бонуса",
  discountPct: "Скидка, %",
  activated: "Активировано",
  activate: "Активировать",
};

export function VendorDashboard() {
  const t = TEXT;
  const { places, refetch } = usePlaces();
  const myPlace = places[0] ?? null;

  const [tab, setTab] = useState<"add" | "offer" | "import">("add");
  const [geo, setGeo] = useState<GeoState>(GEO_IDLE);

  const [form, setForm] = useState<VendorPlaceInput>(EMPTY);
  const [tagsRaw, setTagsRaw] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [warnMsg, setWarnMsg] = useState("");

  function set<K extends keyof VendorPlaceInput>(k: K, v: VendorPlaceInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const canAdd =
    form.name.trim() !== "" &&
    form.address.trim() !== "" &&
    form.district.trim() !== "" &&
    form.ambient_description.trim() !== "" &&
    status !== "loading";

  async function handleAdd() {
    if (!canAdd) return;
    setStatus("loading");
    setErrMsg("");
    setWarnMsg("");
    const tags = tagsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      const result = await placesApi.upsertMine({ ...form, tags }, genKey());
      setStatus("ok");
      setForm(EMPTY);
      setTagsRaw("");
      refetch();

      if (result.generated_by === "template") {
        setWarnMsg("Лендинг создан из шаблона. Для AI-генерации подключите OpenRouter API ключ в .env (бесплатно на openrouter.ai)");
      }

      setTimeout(() => {
        if (result.slug) {
          window.location.href = `/place/${result.slug}`;
        } else {
          setStatus("idle");
        }
      }, 1500);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message + " (HTTP " + e.status + ")" : "Ошибка сети";
      console.error("Ошибка при добавлении заведения:", e);
      setErrMsg(msg);
      setStatus("err");
    }
  }

  const [offerTitle, setOfferTitle] = useState("");
  const [offerBonus, setOfferBonus] = useState("");
  const [offerDisc, setOfferDisc] = useState("0");
  const [offerStatus, setOfferStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [offerErr, setOfferErr] = useState("");

  async function handleOffer() {
    if (!myPlace) {
      setOfferErr("Сначала добавьте заведение");
      setOfferStatus("err");
      return;
    }
    if (!offerTitle.trim() || !offerBonus.trim()) return;
    setOfferStatus("loading");
    setOfferErr("");
    try {
      await offersApi.upsert(
        myPlace.id,
        { title: offerTitle.trim(), bonus_text: offerBonus.trim(), discount_pct: Number(offerDisc) || 0 },
        genKey()
      );
      setOfferStatus("ok");
      refetch();
      setTimeout(() => setOfferStatus("idle"), 2500);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message + " (HTTP " + e.status + ")" : "Ошибка сети";
      console.error("Ошибка при сохранении оффера:", e);
      setOfferErr(msg);
      setOfferStatus("err");
    }
  }

  const [gisUrl, setGisUrl] = useState("");
  const [gisStep, setGisStep] = useState<"link" | "loading" | "review" | "saving" | "done" | "error">("link");
  const [gisDraft, setGisDraft] = useState<Place | null>(null);
  const [gisTagsRaw, setGisTagsRaw] = useState("");
  const [gisAddress, setGisAddress] = useState("");
  const [gisErr, setGisErr] = useState("");
  const [gisSavedSlug, setGisSavedSlug] = useState<string | null>(null);

  async function handleGisImport() {
    if (!gisUrl.trim()) return;
    setGisStep("loading");
    setGisErr("");
    try {
      const draft = await importApi.fromTwoGis(gisUrl.trim());
      setGisDraft(draft);
      setGisAddress(draft.address);
      setGisTagsRaw((draft.tags ?? []).join(", "));
      setGisStep("review");
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : "Не удалось загрузить данные по ссылке";
      setGisErr(msg);
      setGisStep("error");
    }
  }

  function handleGisChangeLink() {
    setGisErr("");
    setGisStep("link");
  }

  function handleGisRetry() {
    handleGisImport();
  }

  async function handleGisSave() {
    if (!gisDraft || !gisAddress.trim()) return;
    setGisStep("saving");
    setGisErr("");
    const tags = gisTagsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const payload: VendorPlaceInput = {
      name: gisDraft.name,
      category: gisDraft.category,
      address: gisAddress.trim(),
      district: gisDraft.district,
      ambient_description: gisDraft.ambient_description ?? "",
      tags,
      lat: gisDraft.lat ?? null,
      lng: gisDraft.lng ?? null,
      two_gis_url: gisDraft.two_gis_url ?? gisUrl.trim(),
      avg_check_kzt: gisDraft.avg_check_kzt ?? null,
      has_outlets: false,
      has_wifi: false,
    };
    try {
      const res = await placesApi.upsertMine(payload, genKey());
      setGisSavedSlug(gisDraft.slug || res.place_id);
      setGisStep("done");
      refetch();
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : "Ошибка сети при сохранении";
      setGisErr(msg);
      setGisStep("review");
    }
  }

  return (
  <div style={{ height: "calc(100vh - 60px)", overflowY: "auto", background: C.bg, padding: 16, paddingBottom: 120, fontFamily: "var(--font-sans)", boxSizing: "border-box" }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 14 }}>
        {myPlace ? myPlace.name : (t.addPlaceTitle || "Добавить заведение")}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["add", "offer", "import"] as const).map((id) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: "7px 14px", borderRadius: 8, border: "0.5px solid " + (tab === id ? C.blue : C.border2), background: tab === id ? C.blue : C.surface, color: tab === id ? "#fff" : C.muted, fontSize: 12, fontWeight: tab === id ? 600 : 400, cursor: "pointer" }}>
            {id === "add" ? (myPlace ? t.editor : t.addPlace) : id === "offer" ? t.offers : "Импорт из 2GIS"}
          </button>
        ))}
      </div>

      {tab === "add" && (
        <div style={{ background: C.surface, border: "0.5px solid " + C.border2, borderRadius: 14, padding: 14 }}>

          <div style={fieldWrap}>
            <label style={labelStyle}>{t.fieldName}</label>
            <input style={inputStyle} value={form.name} placeholder="Surf Coffee"
              onChange={(e) => set("name", e.target.value)} />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>{t.fieldCat}</label>
            <select style={{ ...inputStyle, appearance: "auto" }}
              value={form.category}
              onChange={(e) => set("category", e.target.value as VendorPlaceInput["category"])}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>{t.fieldAddr}</label>
            <input style={inputStyle} value={form.address} placeholder="пр. Кабанбай батыра, 11"
              onChange={(e) => set("address", e.target.value)} />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>{t.fieldDist}</label>
            <input style={inputStyle} value={form.district} placeholder="Есіл"
              onChange={(e) => set("district", e.target.value)} />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>{t.fieldDesc}</label>
            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3}
              value={form.ambient_description}
              placeholder="Тихая кофейня с розетками, specialty кофе..."
              onChange={(e) => set("ambient_description", e.target.value)} />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>{t.tagsLabel}</label>
            <input style={inputStyle} value={tagsRaw} placeholder="wifi, розетки, тихо, кофе"
              onChange={(e) => setTagsRaw(e.target.value)} />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>{t.fieldGis}</label>
            <input style={inputStyle} value={form.two_gis_url ?? ""}
              placeholder="https://2gis.kz/astana/..."
              onChange={(e) => set("two_gis_url", e.target.value)} />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>{t.fieldCheck}</label>
            <input style={inputStyle} type="number" value={form.avg_check_kzt ?? ""}
              placeholder="2500"
              onChange={(e) => set("avg_check_kzt", e.target.value ? Number(e.target.value) : null)} />
          </div>

          <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.muted, cursor: "pointer" }}>
              <input type="checkbox" checked={form.has_wifi}
                onChange={(e) => set("has_wifi", e.target.checked)} />
              {t.fieldWifi}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.muted, cursor: "pointer" }}>
              <input type="checkbox" checked={form.has_outlets}
                onChange={(e) => set("has_outlets", e.target.checked)} />
              {t.fieldOutlets}
            </label>
          </div>

          {warnMsg && (
            <div style={{ color: "#B8860B", background: "rgba(184,134,11,0.08)", border: "0.5px solid #B8860B44", borderRadius: 8, padding: "9px 12px", fontSize: 12, marginBottom: 12 }}>
              {warnMsg}
            </div>
          )}

          {status === "err" && (
            <div style={{ color: C.red, background: C.redBg, border: "0.5px solid " + C.red + "44", borderRadius: 8, padding: "9px 12px", fontSize: 12, marginBottom: 12 }}>
              {errMsg}
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={!canAdd}
            style={{ width: "100%", padding: "11px", borderRadius: 8, border: "none", background: !canAdd ? C.bg : status === "ok" ? C.green : C.blue, color: !canAdd ? C.hint : "#fff", fontSize: 13, fontWeight: 600, cursor: !canAdd ? "default" : "pointer" }}>
            {status === "loading" ? t.submitting : status === "ok" ? t.added : t.submit}
          </button>

        </div>
      )}

      {tab === "offer" && (
        <div style={{ background: C.surface, border: "0.5px solid " + C.border2, borderRadius: 14, padding: 14 }}>

          <div style={fieldWrap}>
            <label style={labelStyle}>{t.offerTitle}</label>
            <input style={inputStyle} value={offerTitle}
              placeholder="Капучино за 700 ₸"
              onChange={(e) => setOfferTitle(e.target.value)} />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>{t.bonusText}</label>
            <input style={inputStyle} value={offerBonus}
              placeholder="Покажи экран — капучино в подарок"
              onChange={(e) => setOfferBonus(e.target.value)} />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>{t.discountPct}</label>
            <input style={inputStyle} type="number" value={offerDisc}
              onChange={(e) => setOfferDisc(e.target.value)} />
          </div>

          {offerStatus === "err" && (
            <div style={{ color: C.red, background: C.redBg, border: "0.5px solid " + C.red + "44", borderRadius: 8, padding: "9px 12px", fontSize: 12, marginBottom: 12 }}>
              {offerErr}
            </div>
          )}

          <button
            onClick={handleOffer}
            disabled={!offerTitle.trim() || !offerBonus.trim() || offerStatus === "loading"}
            style={{ width: "100%", padding: "11px", borderRadius: 8, border: "none", background: offerStatus === "ok" ? C.green : C.blue, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {offerStatus === "loading" ? "..." : offerStatus === "ok" ? t.activated : t.activate}
          </button>

        </div>
      )}

      {tab === "import" && (
        <div style={{ background: C.surface, border: "0.5px solid " + C.border2, borderRadius: 14, padding: 14 }}>

          {(gisStep === "link" || gisStep === "loading" || gisStep === "error") && (
            <>
              <div style={fieldWrap}>
                <label style={labelStyle}>Ссылка на 2GIS</label>
                <input style={inputStyle} value={gisUrl} placeholder="https://2gis.kz/astana/firm/..."
                  disabled={gisStep === "loading"}
                  onChange={(e) => setGisUrl(e.target.value)} />
              </div>

              {gisStep === "error" && (
                <div style={{ color: C.red, background: C.redBg, border: "0.5px solid " + C.red + "44", borderRadius: 8, padding: "9px 12px", fontSize: 12, marginBottom: 12 }}>
                  {gisErr}
                </div>
              )}

              <button
                onClick={gisStep === "error" ? handleGisRetry : handleGisImport}
                disabled={!gisUrl.trim() || gisStep === "loading"}
                style={{ width: "100%", padding: "11px", borderRadius: 8, border: "none", background: !gisUrl.trim() ? C.bg : C.blue, color: !gisUrl.trim() ? C.hint : "#fff", fontSize: 13, fontWeight: 600, cursor: gisUrl.trim() ? "pointer" : "default" }}>
                {gisStep === "loading" ? "Загружаю..." : gisStep === "error" ? "Повторить" : "Импортировать"}
              </button>
            </>
          )}

          {(gisStep === "review" || gisStep === "saving") && gisDraft && (
            <>
              <div style={fieldWrap}>
                <label style={labelStyle}>{t.fieldName}</label>
                <input style={inputStyle} value={gisDraft.name}
                  onChange={(e) => setGisDraft({ ...gisDraft, name: e.target.value })} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>{t.fieldAddr} (обязательно)</label>
                <input style={inputStyle} value={gisAddress}
                  onChange={(e) => setGisAddress(e.target.value)} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>{t.fieldDist}</label>
                <input style={inputStyle} value={gisDraft.district}
                  onChange={(e) => setGisDraft({ ...gisDraft, district: e.target.value })} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>{t.fieldDesc}</label>
                <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3}
                  value={gisDraft.ambient_description ?? ""}
                  onChange={(e) => setGisDraft({ ...gisDraft, ambient_description: e.target.value })} />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>{t.tagsLabel}</label>
                <input style={inputStyle} value={gisTagsRaw}
                  onChange={(e) => setGisTagsRaw(e.target.value)} />
                {normalizeTags(gisTagsRaw.split(",").map((s) => s.trim()).filter(Boolean)).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {normalizeTags(gisTagsRaw.split(",").map((s) => s.trim()).filter(Boolean)).map((tag) => (
                      <span key={tag.id} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, border: "0.5px solid " + C.border2, color: C.muted }}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {gisErr && (
                <div style={{ color: C.red, background: C.redBg, border: "0.5px solid " + C.red + "44", borderRadius: 8, padding: "9px 12px", fontSize: 12, marginBottom: 12 }}>
                  {gisErr}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={handleGisChangeLink} disabled={gisStep === "saving"}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "0.5px solid " + C.border2, background: C.surface, color: C.muted, fontSize: 13, cursor: "pointer" }}>
                  Изменить ссылку
                </button>
                <button onClick={handleGisRetry} disabled={gisStep === "saving"}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "0.5px solid " + C.border2, background: C.surface, color: C.muted, fontSize: 13, cursor: "pointer" }}>
                  Повторить
                </button>
              </div>

              <button
                onClick={handleGisSave}
                disabled={!gisAddress.trim() || gisStep === "saving"}
                style={{ width: "100%", padding: "11px", borderRadius: 8, border: "none", background: !gisAddress.trim() ? C.bg : C.blue, color: !gisAddress.trim() ? C.hint : "#fff", fontSize: 13, fontWeight: 600, cursor: gisAddress.trim() ? "pointer" : "default" }}>
                {gisStep === "saving" ? t.submitting : t.submit}
              </button>

            </>
          )}

          {gisStep === "done" && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ fontSize: 13, color: C.text, marginBottom: 10 }}>Заведение сохранено.</div>
              {gisSavedSlug && (
                <a href={`/place/${gisSavedSlug}`} style={{ fontSize: 13, color: C.blue }}>Открыть карточку</a>
              )}
              <button
                onClick={() => { setGisStep("link"); setGisUrl(""); setGisDraft(null); setGisTagsRaw(""); setGisAddress(""); setGisSavedSlug(null); }}
                style={{ width: "100%", marginTop: 12, padding: "11px", borderRadius: 8, border: "0.5px solid " + C.border2, background: C.surface, color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Импортировать ещё
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
