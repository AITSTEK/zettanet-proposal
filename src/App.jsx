import { useState, useRef, useEffect, useCallback, memo } from "react";

// Supabase client (inline to avoid import issues in artifact)
const SUPABASE_URL = "https://ikkaxqynotihgfspgetu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra2F4cXlub3RpaGdmc3BnZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NjMzOTgsImV4cCI6MjA5MjQzOTM5OH0.laatJSILxBAtDT3h53PV3j1tdIGzk67VZ6Q3Vx6pFPE";

const sbFetch = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  const data = res.status === 204 ? null : await res.json();
  return { data, error: res.ok ? null : data };
};

const supabase = {
  from: (table) => ({
    select: (cols = "*") => ({
      order: (col, { ascending } = {}) => ({
        then: (fn) => sbFetch(`/${table}?select=${cols}&order=${col}.${ascending ? "asc" : "desc"}`).then(fn),
        async exec() { return sbFetch(`/${table}?select=${cols}&order=${col}.${ascending ? "asc" : "desc"}`); }
      }),
      eq: (col, val) => ({
        single: () => sbFetch(`/${table}?select=${cols}&${col}=eq.${val}`, { headers: { "Accept": "application/vnd.pgrst.object+json" } })
      }),
      async exec() { return sbFetch(`/${table}?select=${cols}`); }
    }),
    insert: (body) => ({
      select: () => sbFetch(`/${table}`, { method: "POST", body: JSON.stringify(body) })
    }),
    update: (body) => ({
      eq: (col, val) => ({
        select: () => sbFetch(`/${table}?${col}=eq.${val}`, { method: "PATCH", body: JSON.stringify(body) })
      })
    }),
  })
};

const C = {
  primary: "#e7373e", dark: "#c02a30", darker: "#9e1f24",
  light: "#fdeaea", lighter: "#fff5f5", border: "#f5c0c2",
};

const PRESET_ITEMS = {
  "Smart Automation": [
    { desc: "Intseer Smart Light Control Switch 4-line Multicolor", price: 250 },
    { desc: "Smart Thermostat adaptive to internal controller", price: 750 },
    { desc: "Zigbee Hub Gateway", price: 400 },
    { desc: "Smart Curtain Motor", price: 320 },
    { desc: "Smart Door Lock Zigbee", price: 850 },
  ],
  "Video Intercom": [
    { desc: "2 MP Fisheye Camera – Night Vision & Audio + Intercom Screen 7 inch", price: 975 },
    { desc: "Intercom Screen 7 inch", price: 420 },
    { desc: "Cat 6A Cable Full Copper", price: 690 },
    { desc: "Outdoor Intercom Station", price: 560 },
  ],
  "CCTV System": [
    { desc: "Outdoor Camera Hikvision 4MP", price: 250 },
    { desc: "NVR Hikvision 8ch IP 4K with POE", price: 1000 },
    { desc: "Seagate Exos 6TB 7200 RPM SATA 6Gb/s Hard Drive", price: 675 },
    { desc: "POE Switch 8 Port", price: 600 },
    { desc: "Junction Boxes / Rack 4U", price: 300 },
    { desc: "Cat 6A Cable Full Copper", price: 690 },
  ],
  "Sound System": [
    { desc: "4x20W Music Amplifier with Bluetooth, SD, APP Control", price: 1800 },
    { desc: "In-door Despa Speaker 10W 6.5 inch", price: 190 },
    { desc: "Full Copper Speakers Connection Cable", price: 350 },
  ],
  "Network Structure": [
    { desc: "Unifi In-Door Access Point U6 Plus", price: 495 },
    { desc: "Unifi POE Switch 16 Port", price: 1170 },
    { desc: "Cat 6A Cable Full Copper", price: 690 },
    { desc: "Unifi Dream Machine Pro", price: 2200 },
  ],
};

