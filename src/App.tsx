// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from "react";

// ── СЛОВАРЬ (i18n) ──────────────────────────────────────────
const I18N = {
  ru: {
    appSub:"Консьерж по Астане", search:"Поиск", cabinet:"Кабинет",
    login:"Войти", guest:"Войти как гость", email:"Email", password:"Пароль",
    iAmUser:"👤 Я клиент", iAmVendor:"🏪 Я владелец МСБ",
    chatPlaceholder:"Пиши как хочешь...",
    chatGreet:"Привет! Я VIZIT AI. Спроси где поесть или поработать.",
    iAmHere:"📍 Я на месте", route:"🗺️ 2GIS",
    checkinTitle:"Подтверждение визита", checkinBtn:"Определить местоположение",
    checkinSuccess:"Визит подтверждён!", done:"Готово", cancel:"Отмена",
    vendorTitle:"Кабинет владельца", analytics:"📊 Аналитика",
    editor:"✏️ Данные", offers:"🎁 Оффер", addPlace:"Добавить точку",
    aiShown:"AI-рекомендаций", checkins:"Check-in визитов",
    fieldName:"Название", fieldAddr:"Адрес", submit:"Добавить", added:"Добавлено ✓",
    detecting:"Определяем локацию...",
  },
  kz: {
    appSub:"Астана бойынша кеңесші", search:"Іздеу", cabinet:"Кабинет",
    login:"Кіру", guest:"Қонақ ретінде кіру", email:"Email", password:"Пароль",
    iAmUser:"👤 Мен клиентпін", iAmVendor:"🏪 Мен бизнес иесімін",
    chatPlaceholder:"Кез келген тілде жазыңыз...",
    chatGreet:"Сәлем! Мен VIZIT AI. Астана бойынша орын тауып беремін.",
    iAmHere:"📍 Мен осындамын", route:"🗺️ 2GIS",
    checkinTitle:"Визитті растау", checkinBtn:"Орналасқан жерді анықтау",
    checkinSuccess:"Визит расталды!", done:"Дайын", cancel:"Болдырмау",
    vendorTitle:"Иесінің кабинеті", analytics:"📊 Аналитика",
    editor:"✏️ Деректер", offers:"🎁 Ұсыныс", addPlace:"Мекеме қосу",
    aiShown:"AI ұсынымдар", checkins:"Check-in визиттер",
    fieldName:"Атауы", fieldAddr:"Мекенжай", submit:"Қосу", added:"Қосылды ✓",
    detecting:"Анықталуда...",
  }
};

// ── ЦВЕТОВАЯ ПАЛИТРА ────────────────────────────────────────
const T = {
  bg:"#F5F7FA", surface:"#FFFFFF", border:"#E4E7EB", 
  text:"#1A1C1E", muted:"#4A4D54", hint:"#717680", 
  blue:"#378ADD", green:"#1D9E75", red:"#D85A30",
};

// ── ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ─────────────────────────────
const Btn = ({children, onClick, color, outline, full, style={}}) => (
  <button onClick={onClick} style={{
    background: outline ? "transparent" : (color || T.blue),
    color: outline ? (color || T.blue) : "#fff",
    border: `1px solid ${color || T.blue}`,
    borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600,
    cursor: "pointer", width: full ? "100%" : "auto", ...style
  }}>{children}</button>
);

const Field = ({label, value, onChange, placeholder, type="text"}) => (
  <div style={{marginBottom:15}}>
    {label && <div style={{fontSize:12, color:T.muted, marginBottom:5}}>{label}</div>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{width:"100%", borderRadius:10, padding:12, border:`1px solid ${T.border}`, boxSizing:"border-box"}}/>
  </div>
);

// ── МОДАЛКА CHECK-IN ────────────────────────────────────────
function CheckInModal({place, t, onClose}){
  const [st, setSt] = useState("idle");
  const detect = () => {
    setSt("detecting");
    setTimeout(() => setSt("success"), 1500); // Симуляция геопозиции
  };
  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000}}>
      <div style={{background:T.surface, borderRadius:20, width:320, padding:25, textAlign:"center"}}>
        <div style={{fontSize:30, marginBottom:10}}>{place.emoji || "📍"}</div>
        <div style={{fontWeight:700, marginBottom:5}}>{t.checkinTitle}</div>
        <div style={{fontSize:13, color:T.hint, marginBottom:20}}>{place.name}</div>
        {st === "idle" && <><Btn onClick={detect} full>{t.checkinBtn}</Btn><Btn onClick={onClose} outline full style={{marginTop:10, border:"none"}}>Назад</Btn></>}
        {st === "detecting" && <div>{t.detecting}</div>}
        {st === "success" && <><div style={{color:T.green, fontWeight:700}}>{t.checkinSuccess}</div><Btn onClick={onClose} full style={{marginTop:20}}>{t.done}</Btn></>}
      </div>
    </div>
  );
}

