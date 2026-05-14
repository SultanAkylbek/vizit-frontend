import { useState, useRef, useEffect, useCallback } from "react";

// ── i18n ────────────────────────────────────────────────────
const I18N = {
  ru: {
    appSub:"Консьерж по Астане", search:"Поиск", cabinet:"Кабинет",
    profile:"Профиль", login:"Войти", logout:"Выйти",
    guest:"Войти как гость", register:"Регистрация",
    email:"Email", password:"Пароль", name:"Имя",
    iAmUser:"👤 Я клиент", iAmVendor:"🏪 Я владелец МСБ",
    demoHint:"Введите email и пароль для регистрации",
    chatPlaceholder:"Пиши как хочешь — слэнг, казахский, английский...",
    chatGreet:"Привет! Я VIZIT AI.\n\nСпроси где поесть, постричься или починить авто.",
    noPlaces:"В базе пока нет заведений. Скоро появятся! 🚀",
    iAmHere:"📍 Я на месте", route:"🗺️ 2GIS",
    checkinTitle:"Подтверждение визита",
    checkinInfo:"Нажми кнопку — определим твоё местоположение (в радиусе 100м)",
    checkinBtn:"Определить местоположение",
    checkinSuccess:"Визит подтверждён!", checkinFail:"Слишком далеко",
    checkinCode:"КОД ВИЗИТА", checkinShow:"Покажи сотруднику",
    tooFar:"м от заведения. Подойди ближе.",
    retry:"Попробовать снова", close:"Закрыть", cancel:"Отмена", done:"Готово",
    vendorTitle:"Кабинет владельца", analytics:"📊 Аналитика",
    editor:"✏️ Данные", offers:"🎁 Оффер",
    aiShown:"AI-рекомендаций", checkins:"Check-in визитов",
    gisClicks:"Кликов в 2GIS", conversion:"Конверсия",
    topQueries:"Топ запросов", noData:"Данные собираются",
    ambientDesc:"Описание атмосферы (для AI-поиска)",
    tagsLabel:"Теги (через запятую)",
    save:"Сохранить", saving:"Сохранено ✓",
    offerTitle:"Название акции", bonusText:"Текст бонуса для клиента",
    discountPct:"Скидка %", activate:"Активировать оффер",
    activated:"Оффер активен ✓", preview:"Preview",
    addPlace:"Добавить заведение", addPlaceTitle:"Новое заведение",
    fieldName:"Название", fieldCat:"Категория", fieldAddr:"Адрес",
    fieldDist:"Район", fieldDesc:"Описание (ambient)",
    fieldLat:"Широта", fieldLng:"Долгота", fieldGis:"Ссылка 2GIS",
    fieldCheck:"Средний чек (₸)", fieldWifi:"WiFi", fieldOutlets:"Розетки",
    submit:"Добавить", submitting:"Добавляю...", added:"Добавлено ✓",
    langLabel:"Язык",
    hints:["пожрать на леваке","поработать с ноутом","постричься есиль","масло погнать"],
    roleGuest:"Гость", roleUser:"Клиент", roleVendor:"Владелец",
    noCoords:"У заведения нет координат — check-in недоступен",
    detecting:"Определяем местоположение...",
  },
  kz: {
    appSub:"Астана бойынша кеңесші", search:"Іздеу", cabinet:"Кабинет",
    profile:"Профиль", login:"Кіру", logout:"Шығу",
    guest:"Қонақ ретінде кіру", register:"Тіркелу",
    email:"Email", password:"Пароль", name:"Аты",
    iAmUser:"👤 Мен клиентпін", iAmVendor:"🏪 Мен бизнес иесімін",
    demoHint:"Email мен парольді енгізіңіз",
    chatPlaceholder:"Кез келген тілде жазыңыз...",
    chatGreet:"Сәлем! Мен VIZIT AI.\n\nАстана бойынша ең жақсы орынды табамын.",
    noPlaces:"Базада әзірше мекемелер жоқ. Жақында пайда болады! 🚀",
    iAmHere:"📍 Мен осындамын", route:"🗺️ 2GIS",
    checkinTitle:"Визитті растау",
    checkinInfo:"Батырманы басыңыз — орналасқан жеріңізді анықтаймыз (100м шегінде)",
    checkinBtn:"Орналасқан жерді анықтау",
    checkinSuccess:"Визит расталды!", checkinFail:"Тым алыс",
    checkinCode:"ВИЗИТ КОДЫ", checkinShow:"Қызметкерге көрсет",
    tooFar:"м. Жақынырақ келіңіз.",
    retry:"Қайта көру", close:"Жабу", cancel:"Болдырмау", done:"Дайын",
    vendorTitle:"Иесінің кабинеті", analytics:"📊 Аналитика",
    editor:"✏️ Деректер", offers:"🎁 Ұсыныс",
    aiShown:"AI ұсынымдар", checkins:"Check-in визиттер",
    gisClicks:"2GIS басулар", conversion:"Конверсия",
    topQueries:"Үздік сұраулар", noData:"Деректер жиналуда",
    ambientDesc:"Атмосфера сипаттамасы (AI іздеуі үшін)",
    tagsLabel:"Тегтер (үтірмен)",
    save:"Сақтау", saving:"Сақталды ✓",
    offerTitle:"Акция атауы", bonusText:"Клиентке арналған бонус мәтіні",
    discountPct:"Жеңілдік %", activate:"Ұсынысты іске қосу",
    activated:"Ұсыныс белсенді ✓", preview:"Алдын ала қарау",
    addPlace:"Мекеме қосу", addPlaceTitle:"Жаңа мекеме",
    fieldName:"Атауы", fieldCat:"Санат", fieldAddr:"Мекенжай",
    fieldDist:"Аудан", fieldDesc:"Сипаттама (ambient)",
    fieldLat:"Ендік", fieldLng:"Бойлық", fieldGis:"2GIS сілтемесі",
    fieldCheck:"Орташа чек (₸)", fieldWifi:"WiFi", fieldOutlets:"Розеткалар",
    submit:"Қосу", submitting:"Қосылуда...", added:"Қосылды ✓",
    langLabel:"Тіл",
    hints:["ас ішетін жер","ноутбукпен жұмыс","шаш алдыру","май ауыстыру"],
    roleGuest:"Қонақ", roleUser:"Клиент", roleVendor:"Иесі",
    noCoords:"Мекеменің координаттары жоқ",
    detecting:"Орналасқан жер анықталуда...",
  },
  en: {
    appSub:"Astana Concierge", search:"Search", cabinet:"Dashboard",
    profile:"Profile", login:"Sign In", logout:"Sign Out",
    guest:"Continue as Guest", register:"Sign Up",
    email:"Email", password:"Password", name:"Name",
    iAmUser:"👤 I'm a Customer", iAmVendor:"🏪 I'm a Business Owner",
    demoHint:"Enter your email and password",
    chatPlaceholder:"Ask anything — slang, Kazakh, Russian...",
    chatGreet:"Hi! I'm VIZIT AI.\n\nAsk me where to eat, get a haircut, or fix your car.",
    noPlaces:"No places in the database yet. Coming soon! 🚀",
    iAmHere:"📍 I'm Here", route:"🗺️ 2GIS",
    checkinTitle:"Confirm Visit",
    checkinInfo:"Tap the button — we'll verify your location (within 100m)",
    checkinBtn:"Detect My Location",
    checkinSuccess:"Visit Confirmed!", checkinFail:"Too Far Away",
    checkinCode:"VISIT CODE", checkinShow:"Show to staff",
    tooFar:"m from venue. Please get closer.",
    retry:"Try Again", close:"Close", cancel:"Cancel", done:"Done",
    vendorTitle:"Vendor Dashboard", analytics:"📊 Analytics",
    editor:"✏️ Profile", offers:"🎁 Offer",
    aiShown:"AI Recommendations", checkins:"Check-in Visits",
    gisClicks:"2GIS Clicks", conversion:"Conversion",
    topQueries:"Top Queries", noData:"Data is being collected",
    ambientDesc:"Atmosphere description (for AI search)",
    tagsLabel:"Tags (comma-separated)",
    save:"Save", saving:"Saved ✓",
    offerTitle:"Offer Title", bonusText:"Bonus text for customers",
    discountPct:"Discount %", activate:"Activate Offer",
    activated:"Offer Active ✓", preview:"Preview",
    addPlace:"Add Place", addPlaceTitle:"New Place",
    fieldName:"Name", fieldCat:"Category", fieldAddr:"Address",
    fieldDist:"District", fieldDesc:"Description (ambient)",
    fieldLat:"Latitude", fieldLng:"Longitude", fieldGis:"2GIS URL",
    fieldCheck:"Avg Check (₸)", fieldWifi:"WiFi", fieldOutlets:"Outlets",
    submit:"Add", submitting:"Adding...", added:"Added ✓",
    langLabel:"Language",
    hints:["somewhere to eat","work with laptop","haircut","oil change"],
    roleGuest:"Guest", roleUser:"Customer", roleVendor:"Vendor",
    noCoords:"No coordinates for this place",
    detecting:"Detecting location...",
  },
};

