import { useEffect, useMemo, useReducer } from "react";
import { continentBonuses, territories, territoryById } from "../data/mapData";
import type {
  BattleResult,
  CardSymbol,
  GameLogEntry,
  GameState,
  Phase,
  Player,
  PlayerId,
  TerritoryCard,
  TerritoryState,
} from "../types/game";

const players: Player[] = [
  { id: "blue", name: "Comando Azul", color: "#2563eb", accent: "#dbeafe", isBot: false, cards: [] },
  { id: "red", name: "Frente Vermelha", color: "#dc2626", accent: "#fee2e2", isBot: true, cards: [] },
  { id: "green", name: "Liga Verde", color: "#16a34a", accent: "#dcfce7", isBot: true, cards: [] },
  { id: "gold", name: "Guarda Dourada", color: "#c0841a", accent: "#fef3c7", isBot: true, cards: [] },
];

const symbols: CardSymbol[] = ["triangle", "circle", "square"];

type Action =
  | { type: "selectTerritory"; territoryId: string }
  | { type: "endPhase" }
  | { type: "tradeCards" }
  | { type: "hydrate"; state: GameState }
  | { type: "reset" }
  | { type: "botTurn" };

export interface WarEngine {
  state: GameState;
  currentPlayer: Player;
  activeTerritories: Array<{ id: string; state: TerritoryState }>;
  selectedSource?: string;
  selectedTarget?: string;
  canTradeCards: boolean;
  actions: {
    selectTerritory: (territoryId: string) => void;
    endPhase: () => void;
    tradeCards: () => void;
    hydrate: (state: GameState) => void;
    reset: () => void;
  };
}

export function useWarEngine(): WarEngine {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const currentPlayer = state.players[state.currentPlayerIndex] ?? state.players[0]!;
  const selectedSource = state.selection.sourceId;
  const selectedTarget = state.selection.targetId;
  const canTradeCards = findTradeSet(currentPlayer.cards) !== undefined;

  useEffect(() => {
    if (!currentPlayer.isBot || state.phase === "gameOver") {
      return;
    }

    const timer = window.setTimeout(() => dispatch({ type: "botTurn" }), 650);
    return () => window.clearTimeout(timer);
  }, [currentPlayer.isBot, state.currentPlayerIndex, state.phase, state.territories]);

  return {
    state,
    currentPlayer,
    selectedSource,
    selectedTarget,
    canTradeCards,
    activeTerritories: useMemo(
      () => Object.entries(state.territories).filter(([, territory]) => territory.owner === currentPlayer.id).map(([id, territoryState]) => ({ id, state: territoryState })),
      [currentPlayer.id, state.territories],
    ),
    actions: {
      selectTerritory: (territoryId) => dispatch({ type: "selectTerritory", territoryId }),
      endPhase: () => dispatch({ type: "endPhase" }),
      tradeCards: () => dispatch({ type: "tradeCards" }),
      hydrate: (nextState) => dispatch({ type: "hydrate", state: nextState }),
      reset: () => dispatch({ type: "reset" }),
    },
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "selectTerritory":
      return handleTerritorySelection(state, action.territoryId);
    case "endPhase":
      return advancePhase(state);
    case "tradeCards":
      return tradeCards(state);
    case "hydrate":
      return action.state;
    case "botTurn":
      return playBotStep(state);
    case "reset":
      return createInitialState();
    default:
      return state;
  }
}

function createInitialState(): GameState {
  const shuffledTerritories = shuffle([...territories]);
  const territoryStates: Record<string, TerritoryState> = {};

  shuffledTerritories.forEach((territory, index) => {
    territoryStates[territory.id] = {
      owner: players[index % players.length]!.id,
      troops: 1 + (index % 3 === 0 ? 1 : 0),
    };
  });

  return {
    players: players.map((player) => ({ ...player, cards: [] })),
    territories: territoryStates,
    deck: shuffle(
      territories.map((territory, index) => ({
        territoryId: territory.id,
        symbol: symbols[index % symbols.length]!,
      })),
    ),
    discard: [],
    currentPlayerIndex: 0,
    phase: "reinforce",
    reinforcements: calculateReinforcements(players[0]!.id, territoryStates),
    tradedSets: 0,
    selection: {},
    conqueredThisTurn: false,
    hasFortified: false,
    log: [
      {
        id: 1,
        text: "Operacao iniciada. Distribua reforcos nos seus territorios.",
        tone: "info",
      },
    ],
  };
}

