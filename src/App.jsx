import { useState, useRef } from "react";

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

const newItem = () => ({ id: Date.now() + Math.random(), desc: "", qty: 1, price: 0, image: null, preset: "" });
const newSection = (name = "New Section") => ({ id: Date.now(), name, items: [newItem()] });

const DEFAULT_SECTIONS = [
  { id: 1, name: "Smart Automation", items: [newItem(), newItem(), newItem()] },
  { id: 2, name: "Video Intercom", items: [newItem()] },
  { id: 3, name: "CCTV System", items: [newItem()] },
  { id: 4, name: "Sound System", items: [newItem()] },
  { id: 5, name: "Network Structure", items: [newItem()] },
];

const SECTION_NAMES = ["Smart Automation", "Video Intercom", "CCTV System", "Sound System", "Network Structure", "Custom"];

export default function ProposalApp() {
  const [header, setHeader] = useState({ project: "Privet Villa", location: "Abu Dhabi", date: new Date().toISOString().slice(0,10), ref: "LTR-ZT-HIM-BOR-14102024004-00", client: "Mr. Saeed", company: "Zettanet Technologies", companyEmail: "info@zettanet.tech", companyAddress: "P.O. Box: 114345, Abu Dhabi, UAE" });
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [installation, setInstallation] = useState(3000);
  const [discount, setDiscount] = useState(3000);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [tab, setTab] = useState("edit");

  const updateHeader = (k, v) => setHeader(h => ({ ...h, [k]: v }));

  const updateItem = (secId, itemId, field, value) => {
    setSections(s => s.map(sec => sec.id !== secId ? sec : {
      ...sec, items: sec.items.map(it => it.id !== itemId ? it : { ...it, [field]: value })
    }));
  };

  const selectPreset = (secId, itemId, presetDesc, secName) => {
    const presets = PRESET_ITEMS[secName] || [];
    const found = presets.find(p => p.desc === presetDesc);
    setSections(s => s.map(sec => sec.id !== secId ? sec : {
      ...sec, items: sec.items.map(it => it.id !== itemId ? it : { ...it, preset: presetDesc, desc: found ? found.desc : presetDesc, price: found ? found.price : it.price })
    }));
  };

  const addItem = secId => setSections(s => s.map(sec => sec.id !== secId ? sec : { ...sec, items: [...sec.items, newItem()] }));
  const removeItem = (secId, itemId) => setSections(s => s.map(sec => sec.id !== secId ? sec : { ...sec, items: sec.items.filter(it => it.id !== itemId) }));
  const addSection = () => setSections(s => [...s, newSection()]);
  const removeSection = secId => setSections(s => s.filter(sec => sec.id !== secId));
  const updateSecName = (secId, name) => setSections(s => s.map(sec => sec.id !== secId ? sec : { ...sec, name }));

  const handleImageUpload = (secId, itemId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => updateItem(secId, itemId, "image", e.target.result);
    reader.readAsDataURL(file);
  };

  const secTotal = sec => sec.items.reduce((sum, it) => sum + (parseFloat(it.qty)||0) * (parseFloat(it.price)||0), 0);
  const allSectionTotal = sections.reduce((sum, sec) => sum + secTotal(sec), 0);
  const grandSubtotal = allSectionTotal + (parseFloat(installation)||0);
  const afterDiscount = grandSubtotal - (parseFloat(discount)||0);
  const vat = afterDiscount * 0.05;
  const finalTotal = afterDiscount + vat;

  const fmt = n => `AED ${Number(n).toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const handlePrint = () => {
    window.print();
  };

  const S = {
    page: { fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: "0 0 60px" },
    tabs: { display: "flex", gap: 8, marginBottom: 20 },
    tabBtn: active => ({ padding: "8px 20px", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer", background: active ? "#2d6a4f" : "#fff", color: active ? "#fff" : "#333", fontWeight: active ? 600 : 400 }),
    card: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, padding: 20, marginBottom: 20 },
    label: { fontSize: 12, color: "#666", display: "block", marginBottom: 4 },
    input: { width: "100%", padding: "7px 10px", border: "1px solid #ddd", borderRadius: 5, fontSize: 13, boxSizing: "border-box" },
    sectionHeader: { background: "#5a7a4a", color: "#fff", padding: "8px 14px", borderRadius: "6px 6px 0 0", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between" },
    th: { background: "#f5f5f5", padding: "8px 10px", textAlign: "left", fontSize: 12, fontWeight: 600, borderBottom: "1px solid #ddd" },
    td: { padding: "8px 10px", fontSize: 13, verticalAlign: "middle", borderBottom: "1px solid #f0f0f0" },
    btn: (color="#2d6a4f") => ({ background: color, color: "#fff", border: "none", borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontSize: 12 }),
    removeBtn: { background: "transparent", border: "none", cursor: "pointer", color: "#c00", fontSize: 16, lineHeight: 1 },
    total: { textAlign: "right", padding: "6px 10px", fontSize: 13 },
    summaryRow: (bold) => ({ display: "flex", justifyContent: "space-between", padding: "5px 0", fontWeight: bold ? 600 : 400, fontSize: bold ? 15 : 13, borderTop: bold ? "2px solid #2d6a4f" : "none", color: bold ? "#2d6a4f" : "inherit" }),
  };

  const ItemRow = ({ sec, it, idx }) => {
    const presets = PRESET_ITEMS[sec.name] || [];
    const total = (parseFloat(it.qty)||0) * (parseFloat(it.price)||0);
    const fileRef = useRef();
    return (
      <tr>
        <td style={S.td}>{idx+1}</td>
        <td style={{...S.td, width: 70}}>
          <div style={{ width: 54, height: 54, border: "1px dashed #ccc", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" }}
            onClick={() => fileRef.current.click()}>
            {it.image ? <img src={it.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <span style={{ fontSize: 20, color: "#bbb" }}>+</span>}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageUpload(sec.id, it.id, e.target.files[0])} />
          </div>
          {it.image && <button onClick={() => updateItem(sec.id, it.id, "image", null)} style={{ ...S.removeBtn, fontSize: 11, marginTop: 2 }}>remove</button>}
        </td>
        <td style={{...S.td, minWidth: 220}}>
          {presets.length > 0 && (
            <select value={it.preset} onChange={e => selectPreset(sec.id, it.id, e.target.value, sec.name)}
              style={{ ...S.input, marginBottom: 5, color: it.preset ? "#333" : "#999" }}>
              <option value="">— Select preset —</option>
              {presets.map(p => <option key={p.desc} value={p.desc}>{p.desc}</option>)}
              <option value="__custom__">Custom (type below)</option>
            </select>
          )}
          <textarea value={it.desc} onChange={e => updateItem(sec.id, it.id, "desc", e.target.value)}
            placeholder="Item description..." rows={2}
            style={{ ...S.input, resize: "vertical", fontSize: 12 }} />
        </td>
        <td style={{...S.td, width: 70}}>
          <input type="number" min={1} value={it.qty} onChange={e => updateItem(sec.id, it.id, "qty", e.target.value)} style={{ ...S.input, textAlign: "center" }} />
        </td>
        <td style={{...S.td, width: 100}}>
          <input type="number" min={0} value={it.price} onChange={e => updateItem(sec.id, it.id, "price", e.target.value)} style={{ ...S.input, textAlign: "right" }} />
        </td>
        <td style={{...S.td, width: 110, textAlign: "right", fontWeight: 500}}>{fmt(total)}</td>
        <td style={{...S.td, width: 36}}>
          <button onClick={() => removeItem(sec.id, it.id)} style={S.removeBtn} title="Remove item">×</button>
        </td>
      </tr>
    );
  };

  const PrintView = () => (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 32, fontSize: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#2d6a4f" }}>{header.company}</div>
          <div style={{ color: "#555", fontSize: 12 }}>{header.companyAddress}</div>
          <div style={{ color: "#555", fontSize: 12 }}>E: {header.companyEmail}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: "#555" }}>
          <div><b>Date:</b> {header.date}</div>
          <div><b>Ref:</b> {header.ref}</div>
          <div><b>Project:</b> {header.project}</div>
          <div><b>Location:</b> {header.location}</div>
        </div>
      </div>
      <div style={{ marginBottom: 20, fontSize: 14 }}><b>Client Name:</b> {header.client}</div>
      {sections.map(sec => (
        <div key={sec.id} style={{ marginBottom: 24 }}>
          <div style={{ background: "#5a7a4a", color: "#fff", padding: "7px 12px", fontWeight: 700, fontSize: 13 }}>{sec.name}</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["SN","Photo","Item Description","QTY","Unit Price","Total"].map(h => (
                <th key={h} style={{ background: "#f0f0f0", padding: "6px 8px", textAlign: "left", fontSize: 12, fontWeight: 600, border: "1px solid #ddd" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {sec.items.map((it, i) => {
                const tot = (parseFloat(it.qty)||0)*(parseFloat(it.price)||0);
                return (
                  <tr key={it.id}>
                    <td style={{ padding: "6px 8px", border: "1px solid #eee", textAlign: "center" }}>{i+1}</td>
                    <td style={{ padding: "4px 8px", border: "1px solid #eee", textAlign: "center" }}>
                      {it.image && <img src={it.image} style={{ width: 50, height: 50, objectFit: "cover" }} alt="" />}
                    </td>
                    <td style={{ padding: "6px 8px", border: "1px solid #eee" }}>{it.desc}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #eee", textAlign: "center" }}>{it.qty}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #eee", textAlign: "right" }}>{it.price}</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #eee", textAlign: "right", fontWeight: 600 }}>{fmt(tot)}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={5} style={{ textAlign: "right", padding: "6px 8px", background: "#5a7a4a", color: "#fff", fontWeight: 700 }}>Section Total</td>
                <td style={{ textAlign: "right", padding: "6px 8px", background: "#5a7a4a", color: "#fff", fontWeight: 700 }}>{fmt(secTotal(sec))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <table style={{ width: 380, borderCollapse: "collapse" }}>
          {[["Sections Subtotal", fmt(allSectionTotal)], ["Installation & Configuration", fmt(installation)], ["Subtotal", fmt(grandSubtotal)], ["Discount", `-${fmt(discount)}`], ["After Discount", fmt(afterDiscount)], ["VAT 5%", fmt(vat)]].map(([k,v]) => (
            <tr key={k}><td style={{ padding: "4px 10px", fontSize: 12 }}>{k}</td><td style={{ padding: "4px 10px", textAlign: "right", fontSize: 12 }}>{v}</td></tr>
          ))}
          <tr><td style={{ padding: "8px 10px", fontWeight: 700, background: "#5a7a4a", color: "#fff", fontSize: 14 }}>Total Amount</td><td style={{ padding: "8px 10px", fontWeight: 700, textAlign: "right", background: "#5a7a4a", color: "#fff", fontSize: 14 }}>{fmt(finalTotal)}</td></tr>
        </table>
      </div>
      <div style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#444", borderTop: "1px solid #ddd", paddingTop: 16 }}>{terms}</div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{ background: "#2d6a4f", color: "#fff", padding: "16px 24px", borderRadius: 8, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Zettanet Technologies — Proposal Generator</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>P.O. Box: 114345 · Abu Dhabi, UAE · info@zettanet.tech</div>
      </div>

      <div style={S.tabs}>
        {["edit","preview"].map(t => <button key={t} onClick={() => setTab(t)} style={S.tabBtn(tab===t)}>{t === "edit" ? "Edit Proposal" : "Preview / Print"}</button>)}
        <button onClick={handlePrint} style={{ ...S.btn("#1a4a32"), marginLeft: "auto" }}>Print / Export PDF</button>
      </div>

      {tab === "edit" && <>
        <div style={S.card}>
          <div style={{ fontWeight: 600, marginBottom: 14, color: "#2d6a4f" }}>Proposal Header</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["company","Company Name"],["companyEmail","Company Email"],["companyAddress","Company Address"],["client","Client Name"],["project","Project Name"],["location","Location"],["date","Date"],["ref","Reference No."]].map(([k,l]) => (
              <div key={k}>
                <label style={S.label}>{l}</label>
                <input value={header[k]} onChange={e => updateHeader(k, e.target.value)} style={S.input} />
              </div>
            ))}
          </div>
        </div>

        {sections.map(sec => (
          <div key={sec.id} style={{ border: "1px solid #ddd", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
            <div style={S.sectionHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <select value={SECTION_NAMES.includes(sec.name) ? sec.name : "Custom"} onChange={e => { if (e.target.value !== "Custom") updateSecName(sec.id, e.target.value); }}
                  style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 4, padding: "3px 6px", fontSize: 13 }}>
                  {SECTION_NAMES.map(n => <option key={n} value={n} style={{ color: "#333" }}>{n}</option>)}
                </select>
                <input value={sec.name} onChange={e => updateSecName(sec.id, e.target.value)} style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.5)", color: "#fff", fontSize: 14, fontWeight: 600, width: 180 }} />
              </div>
              <button onClick={() => removeSection(sec.id)} style={{ background: "rgba(255,0,0,0.25)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 12 }}>Remove Section</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["SN","Photo","Item Description","QTY","Unit Price (AED)","Total",""].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sec.items.map((it, i) => <ItemRow key={it.id} sec={sec} it={it} idx={i} />)}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ ...S.total, background: "#5a7a4a", color: "#fff", fontWeight: 600 }}>Section Total</td>
                    <td style={{ ...S.total, background: "#5a7a4a", color: "#fff", fontWeight: 600 }}>{fmt(secTotal(sec))}</td>
                    <td style={{ background: "#5a7a4a" }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div style={{ padding: "10px 14px", background: "#fafafa" }}>
              <button onClick={() => addItem(sec.id)} style={S.btn()}>+ Add Item</button>
            </div>
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <button onClick={addSection} style={{ ...S.btn("#1a4a32"), padding: "10px 20px", fontSize: 14 }}>+ Add Section</button>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 600, marginBottom: 14, color: "#2d6a4f" }}>Installation & Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={S.label}>Installation / Programming / Configuration (AED)</label>
              <input type="number" value={installation} onChange={e => setInstallation(e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Discount (AED)</label>
              <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} style={S.input} />
            </div>
          </div>
          <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 6, padding: "14px 18px" }}>
            {[["Sections Subtotal", fmt(allSectionTotal)], ["Installation & Configuration", fmt(installation)], ["Subtotal", fmt(grandSubtotal)], ["Discount", `-${fmt(discount)}`], ["After Discount", fmt(afterDiscount)], ["VAT 5%", fmt(vat)]].map(([k,v]) => (
              <div key={k} style={S.summaryRow(false)}><span>{k}</span><span>{v}</span></div>
            ))}
            <div style={S.summaryRow(true)}><span>Total Amount</span><span>{fmt(finalTotal)}</span></div>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 600, marginBottom: 10, color: "#2d6a4f" }}>Terms & Conditions</div>
          <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={12} style={{ ...S.input, fontFamily: "inherit", lineHeight: 1.6 }} />
        </div>
      </>}

      {tab === "preview" && <PrintView />}
    </div>
  );
}