// ── СТРАНИЦА ЧАТА ──────────────────────────────────────────
function ChatPage({lang, t, onCheckin}){
  const [msgs, setMsgs] = useState([{role:"ai", text:t.chatGreet}]);
  const [input, setInput] = useState("");
  const send = async() => {
    if(!input.trim()) return;
    const q = input; setInput("");
    setMsgs(m => [...m, {role:"user", text:q}]);
    
    // Эмуляция ответа бэкенда
    setTimeout(() => {
      setMsgs(m => [...m, {role:"ai", text:"Вот отличное место:", place: {name:"Coffee Boom", address:"пр. Мангилик Ел, 20", emoji:"☕", lat:1, lng:1}}]);
    }, 1000);
  };
  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%"}}>
      <div style={{flex:1, overflowY:"auto", padding:15}}>
        {msgs.map((m,i) => (
          <div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start", marginBottom:15, maxWidth:"85%"}}>
            <div style={{background:m.role==="user"?T.blue:T.surface, color:m.role==="user"?"#fff":T.text, padding:12, borderRadius:15, border:m.role==="ai"?`1px solid ${T.border}`:"none"}}>
              {m.text}
              {m.place && (
                <div style={{marginTop:10, background:T.bg, padding:10, borderRadius:10, border:`1px solid ${T.border}`}}>
                  <div style={{fontWeight:700, fontSize:13}}>{m.place.name}</div>
                  <div style={{fontSize:11, color:T.hint}}>{m.place.address}</div>
                  <Btn onClick={() => onCheckin(m.place)} small style={{marginTop:8, padding:"5px 10px", fontSize:11}}>{t.iAmHere}</Btn>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:12, background:T.surface, borderTop:`1px solid ${T.border}`, display:"flex", gap:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} style={{flex:1, border:"none", outline:"none"}} placeholder={t.chatPlaceholder}/>
        <Btn onClick={send}>→</Btn>
      </div>
    </div>
  );
}

// ── КАБИНЕТ ВЛАДЕЛЬЦА ───────────────────────────────────────
function VendorDashboard({t}){
  const [tab, setTab] = useState("analytics");
  const [form, setForm] = useState({name:"", addr:""});
  const [added, setAdded] = useState(false);
  return (
    <div style={{padding:20}}>
      <div style={{display:"flex", gap:10, marginBottom:20, overflowX:"auto"}}>
        {["analytics","add"].map(id => (
          <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 15px", borderRadius:8, border:"none", background:tab===id?T.blue:T.surface, color:tab===id?"#fff":T.muted}}>{t[id] || id}</button>
        ))}
      </div>
      {tab === "analytics" && (
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:15}}>
          <div style={{background:T.surface, padding:15, borderRadius:15, border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11, color:T.hint}}>{t.aiShown}</div>
            <div style={{fontSize:22, fontWeight:700}}>1,240</div>
          </div>
          <div style={{background:T.surface, padding:15, borderRadius:15, border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11, color:T.hint}}>{t.checkins}</div>
            <div style={{fontSize:22, fontWeight:700, color:T.green}}>84</div>
          </div>
        </div>
      )}
      {tab === "add" && (
        <div style={{background:T.surface, padding:20, borderRadius:15, border:`1px solid ${T.border}`}}>
          <Field label={t.fieldName} value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <Field label={t.fieldAddr} value={form.addr} onChange={e=>setForm({...form, addr:e.target.value})}/>
          <Btn onClick={()=>{setAdded(true); setTimeout(()=>setAdded(false),2000)}} full>{added ? t.added : t.submit}</Btn>
        </div>
      )}
    </div>
  );
}

// ── ГЛАВНЫЙ КОМПОНЕНТ ───────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("ru");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("auth"); // auth, chat, vendor
  const [activePlace, setActivePlace] = useState(null);
  const t = I18N[lang] || I18N.ru;

  if (view === "auth") return (
    <div style={{height:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"sans-serif"}}>
      <div style={{background:T.surface, padding:30, borderRadius:25, width:"100%", maxWidth:360, textAlign:"center"}}>
        <div style={{fontSize:24, fontWeight:800, color:T.blue, marginBottom:20}}>VIZIT AI</div>
        <Field placeholder={t.email}/>
        <Field placeholder={t.password} type="password"/>
        <Btn onClick={()=>setView("chat")} full>Войти как клиент</Btn>
        <Btn onClick={()=>setView("vendor")} full outline style={{marginTop:10}}>Вход для бизнеса</Btn>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:500, margin:"0 auto", height:"100vh", background:T.bg, display:"flex", flexDirection:"column", fontFamily:"sans-serif"}}>
      {/* Header */}
      <div style={{padding:15, background:T.surface, borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div style={{fontWeight:800, color:T.blue}}>VIZIT AI</div>
        <div style={{display:"flex", gap:10}}>
          {["ru","kz"].map(l => <button key={l} onClick={()=>setLang(l)} style={{background:"none", border:"none", fontWeight:lang===l?700:400, color:lang===l?T.blue:T.hint}}>{l.toUpperCase()}</button>)}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1, overflow:"hidden"}}>
        {view === "chat" ? <ChatPage lang={lang} t={t} onCheckin={setActivePlace}/> : <VendorDashboard t={t}/>}
      </div>

      {/* TabBar */}
      <div style={{padding:15, background:T.surface, borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-around"}}>
        <button onClick={()=>setView("chat")} style={{background:"none", border:"none", color:view==="chat"?T.blue:T.hint}}>💬 {t.search}</button>
        <button onClick={()=>setView("vendor")} style={{background:"none", border:"none", color:view==="vendor"?T.blue:T.hint}}>🏢 {t.cabinet}</button>
      </div>

      {activePlace && <CheckInModal place={activePlace} t={t} onClose={()=>setActivePlace(null)}/>}
    </div>
  );
}