function handleTerritorySelection(state: GameState, territoryId: string): GameState {
  if (state.phase === "gameOver") {
    return state;
  }

  const currentPlayer = state.players[state.currentPlayerIndex]!;
  const clicked = state.territories[territoryId];
  if (!clicked || currentPlayer.isBot) {
    return state;
  }

  if (state.phase === "reinforce") {
    if (clicked.owner !== currentPlayer.id || state.reinforcements <= 0) {
      return addLog(state, "Escolha um territorio seu para receber reforcos.", "danger");
    }

    const next = cloneState(state);
    next.territories[territoryId]!.troops += 1;
    next.reinforcements -= 1;
    next.selection = { sourceId: territoryId };
    return addLog(next, `${territoryById[territoryId]!.name} recebeu 1 tropa.`, "success");
  }

  if (state.phase === "attack") {
    return selectAttackTerritory(state, territoryId, currentPlayer.id);
  }

  return selectFortifyTerritory(state, territoryId, currentPlayer.id);
}

function selectAttackTerritory(state: GameState, territoryId: string, playerId: PlayerId): GameState {
  const clicked = state.territories[territoryId]!;
  const sourceId = state.selection.sourceId;

  if (!sourceId) {
    if (clicked.owner !== playerId || clicked.troops < 2) {
      return addLog(state, "Selecione uma origem sua com pelo menos 2 tropas.", "danger");
    }

    return { ...state, selection: { sourceId: territoryId } };
  }

  if (territoryId === sourceId) {
    return { ...state, selection: {} };
  }

  const source = state.territories[sourceId]!;
  const isAdjacent = territoryById[sourceId]!.neighbors.includes(territoryId);
  if (source.owner !== playerId || source.troops < 2) {
    return { ...state, selection: {} };
  }

  if (!isAdjacent || clicked.owner === playerId) {
    if (clicked.owner === playerId && clicked.troops >= 2) {
      return { ...state, selection: { sourceId: territoryId } };
    }

    return addLog(state, "O alvo precisa ser inimigo e adjacente.", "danger");
  }

  return resolveAttack(state, sourceId, territoryId);
}

function selectFortifyTerritory(state: GameState, territoryId: string, playerId: PlayerId): GameState {
  if (state.hasFortified) {
    return addLog(state, "Remanejamento ja realizado neste turno.", "danger");
  }

  const clicked = state.territories[territoryId]!;
  const sourceId = state.selection.sourceId;

  if (!sourceId) {
    if (clicked.owner !== playerId || clicked.troops < 2) {
      return addLog(state, "Escolha uma origem sua com tropas disponiveis.", "danger");
    }

    return { ...state, selection: { sourceId: territoryId } };
  }

  const source = state.territories[sourceId]!;
  if (clicked.owner !== playerId || !territoryById[sourceId]!.neighbors.includes(territoryId)) {
    return addLog(state, "Destino precisa ser adjacente e aliado.", "danger");
  }

  const next = cloneState(state);
  const movable = Math.max(1, Math.floor((source.troops - 1) / 2));
  next.territories[sourceId]!.troops -= movable;
  next.territories[territoryId]!.troops += movable;
  next.selection = { sourceId, targetId: territoryId };
  next.hasFortified = true;
  return addLog(next, `${movable} tropa(s) remanejada(s) para ${territoryById[territoryId]!.name}.`, "success");
}

function resolveAttack(state: GameState, sourceId: string, targetId: string): GameState {
  const next = cloneState(state);
  const source = next.territories[sourceId]!;
  const target = next.territories[targetId]!;
  const attackDice = Math.min(3, source.troops - 1);
  const defenseDice = Math.min(3, target.troops);
  const attackerRolls = rollDice(attackDice);
  const defenderRolls = rollDice(defenseDice);
  const comparisons = Math.min(attackerRolls.length, defenderRolls.length);
  let attackerLosses = 0;
  let defenderLosses = 0;

  for (let index = 0; index < comparisons; index += 1) {
    if (attackerRolls[index]! > defenderRolls[index]!) {
      defenderLosses += 1;
    } else {
      attackerLosses += 1;
    }
  }

  source.troops -= attackerLosses;
  target.troops -= defenderLosses;

  let conquered = false;
  if (target.troops <= 0) {
    const movingTroops = Math.min(attackDice, source.troops - 1);
    target.owner = source.owner;
    target.troops = Math.max(1, movingTroops);
    source.troops -= target.troops;
    next.conqueredThisTurn = true;
    conquered = true;
  }

  const battle: BattleResult = { attackerRolls, defenderRolls, attackerLosses, defenderLosses, conquered };
  next.latestBattle = battle;
  next.selection = conquered ? { sourceId: targetId } : { sourceId };

  return checkWinner(addLog(next, describeBattle(sourceId, targetId, battle), conquered ? "success" : "info"));
}

