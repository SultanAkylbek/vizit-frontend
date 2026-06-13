// src/pages/VendorDashboard.tsx
// Зависит только от ../api/index.ts и ../hooks/usePlaces.ts
// Никаких ../components/ui, никаких ../types

import { useState } from "react";
import { placesApi, offersApi, ApiError } from "../api/index";
import type { VendorPlaceInput } from "../api/index";
import { usePlaces } from "../hooks/usePlaces";

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

interface Props {
  user: { id: string; role: string; name: string; email: string };
  t: Record<string, any>;
}

export function VendorDashboard({ t }: Props) {
  const { places, refetch } = usePlaces();
  const myPlace = places[0] ?? null;

  const [tab, setTab] = useState<"add" | "offer">("add");

  // ── Форма заведения ─────────────────────────────────────────
  const [form, setForm] = useState<VendorPlaceInput>(EMPTY);
  const [tagsRaw, setTagsRaw] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");

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
    const tags = tagsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      const res = await placesApi.upsertMine({ ...form, tags }, genKey());
      console.log("Saved:", res);
      setStatus("ok");
      setForm(EMPTY);
      setTagsRaw("");
      refetch();
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message + " (HTTP " + e.status + ")" : "Ошибка сети";
      console.error("Ошибка при добавлении заведения:", e);
      setErrMsg(msg);
      setStatus("err");
    }
  }

  // ── Форма оффера ────────────────────────────────────────────
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

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100%", background: C.bg, padding: 16, paddingBottom: 24, fontFamily: "var(--font-sans)" }}>

      <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 14 }}>
        {myPlace ? myPlace.name : (t.addPlaceTitle || "Добавить заведение")}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["add", "offer"] as const).map((id) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: "7px 14px", borderRadius: 8, border: "0.5px solid " + (tab === id ? C.blue : C.border2), background: tab === id ? C.blue : C.surface, color: tab === id ? "#fff" : C.muted, fontSize: 12, fontWeight: tab === id ? 600 : 400, cursor: "pointer" }}>
            {id === "add" ? (myPlace ? t.editor : t.addPlace) : t.offers}
          </button>
        ))}
      </div>

      {/* ── ADD / EDIT ───────────────────────────────────────── */}
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>{t.fieldLat}</label>
              <input style={inputStyle} type="number" value={form.lat ?? ""}
                placeholder="51.1282"
                onChange={(e) => set("lat", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>{t.fieldLng}</label>
              <input style={inputStyle} type="number" value={form.lng ?? ""}
                placeholder="71.4314"
                onChange={(e) => set("lng", e.target.value ? Number(e.target.value) : null)} />
            </div>
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

      {/* ── OFFER ────────────────────────────────────────────── */}
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
    </div>
  );
}
