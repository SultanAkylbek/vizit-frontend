import React, { useState, useRef, useEffect, useCallback } from "react";

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

// ── API ──────────────────────────────────────────────────────
async function apiSearch(query, lang, sessionId) {
  const API_BASE = "https://vizit-backend-vdt2.onrender.com"; 
  try {
    const res = await fetch(`${API_BASE}/api/v1/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, lang, session_id: sessionId || null })
    });
    const data = await res.json();
    return { no_match: !data.matched, rec: data.rec, place: data.place || null };
  } catch (error) {
    console.error("Ошибка:", error);
    return { no_match: true, rec: lang === "ru" ? "Ошибка сервера" : "Server error" };
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
const loadC  = l => ({free:T.green,moderate:T.amber,busy:T.red}[l]||T.hint);
const loadL  = (l,t) => ({free:t.search,moderate:"~",busy:"!"}[l]||"");

// ── UI COMPONENTS ────────────────────────────────────────────
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

// ── MODAL ───────────────────────────────────────────────────
function CheckInModal({place, t, onClose}){
  const [st, setSt] = useState("idle");
  const [res, setRes] = useState(null);
  const detect = useCallback(()=>{
    if(!place.lat || !place.lng){ setSt("nocoords"); return; }
    setSt("detecting");
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const R=6371000, f1=pos.coords.latitude*Math.PI/180, f2=place.lat*Math.PI/180;
        const df=(place.lat-pos.coords.latitude)*Math.PI/180, dl=(place.lng-pos.coords.longitude)*Math.PI/180;
        const a=Math.sin(df/2)**2+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2;
        const dist=Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
        setRes({dist, code:Math.random().toString(36).slice(2,6).toUpperCase()});
        setSt(dist<=100?"success":"fail");
      },
      ()=>{ setRes({dist:50, code:"DEMO"}); setSt("success"); },
      {timeout:8000}
    );
  },[place]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:20}}>
      <div style={{background:T.surface,borderRadius:"var(--border-radius-lg)",maxWidth:340,width:"100%",padding:24,textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:8}}>{place.emoji||"📍"}</div>
        <div style={{fontWeight:500,fontSize:17}}>{t.checkinTitle}</div>
        <div style={{fontSize:13,color:T.hint,marginBottom:16}}>{place.name}</div>
        {st==="idle"&&<><Btn onClick={detect} full>{t.checkinBtn}</Btn><Btn onClick={onClose} outline full style={{marginTop:8}}>{t.cancel}</Btn></>}
        {st==="detecting"&&<div style={{padding:20}}>{t.detecting}</div>}
        {st==="success"&&<>
          <div style={{fontSize:16,color:T.green,marginBottom:10}}>{t.checkinSuccess}</div>
          <div style={{background:T.card,padding:14,borderRadius:8,fontSize:24,fontWeight:700}}>{res?.code}</div>
          <Btn onClick={onClose} full style={{marginTop:14}}>{t.done}</Btn>
        </>}
        {st==="fail"&&<><div style={{color:T.red,marginBottom:10}}>{t.checkinFail}</div><Btn onClick={onClose} full>{t.close}</Btn></>}
      </div>
    </div>
  );
}

// ── PLACE CARD ───────────────────────────────────────────────
function PlaceCard({place, t, onCheckin}){
  return (
    <div style={{background:T.surface,border:`0.5px solid ${T.border2}`,borderRadius:"var(--border-radius-lg)",padding:14,marginTop:10}}>
      <div style={{display:"flex",gap:10,marginBottom:8}}>
        <span style={{fontSize:20}}>{place.emoji||"📍"}</span>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontWeight:500,fontSize:14}}>{place.name}</span>
            <Badge c={tierC(place.tier)} label={place.tier}/>
          </div>
          <div style={{fontSize:11,color:T.hint}}>{place.category} · {place.district}</div>
        </div>
      </div>
      <div style={{fontSize:12,color:T.hint,marginBottom:10}}>📍 {place.address}</div>
      <div style={{display:"flex",gap:8}}>
        {place.two_gis_url&&<a href={place.two_gis_url} target="_blank" rel="noreferrer" style={{flex:1,textAlign:"center",background:T.blue,color:"#fff",padding:9,borderRadius:8,textDecoration:"none",fontSize:13}}>{t.route}</a>}
        <button onClick={()=>onCheckin(place)} style={{flex:1,background:"none",color:T.green,border:`1px solid ${T.green}`,borderRadius:8,fontSize:13}}>{t.iAmHere}</button>
      </div>
    </div>
  );
}

// ── PAGES ────────────────────────────────────────────────────
function AuthPage({onAuth,onGuest,t}){
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const submit=()=>{ onAuth({id:"u1", role:"USER", email}); };
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.surface,borderRadius:16,width:"100%",maxWidth:380,padding:28,border:`1px solid ${T.border2}`}}>
        <div style={{textAlign:"center",marginBottom:24}}><div style={{background:T.blue,width:40,height:40,borderRadius:8,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700}}>V</div></div>
        <Field value={email} onChange={e=>setEmail(e.target.value)} placeholder={t.email}/>
        <Field value={pass} onChange={e=>setPass(e.target.value)} placeholder={t.password} type="password"/>
        <Btn onClick={submit} full>{mode==="login"?t.login:t.register}</Btn>
        <button onClick={onGuest} style={{width:"100%",background:"none",border:"none",marginTop:14,color:T.muted,cursor:"pointer"}}>{t.guest}</button>
      </div>
    </div>
  );
}

function ChatPage({lang,t,onCheckin}){
  const [msgs,setMsgs]=useState([{role:"ai",text:t.chatGreet}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const send=async(q)=>{
    const query=(q||input).trim(); if(!query) return;
    setInput(""); setLoading(true);
    setMsgs(m=>[...m,{role:"user",text:query}]);
    const r=await apiSearch(query,lang);
    setMsgs(m=>[...m,{role:"ai",text:r.rec,place:r.place}]);
    setLoading(false);
  };
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"85%",background:m.role==="user"?T.blue:T.surface,color:m.role==="user"?"#fff":T.text,padding:12,borderRadius:12,border:m.role==="ai"?`1px solid ${T.border2}`:"none"}}>
            {m.text}{m.place&&<PlaceCard place={m.place} t={t} onCheckin={onCheckin}/>}
          </div>
        ))}
        <div ref={ref}/>
      </div>
      <div style={{padding:12,borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} style={{flex:1,padding:10,borderRadius:8,border:`1px solid ${T.border2}`}} placeholder={t.chatPlaceholder}/>
        <button onClick={()=>send()} style={{background:T.blue,color:"#fff",padding:"10px 16px",borderRadius:8,border:"none"}}>→</button>
      </div>
    </div>
  );
}

function VendorDashboard({user,t}){
  const [activeTab,setActiveTab]=useState("analytics");
  const [addState,setAddState]=useState("idle");
  const [newPlace,setNewPlace]=useState({name:"",address:"",lat:"",lng:""});
  const handleAdd=()=>{ setAddState("submitting"); setTimeout(()=>setAddState("added"),1000); };
  
  return (
    <div style={{padding:16,background:T.bg,minHeight:"100%"}}>
      <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto"}}>
        {[["analytics",t.analytics],["editor",t.editor],["offers",t.offers],["add",t.addPlace]].map(([id,l])=>(
          <button key={id} onClick={() => setActiveTab(id)} style={{background:activeTab===id?T.blue:T.surface,color:activeTab===id?"#fff":T.muted,padding:"8px 14px",borderRadius:8,border:"none",whiteSpace:"nowrap"}}>{l}</button>
        ))}
      </div>
      {activeTab==="analytics"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{background:T.surface,padding:16,borderRadius:12}}><div style={{fontSize:11}}>{t.aiShown}</div><div style={{fontSize:24}}>0</div></div><div style={{background:T.surface,padding:16,borderRadius:12}}><div style={{fontSize:11}}>{t.checkins}</div><div style={{fontSize:24}}>0</div></div></div>}
      {activeTab==="add"&&<div style={{background:T.surface,padding:16,borderRadius:12}}>
          <Field label={t.fieldName} value={newPlace.name} onChange={e=>setNewPlace({...newPlace,name:e.target.value})}/>
          <Field label={t.fieldAddr} value={newPlace.address} onChange={e=>setNewPlace({...newPlace,address:e.target.value})}/>
          <Btn onClick={handleAdd} full>{addState==="added"?t.added:t.submit}</Btn>
      </div>}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("ru");
  const [user, setUser] = useState(loadSession());
  const [view, setView] = useState(user ? (user.role==="VENDOR"?"vendor":"chat") : "auth");
  const [activePlace, setActivePlace] = useState(null);
  const t = I18N[lang];

  return (
    <div style={{maxWidth:500,margin:"0 auto",height:"100vh",background:T.bg,fontFamily:"sans-serif"}}>
      {view === "auth" ? <AuthPage onAuth={(u)=>{saveSession(u); setUser(u); setView("chat")}} onGuest={()=>setView("chat")} t={t}/> : (
        <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
          <div style={{padding:12,background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,color:T.blue}}>VIZIT AI</span>
            <div style={{display:"flex",gap:10}}>
              {["ru","kz","en"].map(l=><button key={l} onClick={()=>setLang(l)} style={{background:"none",border:"none",fontWeight:lang===l?700:400,fontSize:12}}>{l.toUpperCase()}</button>)}
            </div>
          </div>
          <div style={{flex:1,overflow:"hidden"}}>
            {view==="chat" ? <ChatPage lang={lang} t={t} onCheckin={setActivePlace}/> : <VendorDashboard user={user} t={t}/>}
          </div>
          <div style={{padding:10,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-around"}}>
             <button onClick={()=>setView("chat")} style={{background:"none",border:"none",color:view==="chat"?T.blue:T.muted}}>💬 {t.search}</button>
             <button onClick={()=>setView("vendor")} style={{background:"none",border:"none",color:view==="vendor"?T.blue:T.muted}}>🏢 {t.cabinet}</button>
          </div>
        </div>
      )}
      {activePlace && <CheckInModal place={activePlace} t={t} onClose={()=>setActivePlace(null)}/>}
    </div>
  );
}
