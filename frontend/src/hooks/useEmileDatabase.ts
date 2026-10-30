import { useEffect } from 'react';
import { useEmileStore, TokenItem } from '@/store/useEmileStore';
import { getApiBaseUrl, getWsBaseUrl } from '@/config/constants';

export function useEmileDatabase() {
  const addToken = useEmileStore((state) => state.addToken);
  const updateModel = useEmileStore((state) => state.updateModel);
  const setSimParams = useEmileStore((state) => state.setSimParams);
  const setConnected = useEmileStore((state) => state.setConnected);
  const setThresholds = useEmileStore((state) => state.setThresholds);

  useEffect(() => {
    const apiBase = getApiBaseUrl();
    const wsBase = getWsBaseUrl();

    // 1. Fetch initial snapshot state from PostgreSQL DB via REST API
    async function fetchStateFromDB() {
      try {
        const res = await fetch(`${apiBase}/api/state`);
        if (res.ok) {
          const data = await res.json();
          const counters = data.counters || {};
          const latestModel = data.latest_model;
          const dbTokens = data.tokens || [];

          // Deduplicate tokens by mint address
          const uniqueMap = new Map();
          dbTokens.forEach((t: any) => {
            if (t.mint && !uniqueMap.has(t.mint)) {
              uniqueMap.set(t.mint, t);
            }
          });
          const uniqueTokens = Array.from(uniqueMap.values());

          // Update Store with real Database metrics
          const formattedTokens = uniqueTokens.map((t: any) => ({
            mint: t.mint,
            name: t.name || 'Solana Token',
            symbol: t.symbol || (t.mint ? t.mint.slice(0, 6).toUpperCase() : 'SOL'),
            lore: t.lore || 'No lore description provided.',
            lore_withheld: t.lore_withheld || false,
            logo: t.logo || t.image_url,
            holders: t.holders_48h ?? t.holders ?? null,
            peak_mc: t.peak_mc || 10500,
            status: ((t.label === 'cleared' || t.status === 'passed' || (t.peak_mc && t.peak_mc >= 30000)) ? 'passed' : (t.label === 'held' || t.status === 'stalled') ? 'stalled' : 'pending') as 'passed' | 'stalled' | 'pending',
            hour: t.hour ?? t.launch_hour ?? (t.entered_at || t.launched_at ? new Date(t.entered_at || t.launched_at).getUTCHours() : 4),
            launched_at: t.entered_at || t.launched_at
          }));

          const totalTokensInDB = counters.entered ?? counters.above_10k ?? formattedTokens.length;
          const passedCount = counters.cleared ?? counters.passed_30k ?? 0;
          const stalledCount = counters.held ?? counters.stalled ?? (totalTokensInDB - passedCount);

          useEmileStore.setState({
            tally: {
              all: totalTokensInDB,
              pass: passedCount,
              stall: stalledCount
            },
            counters: {
              pump: counters.pulled ?? counters.pump ?? totalTokensInDB,
              dex: counters.priced ?? counters.dex ?? totalTokensInDB,
              rpc: counters.holder_counts ?? counters.rpc ?? totalTokensInDB
            },
            holdersList: counters.median_holders ? [counters.median_holders] : [],
            tokens: formattedTokens,
            ...(latestModel ? {
              simState: {
                n: latestModel.n_samples ?? latestModel.n,
                auc: latestModel.auc_mean ?? latestModel.auc,
                d: latestModel.capacity_d ?? latestModel.d,
                running: false
              }
            } : {})
          });

          if (data.gates_config || data.locks_config) {
            setThresholds({
              gatesConfig: data.locks_config || data.gates_config,
              targetAuc: data.target_auc ?? 0.60,
              floorAuc: data.floor_auc ?? 0.50
            });
          }

          if (latestModel) {
            updateModel({
              run_id: latestModel.run_id ?? latestModel.id,
              n: latestModel.n_samples ?? latestModel.n,
              n_positive: latestModel.n_positive,
              d: latestModel.capacity_d ?? latestModel.d,
              auc: latestModel.auc_mean ?? latestModel.auc,
              auc_std: latestModel.auc_std,
              epsilon_vc: latestModel.epsilon_vc,
              auc_boot_lower: latestModel.auc_boot_lower,
              proven_floor: latestModel.proven_floor,
              gate_level: latestModel.gate_level ?? latestModel.jar_level ?? 0,
              jar_level: latestModel.gate_level ?? latestModel.jar_level ?? 0,
              locks: latestModel.locks ?? latestModel.gates ?? latestModel.gates_status ?? {},
              gates: latestModel.locks ?? latestModel.gates ?? latestModel.gates_status ?? {},
              held_by_lock: latestModel.held_by_lock ?? latestModel.blocked_by ?? null,
              blocked_by: latestModel.held_by_lock ?? latestModel.blocked_by ?? null,
              hour_rates: latestModel.hour_rates,
              feature_importance: latestModel.feature_importance
            });
          }
          setConnected(true);
        }
      } catch (err) {
        console.warn('Backend REST API unavailable, using cached state:', err);
      }
    }

    fetchStateFromDB();

    // 2. Poll fallback every 15s to match server-side cache
    const pollTimer = setInterval(fetchStateFromDB, 15000);

    // 3. Connect WebSocket for live events
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(`${wsBase}/stream`);

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onclose = () => {
        setConnected(false);
      };

      socket.onerror = () => {
        setConnected(false);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'counters') {
            const c = payload.data;
            useEmileStore.setState((state) => ({
              tally: {
                all: c.entered ?? c.above_10k ?? state.tally.all,
                pass: c.cleared ?? c.passed_30k ?? state.tally.pass,
                stall: c.held ?? c.stalled ?? state.tally.stall
              }
            }));
          } else if (payload.type === 'model' && payload.data) {
            updateModel(payload.data);
            setSimParams({
              n: payload.data.n ?? payload.data.n_samples,
              auc: payload.data.auc ?? payload.data.auc_mean,
              d: payload.data.d ?? payload.data.capacity_d
            });
          } else if (payload.token) {
            const raw = payload.token;
            const newItem: TokenItem = {
              mint: raw.mint,
              name: raw.name || 'Solana Token',
              symbol: raw.symbol || (raw.mint ? raw.mint.slice(0, 6).toUpperCase() : 'SOL'),
              lore: raw.lore || 'No lore description provided.',
              holders: raw.holders_48h ?? raw.holders ?? null,
              peak_mc: raw.peak_mc || 10500,
              status: ((raw.status === 'passed' || raw.label === 'cleared' || (raw.peak_mc && raw.peak_mc >= 30000)) ? 'passed' : (raw.status === 'stalled' || raw.label === 'held') ? 'stalled' : 'pending') as 'passed' | 'stalled' | 'pending',
              hour: raw.hour ?? new Date().getUTCHours(),
              launched_at: raw.entered_at || raw.launched_at || new Date().toISOString()
            };
            addToken(newItem);

            // Sync simState.n live with updated DB total
            const curState = useEmileStore.getState();
            setSimParams({ n: curState.tally.all });
          } else if (payload.model && payload.type !== 'model') {
            updateModel(payload.model);
            setSimParams({
              n: payload.model.n,
              auc: payload.model.auc,
              d: payload.model.d
            });
          }
        } catch (e) {
          // Ignore invalid WS payloads
        }
      };
    } catch (e) {
      setConnected(false);
    }

    return () => {
      clearInterval(pollTimer);
      if (socket) socket.close();
    };
  }, [addToken, updateModel, setSimParams, setConnected, setThresholds]);
}