function advancePhase(state: GameState): GameState {
  if (state.phase === "reinforce" && state.reinforcements > 0) {
    return addLog(state, "Aloque todos os reforcos antes de atacar.", "danger");
  }

  if (state.phase === "reinforce") {
    return addLog({ ...state, phase: "attack", selection: {} }, "Fase de ataque liberada.", "info");
  }

  if (state.phase === "attack") {
    return addLog({ ...state, phase: "fortify", selection: {} }, "Fase de remanejamento iniciada.", "info");
  }

  if (state.phase === "fortify") {
    return startNextTurn(state);
  }

  return state;
}

function startNextTurn(state: GameState): GameState {
  const next = cloneState(state);
  const currentPlayer = next.players[next.currentPlayerIndex]!;

  if (next.conqueredThisTurn && next.deck.length > 0) {
    currentPlayer.cards = [...currentPlayer.cards, next.deck[0]!];
    next.deck = next.deck.slice(1);
    next.log = addLog(next, `${currentPlayer.name} recebeu uma carta por conquista.`, "success").log;
  }

  const nextIndex = findNextAlivePlayerIndex(next);
  const nextPlayer = next.players[nextIndex]!;
  next.currentPlayerIndex = nextIndex;
  next.phase = "reinforce";
  next.reinforcements = calculateReinforcements(nextPlayer.id, next.territories);
  next.selection = {};
  next.latestBattle = undefined;
  next.conqueredThisTurn = false;
  next.hasFortified = false;
  return addLog(next, `Turno de ${nextPlayer.name}: ${next.reinforcements} reforcos disponiveis.`, "info");
}

function tradeCards(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex]!;
  const set = findTradeSet(currentPlayer.cards);
  if (!set) {
    return addLog(state, "Nao ha conjunto valido para troca.", "danger");
  }

  const next = cloneState(state);
  const nextPlayer = next.players[next.currentPlayerIndex]!;
  const reward = 4 + next.tradedSets * 2;
  const usedIds = new Set(set.map((card) => `${card.territoryId}:${card.symbol}`));
  nextPlayer.cards = nextPlayer.cards.filter((card) => !usedIds.has(`${card.territoryId}:${card.symbol}`));
  next.discard = [...next.discard, ...set];
  next.reinforcements += reward;
  next.tradedSets += 1;
  return addLog(next, `${nextPlayer.name} trocou cartas por ${reward} tropas extras.`, "success");
}

function playBotStep(state: GameState): GameState {
  const bot = state.players[state.currentPlayerIndex]!;

  if (state.phase === "reinforce") {
    let next = state;
    const set = findTradeSet(bot.cards);
    if (set) {
      next = tradeCards(next);
    }

    const owned = getOwnedTerritories(bot.id, next.territories);
    const border = owned.filter((id) => territoryById[id]!.neighbors.some((neighbor) => next.territories[neighbor]!.owner !== bot.id));
    const sorted = [...(border.length > 0 ? border : owned)].sort((a, b) => next.territories[b]!.troops - next.territories[a]!.troops);
    const target = sorted[0];
    if (!target) {
      return checkWinner(next);
    }

    const updated = cloneState(next);
    updated.territories[target]!.troops += updated.reinforcements;
    const placed = updated.reinforcements;
    updated.reinforcements = 0;
    return addLog({ ...updated, phase: "attack" }, `${bot.name} posicionou ${placed} tropas em ${territoryById[target]!.name}.`, "info");
  }

  if (state.phase === "attack") {
    const opportunity = findBestAttack(bot.id, state.territories);
    if (!opportunity) {
      return advancePhase(state);
    }

    return resolveAttack(state, opportunity.sourceId, opportunity.targetId);
  }

  if (state.phase === "fortify") {
    const move = findBotFortify(bot.id, state.territories);
    if (!move) {
      return startNextTurn(state);
    }

    const next = cloneState(state);
    const movable = Math.max(1, Math.floor((next.territories[move.sourceId]!.troops - 1) / 2));
    next.territories[move.sourceId]!.troops -= movable;
    next.territories[move.targetId]!.troops += movable;
    next.hasFortified = true;
    next.log = addLog(next, `${bot.name} remanejou ${movable} tropa(s) para a fronteira.`, "info").log;
    return startNextTurn(next);
  }

  return state;
}