const DEFAULT_TERMS = `Terms & Conditions:
• Our contract includes site shop drawing, supervision, system installation and delivering.
• Supply & Installation timeline: 4–6 weeks.

Exclusions:
• Any civil work or carpentry work.
• Containments and conduiting pipes are the responsibility of the owner.
• Supply of main electrical current or internet (Etisalat/Du).
• Any unauthorised or third-party repairs.

Warranty:
• 1 year after delivery of equipment (smart home systems).`;

const uid = () => Date.now() + Math.random();
const newItem = () => ({ id: uid(), desc: "", qty: "1", price: "0", image: null, preset: "" });
const newSection = (name = "New Section") => ({ id: uid(), name, items: [newItem()] });
const parseNum = v => parseFloat(v) || 0;
const fmt = n => `AED ${Number(n).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const SECTION_NAMES = ["Smart Automation", "Video Intercom", "CCTV System", "Sound System", "Network Structure", "Custom"];

const StableInput = memo(({ value, onChange, style, placeholder }) => {
  const [local, setLocal] = useState(value);
  const ref = useRef();
  useEffect(() => { if (document.activeElement !== ref.current) setLocal(value); }, [value]);
  return <input ref={ref} type="text" value={local} placeholder={placeholder} style={style}
    onChange={e => { setLocal(e.target.value); onChange(e.target.value); }} />;
});

const StableTextarea = memo(({ value, onChange, rows, style, placeholder }) => {
  const [local, setLocal] = useState(value);
  const ref = useRef();
  useEffect(() => { if (document.activeElement !== ref.current) setLocal(value); }, [value]);
  return <textarea ref={ref} value={local} rows={rows} placeholder={placeholder} style={style}
    onChange={e => { setLocal(e.target.value); onChange(e.target.value); }} />;
});

const AutoImage = memo(({ src, onRemove }) => {
  const [dims, setDims] = useState({ w: 80, h: 80 });
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const maxW = 150, maxH = 110, ratio = img.width / img.height;
      let w = img.width, h = img.height;
      if (w > maxW) { w = maxW; h = w / ratio; }
      if (h > maxH) { h = maxH; w = h * ratio; }
      setDims({ w: Math.round(w), h: Math.round(h) });
    };
    img.src = src;
  }, [src]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <img src={src} style={{ width: dims.w, height: dims.h, objectFit: "contain", borderRadius: 3, border: `1px solid ${C.border}` }} alt="" />
      <button onClick={onRemove} style={{ background: "none", border: "none", color: "#c00", fontSize: 11, cursor: "pointer" }}>remove</button>
    </div>
  );
});

const QtyInput = memo(({ value, onCommit }) => {
  const [local, setLocal] = useState(value);
  const ref = useRef();
  useEffect(() => { if (document.activeElement !== ref.current) setLocal(value); }, [value]);
  const step = delta => {
    const next = Math.max(0, parseNum(local) + delta);
    const rounded = Math.round(next * 2) / 2;
    setLocal(String(rounded)); onCommit(String(rounded));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <input ref={ref} type="text" inputMode="decimal" value={local}
        onChange={e => { setLocal(e.target.value); onCommit(e.target.value); }}
        style={{ width: 80, padding: "6px 8px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, textAlign: "right", boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 2 }}>
        <button onClick={() => step(-0.5)} style={{ flex: 1, fontSize: 15, padding: "2px 0", border: `1px solid ${C.border}`, borderRadius: 3, background: C.light, cursor: "pointer", fontWeight: 600, color: C.primary }}>−</button>
        <button onClick={() => step(0.5)} style={{ flex: 1, fontSize: 15, padding: "2px 0", border: `1px solid ${C.border}`, borderRadius: 3, background: C.light, cursor: "pointer", fontWeight: 600, color: C.primary }}>+</button>
      </div>
    </div>
  );
});

const ItemRow = memo(({ sec, it, idx, onUpdate, onRemove, onImage }) => {
  const presets = PRESET_ITEMS[sec.name] || [];
  const total = parseNum(it.qty) * parseNum(it.price);
  const fileRef = useRef();
  const td = { padding: "8px 10px", fontSize: 13, verticalAlign: "middle", borderBottom: `1px solid ${C.border}` };
  const inp = { width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, boxSizing: "border-box" };
  return (
    <tr>
      <td style={{ ...td, textAlign: "center", width: 36, fontWeight: 600 }}>{idx + 1}</td>
      <td style={{ ...td, width: 120, textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          {it.image ? <AutoImage src={it.image} onRemove={() => onUpdate(it.id, "image", null)} />
            : <div onClick={() => fileRef.current.click()}
                style={{ width: 70, height: 70, border: `2px dashed ${C.border}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.primary, fontSize: 28 }}>+</div>}
          {!it.image && <button onClick={() => fileRef.current.click()} style={{ fontSize: 11, color: C.primary, background: "none", border: "none", cursor: "pointer" }}>Upload</button>}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => onImage(it.id, e.target.files[0])} />
        </div>
      </td>
      <td style={{ ...td, minWidth: 240 }}>
        {presets.length > 0 && (
          <select value={it.preset} onChange={e => {
            const found = presets.find(p => p.desc === e.target.value);
            onUpdate(it.id, "__preset__", { preset: e.target.value, desc: found ? found.desc : "", price: found ? String(found.price) : it.price });
          }} style={{ ...inp, marginBottom: 5, color: it.preset ? "#333" : "#999" }}>
            <option value="">— Select preset —</option>
            {presets.map(p => <option key={p.desc} value={p.desc}>{p.desc}</option>)}
            <option value="__custom__">Custom (type below)</option>
          </select>
        )}
        <StableTextarea value={it.desc} onChange={v => onUpdate(it.id, "desc", v)} rows={2}
          placeholder="Item description..." style={{ ...inp, resize: "vertical", fontSize: 12 }} />
      </td>
      <td style={{ ...td, width: 100 }}><QtyInput value={it.qty} onCommit={v => onUpdate(it.id, "qty", v)} /></td>
      <td style={{ ...td, width: 130 }}>
        <StableInput value={it.price} onChange={v => onUpdate(it.id, "price", v)} placeholder="0.00" style={{ ...inp, textAlign: "right" }} />
      </td>
      <td style={{ ...td, width: 140, textAlign: "right", fontWeight: 600, color: C.darker }}>{fmt(total)}</td>
      <td style={{ ...td, width: 36, textAlign: "center" }}>
        <button onClick={() => onRemove(it.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#c00", fontSize: 18 }}>×</button>
      </td>
    </tr>
  );
});

