import { useState, useCallback } from "react";

const DEFAULTS = { battery: 79, charger: 30, startSoc: 0, targetSoc: 80, efficiency: 90, rate: 8 };

function SliderInput({ label, id, min, max, step = 1, value, unit, onChange }) {
  const handleSlider = (e) => onChange(id, Number(e.target.value));
  const handleNumber = (e) => {
    const clamped = Math.min(max, Math.max(min, Number(e.target.value)));
    onChange(id, isNaN(clamped) ? min : clamped);
  };

  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleNumber}
            style={{
              width: "64px",
              padding: "4px 6px",
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: "6px",
              color: "white",
              fontSize: "13px",
              textAlign: "right",
              outline: "none",
            }}
          />
          <span style={{ fontSize: "11px", color: "#6b7280" }}>{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSlider}
        style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6b7280", opacity: 0.6, marginTop: "2px" }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function ResultCard({ label, value, unit, highlight = false, wide = false }) {
  return (
    <div style={{
      background: highlight ? "#052e16" : "#1f2937",
      borderRadius: "12px",
      padding: "16px 18px",
      gridColumn: wide ? "span 2" : undefined,
    }}>
      <div style={{ fontSize: "12px", color: highlight ? "#34d399" : "#9ca3af", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: wide ? "26px" : "22px", fontWeight: "500", color: highlight ? "#6ee7b7" : "white" }}>
        {value}
        {unit && <span style={{ fontSize: "13px", fontWeight: "400", color: highlight ? "#34d399" : "#9ca3af", marginLeft: "4px" }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function App() {
  const [inputs, setInputs] = useState(DEFAULTS);

  const handleChange = useCallback((id, val) => {
    setInputs((prev) => ({ ...prev, [id]: val }));
  }, []);

  const reset = () => setInputs(DEFAULTS);

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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a,#1e293b)", padding: "24px", fontFamily: "Arial, sans-serif", color: "white" }}>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px", maxWidth: "1100px", margin: "auto" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "46px", height: "46px", background: "#1f2937", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>⚡</div>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: "500", margin: 0 }}>EV Charging Time Calculator</h1>
              <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0" }}>Calculate charging duration based on charger power and battery size</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <ResultCard label="Charging Time" value={timeStr} highlight wide />
            <ResultCard label="Energy to add" value={energy} unit="kWh" />
            <ResultCard label="Actual energy drawn" value={drawn} unit="kWh" />
            <ResultCard label="Range added (est.)" value={rangeKm} unit="km" />
            <ResultCard label="Charging cost" value={cost !== "--" ? `₹${cost}` : "--"} />
            <ResultCard label="Charging type" value={chargeType} />
          </div>

          <div style={{ background: "#1f2937", borderRadius: "12px", padding: "18px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>Formula</h3>
            <div style={{ background: "#111827", borderRadius: "8px", padding: "14px 16px", fontFamily: "monospace", fontSize: "13px", color: "#9ca3af", lineHeight: "2" }}>
              <div style={{ color: "white", marginBottom: "4px" }}>Charging Time (hours) =</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ color: "white" }}>T =</span>
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ borderBottom: "1px solid #6b7280", padding: "0 4px 2px", color: "white", whiteSpace: "nowrap" }}>
                    Battery (kWh) × (State of Charge<sub>target</sub> − State of Charge<sub>start</sub>)
                  </span>
                  <span style={{ padding: "2px 4px 0", color: "white", whiteSpace: "nowrap" }}>
                    Charger Power (kW) × η × 100
                  </span>
                </div>
              </div>
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
                where η = Efficiency% ÷ 100 &nbsp;|&nbsp; State of Charge in % (0–100)
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div style={{ background: "#1f2937", borderRadius: "16px", padding: "18px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "500", marginBottom: "16px" }}>Inputs</h2>

          <SliderInput label="Battery Capacity"                 id="battery"    min={20}  max={150} value={battery}    unit="kWh"    onChange={handleChange} />
          <SliderInput label="Charger Power"                    id="charger"    min={1}   max={350} value={charger}    unit="kW"     onChange={handleChange} />
          <SliderInput label="Current State of Charge (SOC)"   id="startSoc"   min={0}   max={95}  value={startSoc}   unit="%"      onChange={handleChange} />
          <SliderInput label="Target State of Charge (SOC)"    id="targetSoc"  min={5}   max={100} value={targetSoc}  unit="%"      onChange={handleChange} />
          <SliderInput label="Charging Efficiency"              id="efficiency" min={60}  max={99}  value={efficiency} unit="%"      onChange={handleChange} />
          <SliderInput label="Electricity Cost"                 id="rate"       min={1}   max={30}  value={rate}       unit="₹/kWh"  onChange={handleChange} />

          <button
            onClick={reset}
            style={{ width: "100%", marginTop: "8px", padding: "10px", background: "#111827", border: "1px solid #374151", color: "#9ca3af", fontSize: "14px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}
          >
            Reset to Defaults
          </button>
        </div>

      </div>

      {/* Information Section */}
      <div style={{ maxWidth: "1100px", margin: "40px auto 0", color: "#d1d5db", lineHeight: "1.7", textAlign: "left" }}>

        <h2 style={{ color: "white", marginBottom: "15px" }}>About this Calculator</h2>
        <p>
          Calculate how long it takes to charge your electric vehicle at home or at public charging stations.
          Compare charging times between Level 1, Level 2, and DC fast charging.
        </p>

        <h2 style={{ color: "white", marginTop: "35px", marginBottom: "15px" }}>How to Use</h2>
        <ol style={{ paddingLeft: "22px", listStylePosition: "outside", textAlign: "left" }}>
          <li style={{ marginBottom: "8px" }}>
            Enter your vehicle's battery capacity.
          </li>
          <li style={{ marginBottom: "8px" }}>
            Set the charger power (Home: 3–7 kW, Level 2: 7–22 kW, DC Fast: 50–350 kW).
          </li>
          <li style={{ marginBottom: "8px" }}>
            Enter your current State of Charge (SOC) — how full your battery is right now, as a percentage.
          </li>
          <li style={{ marginBottom: "8px" }}>
            Set your target State of Charge (SOC) — 80% is recommended for daily use.
          </li>
          <li style={{ marginBottom: "8px" }}>
            View the estimated charging time and cost.
          </li>
        </ol>

        <h2 style={{ color: "white", marginTop: "35px", marginBottom: "15px" }}>Frequently Asked Questions</h2>

        <div style={{ background: "#111827", padding: "18px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #374151" }}>
          <h3 style={{ color: "white", marginBottom: "8px" }}>What charger power should I use?</h3>
          <p>
            Level 1 (home outlet): 1.4–2.4 kW, Level 2 (home/public): 3.7–22 kW, DC Fast Charging: 50–350 kW.
            Most home charging is done at 7–11 kW.
          </p>
        </div>

        <div style={{ background: "#111827", padding: "18px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #374151" }}>
          <h3 style={{ color: "white", marginBottom: "8px" }}>Why charge only to 80%?</h3>
          <p>
            Lithium-ion batteries charge fastest between 20–80% State of Charge.
            Charging beyond 80% becomes slower and can increase battery degradation over time.
          </p>
        </div>

        <div style={{ background: "#111827", padding: "18px", borderRadius: "12px", border: "1px solid #374151" }}>
          <h3 style={{ color: "white", marginBottom: "8px" }}>What affects charging efficiency?</h3>
          <p>
            Battery temperature, charger quality, cable losses, and battery conditioning all influence charging efficiency.
            Typical values range from 85% to 98%.
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: "50px", paddingTop: "20px", borderTop: "1px solid #374151", color: "#9ca3af", fontSize: "14px" }}>
          Created by <strong>Swaraj Kalamkar</strong> ⚡
        </div>

      </div>
    </div>
  );
}