function calculateReinforcements(playerId: PlayerId, territoryStates: Record<string, TerritoryState>): number {
  const ownedIds = getOwnedTerritories(playerId, territoryStates);
  const territoryBonus = Math.max(3, Math.floor(ownedIds.length / 3));
  const continentBonus = Object.entries(continentBonuses).reduce((total, [continent, bonus]) => {
    const controlsContinent = territories
      .filter((territory) => territory.continent === continent)
      .every((territory) => territoryStates[territory.id]!.owner === playerId);
    return total + (controlsContinent ? bonus : 0);
  }, 0);

  return territoryBonus + continentBonus;
}

function findBestAttack(playerId: PlayerId, territoryStates: Record<string, TerritoryState>): { sourceId: string; targetId: string } | undefined {
  const candidates = getOwnedTerritories(playerId, territoryStates)
    .filter((id) => territoryStates[id]!.troops >= 3)
    .flatMap((sourceId) =>
      territoryById[sourceId]!.neighbors
        .filter((targetId) => territoryStates[targetId]!.owner !== playerId)
        .map((targetId) => ({ sourceId, targetId, score: territoryStates[sourceId]!.troops - territoryStates[targetId]!.troops })),
    )
    .filter((candidate) => candidate.score >= 0)
    .sort((a, b) => b.score - a.score);

  return candidates[0];
}

function findBotFortify(playerId: PlayerId, territoryStates: Record<string, TerritoryState>): { sourceId: string; targetId: string } | undefined {
  const owned = getOwnedTerritories(playerId, territoryStates);
  const rear = owned.filter((id) => territoryStates[id]!.troops > 2 && territoryById[id]!.neighbors.every((neighbor) => territoryStates[neighbor]!.owner === playerId));
  const border = owned.filter((id) => territoryById[id]!.neighbors.some((neighbor) => territoryStates[neighbor]!.owner !== playerId));

  for (const sourceId of rear) {
    const targetId = territoryById[sourceId]!.neighbors.find((neighbor) => border.includes(neighbor));
    if (targetId) {
      return { sourceId, targetId };
    }
  }

  return undefined;
}

function findTradeSet(cards: TerritoryCard[]): TerritoryCard[] | undefined {
  if (cards.length < 3) {
    return undefined;
  }

  for (const symbol of symbols) {
    const same = cards.filter((card) => card.symbol === symbol).slice(0, 3);
    if (same.length === 3) {
      return same;
    }
  }

  const mixed = symbols.map((symbol) => cards.find((card) => card.symbol === symbol)).filter((card): card is TerritoryCard => card !== undefined);
  return mixed.length === 3 ? mixed : undefined;
}

function checkWinner(state: GameState): GameState {
  const alive = state.players.filter((player) => getOwnedTerritories(player.id, state.territories).length > 0);
  if (alive.length !== 1) {
    return state;
  }

  return addLog({ ...state, phase: "gameOver", selection: {}, reinforcements: 0 }, `${alive[0]!.name} dominou o mundo.`, "success");
}

function findNextAlivePlayerIndex(state: GameState): number {
  for (let offset = 1; offset <= state.players.length; offset += 1) {
    const index = (state.currentPlayerIndex + offset) % state.players.length;
    if (getOwnedTerritories(state.players[index]!.id, state.territories).length > 0) {
      return index;
    }
  }

  return state.currentPlayerIndex;
}

function getOwnedTerritories(playerId: PlayerId, territoryStates: Record<string, TerritoryState>): string[] {
  return Object.entries(territoryStates).filter(([, territory]) => territory.owner === playerId).map(([id]) => id);
}

function rollDice(amount: number): number[] {
  return Array.from({ length: amount }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
}

function describeBattle(sourceId: string, targetId: string, result: BattleResult): string {
  const base = `${territoryById[sourceId]!.name} atacou ${territoryById[targetId]!.name}: ataque ${result.attackerRolls.join(", ")} vs defesa ${result.defenderRolls.join(", ")}.`;
  if (result.conquered) {
    return `${base} Territorio conquistado.`;
  }

  return `${base} Perdas A/D: ${result.attackerLosses}/${result.defenderLosses}.`;
}

function addLog(state: GameState, text: string, tone: GameLogEntry["tone"]): GameState {
  const entry: GameLogEntry = {
    id: state.log[0] ? state.log[0].id + 1 : 1,
    text,
    tone,
  };

  return { ...state, log: [entry, ...state.log].slice(0, 90) };
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({ ...player, cards: [...player.cards] })),
    territories: Object.fromEntries(Object.entries(state.territories).map(([id, territory]) => [id, { ...territory }])) as Record<string, TerritoryState>,
    deck: [...state.deck],
    discard: [...state.discard],
    selection: { ...state.selection },
    log: [...state.log],
  };
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
  }

  return next;
}
