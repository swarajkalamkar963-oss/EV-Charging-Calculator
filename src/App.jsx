import { useState, useCallback, useEffect, useRef } from "react";

const DEFAULTS = { battery: 79, charger: 30, startSoc: 0, targetSoc: 80, efficiency: 90, rate: 8 };

/* ── container-width based breakpoint ── */
function useContainerWidth(ref) {
  const [width, setWidth] = useState(9999);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/* ── slider + number input ── */
function SliderInput({ label, id, min, max, step = 1, value, unit, onChange }) {
  const [text, setText] = useState(String(value));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setText(String(value));
  }, [value]);

  const handleSlider = (e) => onChange(id, Number(e.target.value));

  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      setText(raw);
      const n = parseFloat(raw);
      if (!isNaN(n)) onChange(id, n);
    }
  };

  const handleFocus = (e) => {
    isFocused.current = true;
    e.target.select();
  };

  const handleBlur = () => {
    isFocused.current = false;
    const n = parseFloat(text);
    const clamped = isNaN(n) ? min : Math.min(max, Math.max(min, n));
    setText(String(clamped));
    onChange(id, clamped);
  };

  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="text"
            inputMode="decimal"
            value={text}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{ width: "64px", padding: "4px 6px", background: "#111827", border: "1px solid #374151", borderRadius: "6px", color: "white", fontSize: "13px", textAlign: "right", outline: "none" }}
          />
          <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "32px" }}>{unit}</span>
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={handleSlider}
        style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6b7280", opacity: 0.6, marginTop: "2px" }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

/* ── result card — always full width on mobile ── */
function ResultCard({ label, value, unit, highlight = false, isMobile }) {
  return (
    <div style={{
      background: highlight ? "#052e16" : "#1f2937",
      borderRadius: "12px",
      padding: isMobile ? "14px 16px" : "16px 18px",
      width: "100%",
      boxSizing: "border-box",
    }}>
      <div style={{ fontSize: "12px", color: highlight ? "#34d399" : "#9ca3af", marginBottom: "6px" }}>{label}</div>
      <div style={{
        fontSize: highlight ? (isMobile ? "24px" : "26px") : (isMobile ? "20px" : "22px"),
        fontWeight: "500",
        color: highlight ? "#6ee7b7" : "white",
      }}>
        {value}
        {unit && <span style={{ fontSize: "13px", fontWeight: "400", color: highlight ? "#34d399" : "#9ca3af", marginLeft: "4px" }}>{unit}</span>}
      </div>
    </div>
  );
}

