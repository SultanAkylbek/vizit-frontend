// @ts-nocheck
import { useState } from "react";
import { T, Btn, Field, GateLabel } from "../components/ui";
import { placesApi, offersApi, ApiError } from "../api";
import { usePlaces } from "../hooks/usePlaces";

const CATEGORY_OPTIONS = [
  "cafe",
  "restaurant",
  "barbershop",
  "sto",
  "gym",
  "other",
];

const EMPTY_FORM = {
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

export function VendorDashboard({ t }) {
  const { places, refetch } = usePlaces();
  const [activeTab, setActiveTab] = useState("add");

  const [form, setForm] = useState(EMPTY_FORM);
  const [tagsInput, setTagsInput] = useState("");
  const [submitState, setSubmitState] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const canSubmit =
    form.name.trim() &&
    form.address.trim() &&
    form.district.trim() &&
    form.ambient_description.trim() &&
    submitState !== "submitting";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitState("submitting");
    setErrorMsg(null);

    const tags = tagsInput
      .split(",")
      .map((tg) => tg.trim())
      .filter(Boolean);

    const payload = { ...form, tags };

    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    try {
      const result = await placesApi.upsertMine(payload, idempotencyKey);
      setSubmitState("success");
      setForm(EMPTY_FORM);
      setTagsInput("");
      refetch();
      setTimeout(() => setSubmitState("idle"), 2500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "Ошибка сервера");
      setSubmitState("error");
    }
  };

  const [offerTitle, setOfferTitle] = useState("");
  const [offerBonus, setOfferBonus] = useState("");
  const [offerDiscount, setOfferDiscount] = useState("0");
  const [offerState, setOfferState] = useState("idle");
  const [offerError, setOfferError] = useState(null);

  const myPlace = places && places[0];

  const handleOfferSubmit = async () => {
    if (!myPlace) {
      setOfferError("Сначала добавьте заведение");
      setOfferState("error");
      return;
    }
    if (!offerTitle.trim() || !offerBonus.trim()) return;

    setOfferState("submitting");
    setOfferError(null);

    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    try {
      await offersApi.upsert(
        myPlace.id,
        {
          title: offerTitle.trim(),
          bonus_text: offerBonus.trim(),
          discount_pct: Number(offerDiscount) || 0,
        },
        idempotencyKey
      );
      setOfferState("success");
      refetch();
      setTimeout(() => setOfferState("idle"), 2500);
    } catch (err) {
      console.error(err);
      setOfferError(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "Ошибка сервера");
      setOfferState("error");
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg }}>
      <div style={{ padding: "18px 16px 0" }}>
        <GateLabel>{t.vendorTitle}</GateLabel>
        <h2 style={{ fontWeight: 700, fontSize: 19, color: T.text, margin: "2px 0 16px" }}>
          {myPlace ? myPlace.name : t.addPlaceTitle}
        </h2>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "0 16px 16px" }}>
        {[
          ["add", myPlace ? t.editor : t.addPlace],
          ["offer", t.offers],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1,
              padding: "10px",
              background: activeTab === id ? T.navy : T.surface,
              border: `1px solid ${activeTab === id ? T.navy : T.border2}`,
              borderRadius: "var(--border-radius-md)",
              color: activeTab === id ? "#fff" : T.muted,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "add" && (
        <div style={{ padding: "0 16px 32px" }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: "var(--border-radius-lg)", padding: 16 }}>
            <Field label={t.fieldName} value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Surf Coffee" />
            
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase" }}>
                {t.fieldCat}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => updateField("category", cat)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: "var(--border-radius-pill)",
                      border: `1.5px solid ${form.category === cat ? T.navy : T.border2}`,
                      background: form.category === cat ? T.navy : T.surface,
                      color: form.category === cat ? "#fff" : T.muted,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <Field label={t.fieldAddr} value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="пр. Кабанбай батыра, 11" />
            <Field label={t.fieldDist} value={form.district} onChange={(e) => updateField("district", e.target.value)} placeholder="Есіл" />
            <Field label={t.fieldDesc} value={form.ambient_description} onChange={(e) => updateField("ambient_description", e.target.value)} placeholder="Тихая кофейня..." multiline />
            <Field label={t.tagsLabel} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="wifi, розетки" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label={t.fieldLat} value={form.lat ?? ""} onChange={(e) => updateField("lat", e.target.value ? Number(e.target.value) : null)} placeholder="51.1282" type="number" />
              <Field label={t.fieldLng} value={form.lng ?? ""} onChange={(e) => updateField("lng", e.target.value ? Number(e.target.value) : null)} placeholder="71.4314" type="number" />
            </div>

            <Field label={t.fieldGis} value={form.two_gis_url ?? ""} onChange={(e) => updateField("two_gis_url", e.target.value)} placeholder="https://2gis.kz/..." />
            <Field label={t.fieldCheck} value={form.avg_check_kzt ?? ""} onChange={(e) => updateField("avg_check_kzt", e.target.value ? Number(e.target.value) : null)} placeholder="2500" type="number" />

            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.muted, cursor: "pointer" }}>
                <input type="checkbox" checked={form.has_wifi} onChange={(e) => updateField("has_wifi", e.target.checked)} />
                {t.fieldWifi}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.muted, cursor: "pointer" }}>
                <input type="checkbox" checked={form.has_outlets} onChange={(e) => updateField("has_outlets", e.target.checked)} />
                {t.fieldOutlets}
              </label>
            </div>

            {submitState === "error" && errorMsg && (
              <div style={{ color: T.red, background: T.redSoft, border: `1px solid ${T.red}33`, borderRadius: "var(--border-radius-md)", padding: "10px 12px", fontSize: 12, marginBottom: 12, fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}

            <Btn onClick={handleSubmit} disabled={!canSubmit} full color={submitState === "success" ? T.green : T.red}>
              {submitState === "submitting" ? t.submitting : submitState === "success" ? t.added : t.submit}
            </Btn>
          </div>
        </div>
      )}

      {activeTab === "offer" && (
        <div style={{ padding: "0 16px 32px" }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: "var(--border-radius-lg)", padding: 16 }}>
            <Field label={t.offerTitle} value={offerTitle} onChange={(e) => setOfferTitle(e.target.value)} placeholder="Капучино за 700 ₸" />
            <Field label={t.bonusText} value={offerBonus} onChange={(e) => setOfferBonus(e.target.value)} placeholder="Покажи экран" />
            <Field label={t.discountPct} value={offerDiscount} onChange={(e) => setOfferDiscount(e.target.value)} type="number" />

            {offerState === "error" && offerError && (
              <div style={{ color: T.red, background: T.redSoft, border: `1px solid ${T.red}33`, borderRadius: "var(--border-radius-md)", padding: "10px 12px", fontSize: 12, marginBottom: 12, fontWeight: 600 }}>
                {offerError}
              </div>
            )}

            <Btn onClick={handleOfferSubmit} disabled={!offerTitle.trim() || !offerBonus.trim() || offerState === "submitting"} full color={offerState === "success" ? T.green : T.red}>
              {offerState === "submitting" ? "..." : offerState === "success" ? t.activated : t.activate}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
