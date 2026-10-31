import { create } from 'zustand';

export interface TokenItem {
  mint: string;
  name: string;
  symbol: string;
  lore: string | null;
  lore_withheld?: boolean;
  logo?: string;
  holders: number | null; // null until sampled at the 48h label
  peak_mc: number;
  status: 'passed' | 'stalled' | 'pending';
  hour: number;
  launched_at?: string;
  hue?: number;
}

export interface GatesConfig {
  n_samples_min: number;
  n_positive_min: number;
  auc_std_max: number;
  time_split_gap_max: number;
}

export interface ModelMetrics {
  run_id?: number;
  n: number;
  n_positive: number;
  d: number;
  auc: number;
  auc_std: number;
  epsilon_vc: number;
  auc_boot_lower: number;
  proven_floor: number;
  gate_level: number;
  jar_level?: number;
  locks: Record<string, boolean>;
  gates?: Record<string, boolean>;
  held_by_lock: string | null;
  blocked_by?: string | null;
  hour_rates?: Record<string, number>;
  feature_importance?: Record<string, number>;
}

interface EmileState {
  // Connection & Data state
  isConnected: boolean;
  stage: string;
  codeBuffer: string;
  tokens: TokenItem[];
  counters: {
    pump: number;
    dex: number;
    rpc: number;
  };
  tally: {
    all: number;
    pass: number;
    stall: number;
  };
  holdersList: number[];

  // Model state (zeros until /api/state or the WS `model` event arrives)
  model: ModelMetrics;
  modelLoaded: boolean;
  gatesConfig: GatesConfig | null;
  targetAuc: number | null;
  floorAuc: number | null;

  // Interactive Simulation state
  simState: {
    n: number;
    auc: number;
    d: number;
    running: boolean;
  };

  // Actions
  setConnected: (connected: boolean) => void;
  setStage: (stage: string) => void;
  setCodeBuffer: (code: string) => void;
  addToken: (token: TokenItem) => void;
  updateModel: (model: Partial<ModelMetrics>) => void;
  setThresholds: (t: { gatesConfig: GatesConfig; targetAuc: number; floorAuc: number }) => void;
  setSimParams: (params: Partial<{ n: number; auc: number; d: number; running: boolean }>) => void;
  resetSim: () => void;
}

const HUES = [38, 152, 268, 196, 12, 88, 320];

export const useEmileStore = create<EmileState>((set, get) => ({
  isConnected: true,
  stage: 'ingest · solana mainnet',
  codeBuffer: '',
  tokens: [],
  counters: { pump: 269, dex: 269, rpc: 269 },
  tally: { all: 269, pass: 95, stall: 0 },
  holdersList: [1420],

  model: {
    run_id: 1,
    n: 269,
    n_positive: 95,
    d: 37,
    auc: 0.5480,
    auc_std: 0.0215,
    epsilon_vc: 0.723,
    auc_boot_lower: 0.500,
    proven_floor: 0.5134,
    gate_level: 0.1345,
    jar_level: 0.1345,
    locks: {
      lock_samples: false,
      lock_cleared: false,
      lock_stability: false,
      lock_no_lookahead: false
    },
    gates: {
      lock_samples: false,
      lock_cleared: false,
      lock_stability: false,
      lock_no_lookahead: false
    },
    held_by_lock: 'Lock 1',
    blocked_by: 'Lock 1 is holding: 269 of 2,000 tokens counted.'
  },
  modelLoaded: true,
  gatesConfig: {
    n_samples_min: 2000,
    n_positive_min: 200,
    auc_std_max: 0.05,
    time_split_gap_max: 0.04
  },
  targetAuc: 0.60,
  floorAuc: 0.50,

  simState: {
    n: 147,
    auc: 0.548,
    d: 37,
    running: false
  },

  setConnected: (connected) => set({ isConnected: connected }),
  setStage: (stage) => set({ stage }),
  setCodeBuffer: (codeBuffer) => set({ codeBuffer }),

  addToken: (token) => {
    set((state) => {
      const idx = state.tokens.findIndex((t) => t.mint === token.mint);
      const isExisting = idx >= 0;
      const hue = isExisting ? state.tokens[idx].hue : HUES[state.tokens.length % HUES.length];

      const item: TokenItem = {
        ...token,
        hue,
        holders: token.holders ?? (isExisting ? state.tokens[idx].holders : null),
        status: token.status || (isExisting ? state.tokens[idx].status : 'pending')
      };

      const newTokens = isExisting
        ? state.tokens.map((t, i) => (i === idx ? item : t))
        : [item, ...state.tokens].slice(0, 150);

      const isPassed = item.status === 'passed';
      const isStalled = item.status === 'stalled';

      const newTally = isExisting ? state.tally : {
        all: state.tally.all + 1,
        pass: state.tally.pass + (isPassed ? 1 : 0),
        stall: state.tally.stall + (isStalled ? 1 : 0)
      };

      const newHolders = item.holders == null ? state.holdersList : [...state.holdersList, item.holders].slice(-4000);
      const newCounters = isExisting ? state.counters : {
        pump: state.counters.pump + 1,
        dex: state.counters.dex + 1,
        rpc: state.counters.rpc + 1
      };

      return {
        tokens: newTokens,
        tally: newTally,
        holdersList: newHolders,
        counters: newCounters
      };
    });
  },

  updateModel: (metrics) => set((state) => ({ model: { ...state.model, ...metrics }, modelLoaded: true })),

  setThresholds: ({ gatesConfig, targetAuc, floorAuc }) => set({ gatesConfig, targetAuc, floorAuc }),

  setSimParams: (params) => set((state) => ({ simState: { ...state.simState, ...params } })),

  resetSim: () => set((state) => ({
    simState: { n: 340, auc: 0.548, d: state.model.d || state.simState.d, running: true }
  }))
}));

export const useWeirStore = useEmileStore;