const DEFAULT_HEADER = {
  project: "", location: "", date: new Date().toISOString().slice(0, 10),
  ref: "", client: "", company: "Zettanet Technologies",
  companyEmail: "info@zettanet.tech", companyAddress: "P.O. Box: 114345, Abu Dhabi, UAE",
  slogan: "Smart Solutions for Modern Living", logo: null
};

const DEFAULT_SECTIONS = [
  { id: 1, name: "Smart Automation", items: [newItem(), newItem()] },
  { id: 2, name: "Video Intercom", items: [newItem()] },
  { id: 3, name: "CCTV System", items: [newItem()] },
  { id: 4, name: "Sound System", items: [newItem()] },
  { id: 5, name: "Network Structure", items: [newItem()] },
];

export default function ProposalApp() {
  const [header, setHeader] = useState(DEFAULT_HEADER);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [installation, setInstallation] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [discountType, setDiscountType] = useState("lumpsum");
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [tab, setTab] = useState("edit");
  const [currentId, setCurrentId] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [showQuotes, setShowQuotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const logoRef = useRef();

  const updateHeader = useCallback((k, v) => setHeader(h => ({ ...h, [k]: v })), []);
  const handleLogoUpload = file => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => updateHeader("logo", e.target.result);
    r.readAsDataURL(file);
  };

  const updateItem = useCallback((secId, itemId, field, value) => {
    setSections(s => s.map(sec => sec.id !== secId ? sec : {
      ...sec, items: sec.items.map(it => {
        if (it.id !== itemId) return it;
        if (field === "__preset__") return { ...it, ...value };
        return { ...it, [field]: value };
      })
    }));
  }, []);

  const removeItem = useCallback((secId, itemId) => {
    setSections(s => s.map(sec => sec.id !== secId ? sec : { ...sec, items: sec.items.filter(it => it.id !== itemId) }));
  }, []);

  const handleImage = useCallback((secId, itemId, file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => setSections(s => s.map(sec => sec.id !== secId ? sec : {
      ...sec, items: sec.items.map(it => it.id !== itemId ? it : { ...it, image: e.target.result })
    }));
    r.readAsDataURL(file);
  }, []);

  const addItem = secId => setSections(s => s.map(sec => sec.id !== secId ? sec : { ...sec, items: [...sec.items, newItem()] }));
  const addSection = () => setSections(s => [...s, newSection()]);
  const removeSection = secId => setSections(s => s.filter(sec => sec.id !== secId));
  const updateSecName = (secId, name) => setSections(s => s.map(sec => sec.id !== secId ? sec : { ...sec, name }));

  const secTotal = sec => sec.items.reduce((sum, it) => sum + parseNum(it.qty) * parseNum(it.price), 0);
  const allSectionTotal = sections.reduce((sum, sec) => sum + secTotal(sec), 0);
  const grandSubtotal = allSectionTotal + parseNum(installation);
  const discountAmount = discountType === "percent" ? allSectionTotal * (parseNum(discount) / 100) : parseNum(discount);
  const afterDiscount = allSectionTotal - discountAmount + parseNum(installation);
  const vat = afterDiscount * 0.05;
  const finalTotal = afterDiscount + vat;

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "no-print-style";
    style.innerHTML = `@media print { .no-print { display: none !important; } }`;
    document.head.appendChild(style);
    return () => { const el = document.getElementById("no-print-style"); if (el) el.remove(); };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    const payload = {
      client_name: header.client,
      project_name: header.project,
      location: header.location,
      ref_number: header.ref,
      date: header.date,
      sections,
      installation: parseNum(installation),
      discount: parseNum(discount),
      discount_type: discountType,
      terms,
      header,
      total_amount: finalTotal,
      status: "draft",
      updated_at: new Date().toISOString(),
    };
    let result;
    if (currentId) {
      result = await supabase.from("quotes").update(payload).eq("id", currentId).select();
    } else {
      result = await supabase.from("quotes").insert(payload).select();
    }
    if (result.error) {
      setSaveMsg("❌ Save failed: " + JSON.stringify(result.error));
    } else {
      if (!currentId && result.data?.[0]) setCurrentId(result.data[0].id);
      setSaveMsg("✅ Quote saved successfully!");
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleLoadList = async () => {
    const result = await sbFetch("/quotes?select=id,client_name,project_name,total_amount,date,updated_at&order=updated_at.desc");
    if (!result.error) setQuotes(result.data || []);
    setShowQuotes(true);
  };

  const handleLoad = async (id) => {
    const result = await sbFetch(`/quotes?select=*&id=eq.${id}`, { headers: { "Accept": "application/vnd.pgrst.object+json" } });
    const data = result.data;
    if (!result.error && data) {
      setHeader(data.header || DEFAULT_HEADER);
      setSections(data.sections || DEFAULT_SECTIONS);
      setInstallation(String(data.installation || 0));
      setDiscount(String(data.discount || 0));
      setDiscountType(data.discount_type || "lumpsum");
      setTerms(data.terms || DEFAULT_TERMS);
      setCurrentId(data.id);
      setShowQuotes(false);
      setTab("edit");
      setSaveMsg("✅ Quote loaded!");
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  // New quote
  const handleNew = () => {
    setHeader({ ...DEFAULT_HEADER, date: new Date().toISOString().slice(0, 10) });
    setSections(DEFAULT_SECTIONS.map(s => ({ ...s, id: uid(), items: [newItem()] })));
    setInstallation("0");
    setDiscount("0");
    setDiscountType("lumpsum");
    setTerms(DEFAULT_TERMS);
    setCurrentId(null);
    setShowQuotes(false);
    setSaveMsg("");
  };

  const handlePrint = () => {
    const els = document.querySelectorAll(".no-print");
    els.forEach(el => el.style.display = "none");
    window.print();
    setTimeout(() => els.forEach(el => el.style.display = ""), 1000);
  };

  const handleExportPDF = () => {
    setTab("preview");
    setTimeout(() => {
      const els = document.querySelectorAll(".no-print");
      els.forEach(el => el.style.display = "none");
      window.print();
      setTimeout(() => els.forEach(el => el.style.display = ""), 1500);
    }, 300);
  };

  const S = {
    card: { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 20 },
    label: { fontSize: 12, color: "#555", display: "block", marginBottom: 4, fontWeight: 500 },
    input: { width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, boxSizing: "border-box" },
    btn: (bg = C.primary) => ({ background: bg, color: "#fff", border: "none", borderRadius: 4, padding: "6px 16px", cursor: "pointer", fontSize: 13, fontWeight: 500 }),
    tabBtn: a => ({ padding: "8px 20px", border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer", background: a ? C.primary : "#fff", color: a ? "#fff" : "#333", fontWeight: a ? 600 : 400 }),
    summaryRow: b => ({ display: "flex", justifyContent: "space-between", padding: "6px 0", fontWeight: b ? 700 : 400, fontSize: b ? 15 : 13, borderTop: b ? `2px solid ${C.primary}` : `1px solid ${C.border}`, color: b ? C.primary : "inherit" }),
    th: { background: C.primary, color: "#fff", padding: "9px 10px", textAlign: "left", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  };

  const summaryRows = [
    ["Sections Subtotal", fmt(allSectionTotal)],
    ...(parseNum(installation) > 0 ? [["Installation & Configuration", fmt(parseNum(installation))]] : []),
    ...((parseNum(installation) > 0 || discountAmount > 0) ? [["Subtotal", fmt(grandSubtotal)]] : []),
    ...(discountAmount > 0 ? [["Discount", `-${fmt(discountAmount)}`], ["After Discount", fmt(afterDiscount)]] : []),
    ["VAT 5%", fmt(vat)],
  ];

  const PDFContent = () => (
    <div id="pdf-content" style={{ fontFamily: "Arial, sans-serif", padding: 28, fontSize: 12, color: "#000", background: "#fff", maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: `3px solid ${C.primary}`, paddingBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {header.logo ? <img src={header.logo} style={{ height: 70, objectFit: "contain" }} alt="logo" />
            : <div style={{ width: 70, height: 70, background: C.primary, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>ZN</div>}
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: C.primary }}>{header.company}</div>
            <div style={{ fontSize: 11, color: "#555", fontStyle: "italic", marginTop: 2 }}>{header.slogan}</div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>{header.companyAddress}</div>
            <div style={{ fontSize: 11, color: "#333" }}>E: {header.companyEmail}</div>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "#333", lineHeight: 1.9 }}>
          <div><b>Date:</b> {header.date}</div>
          {header.ref && <div><b>Ref:</b> {header.ref}</div>}
          {header.project && <div><b>Project:</b> {header.project}</div>}
          {header.location && <div><b>Location:</b> {header.location}</div>}
          {header.client && <div><b>Client:</b> {header.client}</div>}
        </div>
      </div>
      {sections.map(sec => (
        <div key={sec.id} style={{ marginBottom: 22 }}>
          <div style={{ background: C.primary, color: "#fff", padding: "7px 12px", fontWeight: 700, fontSize: 13, borderRadius: "4px 4px 0 0" }}>{sec.name}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: `1.5px solid ${C.primary}` }}>
            <thead>
              <tr>{["SN", "Photo", "Item Description", "QTY", "Unit Price (AED)", "Total"].map(h => (
                <th key={h} style={{ background: C.light, padding: "7px 9px", textAlign: "left", fontSize: 11, fontWeight: 700, borderBottom: `1.5px solid ${C.primary}`, borderRight: `1px solid ${C.border}`, color: "#000" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {sec.items.map((it, i) => {
                const tot = parseNum(it.qty) * parseNum(it.price);
                return (
                  <tr key={it.id} style={{ background: i % 2 === 0 ? "#fff" : C.lighter }}>
                    <td style={{ padding: "6px 9px", border: `1px solid ${C.border}`, textAlign: "center", width: 30, fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ padding: "4px 8px", border: `1px solid ${C.border}`, textAlign: "center", width: 90 }}>
                      {it.image && <img src={it.image} style={{ maxWidth: 80, maxHeight: 70, objectFit: "contain" }} alt="" />}
                    </td>
                    <td style={{ padding: "6px 9px", border: `1px solid ${C.border}`, fontSize: 11 }}>{it.desc}</td>
                    <td style={{ padding: "6px 9px", border: `1px solid ${C.border}`, textAlign: "center", width: 50 }}>{it.qty}</td>
                    <td style={{ padding: "6px 9px", border: `1px solid ${C.border}`, textAlign: "right", width: 90 }}>{parseNum(it.price).toFixed(2)}</td>
                    <td style={{ padding: "6px 9px", border: `1px solid ${C.border}`, textAlign: "right", fontWeight: 700, width: 110 }}>{fmt(tot)}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={5} style={{ textAlign: "right", padding: "7px 9px", background: C.primary, color: "#fff", fontWeight: 700, border: `1px solid ${C.primary}` }}>Section Total</td>
                <td style={{ textAlign: "right", padding: "7px 9px", background: C.primary, color: "#fff", fontWeight: 700, border: `1px solid ${C.primary}` }}>{fmt(secTotal(sec))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <table style={{ width: 380, borderCollapse: "collapse", border: `1.5px solid ${C.primary}` }}>
          {summaryRows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: "5px 10px", fontSize: 11, borderBottom: `1px solid ${C.border}` }}>{k}</td>
              <td style={{ padding: "5px 10px", textAlign: "right", fontSize: 11, borderBottom: `1px solid ${C.border}` }}>{v}</td>
            </tr>
          ))}
          <tr>
            <td style={{ padding: "9px 10px", fontWeight: 700, background: C.primary, color: "#fff", fontSize: 13 }}>Total Amount</td>
            <td style={{ padding: "9px 10px", fontWeight: 700, textAlign: "right", background: C.primary, color: "#fff", fontSize: 13 }}>{fmt(finalTotal)}</td>
          </tr>
        </table>
      </div>
      <div style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "#000", borderTop: `2px solid ${C.primary}`, paddingTop: 14, lineHeight: 1.7 }}>{terms}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 980, margin: "0 auto", padding: "0 0 60px" }}>
      {/* Top bar */}
      <div className="no-print" style={{ background: C.primary, color: "#fff", padding: "14px 24px", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        {header.logo ? <img src={header.logo} style={{ height: 46, objectFit: "contain", borderRadius: 4, background: "#fff", padding: 4 }} alt="logo" />
          : <div style={{ width: 46, height: 46, background: "rgba(255,255,255,0.2)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>ZN</div>}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Zettanet Technologies — Proposal Generator</div>
          <div style={{ fontSize: 11, opacity: 0.85, fontStyle: "italic" }}>{header.slogan}</div>
        </div>
        {currentId && <div style={{ fontSize: 11, opacity: 0.7, textAlign: "right" }}>ID: {currentId.slice(0, 8)}...</div>}
      </div>

      {/* Action bar */}
      <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {["edit", "preview"].map(t => <button key={t} onClick={() => setTab(t)} style={S.tabBtn(tab === t)}>{t === "edit" ? "Edit Proposal" : "Preview"}</button>)}
        <button onClick={handlePrint} style={S.btn("#444")}>Print</button>
        <button onClick={handleExportPDF} style={S.btn(C.darker)}>Export PDF</button>
        <div style={{ flex: 1 }} />
        <button onClick={handleNew} style={S.btn("#666")}>+ New Quote</button>
        <button onClick={handleLoadList} style={S.btn("#2563eb")}>📂 My Quotes</button>
        <button onClick={handleSave} disabled={saving} style={{ ...S.btn("#16a34a"), opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : currentId ? "💾 Update Quote" : "💾 Save Quote"}
        </button>
      </div>

      {saveMsg && <div className="no-print" style={{ padding: "10px 16px", background: saveMsg.includes("❌") ? "#fee2e2" : "#dcfce7", borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 500 }}>{saveMsg}</div>}

      {/* Quotes List Modal */}
      {showQuotes && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, width: 600, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.primary }}>Saved Quotes</div>
              <button onClick={() => setShowQuotes(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#666" }}>×</button>
            </div>
            {quotes.length === 0 ? (
              <div style={{ textAlign: "center", color: "#999", padding: 40 }}>No saved quotes yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>{["Client", "Project", "Total", "Date", ""].map(h => (
                    <th key={h} style={{ padding: "8px 10px", background: C.light, textAlign: "left", fontSize: 12, fontWeight: 600, borderBottom: `2px solid ${C.border}` }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {quotes.map((q, i) => (
                    <tr key={q.id} style={{ background: i % 2 === 0 ? "#fff" : C.lighter }}>
                      <td style={{ padding: "9px 10px", fontSize: 13, borderBottom: `1px solid ${C.border}` }}>{q.client_name || "—"}</td>
                      <td style={{ padding: "9px 10px", fontSize: 13, borderBottom: `1px solid ${C.border}` }}>{q.project_name || "—"}</td>
                      <td style={{ padding: "9px 10px", fontSize: 13, borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>{fmt(q.total_amount)}</td>
                      <td style={{ padding: "9px 10px", fontSize: 12, borderBottom: `1px solid ${C.border}`, color: "#666" }}>{q.date}</td>
                      <td style={{ padding: "9px 10px", borderBottom: `1px solid ${C.border}` }}>
                        <button onClick={() => handleLoad(q.id)} style={S.btn()}>Open</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "edit" && <>
        <div style={S.card}>
          <div style={{ fontWeight: 600, marginBottom: 14, color: C.primary, fontSize: 15 }}>Company & Proposal Header</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 14, background: C.lighter, borderRadius: 6, border: `1px solid ${C.border}`, marginBottom: 14 }}>
            {header.logo ? <img src={header.logo} style={{ height: 70, objectFit: "contain", borderRadius: 4, border: `1px solid ${C.border}` }} alt="logo" />
              : <div style={{ width: 70, height: 70, background: C.light, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: 700, fontSize: 20 }}>ZN</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => logoRef.current.click()} style={S.btn()}>Upload Logo</button>
              {header.logo && <button onClick={() => updateHeader("logo", null)} style={S.btn("#c00")}>Remove</button>}
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleLogoUpload(e.target.files[0])} />
              <span style={{ fontSize: 10, color: "#888" }}>PNG / JPG</span>
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Company Slogan</label>
              <StableInput value={header.slogan} onChange={v => updateHeader("slogan", v)} style={S.input} placeholder="Your slogan here" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["company", "Company Name"], ["companyEmail", "Company Email"], ["companyAddress", "Company Address"], ["client", "Client Name"], ["project", "Project Name"], ["location", "Location"], ["date", "Date"], ["ref", "Reference No."]].map(([k, l]) => (
              <div key={k}>
                <label style={S.label}>{l}</label>
                <StableInput value={header[k]} onChange={v => updateHeader(k, v)} style={S.input} />
              </div>
            ))}
          </div>
        </div>

        {sections.map(sec => (
          <div key={sec.id} style={{ border: `1.5px solid ${C.primary}`, borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ background: C.primary, color: "#fff", padding: "9px 14px", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <select value={SECTION_NAMES.includes(sec.name) ? sec.name : "Custom"}
                  onChange={e => { if (e.target.value !== "Custom") updateSecName(sec.id, e.target.value); }}
                  style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 4, padding: "3px 6px", fontSize: 13 }}>
                  {SECTION_NAMES.map(n => <option key={n} value={n} style={{ color: "#333" }}>{n}</option>)}
                </select>
                <input value={sec.name} onChange={e => updateSecName(sec.id, e.target.value)}
                  style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.5)", color: "#fff", fontSize: 14, fontWeight: 600, width: 200 }} />
              </div>
              <button onClick={() => removeSection(sec.id)} style={{ background: "rgba(255,0,0,0.3)", border: "none", color: "#fff", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>Remove Section</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>{["SN", "Photo", "Item Description", "QTY (±0.5)", "Unit Price (AED)", "Total", ""].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {sec.items.map((it, i) => (
                    <ItemRow key={it.id} sec={sec} it={it} idx={i}
                      onUpdate={(itemId, field, value) => updateItem(sec.id, itemId, field, value)}
                      onRemove={itemId => removeItem(sec.id, itemId)}
                      onImage={(itemId, file) => handleImage(sec.id, itemId, file)} />
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ textAlign: "right", padding: "7px 10px", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 13 }}>Section Total</td>
                    <td style={{ textAlign: "right", padding: "7px 10px", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 13 }}>{fmt(secTotal(sec))}</td>
                    <td style={{ background: C.primary }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div style={{ padding: "10px 14px", background: C.lighter, borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => addItem(sec.id)} style={S.btn()}>+ Add Item</button>
            </div>
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <button onClick={addSection} style={{ ...S.btn(C.dark), padding: "10px 24px", fontSize: 14 }}>+ Add Section</button>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 600, marginBottom: 14, color: C.primary, fontSize: 15 }}>Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={S.label}>Installation / Programming / Configuration (AED)</label>
              <StableInput value={installation} onChange={setInstallation} style={{ ...S.input, textAlign: "right" }} placeholder="0" />
            </div>
            <div>
              <label style={S.label}>Discount</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <button onClick={() => setDiscountType("lumpsum")} style={{ flex: 1, padding: "5px 0", border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer", background: discountType === "lumpsum" ? C.primary : C.lighter, color: discountType === "lumpsum" ? "#fff" : "#333", fontSize: 12, fontWeight: 500 }}>AED Lump sum</button>
                <button onClick={() => setDiscountType("percent")} style={{ flex: 1, padding: "5px 0", border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer", background: discountType === "percent" ? C.primary : C.lighter, color: discountType === "percent" ? "#fff" : "#333", fontSize: 12, fontWeight: 500 }}>% Percentage</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <StableInput value={discount} onChange={setDiscount} style={{ ...S.input, textAlign: "right" }} placeholder="0" />
                <span style={{ fontSize: 13, color: "#555", whiteSpace: "nowrap" }}>{discountType === "percent" ? "%" : "AED"}</span>
              </div>
              {discountType === "percent" && parseNum(discount) > 0 && (
                <div style={{ fontSize: 12, color: C.primary, marginTop: 4 }}>= {fmt(discountAmount)} off</div>
              )}
            </div>
          </div>
          <div style={{ background: C.lighter, border: `1.5px solid ${C.primary}`, borderRadius: 6, padding: "14px 18px" }}>
            {summaryRows.map(([k, v]) => (
              <div key={k} style={S.summaryRow(false)}><span>{k}</span><span>{v}</span></div>
            ))}
            <div style={S.summaryRow(true)}><span>Total Amount</span><span>{fmt(finalTotal)}</span></div>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 600, marginBottom: 10, color: C.primary, fontSize: 15 }}>Terms & Conditions</div>
          <StableTextarea value={terms} onChange={setTerms} rows={12} style={{ ...S.input, fontFamily: "inherit", lineHeight: 1.7 }} />
        </div>
      </>}

      {tab === "preview" && (
        <>
          <style>{`@media print { .no-print { display: none !important; } }`}</style>
          <PDFContent />
        </>
      )}
      <div style={{ position: "absolute", left: -9999, top: 0, visibility: "hidden" }}><PDFContent /></div>
    </div>
  );
}