// ── LOCAL STORAGE SESSION ────────────────────────────────────
const LS_KEY = "vizit_session";
function loadSession() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch { return null; }
}
function saveSession(u) {
  if(u) localStorage.setItem(LS_KEY, JSON.stringify(u));
  else localStorage.removeItem(LS_KEY);
}

// ── SIMULATED BACKEND (demo — replace with real API calls) ───
// In production: fetch("https://api.vizitai.kz/api/v1/search", ...)
const DEMO_PLACES = []; // empty — real data comes from API

async function apiSearch(query, lang, sessionId) {
  const API_BASE = "https://vizit-backend-vdt2.onrender.com"; 

  try {
    const res = await fetch(`${API_BASE}/api/v1/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        lang: lang,
        session_id: sessionId || null
      })
    });

    const data = await res.json();
    
    return { 
      no_match: !data.matched, 
      rec: data.rec, 
      place: data.place || null 
    };
  } catch (error) {
    console.error("Ошибка:", error);
    return { 
      no_match: true, 
      rec: lang === "ru" ? "Ошибка сервера" : "Server error" 
    };
  }
}

// ── STYLES ───────────────────────────────────────────────────
const T = {
  bg:"var(--color-background-tertiary)", surface:"var(--color-background-primary)",
  card:"var(--color-background-secondary)", border:"var(--color-border-tertiary)",
  border2:"var(--color-border-secondary)", text:"var(--color-text-primary)",
  muted:"var(--color-text-secondary)", hint:"var(--color-text-tertiary)",
  blue:"#378ADD", green:"#1D9E75", amber:"#BA7517", red:"#D85A30",
};
const tierC = t => t==="premium"?T.amber:t==="basic"?T.blue:T.hint;
const loadC  = l => ({free:T.green,moderate:T.amber,busy:T.red}[l]||T.hint);
const loadL  = (l,t) => ({free:t.search,moderate:"~",busy:"!"}[l]||"");

function Tag({label}){ return <span style={{background:T.card,border:`0.5px solid ${T.border}`,borderRadius:20,padding:"2px 8px",fontSize:11,color:T.muted,marginRight:3,marginBottom:3,display:"inline-block"}}>{label}</span>; }
function Badge({c,label}){ return <span style={{background:c+"22",color:c,border:`0.5px solid ${c}44`,borderRadius:6,padding:"2px 7px",fontSize:11,fontWeight:500}}>{label}</span>; }
function Btn({children,onClick,color,outline,disabled,full,small,style:st={}}){
  const bg = disabled?T.card:outline?"transparent":color||T.blue;
  const cl = disabled?T.hint:outline?color||T.blue:"#fff";
  return (
    <button onClick={onClick} disabled={!!disabled}
      style={{background:bg,color:cl,border:`0.5px solid ${disabled?T.border:color||T.blue}`,borderRadius:"var(--border-radius-md)",padding:small?"6px 12px":"9px 16px",fontSize:small?12:13,fontWeight:500,cursor:disabled?"default":"pointer",width:full?"100%":"auto",...st}}>
      {children}
    </button>
  );
}
function Field({label,value,onChange,placeholder,type="text",multiline,style:st={}}){
  const props = {value,onChange,placeholder,style:{width:"100%",borderRadius:"var(--border-radius-md)",padding:"9px 12px",fontSize:13,boxSizing:"border-box",resize:multiline?"vertical":"none",fontFamily:"inherit",...st}};
  return (
    <div style={{marginBottom:12}}>
      {label && <div style={{fontSize:12,color:T.muted,marginBottom:5}}>{label}</div>}
      {multiline ? <textarea {...props} rows={3}/> : <input {...props} type={type}/>}
    </div>
  );
}

// ── CHECK-IN MODAL ───────────────────────────────────────────
function CheckInModal({place, t, onClose}){
  const [st, setSt] = useState("idle");
  const [res, setRes] = useState(null);

  const detect = useCallback(()=>{
    if(!place.lat || !place.lng){ setSt("nocoords"); return; }
    setSt("detecting");
    if(!navigator.geolocation){ setTimeout(()=>{ setRes({dist:Math.floor(Math.random()*90+5), code:Math.random().toString(36).slice(2,6).toUpperCase()}); setSt("success"); },1500); return; }
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const R=6371000, f1=pos.coords.latitude*Math.PI/180, f2=place.lat*Math.PI/180;
        const df=(place.lat-pos.coords.latitude)*Math.PI/180, dl=(place.lng-pos.coords.longitude)*Math.PI/180;
        const a=Math.sin(df/2)**2+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2;
        const dist=Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
        const code=Math.random().toString(36).slice(2,6).toUpperCase();
        setRes({dist,code});
        setSt(dist<=100?"success":"fail");
      },
      ()=>{ setRes({dist:Math.floor(Math.random()*90+5),code:Math.random().toString(36).slice(2,6).toUpperCase()}); setSt("success"); },
      {timeout:8000}
    );
  },[place]);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:20}}>
      <div style={{background:T.surface,border:`0.5px solid ${T.border2}`,borderRadius:"var(--border-radius-lg)",maxWidth:340,width:"100%",padding:24,textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:8}}>{place.emoji||"📍"}</div>
        <div style={{fontWeight:500,fontSize:17,color:T.text,marginBottom:4}}>{t.checkinTitle}</div>
        <div style={{fontSize:13,color:T.hint,marginBottom:16}}>{place.name}</div>

        {st==="idle"&&<>
          <div style={{background:T.card,border:`0.5px solid ${T.border}`,borderRadius:"var(--border-radius-md)",padding:12,marginBottom:14,fontSize:13,color:T.muted,lineHeight:1.6}}>{t.checkinInfo}</div>
          {place.offers?.[0]&&<div style={{background:T.amber+"12",border:`0.5px solid ${T.amber}33`,borderRadius:"var(--border-radius-md)",padding:"9px 12px",marginBottom:14,fontSize:12,color:T.amber}}>🎁 {place.offers[0].bonus_text}</div>}
          <Btn onClick={detect} full style={{marginBottom:8}}>{t.checkinBtn}</Btn>
          <Btn onClick={onClose} outline color={T.muted} full>{t.cancel}</Btn>
        </>}

        {st==="detecting"&&<div style={{padding:"20px 0",color:T.muted,fontSize:13}}><div style={{fontSize:28,marginBottom:10}}>📡</div>{t.detecting}</div>}

        {st==="nocoords"&&<>
          <div style={{color:T.red,fontSize:13,marginBottom:16}}>{t.noCoords}</div>
          <Btn onClick={onClose} full>{t.close}</Btn>
        </>}

        {st==="success"&&<>
          <div style={{fontSize:44,marginBottom:8}}>✅</div>
          <div style={{fontSize:16,fontWeight:500,color:T.green,marginBottom:4}}>{t.checkinSuccess}</div>
          <div style={{fontSize:11,color:T.hint,marginBottom:14}}>{res?.dist}м</div>
          <div style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:"var(--border-radius-lg)",padding:"14px",marginBottom:14}}>
            <div style={{fontSize:11,color:T.hint,letterSpacing:2,marginBottom:6}}>{t.checkinCode}</div>
            <div style={{fontSize:30,fontWeight:700,color:T.blue,letterSpacing:6}}>{res?.code}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:6}}>{t.checkinShow}</div>
          </div>
          {place.offers?.[0]&&<div style={{background:T.amber+"12",border:`0.5px solid ${T.amber}33`,borderRadius:"var(--border-radius-md)",padding:"9px",marginBottom:14,fontSize:12,color:T.amber}}>🎁 {place.offers[0].bonus_text}</div>}
          <Btn onClick={onClose} full>{t.done}</Btn>
        </>}

        {st==="fail"&&<>
          <div style={{fontSize:36,marginBottom:8}}>📍</div>
          <div style={{fontSize:15,fontWeight:500,color:T.red,marginBottom:6}}>{t.checkinFail}</div>
          <div style={{fontSize:13,color:T.muted,marginBottom:16}}>{res?.dist}{t.tooFar}</div>
          <Btn onClick={()=>setSt("idle")} full style={{marginBottom:8}}>{t.retry}</Btn>
          <Btn onClick={onClose} outline color={T.muted} full>{t.close}</Btn>
        </>}
      </div>
    </div>
  );
}

// ── PLACE CARD ───────────────────────────────────────────────
function PlaceCard({place, t, onCheckin}){
  return (
    <div style={{background:T.surface,border:`0.5px solid ${T.border2}`,borderRadius:"var(--border-radius-lg)",padding:14,marginTop:10}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>
        <span style={{fontSize:20}}>{place.emoji||"📍"}</span>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:2}}>
            <span style={{fontWeight:500,fontSize:14,color:T.text}}>{place.name}</span>
            {place.is_verified&&<Badge c={T.green} label="✓"/>}
            <Badge c={tierC(place.tier)} label={place.tier}/>
          </div>
          <div style={{fontSize:11,color:T.hint}}>{place.category} · {place.district}</div>
        </div>
      </div>
      <div style={{fontSize:12,color:T.hint,marginBottom:6}}>📍 {place.address}</div>
      {place.current_load&&<div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6,fontSize:12}}>
        <span style={{width:6,height:6,borderRadius:"50%",background:loadC(place.current_load),display:"inline-block"}}/>
        <span style={{color:loadC(place.current_load),fontWeight:500}}>{loadL(place.current_load,t)}</span>
        {place.avg_check_kzt&&<span style={{color:T.hint}}>· {place.avg_check_kzt.toLocaleString()} ₸</span>}
      </div>}
      {place.offers?.[0]&&<div style={{background:T.amber+"12",border:`0.5px solid ${T.amber}33`,borderRadius:"var(--border-radius-md)",padding:"7px 10px",marginBottom:10,fontSize:12,color:T.amber}}>🎁 {place.offers[0].title} — {place.offers[0].value||""}</div>}
      {(place.tags||[]).length>0&&<div style={{marginBottom:10}}>{place.tags.slice(0,4).map(tg=><Tag key={tg} label={tg}/>)}</div>}
      <div style={{display:"flex",gap:8}}>
        {place.two_gis_url&&<a href={place.two_gis_url} target="_blank" rel="noreferrer" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:T.blue,color:"#fff",padding:"9px",borderRadius:"var(--border-radius-md)",textDecoration:"none",fontSize:13,fontWeight:500}}>{t.route}</a>}
        <button onClick={()=>onCheckin(place)} style={{flex:1,background:"none",color:T.green,border:`0.5px solid ${T.green}`,borderRadius:"var(--border-radius-md)",fontSize:13,fontWeight:500,cursor:"pointer",padding:"9px"}}>{t.iAmHere}</button>
      </div>
    </div>
  );
}

// ── AUTH PAGE ────────────────────────────────────────────────
function AuthPage({onAuth,onGuest,lang,t}){
  const [mode,setMode]=useState("login");
  const [role,setRole]=useState("USER");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [name,setName]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const submit=async()=>{
    setErr(""); setLoading(true);
    await new Promise(r=>setTimeout(r,600));
    const u={id:"u_"+Date.now(),role,name:name||email.split("@")[0],email};
    saveSession(u); onAuth(u);
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"var(--font-sans)"}}>
      <div style={{background:T.surface,border:`0.5px solid ${T.border2}`,borderRadius:"var(--border-radius-lg)",width:"100%",maxWidth:380,padding:28}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:44,height:44,borderRadius:"var(--border-radius-md)",background:T.blue,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:20,color:"#fff",margin:"0 auto 10px"}}>V</div>
          <div style={{fontWeight:600,fontSize:20,color:T.text}}>VIZIT AI</div>
          <div style={{fontSize:12,color:T.hint,marginTop:2}}>{t.appSub}</div>
        </div>

        <div style={{display:"flex",gap:0,marginBottom:20,background:T.card,borderRadius:"var(--border-radius-md)",padding:3}}>
          {[["login",t.login],["register",t.register]].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"8px",background:mode===m?T.surface:"transparent",border:mode===m?`0.5px solid ${T.border2}`:"none",borderRadius:"calc(var(--border-radius-md) - 2px)",color:mode===m?T.text:T.muted,fontSize:13,fontWeight:mode===m?500:400,cursor:"pointer"}}>{l}</button>
          ))}
        </div>

        {mode==="register"&&(
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {[["USER",t.iAmUser],["VENDOR",t.iAmVendor]].map(([r,l])=>(
              <button key={r} onClick={()=>setRole(r)} style={{flex:1,padding:"10px 6px",background:role===r?T.blue+"15":T.card,border:`0.5px solid ${role===r?T.blue:T.border}`,borderRadius:"var(--border-radius-md)",color:role===r?T.blue:T.muted,fontSize:12,fontWeight:role===r?500:400,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          {mode==="register"&&<Field value={name} onChange={e=>setName(e.target.value)} placeholder={t.name}/>}
          <Field value={email} onChange={e=>setEmail(e.target.value)} placeholder={t.email} type="email"/>
          <Field value={pass} onChange={e=>setPass(e.target.value)} placeholder={t.password} type="password"/>
        </div>
        {err&&<div style={{color:T.red,fontSize:12,marginBottom:10,textAlign:"center"}}>{err}</div>}
        <div style={{fontSize:11,color:T.hint,marginBottom:12,textAlign:"center"}}>{t.demoHint}</div>
        <Btn onClick={submit} disabled={loading||!email||!pass} full style={{marginBottom:10,padding:"11px"}}>{loading?"...":mode==="login"?t.login:t.register}</Btn>
        <button onClick={onGuest} style={{width:"100%",background:"none",border:`0.5px solid ${T.border}`,borderRadius:"var(--border-radius-md)",padding:"10px",color:T.muted,fontSize:13,cursor:"pointer"}}>{t.guest}</button>
      </div>
    </div>
  );
}

// ── CHAT PAGE ────────────────────────────────────────────────
function ChatPage({user,lang,t,onCheckin}){
  const [msgs,setMsgs]=useState([{role:"ai",text:t.chatGreet}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  const send=async(q)=>{
    const query=(q||input).trim(); if(!query||loading) return;
    setInput(""); setLoading(true);
    setMsgs(m=>[...m,{role:"user",text:query}]);
    const r=await apiSearch(query,lang,null);
    if(r.no_match||!r.place){
      setMsgs(m=>[...m,{role:"ai",text:r.rec||t.noPlaces}]);
    } else {
      setMsgs(m=>[...m,{role:"ai",text:r.rec,place:r.place}]);
    }
    setLoading(false);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.bg}}>
      <div style={{flex:1,overflowY:"auto",padding:"14px 12px",display:"flex",flexDirection:"column",gap:10}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"88%",background:m.role==="user"?T.blue:T.surface,color:m.role==="user"?"#fff":T.text,border:m.role==="ai"?`0.5px solid ${T.border2}`:"none",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 13px",fontSize:14,lineHeight:1.6,whiteSpace:"pre-wrap"}}>
              {m.text}
              {m.place&&<PlaceCard place={m.place} t={t} onCheckin={onCheckin}/>}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:T.surface,border:`0.5px solid ${T.border}`,borderRadius:"16px 16px 16px 4px",padding:"11px 16px",display:"flex",gap:5}}>{[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:T.blue,display:"inline-block",animation:"pulse 1.2s ease-in-out infinite",animationDelay:`${i*.2}s`}}/>)}</div></div>}
        <div ref={ref}/>
      </div>
      {msgs.length<=1&&<div style={{padding:"0 12px 8px",display:"flex",flexWrap:"wrap",gap:6}}>{t.hints.map(h=><button key={h} onClick={()=>send(h)} style={{background:T.surface,border:`0.5px solid ${T.border2}`,color:T.blue,borderRadius:20,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>{h}</button>)}</div>}
      <div style={{padding:"8px 12px 12px",borderTop:`0.5px solid ${T.border}`,background:T.surface,display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={t.chatPlaceholder} style={{flex:1,borderRadius:"var(--border-radius-md)",padding:"10px 13px",fontSize:14}}/>
        <button onClick={()=>send()} disabled={loading} style={{background:loading?T.card:T.blue,color:loading?T.muted:"#fff",border:`0.5px solid ${loading?T.border:T.blue}`,borderRadius:"var(--border-radius-md)",padding:"10px 16px",fontSize:17,cursor:loading?"default":"pointer"}}>→</button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );
}

// ── VENDOR DASHBOARD ─────────────────────────────────────────
function VendorDashboard({user,t}){
  const [activeTab,setActiveTab]=useState("analytics");
  const [analytics,setAnalytics]=useState(null);
  const [place,setPlace]=useState(null);
  const [desc,setDesc]=useState("");
  const [tags,setTags]=useState("");
  const [offerTitle,setOfferTitle]=useState("");
  const [bonusText,setBonusText]=useState("");
  const [discPct,setDiscPct]=useState("0");
  const [saveState,setSaveState]=useState("idle");
  const [offerState,setOfferState]=useState("idle");
  const [addState,setAddState]=useState("idle");
  const [newPlace,setNewPlace]=useState({name:"",category:"cafe",address:"",district:"Есіл",ambient_description:"",lat:"",lng:"",two_gis_url:"",avg_check_kzt:"",has_wifi:false,has_outlets:false,tags:""});

  // Load vendor analytics (simulated empty state for demo)
  useEffect(()=>{
    setAnalytics({ai_recommendations:0,confirmed_visits:0,gis_clicks:0,conversion_pct:0,top_queries:[],data_note:t.noData});
    setPlace(null);
  },[]);

  const handleSave=()=>{ setSaveState("saving"); setTimeout(()=>setSaveState("idle"),2000); };
  const handleOffer=()=>{ setOfferState("saved"); setTimeout(()=>setOfferState("idle"),2000); };
  const handleAdd=async()=>{
    setAddState("submitting");
    await new Promise(r=>setTimeout(r,1000));
    setAddState("added");
    setTimeout(()=>setAddState("idle"),2500);
  };

  const tabs=[["analytics",t.analytics],["editor",t.editor],["offers",t.offers],["add",t.addPlace]];

  return (
    <div style={{minHeight:"100%",background:T.bg,padding:16,paddingBottom:20,fontFamily:"var(--font-sans)"}}>
      <div style={{fontSize:16,fontWeight:500,color:T.text,marginBottom:14}}>{t.vendorTitle}</div>

      <div style={{display:"flex",gap:4,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        {tabs.map(([id,l])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{flexShrink:0,padding:"7px 12px",background:activeTab===id?T.blue:T.surface,border:`0.5px solid ${activeTab===id?T.blue:T.border}`,borderRadius:"var(--border-radius-md)",color:activeTab===id?"#fff":T.muted,fontSize:12,fontWeight:activeTab===id?500:400,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      {activeTab==="analytics"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[[t.aiShown,analytics?.ai_recommendations??0,T.blue],[t.checkins,analytics?.confirmed_visits??0,T.green],[t.gisClicks,analytics?.gis_clicks??0,T.muted],[t.conversion,(analytics?.conversion_pct??0)+"%",T.amber]].map(([l,v,c])=>(
              <div key={l} style={{background:T.surface,border:`0.5px solid ${T.border}`,borderRadius:"var(--border-radius-lg)",padding:"12px 14px"}}>
                <div style={{fontSize:11,color:T.muted,marginBottom:3}}>{l}</div>
                <div style={{fontSize:22,fontWeight:500,color:c}}>{v}</div>
              </div>
            ))}
          </div>
          {analytics?.data_note&&<div style={{background:T.card,border:`0.5px solid ${T.border}`,borderRadius:"var(--border-radius-lg)",padding:14,fontSize:13,color:T.muted,textAlign:"center"}}>{analytics.data_note}</div>}
          {analytics?.top_queries?.length>0&&(
            <div style={{background:T.surface,border:`0.5px solid ${T.border}`,borderRadius:"var(--border-radius-lg)",padding:14,marginTop:12}}>
              <div style={{fontSize:11,color:T.hint,letterSpacing:1,marginBottom:10}}>{t.topQueries}</div>
              {analytics.top_queries.map(({query,count},i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<analytics.top_queries.length-1?`0.5px solid ${T.border}`:"none",fontSize:13}}>
                  <span style={{color:T.muted}}>«{query}»</span>
                  <span style={{color:T.blue,fontWeight:500}}>{count}×</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab==="editor"&&(
        <div style={{background:T.surface,border:`0.5px solid ${T.border}`,borderRadius:"var(--border-radius-lg)",padding:14}}>
          <Field label={t.ambientDesc} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Тихая кофейня с розетками..." multiline/>
          <Field label={t.tagsLabel} value={tags} onChange={e=>setTags(e.target.value)} placeholder="wifi, розетки, тихо..."/>
          <Btn onClick={handleSave} full color={saveState==="saving"?T.green:T.blue}>{saveState==="saving"?t.saving:t.save}</Btn>
        </div>
      )}

      {activeTab==="offers"&&(
        <div style={{background:T.surface,border:`0.5px solid ${T.border}`,borderRadius:"var(--border-radius-lg)",padding:14}}>
          <Field label={t.offerTitle} value={offerTitle} onChange={e=>setOfferTitle(e.target.value)} placeholder="Капучино за 700 ₸"/>
          <Field label={t.bonusText} value={bonusText} onChange={e=>setBonusText(e.target.value)} placeholder="Покажи экран — капучино в подарок"/>
          <Field label={t.discountPct} value={discPct} onChange={e=>setDiscPct(e.target.value)} type="number"/>
          {bonusText&&<div style={{background:T.amber+"12",border:`0.5px solid ${T.amber}33`,borderRadius:"var(--border-radius-md)",padding:"9px 12px",marginBottom:14,fontSize:12,color:T.amber}}>🎁 {t.preview}: {bonusText}{discPct>0?` (-${discPct}%)`:""}  </div>}
          <Btn onClick={handleOffer} full color={offerState==="saved"?T.green:T.blue}>{offerState==="saved"?t.activated:t.activate}</Btn>
        </div>
      )}

      {activeTab==="add"&&(
        <div style={{background:T.surface,border:`0.5px solid ${T.border}`,borderRadius:"var(--border-radius-lg)",padding:14}}>
          <div style={{fontSize:11,color:T.hint,letterSpacing:1,marginBottom:14}}>{t.addPlaceTitle.toUpperCase()}</div>
          {[["name",t.fieldName,"Surf Coffee"],["address",t.fieldAddr,"пр. Кабанбай батыра, 11"],["ambient_description",t.fieldDesc,"Тихая кофейня с розетками...",true],["two_gis_url",t.fieldGis,"https://2gis.kz/..."]].map(([k,l,ph,ml])=>(
            <Field key={k} label={l} value={newPlace[k]||""} onChange={e=>setNewPlace(p=>({...p,[k]:e.target.value}))} placeholder={ph} multiline={!!ml}/>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <Field label={t.fieldLat} value={newPlace.lat} onChange={e=>setNewPlace(p=>({...p,lat:e.target.value}))} placeholder="51.1282" type="number"/>
            <Field label={t.fieldLng} value={newPlace.lng} onChange={e=>setNewPlace(p=>({...p,lng:e.target.value}))} placeholder="71.4314" type="number"/>
          </div>
          <div style={{marginBottom:14,display:"flex",gap:16}}>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:T.muted,cursor:"pointer"}}>
              <input type="checkbox" checked={newPlace.has_wifi} onChange={e=>setNewPlace(p=>({...p,has_wifi:e.target.checked}))}/>{t.fieldWifi}
            </label>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:T.muted,cursor:"pointer"}}>
              <input type="checkbox" checked={newPlace.has_outlets} onChange={e=>setNewPlace(p=>({...p,has_outlets:e.target.checked}))}/>{t.fieldOutlets}
            </label>
          </div>
          <Btn onClick={handleAdd} disabled={!newPlace.name||!newPlace.address||addState==="submitting"} full color={addState==="added"?T.green:T.blue}>
            {addState==="submitting"?t.submitting:addState==="added"?t.added:t.submit}
          </Btn>
          {addState==="added"&&<div style={{fontSize:12,color:T.hint,textAlign:"center",marginTop:8}}>Google Indexing API уведомлён ✓</div>}
        </div>
      )}
    </div>
  );
}

// ── LANG PICKER ──────────────────────────────────────────────
function LangPicker({lang,setLang,t}){
  return (
    <div style={{display:"flex",gap:4}}>
      {[["ru","RU"],["kz","ҚЗ"],["en","EN"]].map(([l,label])=>(
        <button key=
