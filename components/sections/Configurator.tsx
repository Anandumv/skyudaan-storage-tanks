'use client';

import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { sound } from '@/lib/audio';
import {
  ACCESSORIES,
  APPLICATIONS,
  MOCS,
  ORIENTATIONS,
  calculate,
  formatInr,
  formatNum,
  gaDrawingSvg,
  type VesselConfig,
} from '@/lib/engineering';
import { useFilm } from '@/lib/store';
import { scrollToId } from '../ScrollDriver';

export function specSummary(c: VesselConfig) {
  const r = calculate(c);
  const acc = ACCESSORIES.filter((a) => c.accessories[a.id]).map((a) => a.label);
  return [
    `Application: ${APPLICATIONS.find((a) => a.id === c.application)!.label}`,
    `Orientation: ${ORIENTATIONS.find((o) => o.id === c.orientation)!.label}`,
    `Capacity: ${formatNum(c.capacityLiters)} L`,
    `MOC: ${MOCS.find((m) => m.id === c.moc)!.label}`,
    `Indicative size: Ø ${r.diameterMm} × ${r.lengthMm} mm T/T`,
    `Shell / head: ${r.shellThkMm} / ${r.headThkMm} mm`,
    `Design code: ${r.designCode}`,
    acc.length ? `Accessories: ${acc.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="field">
      <legend className="mono">{label}</legend>
      <div className="seg">
        {options.map((o) => (
          <label key={o.id} className={o.id === value ? 'seg-opt is-on' : 'seg-opt'}>
            <input type="radio" name={label} value={o.id} checked={o.id === value} onChange={() => onChange(o.id)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Configurator() {
  const vessel = useFilm((s) => s.vessel);
  const setRaw = useFilm((s) => s.setVessel);
  const setVessel: typeof setRaw = (patch) => {
    sound?.tick();
    setRaw(patch);
  };
  const drag = useRef<{ x: number; yaw: number } | null>(null);
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, yaw: useFilm.getState().yaw };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current) useFilm.setState({ yaw: drag.current.yaw + (e.clientX - drag.current.x) * 0.01 });
  };
  const onUp = () => (drag.current = null);
  const r = useMemo(() => calculate(vessel), [vessel]);

  const download = () => {
    const blob = new Blob([gaDrawingSvg(vessel)], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkyUdaan-GA-${vessel.capacityLiters / 1000}kL-${vessel.orientation}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const sendToRfq = () => {
    window.dispatchEvent(new CustomEvent('rfq:prefill', { detail: specSummary(vessel) }));
    scrollToId('rfq');
  };

  return (
    <section id="configure" className="configure" aria-labelledby="configure-title">
      <div className="configure-stage" aria-hidden data-cursor="Drag" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div className="configure-dims mono">
          <span>Ø {formatNum(r.diameterMm)} mm</span>
          <span>T/T {formatNum(r.lengthMm)} mm</span>
        </div>
      </div>
      <div className="configure-panel">
        <p className="kicker mono">
          <span className="kicker-num">09</span> General arrangement
        </p>
        <h2 id="configure-title" className="display display--md" data-split>
          Now spec <em>yours.</em>
        </h2>
        <p className="lede">Set the duty. The vessel you just watched being built reshapes to match, with indicative sizing you can send straight to our estimating cell.</p>

        <Segmented label="Application" value={vessel.application} options={APPLICATIONS} onChange={(application) => setVessel({ application })} />
        <Segmented label="Orientation" value={vessel.orientation} options={ORIENTATIONS} onChange={(orientation) => setVessel({ orientation })} />

        <div className="field">
          <label className="mono" htmlFor="capacity">
            Working capacity <output htmlFor="capacity">{formatNum(vessel.capacityLiters)} L</output>
          </label>
          <input
            id="capacity"
            type="range"
            min={5000}
            max={100000}
            step={5000}
            value={vessel.capacityLiters}
            onChange={(e) => setVessel({ capacityLiters: Number(e.target.value) })}
            style={{ ['--p' as string]: `${((vessel.capacityLiters - 5000) / 95000) * 100}%` }}
          />
          <div className="range-scale mono small" aria-hidden>
            <span>5 kL</span>
            <span>50 kL</span>
            <span>100 kL</span>
          </div>
        </div>

        <fieldset className="field">
          <legend className="mono">Material of construction</legend>
          <div className="moc">
            {MOCS.map((m) => (
              <label key={m.id} className={m.id === vessel.moc ? 'moc-opt is-on' : 'moc-opt'}>
                <input type="radio" name="moc" checked={m.id === vessel.moc} onChange={() => setVessel({ moc: m.id })} />
                <span className={`swatch swatch--${m.id}`} aria-hidden />
                <span>
                  {m.label}
                  <small>{m.note}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="mono">Accessories</legend>
          <div className="checks">
            {ACCESSORIES.map((a) => (
              <label key={a.id} className="check">
                <input
                  type="checkbox"
                  checked={vessel.accessories[a.id]}
                  onChange={(e) => setVessel({ accessories: { ...vessel.accessories, [a.id]: e.target.checked } })}
                />
                {a.label}
              </label>
            ))}
          </div>
        </fieldset>

        <dl className="readout" aria-live="polite">
          <div><dt className="mono">Size (Ø × T/T)</dt><dd>{formatNum(r.diameterMm)} × {formatNum(r.lengthMm)} mm</dd></div>
          <div><dt className="mono">Shell / heads</dt><dd>{r.shellThkMm} / {r.headThkMm} mm</dd></div>
          <div><dt className="mono">Tare (est.)</dt><dd>~{formatNum(r.emptyWeightKg)} kg</dd></div>
          <div><dt className="mono">Design code</dt><dd>{r.designCode}</dd></div>
          <div className="readout-price"><dt className="mono">Indicative ex-works</dt><dd>{formatInr(r.estPriceInr)}</dd></div>
        </dl>
        <p className="fine">Indicative sizing and budget only. A firm quote follows a review of your duty, codes and site conditions.</p>

        <div className="cta-row">
          <button className="btn btn--ink" onClick={sendToRfq}>Send this spec for a quote</button>
          <button className="btn btn--line" onClick={download}>Download GA drawing (.svg)</button>
        </div>
      </div>
    </section>
  );
}
