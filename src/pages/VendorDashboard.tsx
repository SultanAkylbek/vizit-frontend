// @ts-nocheck
import { useState } from "react";
import { placesApi, offersApi, ApiError } from "../api";
import { usePlaces } from "../hooks/usePlaces";

const CATEGORY_OPTIONS = ["cafe", "restaurant", "barbershop", "sto", "gym", "other"];

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

    const tags = tagsInput.split(",").map((tg) => tg.trim()).filter(Boolean);
    const payload = { ...form, tags };

    const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

    try {
      await placesApi.upsertMine(payload, idempotencyKey);
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

    const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

    try {
      await offersApi.upsert(myPlace.id, { title: offerTitle.trim(), bonus_text: offerBonus.trim(), discount_pct: Number(offerDiscount) || 0 }, idempotencyKey);
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
    <div style={{ flex: 1, overflowY: "auto", background: "#f9fafb", padding: "16px", fontFamily: "sans-serif" }}>
      <div>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase" }}>Панель Партнера</span>
        <h2 style={{ fontWeight: 700, fontSize: "20px", color: "#111827", margin: "4px 0 16px" }}>
          {myPlace ? myPlace.name : "Добавление заведения"}
        </h2>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button onClick={() => setActiveTab("add")} style={{ flex: 1, padding: "10px", background: activeTab === "add" ? "#111827" : "#fff", color: activeTab === "add" ? "#fff" : "#4b5563", border: "1px solid #d1d5db", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
          Профиль заведения
        </button>
        <button onClick={() => setActiveTab("offer")} style={{ flex: 1, padding: "10px", background: activeTab === "offer" ? "#111827" : "#fff", color: activeTab === "offer" ? "#fff" : "#4b5563", border: "1px solid #d1d5db", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
          Акции и Бонусы
        </button>
      </div>

      {activeTab === "add" && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Название заведения *</label>
            <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }} placeholder="Например: Surf Coffee" />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>Категория</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {CATEGORY_OPTIONS.map((cat) => (
                <button key={cat} onClick={() => updateField("category", cat)} style={{ padding: "6px 12px", borderRadius: "20px", border: `1.5px solid ${form.category === cat ? "#111827" : "#e5e7eb"}`, background: form.category === cat ? "#111827" : "#fff", color: form.category === cat ? "#fff" : "#4b5563", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Адрес *</label>
            <input type="text" value={form.address} onChange={(e) => updateField("address", e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }} placeholder="пр. Кабанбай батыра, 11" />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Район *</label>
            <input type="text" value={form.district} onChange={(e) => updateField("district", e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }} placeholder="Есіл" />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Описание атмосферы *</label>
            <textarea value={form.ambient_description} onChange={(e) => updateField("ambient_description", e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", minHeight: "8px", boxSizing: "border-box" }} placeholder="Тихая уютная кофейня с виниловым проигрывателем..." />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Теги (через запятую)</label>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }} placeholder="wifi, розетки, кофе" />
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#374151" }}>
              <input type="checkbox" checked={form.has_wifi} onChange={(e) => updateField("has_wifi", e.target.checked)} /> Есть Wi-Fi
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#374151" }}>
              <input type="checkbox" checked={form.has_outlets} onChange={(e) => updateField("has_outlets", e.target.checked)} /> Есть розетки
            </label>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Ссылка на 2GIS</label>
            <input type="text" value={form.two_gis_url} onChange={(e) => updateField("two_gis_url", e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }} placeholder="https://2gis.kz/astana/..." />
          </div>

          {submitState === "error" && (
            <div style={{ color: "#ef4444", background: "#fef2f2", padding: "10px", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" }}>{errorMsg}</div>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit} style={{ width: "100%", padding: "12px", background: submitState === "success" ? "#10b981" : "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: canSubmit ? "pointer" : "not-allowed", opacity: canSubmit ? 1 : 0.6 }}>
            {submitState === "submitting" ? "Сохранение..." : submitState === "success" ? "Успешно сохранено! 🎉" : "Сохранить заведение"}
          </button>
        </div>
      )}

      {activeTab === "offer" && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Заголовок предложения</label>
            <input type="text" value={offerTitle} onChange={(e) => setOfferTitle(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }} placeholder="Капучино за 700 ₸ при первом посещении" />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Условия (текст бонуса)</label>
            <input type="text" value={offerBonus} onChange={(e) => setOfferBonus(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }} placeholder="Покажите этот экран бариста" />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>Размер скидки (%)</label>
            <input type="number" value={offerDiscount} onChange={(e) => setOfferDiscount(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }} />
          </div>

          {offerState === "error" && (
            <div style={{ color: "#ef4444", background: "#fef2f2", padding: "10px", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" }}>{offerError}</div>
          )}

          <button onClick={handleOfferSubmit} disabled={!offerTitle.trim() || !offerBonus.trim() || offerState === "submitting"} style={{ width: "100%", padding: "12px", background: offerState === "success" ? "#10b981" : "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
            {offerState === "submitting" ? "Активация..." : offerState === "success" ? "Акция активирована! 🚀" : "Активировать акцию"}
          </button>
        </div>
      )}
    </div>
  );
}
