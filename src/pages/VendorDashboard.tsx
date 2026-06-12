// @ts-nocheck
import { useState } from "react";
import { T, Btn, Field, GateLabel } from "../components/ui";
import { placesApi, offersApi, ApiError } from "../api";
import type { VendorPlaceInput } from "../api";
import { usePlaces } from "../hooks/usePlaces";
import type { User, I18nDict } from "../types";

interface Props {
  user: User;
  t: I18nDict;
}

const CATEGORY_OPTIONS: VendorPlaceInput["category"][] = [
  "cafe",
  "restaurant",
  "barbershop",
  "sto",
  "gym",
  "other",
];

const EMPTY_FORM: VendorPlaceInput = {
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

type SubmitState = "idle" | "submitting" | "success" | "error";

export function VendorDashboard({ t }: Props) {
  const { places, refetch } = usePlaces();

  const [activeTab, setActiveTab] = useState<"add" | "offer">("add");

  // ── Форма добавления/редактирования заведения ───────────────
  const [form, setForm] = useState<VendorPlaceInput>(EMPTY_FORM);
  const [tagsInput, setTagsInput] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateField = <K extends keyof VendorPlaceInput>(
    key: K,
    value: VendorPlaceInput[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

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

    // Собираем теги из строки "wifi, розетки, тихо"
    const tags = tagsInput
      .split(",")
      .map((tg) => tg.trim())
      .filter(Boolean);

    const payload: VendorPlaceInput = { ...form, tags };

    // Idempotency key — генерируем один раз на попытку отправки,
    // повторный клик с той же сессией не создаст дубликат на бэкенде
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    try {
      const result = await placesApi.upsertMine(payload, idempotencyKey);
      console.log("Заведение сохранено:", result);

      setSubmitState("success");
      // Очищаем форму
      setForm(EMPTY_FORM);
      setTagsInput("");
      // Обновляем список заведений на лендинге/в кэше
      refetch();

      // Возвращаем кнопку в обычное состояние через пару секунд
      setTimeout(() => setSubmitState("idle"), 2500);
    } catch (err) {
      console.error("Ошибка при сохранении заведения:", err);
      const msg =
        err instanceof ApiError
          ? `${err.message} (HTTP ${err.status})`
          : "Не удалось связаться с сервером";
      setErrorMsg(msg);
      setSubmitState("error");
    }
  };

  // ── Форма оффера ──────────────────────────────────────────────
  const [offerTitle, setOfferTitle] = useState("");
  const [offerBonus, setOfferBonus] = useState("");
  const [offerDiscount, setOfferDiscount] = useState("0");
  const [offerState, setOfferState] = useState<SubmitState>("idle");
  const [offerError, setOfferError] = useState<string | null>(null);

  // У текущего вендора уже может быть заведение — берём первое из списка
  // (бэкенд гарантирует максимум одно заведение на вендора)
  const myPlace = places[0];

  const handleOfferSubmit = async () => {
    if (!myPlace) {
      setOfferError(
        "Сначала добавьте заведение на вкладке «Добавить»"
      );
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
      console.error("Ошибка при сохранении оффера:", err);
      const msg =
        err instanceof ApiError
          ? `${err.message} (HTTP ${err.status})`
          : "Не удалось связаться с сервером";
      setOfferError(msg);
      setOfferState("error");
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg, fontFamily: "var(--font-sans)" }}>
      <div style={{ padding: "18px 16px 0" }}>
        <GateLabel>{t.vendorTitle}</GateLabel>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 19,
            color: T.text,
            margin: "2px 0 16px",
          }}
        >
          {myPlace ? myPlace.name : t.addPlaceTitle}
        </h2>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px 16px" }}>
        {(
          [
            ["add", myPlace ? t.editor : t.addPlace],
            ["offer", t.offers],
          ] as const
        ).map(([id, label]) => (
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

      {/* ── ДОБАВИТЬ / РЕДАКТИРОВАТЬ ЗАВЕДЕНИЕ ───────────────── */}
      {activeTab === "add" && (
        <div style={{ padding: "0 16px 32px" }}>
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border2}`,
              borderRadius: "var(--border-radius-lg)",
              padding: 16,
            }}
          >
            <Field
              label={t.fieldName}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Surf Coffee"
            />

            {/* Категория */}
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.muted,
                  marginBottom: 6,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono)",
                }}
              >
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

            <Field
              label={t.fieldAddr}
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="пр. Кабанбай батыра, 11"
            />
            <Field
              label={t.fieldDist}
              value={form.district}
              onChange={(e) => updateField("district", e.target.value)}
              placeholder="Есіл"
            />
            <Field
              label={t.fieldDesc}
              value={form.ambient_description}
              onChange={(e) => updateField("ambient_description", e.target.value)}
              placeholder="Тихая кофейня с розетками, specialty кофе..."
              multiline
            />
            <Field
              label={t.tagsLabel}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="wifi, розетки, тихо, кофе"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field
                label={t.fieldLat}
                value={form.lat?.toString() ?? ""}
                onChange={(e) =>
                  updateField("lat", e.target.value ? Number(e.target.value) : null)
                }
                placeholder="51.1282"
                type="number"
              />
              <Field
                label={t.fieldLng}
                value={form.lng?.toString() ?? ""}
                onChange={(e) =>
                  updateField("lng", e.target.value ? Number(e.target.value) : null)
                }
                placeholder="71.4314"
                type="number"
              />
            </div>

            <Field
              label={t.fieldGis}
              value={form.two_gis_url ?? ""}
              onChange={(e) => updateField("two_gis_url", e.target.value)}
              placeholder="https://2gis.kz/astana/..."
            />
            <Field
              label={t.fieldCheck}
              value={form.avg_check_kzt?.toString() ?? ""}
              onChange={(e) =>
                updateField(
                  "avg_check_kzt",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              placeholder="2500"
              type="number"
            />

            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.muted, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.has_wifi}
                  onChange={(e) => updateField("has_wifi", e.target.checked)}
                />
                {t.fieldWifi}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.muted, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.has_outlets}
                  onChange={(e) => updateField("has_outlets", e.target.checked)}
                />
                {t.fieldOutlets}
              </label>
            </div>

            {submitState === "error" && errorMsg && (
              <div
                style={{
                  color: T.red,
                  background: T.redSoft,
                  border: `1px solid ${T.red}33`,
                  borderRadius: "var(--border-radius-md)",
                  padding: "10px 12px",
                  fontSize: 12,
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                {errorMsg}
              </div>
            )}

            <Btn
              onClick={handleSubmit}
              disabled={!canSubmit}
              full
              color={submitState === "success" ? T.green : T.red}
            >
              {submitState === "submitting"
                ? t.submitting
                : submitState === "success"
                  ? t.added
                  : t.submit}
            </Btn>
          </div>
        </div>
      )}

      {/* ── ОФФЕР ─────────────────────────────────────────────── */}
      {activeTab === "offer" && (
        <div style={{ padding: "0 16px 32px" }}>
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border2}`,
              borderRadius: "var(--border-radius-lg)",
              padding: 16,
            }}
          >
            <Field
              label={t.offerTitle}
              value={offerTitle}
              onChange={(e) => setOfferTitle(e.target.value)}
              placeholder="Капучино за 700 ₸"
            />
            <Field
              label={t.bonusText}
              value={offerBonus}
              onChange={(e) => setOfferBonus(e.target.value)}
              placeholder="Покажи экран — капучино в подарок"
            />
            <Field
              label={t.discountPct}
              value={offerDiscount}
              onChange={(e) => setOfferDiscount(e.target.value)}
              type="number"
            />

            {offerState === "error" && offerError && (
              <div
                style={{
                  color: T.red,
                  background: T.redSoft,
                  border: `1px solid ${T.red}33`,
                  borderRadius: "var(--border-radius-md)",
                  padding: "10px 12px",
                  fontSize: 12,
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                {offerError}
              </div>
            )}

            <Btn
              onClick={handleOfferSubmit}
              disabled={
                !offerTitle.trim() || !offerBonus.trim() || offerState === "submitting"
              }
              full
              color={offerState === "success" ? T.green : T.red}
            >
              {offerState === "submitting"
                ? "..."
                : offerState === "success"
                  ? t.activated
                  : t.activate}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
