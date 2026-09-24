import { create } from 'zustand';
import { defaultConfig, type VesselConfig } from './engineering';

interface State {
  /** Film clock: 0 = flat plate … FILM_END = dispatched vessel. Written by scroll, read in useFrame. */
  t: number;
  /** 0 = film framing, 1 = configurator framing. */
  config: number;
  /** Canvas is on screen (later sections cover it). */
  visible: boolean;
  vessel: VesselConfig;
  setVessel: (patch: Partial<VesselConfig>) => void;
}

export const useFilm = create<State>((set) => ({
  t: 0,
  config: 0,
  visible: true,
  vessel: defaultConfig,
  setVessel: (patch) => set((s) => ({ vessel: { ...s.vessel, ...patch } })),
}));