/* ── inputs panel ── */
function InputsPanel({ inputs, handleChange, reset }) {
  const { battery, charger, startSoc, targetSoc, efficiency, rate } = inputs;
  return (
    <>
      <SliderInput label="Battery Capacity"        id="battery"    min={20}  max={150} value={battery}    unit="kWh"   onChange={handleChange} />
      <SliderInput label="Charger Power"           id="charger"    min={1}   max={350} value={charger}    unit="kW"    onChange={handleChange} />
      <SliderInput label="Start State of Charge"  id="startSoc"   min={0}   max={95}  value={startSoc}   unit="%"     onChange={handleChange} />
      <SliderInput label="Target State of Charge" id="targetSoc"  min={5}   max={100} value={targetSoc}  unit="%"     onChange={handleChange} />
      <SliderInput label="Charging Efficiency"     id="efficiency" min={60}  max={99}  value={efficiency} unit="%"     onChange={handleChange} />
      <SliderInput label="Electricity Cost"        id="rate"       min={1}   max={30}  value={rate}       unit="₹/kWh" onChange={handleChange} />
      <button
        onClick={reset}
        style={{ width: "100%", marginTop: "8px", padding: "12px", background: "#111827", border: "1px solid #374151", color: "#9ca3af", fontSize: "14px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}
      >Reset to Defaults</button>
    </>
  );
}

/* ══════════════════════════════════════════ */
export default function App() {
  const [inputs, setInputs] = useState(DEFAULTS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const containerRef = useRef(null);
  const containerWidth = useContainerWidth(containerRef);
  const isMobile = containerWidth > 0 && containerWidth < 700;

  const handleChange = useCallback((id, val) => setInputs((p) => ({ ...p, [id]: val })), []);
  const reset = () => setInputs(DEFAULTS);

  useEffect(() => {
    document.body.style.overflow = (isMobile && drawerOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, drawerOpen]);

  const { battery, charger, startSoc, targetSoc, efficiency, rate } = inputs;
  let timeStr = "--", energy = "--", drawn = "--", rangeKm = "--", cost = "--", chargeType = "Target must exceed start";

  if (targetSoc > startSoc) {
    const eta = efficiency / 100;
    const energyNeeded = battery * (targetSoc - startSoc) / 100;
    const actualDrawn = energyNeeded / eta;
    const timeHours = actualDrawn / charger;
    const hrs = Math.floor(timeHours);
    const mins = Math.round((timeHours - hrs) * 60);
    timeStr = `${hrs} hr ${mins} min`;
    energy = energyNeeded.toFixed(1);
    drawn = actualDrawn.toFixed(1);
    rangeKm = Math.round(energyNeeded * 6.67);
    cost = Math.round(actualDrawn * rate);
    chargeType = charger < 7 ? "Slow AC Charging" : charger < 25 ? "Standard AC/DC" : "Fast DC Charging";
  }

  return (
    /* Outer shell — ref here so ResizeObserver measures real available width */
    <div ref={containerRef} style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0f172a,#1e293b)",
      fontFamily: "Arial, sans-serif",
      color: "white",
      /* Prevent any horizontal overflow */
      overflowX: "hidden",
      boxSizing: "border-box",
      position: "relative",
    }}>

      {/* ── BLUR OVERLAY ── */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed", inset: 0,
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            background: "rgba(0,0,0,0.45)",
            zIndex: 40,
          }}
        />
      )}

      {/* ── MOBILE BOTTOM DRAWER ── */}
      {isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#111827",
          borderRadius: "20px 20px 0 0",
          padding: "20px 18px 36px",
          zIndex: 50,
          transform: drawerOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          boxSizing: "border-box",
        }}>
          <div style={{ width: "40px", height: "4px", background: "#374151", borderRadius: "2px", margin: "0 auto 18px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Inputs</h2>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ background: "#1f2937", border: "none", color: "#9ca3af", fontSize: "18px", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >✕</button>
          </div>
          <InputsPanel inputs={inputs} handleChange={handleChange} reset={reset} />
        </div>
      )}

      {/* ── FLOATING CONTROLS BUTTON — always fixed bottom-right on mobile ── */}
      {isMobile && (
        <button
          onClick={() => setDrawerOpen((o) => !o)}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "20px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "50px",
            padding: "14px 22px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 24px rgba(16,185,129,0.45)",
            zIndex: 60,          /* above drawer overlay */
            fontFamily: "inherit",
            transition: "background 0.2s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
            <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none"/>
            <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/>
            <circle cx="9" cy="18" r="2" fill="currentColor" stroke="none"/>
          </svg>
          Controls
        </button>
      )}

      {/* ══════════ MAIN SCROLLABLE CONTENT ══════════ */}
      <div style={{
        padding: isMobile ? "16px 14px 100px" : "24px",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "100%",
      }}>

        {/* Desktop two-column grid / Mobile single column */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 360px",
          gap: "20px",
          maxWidth: "1100px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}>

          {/* ── LEFT / MAIN column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: 0 }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "46px", height: "46px", flexShrink: 0, background: "#1f2937", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>⚡</div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: isMobile ? "17px" : "20px", fontWeight: "500", margin: 0, wordBreak: "break-word" }}>EV Charging Time Calculator</h1>
                <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0" }}>
                  Calculate charging duration based on charger power and battery size
                </p>
              </div>
            </div>

            {/* Result cards — single column on mobile, 2-col grid on desktop */}
            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                <ResultCard label="Charging Time" value={timeStr} highlight isMobile />
                <ResultCard label="Energy to add" value={energy} unit="kWh" isMobile />
                <ResultCard label="Actual energy drawn" value={drawn} unit="kWh" isMobile />
                <ResultCard label="Range added (est.)" value={rangeKm} unit="km" isMobile />
                <ResultCard label="Charging cost" value={cost !== "--" ? `₹${cost}` : "--"} isMobile />
                <ResultCard label="Charging type" value={chargeType} isMobile />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* wide card spans 2 cols on desktop */}
                <div style={{ background: "#052e16", borderRadius: "12px", padding: "16px 18px", gridColumn: "span 2" }}>
                  <div style={{ fontSize: "12px", color: "#34d399", marginBottom: "6px" }}>Charging Time</div>
                  <div style={{ fontSize: "26px", fontWeight: "500", color: "#6ee7b7" }}>{timeStr}</div>
                </div>
                <ResultCard label="Energy to add" value={energy} unit="kWh" />
                <ResultCard label="Actual energy drawn" value={drawn} unit="kWh" />
                <ResultCard label="Range added (est.)" value={rangeKm} unit="km" />
                <ResultCard label="Charging cost" value={cost !== "--" ? `₹${cost}` : "--"} />
                <ResultCard label="Charging type" value={chargeType} />
              </div>
            )}

            {/* Formula */}
            <div style={{ background: "#1f2937", borderRadius: "12px", padding: isMobile ? "14px" : "18px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>Formula</h3>
              <div style={{ background: "#111827", borderRadius: "8px", padding: isMobile ? "12px" : "14px 16px", fontFamily: "monospace", fontSize: isMobile ? "11px" : "13px", color: "#9ca3af", lineHeight: "2", overflowX: "auto" }}>
                <div style={{ color: "white", marginBottom: "4px" }}>Charging Time (hours) =</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ color: "white" }}>T =</span>
                  <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ borderBottom: "1px solid #6b7280", padding: "0 4px 2px", color: "white", whiteSpace: "nowrap" }}>
                      Battery (kWh) × (SOC<sub>target</sub> − SOC<sub>start</sub>)
                    </span>
                    <span style={{ padding: "2px 4px 0", color: "white", whiteSpace: "nowrap" }}>
                      Charger Power (kW) × η × 100
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: "10px", fontSize: "11px", color: "#6b7280" }}>
                  where η = Efficiency% ÷ 100 &nbsp;|&nbsp; SOC in % (0–100)
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT column — desktop inputs sidebar ── */}
          {!isMobile && (
            <div style={{ background: "#1f2937", borderRadius: "16px", padding: "18px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "500", marginBottom: "16px" }}>Inputs</h2>
              <InputsPanel inputs={inputs} handleChange={handleChange} reset={reset} />
            </div>
          )}

        </div>{/* end grid */}

        {/* ── Information Section ── */}
        <div style={{ maxWidth: "1100px", margin: "40px auto 0", color: "#d1d5db", lineHeight: "1.7" }}>

          <h2 style={{ color: "white", marginBottom: "15px" }}>About this Calculator</h2>
          <p>Calculate how long it takes to charge your electric vehicle at home or at public charging stations. Compare charging times between Level 1, Level 2, and DC fast charging.</p>

          <h2 style={{ color: "white", marginTop: "35px", marginBottom: "15px" }}>How to Use</h2>
          <ol style={{ paddingLeft: "22px", listStylePosition: "outside" }}>
            <li style={{ marginBottom: "8px" }}>Enter your vehicle's battery capacity.</li>
            <li style={{ marginBottom: "8px" }}>Set the charger power (Home: 3–7 kW, Level 2: 7–22 kW, DC Fast: 50–350 kW).</li>
            <li style={{ marginBottom: "8px" }}>Enter your current State of Charge (SOC) — how full your battery is right now.</li>
            <li style={{ marginBottom: "8px" }}>Set your target SOC — 80% is recommended for daily use.</li>
            <li style={{ marginBottom: "8px" }}>View the estimated charging time and cost.</li>
          </ol>

          <h2 style={{ color: "white", marginTop: "35px", marginBottom: "15px" }}>Frequently Asked Questions</h2>

          {[
            { q: "What charger power should I use?", a: "Level 1 (home outlet): 1.4–2.4 kW, Level 2 (home/public): 3.7–22 kW, DC Fast Charging: 50–350 kW. Most home charging is done at 7–11 kW." },
            { q: "Why charge only to 80%?", a: "Lithium-ion batteries charge fastest between 20–80% State of Charge. Charging beyond 80% becomes slower and can increase battery degradation over time." },
            { q: "What affects charging efficiency?", a: "Battery temperature, charger quality, cable losses, and battery conditioning all influence charging efficiency. Typical values range from 85% to 98%." },
          ].map(({ q, a }) => (
            <div key={q} style={{ background: "#111827", padding: "18px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #374151" }}>
              <h3 style={{ color: "white", marginBottom: "8px" }}>{q}</h3>
              <p style={{ margin: 0 }}>{a}</p>
            </div>
          ))}

          <div style={{ textAlign: "center", marginTop: "50px", paddingTop: "20px", borderTop: "1px solid #374151", color: "#9ca3af", fontSize: "14px" }}>
            Created by <strong>Swaraj Kalamkar</strong> ⚡
          </div>
        </div>

      </div>{/* end padding wrapper */}
    </div>
  );
}