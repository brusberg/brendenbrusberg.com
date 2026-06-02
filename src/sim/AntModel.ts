export type Zone = 'outside' | 'inside';
export type Terrain = 'soil' | 'tunnel';
export type AntState = 'wander' | 'seekFood' | 'carryFood';
export type AntTask = 'forage' | 'dig' | 'nurse';
export type FoodKind = 'crumb' | 'seed' | 'leaf';
export type AntOrigin = 'seed' | 'hatched';
export type CareTarget = { type: 'queen' } | { type: 'larva'; id: number };
export type QueenActivity = 'nurseIdle' | 'broodCare' | 'seekStoredFood' | 'pacing';
export type AntActivity =
  | 'idle'
  | 'seekFood'
  | 'carryFood'
  | 'followFoodTrail'
  | 'returnHome'
  | 'enterNest'
  | 'seekStoredFood'
  | 'eatStoredFood'
  | 'eatFieldFood'
  | 'seekDigSite'
  | 'digging'
  | 'seekCareFood'
  | 'deliverCareFood'
  | 'feedQueen'
  | 'feedLarva'
  | 'nurseIdle';
export type AntActionReason =
  | 'spawn'
  | 'hatchLarva'
  | 'assignTask'
  | 'directFood'
  | 'pickupFood'
  | 'followFoodPheromone'
  | 'exploreRandom'
  | 'followHomePheromone'
  | 'returnHomeFallback'
  | 'staleFoodTrail'
  | 'returnHomeAfterStaleTrail'
  | 'carryToStorage'
  | 'leaveNest'
  | 'enterNest'
  | 'seekStoredFood'
  | 'eatStoredFood'
  | 'eatFieldFood'
  | 'eatCarriedFood'
  | 'hungrySeekFood'
  | 'queenEatStoredFood'
  | 'queenLayLarva'
  | 'larvaEatStoredFood'
  | 'larvaMature'
  | 'larvaStarved'
  | 'pickupCareFood'
  | 'deliverCareFood'
  | 'feedQueen'
  | 'feedLarva'
  | 'seekDigSite'
  | 'digging'
  | 'openTunnel'
  | 'nurseIdle'
  | 'avoidBoundary'
  | 'depositFood';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Cell {
  x: number;
  y: number;
  zone: Zone;
  terrain: Terrain;
  digProgress: number;
  pheromoneFood: number;
  pheromoneHome: number;
}

export interface TaskAllocation {
  forage: number;
  dig: number;
  nurse: number;
}

export interface Ant extends Vec2 {
  id: number;
  origin: AntOrigin;
  age: number;
  hatchedFromLarvaId: number | null;
  task: AntTask;
  activity: AntActivity;
  state: AntState;
  carryingFood: boolean;
  carryingCareFood: boolean;
  carriedFoodKind: FoodKind | null;
  nursingTarget: CareTarget | null;
  hunger: number;
  energy: number;
  heading: number;
  speed: number;
  carryingSeconds: number;
  targetCellIndex: number | null;
  lastAction: AntActionReason;
}

export interface Food extends Vec2 {
  id: number;
  amount: number;
  kind: FoodKind;
}

export interface StoredFoodPellet extends Vec2 {
  id: number;
  siteId: number | null;
  kind: FoodKind;
}

export interface StorageSite extends Vec2 {
  id: number;
  cellIndex: number;
  capacity: number;
  stored: number;
}

export interface Queen extends Vec2 {
  activity: QueenActivity;
  hunger: number;
  layCooldown: number;
  larvaeLaid: number;
  heading: number;
  targetCellIndex: number | null;
  lastAction: AntActionReason;
}

export interface Larva extends Vec2 {
  id: number;
  age: number;
  hunger: number;
  fedProgress: number;
  starvationSeconds: number;
  lastAction: AntActionReason;
}

export interface ColonyEvent extends Vec2 {
  id: number;
  time: number;
  type: AntActionReason;
  antId?: number;
  larvaId?: number;
  foodId?: number;
  storedFoodId?: number;
  storageSiteId?: number | null;
  cellIndex?: number | null;
  amount?: number;
}

interface StorageDestination extends Vec2 {
  cellIndex: number | null;
  siteId: number | null;
}

type DigRoomKind = 'storage' | 'brood' | 'expansion';

interface DigRoom extends Vec2 {
  radiusX: number;
  radiusY: number;
  priority: number;
  kind: DigRoomKind;
}

export interface AntModelConfig {
  seed: number;
  antCount: number;
  initialFoodCount: number;
  foodSenseRadius: number;
  pheromoneSenseRadius: number;
  foodPheromoneDecayPerSecond: number;
  homePheromoneDecayPerSecond: number;
  foodPheromoneDrop: number;
  foodPheromoneFollowChance: number;
  homePheromoneFollowChance: number;
  starvingFoodSenseMultiplier: number;
  directFoodSteer: number;
  foodTrailSteer: number;
  foodTrailOutboundBias: number;
  homeTrailSteer: number;
  homeFallbackSteer: number;
  randomTurnStrength: number;
  staleFoodSearchRadius: number;
  staleTrailClearRadius: number;
  staleTrailReturnDistance: number;
  digRatePerSecond: number;
  digWorkDistance: number;
  boundaryAvoidanceMargin: number;
  foodSpawnRate: number;
  storageSiteCapacity: number;
  antHungerRatePerSecond: number;
  antHungryThreshold: number;
  antFoodValue: number;
  queenHungerRatePerSecond: number;
  queenEatThreshold: number;
  queenFoodValue: number;
  queenLayIntervalSeconds: number;
  queenLayHungerMax: number;
  maxLarvae: number;
  larvaHungerRatePerSecond: number;
  larvaEatThreshold: number;
  larvaFoodValue: number;
  larvaGrowthPerFeed: number;
  larvaMatureSeconds: number;
  larvaGrowthRequired: number;
  larvaStarvationSeconds: number;
  maxAnts: number;
}

export interface AntPatchSnapshot {
  time: number;
  storedFood: number;
  foodCount: number;
  seedAntCount: number;
  hatchedAntCount: number;
  ants: Array<{
    id: number;
    origin: AntOrigin;
    age: number;
    hatchedFromLarvaId: number | null;
    x: number;
    y: number;
    task: AntTask;
    activity: AntActivity;
    state: AntState;
    carryingFood: boolean;
    carryingCareFood: boolean;
    carriedFoodKind: FoodKind | null;
    nursingTarget: CareTarget | null;
    hunger: number;
    lastAction: AntActionReason;
    energy: number;
    nearestFoodDistance: number | null;
    cellFoodPheromone: number;
    cellHomePheromone: number;
    carryingSeconds: number;
    targetCellIndex: number | null;
  }>;
  taskAllocation: TaskAllocation;
  taskCounts: Record<AntTask, number>;
  activityCounts: Record<AntActivity, number>;
  tunnelCount: number;
  frontierCount: number;
  activeDigCells: number;
  tunnelsDug: number;
  food: Array<{
    id: number;
    x: number;
    y: number;
    amount: number;
    kind: Food['kind'];
  }>;
  storedFoodPellets: Array<{
    id: number;
    siteId: number | null;
    x: number;
    y: number;
    kind: FoodKind;
  }>;
  storageSites: StorageSite[];
  queen: {
    x: number;
    y: number;
    activity: QueenActivity;
    hunger: number;
    layCooldown: number;
    larvaeLaid: number;
    heading: number;
    targetCellIndex: number | null;
    lastAction: AntActionReason;
  };
  larvae: Array<{
    id: number;
    x: number;
    y: number;
    age: number;
    hunger: number;
    fedProgress: number;
    starvationSeconds: number;
    lastAction: AntActionReason;
  }>;
  recentEvents: ColonyEvent[];
}

export const GRID_WIDTH = 192;
export const GRID_HEIGHT = 112;
export const SURFACE_ROWS = 42;
export const FIELD_SIZE = GRID_WIDTH * GRID_HEIGHT;
export const FRAME_STEP = 1 / 60;
export const MAX_DELTA = 0.08;
export const NEST_ENTRANCE: Vec2 = { x: GRID_WIDTH / 2, y: SURFACE_ROWS - 1 };
export const STORAGE_CELL: Vec2 = { x: GRID_WIDTH / 2, y: SURFACE_ROWS + 8 };
export const QUEEN_CELL: Vec2 = { x: 71, y: SURFACE_ROWS + 12 };
const MIN_EXPANSION_Y = SURFACE_ROWS + 11;
const ENTRY_EXPANSION_RADIUS = 7;
const MAX_DIG_PLAN_SCORE = 8.2;

export const DEFAULT_ANT_MODEL_CONFIG: AntModelConfig = {
  seed: 1,
  antCount: 3,
  initialFoodCount: 8,
  foodSenseRadius: 11,
  pheromoneSenseRadius: 7,
  foodPheromoneDecayPerSecond: 0.045,
  homePheromoneDecayPerSecond: 0.025,
  foodPheromoneDrop: 0.065,
  foodPheromoneFollowChance: 0.94,
  homePheromoneFollowChance: 1,
  starvingFoodSenseMultiplier: 4.5,
  directFoodSteer: 0.16,
  foodTrailSteer: 0.12,
  foodTrailOutboundBias: 0.035,
  homeTrailSteer: 0.22,
  homeFallbackSteer: 0.12,
  randomTurnStrength: 0.6,
  staleFoodSearchRadius: 14,
  staleTrailClearRadius: 5,
  staleTrailReturnDistance: 28,
  digRatePerSecond: 0.42,
  digWorkDistance: 1.9,
  boundaryAvoidanceMargin: 6,
  foodSpawnRate: 0.35,
  storageSiteCapacity: 9,
  antHungerRatePerSecond: 0.0045,
  antHungryThreshold: 0.72,
  antFoodValue: 0.62,
  queenHungerRatePerSecond: 0.0018,
  queenEatThreshold: 0.58,
  queenFoodValue: 0.65,
  queenLayIntervalSeconds: 24,
  queenLayHungerMax: 0.52,
  maxLarvae: 18,
  larvaHungerRatePerSecond: 0.0042,
  larvaEatThreshold: 0.68,
  larvaFoodValue: 0.64,
  larvaGrowthPerFeed: 1,
  larvaMatureSeconds: 38,
  larvaGrowthRequired: 1,
  larvaStarvationSeconds: 34,
  maxAnts: 24,
};

export class AntModel {
  readonly cells: Cell[] = [];
  readonly ants: Ant[] = [];
  readonly food: Food[] = [];
  readonly storedFoodPellets: StoredFoodPellet[] = [];
  readonly storageSites: StorageSite[] = [];
  readonly queen: Queen = {
    x: QUEEN_CELL.x,
    y: QUEEN_CELL.y,
    activity: 'nurseIdle',
    hunger: 0.28,
    layCooldown: 12,
    larvaeLaid: 0,
    heading: Math.PI,
    targetCellIndex: null,
    lastAction: 'spawn',
  };
  readonly larvae: Larva[] = [];
  readonly config: AntModelConfig;

  elapsed = 0;
  storedFood = 0;
  tunnelsDug = 0;
  taskAllocation: TaskAllocation = {
    forage: 0.62,
    dig: 0.34,
    nurse: 0.04,
  };

  private nextFoodId = 1;
  private nextStoredFoodId = 1;
  private nextStorageSiteId = 1;
  private nextEventId = 1;
  private nextLarvaId = 1;
  private nextAntId = 0;
  private seed: number;
  private taskRebalanceTimer = 0;
  private recentEvents: ColonyEvent[] = [];

  constructor(config: Partial<AntModelConfig> = {}) {
    this.config = { ...DEFAULT_ANT_MODEL_CONFIG, ...config };
    this.seed = this.config.seed;
    this.seedCells();
    this.seedFood();
    this.seedAnts();
    this.rebalanceTasks();
  }

  update(delta: number): void {
    this.elapsed += delta;
    this.taskRebalanceTimer += delta;

    if (this.taskRebalanceTimer >= 1.5) {
      this.taskRebalanceTimer = 0;
      this.rebalanceTasks();
    }

    this.decayPheromones(delta);
    this.reinforceNestPheromone();

    for (const ant of this.ants) {
      this.updateAnt(ant, delta);
    }

    this.updateQueen(delta);
    this.updateLarvae(delta);

    if (this.food.length < this.config.initialFoodCount && this.random() < delta * this.config.foodSpawnRate) {
      this.food.push(this.createFood());
    }
  }

  snapshot(): AntPatchSnapshot {
    const taskCounts = this.taskCounts();
    const activityCounts = this.activityCounts();

    return {
      time: Number(this.elapsed.toFixed(3)),
      storedFood: this.storedFood,
      foodCount: this.food.length,
      seedAntCount: this.ants.filter((ant) => ant.origin === 'seed').length,
      hatchedAntCount: this.ants.filter((ant) => ant.origin === 'hatched').length,
      ants: this.ants.map((ant) => {
        const cell = this.cellAt(ant.x, ant.y);
        const nearest = this.nearestFood(ant, Number.POSITIVE_INFINITY);

        return {
          id: ant.id,
          origin: ant.origin,
          age: Number(ant.age.toFixed(2)),
          hatchedFromLarvaId: ant.hatchedFromLarvaId,
          x: Number(ant.x.toFixed(2)),
          y: Number(ant.y.toFixed(2)),
          task: ant.task,
          activity: ant.activity,
          state: ant.state,
          carryingFood: ant.carryingFood,
          carryingCareFood: ant.carryingCareFood,
          carriedFoodKind: ant.carriedFoodKind,
          nursingTarget: ant.nursingTarget ? { ...ant.nursingTarget } : null,
          hunger: Number(ant.hunger.toFixed(3)),
          lastAction: ant.lastAction,
          energy: Number(ant.energy.toFixed(3)),
          nearestFoodDistance: nearest ? Number(this.distance(ant, nearest).toFixed(2)) : null,
          cellFoodPheromone: Number((cell?.pheromoneFood ?? 0).toFixed(3)),
          cellHomePheromone: Number((cell?.pheromoneHome ?? 0).toFixed(3)),
          carryingSeconds: Number(ant.carryingSeconds.toFixed(2)),
          targetCellIndex: ant.targetCellIndex,
        };
      }),
      taskAllocation: { ...this.taskAllocation },
      taskCounts,
      activityCounts,
      tunnelCount: this.tunnelCount(),
      frontierCount: this.frontierCells().length,
      activeDigCells: this.cells.filter((cell) => cell.digProgress > 0).length,
      tunnelsDug: this.tunnelsDug,
      food: this.food.map((food) => ({
        id: food.id,
        x: Number(food.x.toFixed(2)),
        y: Number(food.y.toFixed(2)),
        amount: food.amount,
        kind: food.kind,
      })),
      storedFoodPellets: this.storedFoodPellets.map((pellet) => ({
        id: pellet.id,
        siteId: pellet.siteId,
        x: Number(pellet.x.toFixed(2)),
        y: Number(pellet.y.toFixed(2)),
        kind: pellet.kind,
      })),
      storageSites: this.storageSites.map((site) => ({
        id: site.id,
        cellIndex: site.cellIndex,
        x: Number(site.x.toFixed(2)),
        y: Number(site.y.toFixed(2)),
        capacity: site.capacity,
        stored: site.stored,
      })),
      queen: {
        x: Number(this.queen.x.toFixed(2)),
        y: Number(this.queen.y.toFixed(2)),
        activity: this.queen.activity,
        hunger: Number(this.queen.hunger.toFixed(3)),
        layCooldown: Number(this.queen.layCooldown.toFixed(2)),
        larvaeLaid: this.queen.larvaeLaid,
        heading: Number(this.queen.heading.toFixed(3)),
        targetCellIndex: this.queen.targetCellIndex,
        lastAction: this.queen.lastAction,
      },
      larvae: this.larvae.map((larva) => ({
        id: larva.id,
        x: Number(larva.x.toFixed(2)),
        y: Number(larva.y.toFixed(2)),
        age: Number(larva.age.toFixed(2)),
        hunger: Number(larva.hunger.toFixed(3)),
        fedProgress: Number(larva.fedProgress.toFixed(2)),
        starvationSeconds: Number(larva.starvationSeconds.toFixed(2)),
        lastAction: larva.lastAction,
      })),
      recentEvents: this.recentEvents.map((event) => ({
        ...event,
        time: Number(event.time.toFixed(3)),
        x: Number(event.x.toFixed(2)),
        y: Number(event.y.toFixed(2)),
      })),
    };
  }

  cellAt(x: number, y: number): Cell | null {
    const px = Math.round(x);
    const py = Math.round(y);

    if (px < 0 || py < 0 || px >= GRID_WIDTH || py >= GRID_HEIGHT) {
      return null;
    }

    return this.cells[this.index(px, py)] ?? null;
  }

  index(x: number, y: number): number {
    return y * GRID_WIDTH + x;
  }

  distance(a: Vec2, b: Vec2): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private emitEvent(
    type: AntActionReason,
    point: Vec2,
    data: Partial<Omit<ColonyEvent, 'id' | 'time' | 'type' | 'x' | 'y'>> = {},
  ): void {
    this.recentEvents.push({
      id: this.nextEventId++,
      time: this.elapsed,
      type,
      x: point.x,
      y: point.y,
      ...data,
    });

    if (this.recentEvents.length > 240) {
      this.recentEvents.splice(0, this.recentEvents.length - 240);
    }
  }

  setTaskAllocation(allocation: Partial<TaskAllocation>): void {
    const forage = Math.max(0, allocation.forage ?? this.taskAllocation.forage);
    const dig = Math.max(0, allocation.dig ?? this.taskAllocation.dig);
    const nurse = Math.max(0, allocation.nurse ?? this.taskAllocation.nurse);
    const total = Math.max(0.001, forage + dig + nurse);

    this.taskAllocation = {
      forage: forage / total,
      dig: dig / total,
      nurse: nurse / total,
    };

    this.taskRebalanceTimer = 0;
    this.rebalanceTasks();
  }

  private seedCells(): void {
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        const zone: Zone = y < SURFACE_ROWS ? 'outside' : 'inside';
        this.cells.push({
          x,
          y,
          zone,
          terrain: zone === 'outside' ? 'tunnel' : 'soil',
          digProgress: 0,
          pheromoneFood: 0,
          pheromoneHome: 0,
        });
      }
    }

    this.openTunnel(NEST_ENTRANCE.x, SURFACE_ROWS, 1);
    this.openTunnel(STORAGE_CELL.x, STORAGE_CELL.y, 1.4);
    this.openTunnel(QUEEN_CELL.x, QUEEN_CELL.y, 1.7);
    this.openLine({ x: NEST_ENTRANCE.x, y: SURFACE_ROWS }, STORAGE_CELL, 0.7);
    this.openLine(STORAGE_CELL, QUEEN_CELL, 0.7);
  }

  private seedFood(): void {
    for (let index = 0; index < this.config.initialFoodCount; index += 1) {
      this.food.push(this.createFood());
    }
  }

  private seedAnts(): void {
    for (let id = 0; id < this.config.antCount; id += 1) {
      this.ants.push({
        id: this.nextAntId++,
        origin: 'seed',
        age: 0,
        hatchedFromLarvaId: null,
        x: NEST_ENTRANCE.x + this.randomBetween(-2, 2),
        y: NEST_ENTRANCE.y + this.randomBetween(-1, 1),
        task: 'forage',
        activity: id % 3 === 0 ? 'idle' : 'seekFood',
        state: id % 3 === 0 ? 'wander' : 'seekFood',
        carryingFood: false,
        carryingCareFood: false,
        carriedFoodKind: null,
        nursingTarget: null,
        hunger: this.randomBetween(0.18, 0.56),
        energy: this.randomBetween(0.65, 1),
        heading: this.randomBetween(0, Math.PI * 2),
        speed: this.randomBetween(6.5, 11.5),
        carryingSeconds: 0,
        targetCellIndex: null,
        lastAction: 'spawn',
      });
    }
  }

  private updateAnt(ant: Ant, delta: number): void {
    const cell = this.cellAt(ant.x, ant.y);
    ant.age += delta;
    ant.hunger = this.clamp(ant.hunger + delta * this.config.antHungerRatePerSecond * (ant.carryingFood || ant.carryingCareFood ? 1.1 : 1), 0, 1);

    if (cell?.zone === 'outside' && ant.carryingFood) {
      cell.pheromoneFood = Math.min(1, cell.pheromoneFood + this.config.foodPheromoneDrop);
    }

    if (ant.carryingFood) {
      this.updateCarrier(ant, delta);
    } else if (ant.carryingCareFood) {
      this.updateNurse(ant, delta);
    } else if (ant.hunger >= this.config.antHungryThreshold) {
      this.updateHungryAnt(ant, delta);
    } else if (ant.task === 'dig') {
      this.updateDigger(ant, delta);
    } else if (ant.task === 'nurse') {
      this.updateNurse(ant, delta);
    } else {
      this.updateForager(ant, delta);
    }

    this.moveAnt(ant, delta);
    ant.energy = this.clamp(ant.energy - delta * (0.002 + Math.max(0, ant.hunger - this.config.antHungryThreshold) * 0.008), 0.2, 1);
  }

  private updateHungryAnt(ant: Ant, delta: number): void {
    ant.carryingSeconds = 0;
    ant.carryingCareFood = false;
    ant.carriedFoodKind = null;
    ant.nursingTarget = null;
    ant.targetCellIndex = null;
    const foodSearchRadius =
      ant.hunger >= 0.96
        ? Number.POSITIVE_INFINITY
        : ant.hunger >= 0.9
          ? this.config.foodSenseRadius * this.config.starvingFoodSenseMultiplier
        : ant.hunger >= 0.82
          ? this.config.foodSenseRadius * 2.2
          : this.config.foodSenseRadius;
    const nearbyFood = this.nearestFood(ant, foodSearchRadius);

    if (nearbyFood && ant.y < SURFACE_ROWS) {
      ant.activity = 'eatFieldFood';
      ant.state = 'seekFood';
      ant.lastAction = 'hungrySeekFood';
      this.steerToward(ant, nearbyFood, this.config.directFoodSteer * 1.25);

      if (this.distance(ant, nearbyFood) < 1.6) {
        this.consumeFieldFood(nearbyFood);
        this.feedAnt(ant, this.config.antFoodValue);
        ant.lastAction = 'eatFieldFood';
      }

      return;
    }

    const storedFood = this.nearestStoredFoodPellet(ant);

    if (storedFood) {
      if (!this.isOpenTunnel(ant.x, ant.y)) {
        const atNestMouth = this.distance(ant, NEST_ENTRANCE) < 2.8;
        ant.activity = 'returnHome';
        ant.state = 'wander';
        ant.lastAction = atNestMouth ? 'enterNest' : 'returnHomeFallback';
        this.steerToward(ant, atNestMouth ? { x: NEST_ENTRANCE.x, y: SURFACE_ROWS } : NEST_ENTRANCE, this.config.homeFallbackSteer * 1.4);
        return;
      }

      ant.activity = 'seekStoredFood';
      ant.state = 'wander';
      ant.lastAction = 'seekStoredFood';
      const storedFoodDestination = this.storageDestinationForPellet(storedFood);
      const storedFoodStep = storedFoodDestination ? this.nextTunnelStepToward(ant, storedFoodDestination) : null;
      ant.targetCellIndex = storedFoodDestination?.cellIndex ?? null;
      this.steerToward(ant, storedFoodStep ?? storedFood, 0.36);

      if (this.canAccessStoredFood(ant, storedFood, storedFoodDestination, 1.65)) {
        this.consumeStoredFoodPellet(storedFood);
        this.feedAnt(ant, this.config.antFoodValue);
        ant.activity = 'eatStoredFood';
        ant.lastAction = 'eatStoredFood';
        ant.targetCellIndex = null;
        ant.heading += this.randomBetween(-0.3, 0.3);
        this.emitEvent('eatStoredFood', ant, { antId: ant.id, storedFoodId: storedFood.id, storageSiteId: storedFood.siteId });
      }

      return;
    }

    if (ant.y >= SURFACE_ROWS - 0.25) {
      ant.activity = 'seekFood';
      ant.state = 'seekFood';
      ant.lastAction = 'leaveNest';
      this.steerTowardNestExit(ant, 0.38);
      return;
    }

    const scentedCell = this.bestScentCell(ant);
    ant.activity = 'seekFood';
    ant.state = 'seekFood';
    ant.lastAction = 'hungrySeekFood';

    if (scentedCell && this.random() < this.config.foodPheromoneFollowChance) {
      this.steerToward(ant, scentedCell, this.config.foodTrailSteer * 1.2);
    } else {
      ant.heading += this.randomBetween(-this.config.randomTurnStrength, this.config.randomTurnStrength) * delta * 8;
    }
  }

  private updateCarrier(ant: Ant, delta: number): void {
    ant.task = 'forage';
    ant.carryingCareFood = false;
    ant.nursingTarget = null;
    ant.activity = 'returnHome';
    ant.state = 'carryFood';
    ant.carryingSeconds += delta;
    const carrierStuck = ant.carryingSeconds > 38;
    const atNestMouth = this.distance(ant, NEST_ENTRANCE) < (carrierStuck ? 4.6 : 2.8);
    const insideTunnel = this.isOpenTunnel(ant.x, ant.y);

    if (ant.hunger >= 0.92 && ant.carryingSeconds > 35) {
      ant.carryingFood = false;
      ant.carriedFoodKind = null;
      ant.state = 'seekFood';
      ant.activity = 'eatFieldFood';
      ant.carryingSeconds = 0;
      ant.targetCellIndex = null;
      ant.lastAction = 'eatCarriedFood';
      this.feedAnt(ant, this.config.antFoodValue * 0.78);
      this.emitEvent('eatCarriedFood', ant, { antId: ant.id });
      return;
    }

    if (carrierStuck) {
      ant.targetCellIndex = null;
    }

    let storageDestination = this.storageDestinationFor(ant);

    if (insideTunnel && ant.carryingSeconds > 34) {
      storageDestination = this.nearestCarryDepositDestination(ant, ant.carryingSeconds > 52 ? 8 : 5) ?? storageDestination;
    }

    if (insideTunnel && ant.carryingSeconds > 41.5) {
      const currentCell = this.cellAt(ant.x, ant.y);

      if (currentCell && currentCell.zone === 'inside' && currentCell.terrain === 'tunnel') {
        const currentSite = this.storageSiteAt(currentCell);
        this.completeFoodDeposit(
          ant,
          {
            x: currentCell.x,
            y: currentCell.y,
            cellIndex: this.index(currentCell.x, currentCell.y),
            siteId: currentSite?.id ?? null,
          },
          3,
        );
        return;
      }
    }

    if (!insideTunnel && atNestMouth && ant.carryingSeconds > 41.5) {
      const entryCell = this.cellAt(NEST_ENTRANCE.x, SURFACE_ROWS);

      if (entryCell && entryCell.zone === 'inside' && entryCell.terrain === 'tunnel') {
        const entrySite = this.storageSiteAt(entryCell);
        this.completeFoodDeposit(
          ant,
          {
            x: entryCell.x,
            y: entryCell.y,
            cellIndex: this.index(entryCell.x, entryCell.y),
            siteId: entrySite?.id ?? null,
          },
          3,
        );
        return;
      }
    }

    const entryTunnel = { x: NEST_ENTRANCE.x, y: SURFACE_ROWS };
    const tunnelStep = insideTunnel ? this.nextTunnelStepToward(ant, storageDestination) : null;
    const depositTarget = insideTunnel ? (tunnelStep ?? storageDestination) : atNestMouth ? entryTunnel : NEST_ENTRANCE;
    const homeCell = atNestMouth || insideTunnel || carrierStuck ? null : this.bestHomeScentCell(ant);

    ant.targetCellIndex = storageDestination.cellIndex;

    if (homeCell && this.random() < this.config.homePheromoneFollowChance) {
      ant.lastAction = 'followHomePheromone';
      this.steerToward(ant, homeCell, this.config.homeTrailSteer);
    } else if (insideTunnel) {
      ant.lastAction = 'carryToStorage';
    } else if (atNestMouth) {
      ant.lastAction = 'enterNest';
    } else {
      ant.lastAction = 'returnHomeFallback';
    }

    this.steerToward(
      ant,
      depositTarget,
      insideTunnel || atNestMouth ? (carrierStuck ? 0.58 : 0.42) : carrierStuck ? 0.62 : this.config.homeFallbackSteer,
    );

    if (insideTunnel && this.distance(ant, storageDestination) < (carrierStuck ? 2.9 : 2.1)) {
      this.completeFoodDeposit(ant, storageDestination);
    }
  }

  private completeFoodDeposit(ant: Ant, destination: StorageDestination, emergencyCapacity = 0): void {
    ant.carryingFood = false;
    this.depositStoredFood(ant.carriedFoodKind ?? 'crumb', destination, ant, emergencyCapacity);
    ant.carriedFoodKind = null;
    ant.state = 'seekFood';
    ant.activity = 'seekFood';
    ant.carryingSeconds = 0;
    ant.targetCellIndex = null;
    ant.lastAction = 'depositFood';
    this.storedFood += 1;
    ant.heading = Math.atan2(NEST_ENTRANCE.y - ant.y, NEST_ENTRANCE.x - ant.x) + this.randomBetween(-0.18, 0.18);
  }

  private updateForager(ant: Ant, delta: number): void {
    ant.carryingSeconds = 0;
    ant.carryingCareFood = false;
    ant.targetCellIndex = null;
    ant.nursingTarget = null;

    if (ant.y >= SURFACE_ROWS - 0.25) {
      ant.activity = 'seekFood';
      ant.state = 'seekFood';
      ant.lastAction = 'leaveNest';
      this.steerTowardNestExit(ant, 0.36);
      return;
    }

    const nearbyFood = this.nearestFood(ant, this.config.foodSenseRadius);

    if (nearbyFood) {
      ant.activity = 'seekFood';
      ant.state = 'seekFood';
      ant.lastAction = 'directFood';
      this.steerToward(ant, nearbyFood, this.config.directFoodSteer);

      if (this.distance(ant, nearbyFood) < 1.6) {
        nearbyFood.amount -= 1;
        ant.carryingFood = true;
        ant.carriedFoodKind = nearbyFood.kind;
        ant.state = 'carryFood';
        ant.activity = 'carryFood';
        ant.carryingSeconds = 0;
        ant.lastAction = 'pickupFood';
        this.emitEvent('pickupFood', nearbyFood, { antId: ant.id, foodId: nearbyFood.id, amount: nearbyFood.amount });

        if (nearbyFood.amount <= 0) {
          this.food.splice(this.food.indexOf(nearbyFood), 1);
        }
      }

      return;
    }

    const scentedCell = this.bestScentCell(ant);

    if (scentedCell && this.isStaleFoodTrailEnd(ant, scentedCell)) {
      this.clearFoodPheromoneNear(ant, this.config.staleTrailClearRadius);
      const alternateScentedCell = this.bestScentCell(ant);

      if (alternateScentedCell && this.random() < this.config.foodPheromoneFollowChance) {
        ant.activity = 'followFoodTrail';
        ant.lastAction = 'followFoodPheromone';
        this.steerToward(ant, alternateScentedCell, this.config.foodTrailSteer);
      } else if (this.distance(ant, NEST_ENTRANCE) > this.config.staleTrailReturnDistance) {
        ant.activity = 'returnHome';
        ant.lastAction = 'returnHomeAfterStaleTrail';
        this.steerToward(ant, NEST_ENTRANCE, this.config.homeFallbackSteer);
      } else {
        ant.activity = 'idle';
        ant.lastAction = 'staleFoodTrail';
        ant.heading += this.randomBetween(-this.config.randomTurnStrength, this.config.randomTurnStrength) * delta * 12;
      }
    } else if (scentedCell && this.random() < this.config.foodPheromoneFollowChance) {
      ant.activity = 'followFoodTrail';
      ant.lastAction = 'followFoodPheromone';
      this.steerToward(ant, scentedCell, this.config.foodTrailSteer);
    } else {
      ant.activity = 'idle';
      ant.lastAction = 'exploreRandom';
      ant.heading += this.randomBetween(-this.config.randomTurnStrength, this.config.randomTurnStrength) * delta * 8;
    }
  }

  private updateDigger(ant: Ant, delta: number): void {
    ant.carryingSeconds = 0;
    ant.carryingCareFood = false;
    ant.carriedFoodKind = null;
    ant.nursingTarget = null;
    ant.state = 'wander';

    if (!this.isOpenTunnel(ant.x, ant.y)) {
      ant.activity = 'enterNest';
      ant.lastAction = 'enterNest';
      ant.targetCellIndex = null;
      const entryTarget = this.distance(ant, NEST_ENTRANCE) > 1.8 ? NEST_ENTRANCE : { x: NEST_ENTRANCE.x, y: SURFACE_ROWS };
      this.steerToward(ant, entryTarget, 0.42);
      return;
    }

    const target = this.digTargetFor(ant);

    if (!target) {
      ant.activity = 'idle';
      ant.lastAction = 'exploreRandom';
      ant.heading += this.randomBetween(-this.config.randomTurnStrength, this.config.randomTurnStrength) * delta * 4;
      return;
    }

    const workSite = this.nearestTunnelNeighbor(target, ant) ?? STORAGE_CELL;
    ant.targetCellIndex = this.index(target.x, target.y);

    if (this.distance(ant, workSite) > this.config.digWorkDistance) {
      ant.activity = 'seekDigSite';
      ant.lastAction = 'seekDigSite';
      const workSiteStep = this.nextTunnelStepToward(ant, {
        x: workSite.x,
        y: workSite.y,
        cellIndex: this.index(workSite.x, workSite.y),
        siteId: null,
      });
      this.steerToward(ant, workSiteStep ?? workSite, 0.22);
      return;
    }

    ant.activity = 'digging';
    ant.lastAction = 'digging';
    ant.heading += this.randomBetween(-0.16, 0.16);
    target.digProgress = Math.min(1, target.digProgress + delta * this.config.digRatePerSecond * ant.energy);

    if (target.digProgress >= 1) {
      target.terrain = 'tunnel';
      target.digProgress = 0;
      this.tunnelsDug += 1;
      ant.targetCellIndex = null;
      ant.lastAction = 'openTunnel';
      this.emitEvent('openTunnel', target, { antId: ant.id, cellIndex: this.index(target.x, target.y) });
    }
  }

  private updateNurse(ant: Ant, delta: number): void {
    ant.carryingSeconds = 0;
    ant.state = 'wander';
    ant.targetCellIndex = null;

    if (!this.isOpenTunnel(ant.x, ant.y)) {
      ant.activity = 'enterNest';
      ant.lastAction = 'enterNest';
      const entryTarget = this.distance(ant, NEST_ENTRANCE) > 1.8 ? NEST_ENTRANCE : { x: NEST_ENTRANCE.x, y: SURFACE_ROWS };
      this.steerToward(ant, entryTarget, 0.42);
      return;
    }

    if (ant.carryingCareFood) {
      const target = this.validCareTarget(ant.nursingTarget) ?? this.nextCareTarget();
      ant.nursingTarget = target;

      if (!target) {
        ant.carryingCareFood = false;
        ant.carriedFoodKind = null;
        ant.activity = 'nurseIdle';
        ant.lastAction = 'nurseIdle';
        this.steerToward(ant, QUEEN_CELL, 0.1);
        return;
      }

      const targetPoint = this.careTargetPoint(target);
      const targetDestination = targetPoint ? this.tunnelDestinationForPoint(targetPoint) : null;
      const targetStep = targetDestination ? this.nextTunnelStepToward(ant, targetDestination) : null;

      ant.activity = 'deliverCareFood';
      ant.lastAction = 'deliverCareFood';
      ant.targetCellIndex = targetDestination?.cellIndex ?? null;
      this.steerToward(ant, targetStep ?? targetPoint ?? QUEEN_CELL, 0.3);

      if (targetPoint && this.distance(ant, targetPoint) < 1.7) {
        const fed = this.feedCareTarget(target);
        ant.carryingCareFood = false;
        ant.carriedFoodKind = null;
        ant.nursingTarget = null;
        ant.activity = fed === 'queen' ? 'feedQueen' : 'feedLarva';
        ant.lastAction = fed === 'queen' ? 'feedQueen' : 'feedLarva';
        ant.heading += this.randomBetween(-0.35, 0.35);
        this.emitEvent(ant.lastAction, targetPoint, {
          antId: ant.id,
          larvaId: target.type === 'larva' ? target.id : undefined,
        });
      }

      return;
    }

    const target = this.nextCareTarget();
    ant.nursingTarget = target;

    if (!target) {
      ant.carriedFoodKind = null;
      ant.activity = 'nurseIdle';
      ant.lastAction = 'nurseIdle';
      this.steerToward(ant, QUEEN_CELL, 0.08);
      ant.heading += this.randomBetween(-0.25, 0.25) * delta * 4;
      return;
    }

    const storedFood = this.nearestStoredFoodPellet(ant);

    if (!storedFood) {
      ant.carriedFoodKind = null;
      ant.activity = 'seekCareFood';
      ant.lastAction = 'seekStoredFood';
      const storageDestination = this.tunnelDestinationForPoint(STORAGE_CELL);
      const storageStep = storageDestination ? this.nextTunnelStepToward(ant, storageDestination) : null;
      this.steerToward(ant, storageStep ?? STORAGE_CELL, 0.16);
      return;
    }

    ant.activity = 'seekCareFood';
    ant.lastAction = 'seekStoredFood';
    const foodDestination = this.storageDestinationForPellet(storedFood);
    const foodStep = foodDestination ? this.nextTunnelStepToward(ant, foodDestination) : null;
    ant.targetCellIndex = foodDestination?.cellIndex ?? null;
    this.steerToward(ant, foodStep ?? storedFood, 0.28);

    if (this.canAccessStoredFood(ant, storedFood, foodDestination, 1.65)) {
      const kind = storedFood.kind;
      this.consumeStoredFoodPellet(storedFood);
      ant.carryingCareFood = true;
      ant.carriedFoodKind = kind;
      ant.activity = 'deliverCareFood';
      ant.lastAction = 'pickupCareFood';
      ant.targetCellIndex = null;
      this.emitEvent('pickupCareFood', ant, { antId: ant.id, storedFoodId: storedFood.id, storageSiteId: storedFood.siteId });
    }
  }

  private updateQueen(delta: number): void {
    const wasFed = this.queen.lastAction === 'queenEatStoredFood';
    this.queen.hunger = this.clamp(this.queen.hunger + delta * this.config.queenHungerRatePerSecond, 0, 1);
    this.queen.layCooldown = Math.max(0, this.queen.layCooldown - delta);
    this.updateQueenMovement(delta);
    let acted = false;

    if (this.queen.hunger >= this.config.queenEatThreshold && this.storedFoodPellets.length > 0) {
      const storedFood = this.nearestStoredFoodPellet(this.queen);
      const storedFoodDestination = storedFood ? this.storageDestinationForPellet(storedFood) : null;

      if (storedFood && this.canAccessStoredFood(this.queen, storedFood, storedFoodDestination, 1.65)) {
        this.consumeStoredFoodPellet(storedFood);
        this.queen.hunger = this.clamp(this.queen.hunger - this.config.queenFoodValue, 0, 1);
        this.queen.activity = 'seekStoredFood';
        this.queen.targetCellIndex = null;
        this.queen.lastAction = 'queenEatStoredFood';
        this.emitEvent('queenEatStoredFood', this.queen, { storedFoodId: storedFood.id, storageSiteId: storedFood.siteId });
        acted = true;
      }
    }

    if (this.queen.layCooldown <= 0 && this.queen.hunger <= this.config.queenLayHungerMax && this.larvae.length < this.config.maxLarvae) {
      const larva = this.layLarva();
      this.queen.hunger = this.clamp(this.queen.hunger + 0.08, 0, 1);
      this.queen.layCooldown = this.config.queenLayIntervalSeconds * this.randomBetween(0.75, 1.28);
      this.queen.larvaeLaid += 1;
      this.queen.lastAction = 'queenLayLarva';
      this.emitEvent('queenLayLarva', larva, { larvaId: larva.id });
      acted = true;
    }

    if (!acted && !wasFed) {
      this.queen.lastAction = this.queen.hunger >= this.config.queenEatThreshold ? 'seekStoredFood' : 'nurseIdle';
    }
  }

  private updateQueenMovement(delta: number): void {
    const targetCell = this.queenMovementTarget();

    if (!targetCell) {
      this.queen.activity = 'nurseIdle';
      this.queen.targetCellIndex = null;
      this.queen.heading += this.randomBetween(-0.08, 0.08) * delta;
      return;
    }

    const destination = {
      x: targetCell.x,
      y: targetCell.y,
      cellIndex: this.index(targetCell.x, targetCell.y),
      siteId: null,
    };
    const step = this.nextTunnelStepToward(this.queen, destination) ?? targetCell;
    const distanceToTarget = this.distance(this.queen, targetCell);
    this.queen.targetCellIndex = destination.cellIndex;

    if (this.queen.hunger >= this.config.queenEatThreshold && this.storedFoodPellets.length > 0) {
      this.queen.activity = 'seekStoredFood';
    } else if (this.larvae.length > 0) {
      this.queen.activity = 'broodCare';
    } else {
      this.queen.activity = 'pacing';
    }

    if (distanceToTarget < 1.05) {
      this.queen.targetCellIndex = null;
      this.queen.heading += this.randomBetween(-0.18, 0.18) * delta;
      return;
    }

    this.steerQueenToward(step, 0.16);
    this.moveQueen(delta);
  }

  private queenMovementTarget(): Cell | null {
    const existing = this.queen.targetCellIndex === null ? null : this.cells[this.queen.targetCellIndex] ?? null;

    if (existing && existing.zone === 'inside' && existing.terrain === 'tunnel' && this.distance(this.queen, existing) > 1.05) {
      return existing;
    }

    if (this.queen.hunger >= this.config.queenEatThreshold && this.storedFoodPellets.length > 0) {
      const storedFood = this.nearestStoredFoodPellet(this.queen);
      const destination = storedFood ? this.storageDestinationForPellet(storedFood) : null;

      if (destination && destination.cellIndex !== null) {
        return this.cells[destination.cellIndex] ?? null;
      }
    }

    if (this.larvae.length > 0) {
      const broodCenter = this.larvae.reduce(
        (center, larva) => ({
          x: center.x + larva.x / this.larvae.length,
          y: center.y + larva.y / this.larvae.length,
        }),
        { x: 0, y: 0 },
      );
      return this.openTunnelCellNear(broodCenter, 4) ?? this.openTunnelCellNear(this.queen, 3);
    }

    return this.openTunnelCellNear(QUEEN_CELL, 7) ?? this.cellAt(QUEEN_CELL.x, QUEEN_CELL.y);
  }

  private steerQueenToward(target: Vec2, strength: number): void {
    const desired = Math.atan2(target.y - this.queen.y, target.x - this.queen.x);
    let difference = desired - this.queen.heading;

    while (difference > Math.PI) {
      difference -= Math.PI * 2;
    }

    while (difference < -Math.PI) {
      difference += Math.PI * 2;
    }

    this.queen.heading += difference * strength;
  }

  private moveQueen(delta: number): void {
    const previous = { x: this.queen.x, y: this.queen.y };
    const speed = 1.55 * (this.queen.hunger >= this.config.queenEatThreshold ? 1.18 : 1);
    this.queen.x += Math.cos(this.queen.heading) * speed * delta;
    this.queen.y += Math.sin(this.queen.heading) * speed * delta;

    if (!this.isOpenTunnel(this.queen.x, this.queen.y)) {
      this.queen.x = previous.x;
      this.queen.y = previous.y;
      this.queen.heading += Math.PI * this.randomBetween(0.55, 1.45);
      this.queen.targetCellIndex = null;
    }
  }

  private updateLarvae(delta: number): void {
    for (let index = this.larvae.length - 1; index >= 0; index -= 1) {
      const larva = this.larvae[index];

      if (!larva) {
        continue;
      }

      const wasFed = larva.lastAction === 'larvaEatStoredFood';
      larva.age += delta;
      larva.hunger = this.clamp(larva.hunger + delta * this.config.larvaHungerRatePerSecond, 0, 1);

      if (larva.hunger >= 0.98) {
        larva.starvationSeconds += delta;
      } else {
        larva.starvationSeconds = Math.max(0, larva.starvationSeconds - delta * 0.5);
      }

      if (larva.starvationSeconds >= this.config.larvaStarvationSeconds) {
        larva.lastAction = 'larvaStarved';
        this.emitEvent('larvaStarved', larva, { larvaId: larva.id });
        this.larvae.splice(index, 1);
        continue;
      }

      if (
        this.ants.length < this.config.maxAnts &&
        larva.age >= this.config.larvaMatureSeconds &&
        larva.fedProgress >= this.config.larvaGrowthRequired &&
        larva.hunger < 0.86
      ) {
        larva.lastAction = 'larvaMature';
        this.emitEvent('larvaMature', larva, { larvaId: larva.id });
        this.hatchLarva(larva);
        this.larvae.splice(index, 1);
        continue;
      }

      if (!wasFed) {
        larva.lastAction = larva.hunger >= this.config.larvaEatThreshold || this.larvaNeedsGrowthFood(larva) ? 'seekStoredFood' : 'nurseIdle';
      }
    }
  }

  private layLarva(): Larva {
    const point = this.openPointNear(this.queen, 3.2);
    const larva = {
      id: this.nextLarvaId++,
      x: point.x,
      y: point.y,
      age: 0,
      hunger: this.randomBetween(0.18, 0.42),
      fedProgress: 0,
      starvationSeconds: 0,
      lastAction: 'spawn' as AntActionReason,
    };

    this.larvae.push(larva);
    return larva;
  }

  private hatchLarva(larva: Larva): void {
    const ant = {
      id: this.nextAntId++,
      origin: 'hatched',
      age: 0,
      hatchedFromLarvaId: larva.id,
      x: larva.x + this.randomBetween(-0.45, 0.45),
      y: larva.y + this.randomBetween(-0.35, 0.35),
      task: 'nurse',
      activity: 'nurseIdle',
      state: 'wander',
      carryingFood: false,
      carryingCareFood: false,
      carriedFoodKind: null,
      nursingTarget: null,
      hunger: this.randomBetween(0.34, 0.58),
      energy: this.randomBetween(0.52, 0.72),
      heading: this.randomBetween(0, Math.PI * 2),
      speed: this.randomBetween(5.8, 8.4),
      carryingSeconds: 0,
      targetCellIndex: null,
      lastAction: 'hatchLarva',
    } satisfies Ant;
    this.ants.push(ant);
    this.rebalanceTasks();
    this.ants[this.ants.length - 1]!.lastAction = 'hatchLarva';
    this.emitEvent('hatchLarva', ant, { antId: ant.id, larvaId: larva.id });
  }

  private nextCareTarget(): CareTarget | null {
    let bestTarget: CareTarget | null = null;
    let bestScore = 0.42;

    if (this.queen.hunger >= this.config.queenEatThreshold) {
      bestTarget = { type: 'queen' };
      bestScore =
        this.queen.hunger >= 0.86
          ? 1.05 + this.queen.hunger
          : 0.45 + (this.queen.hunger - this.config.queenEatThreshold) * 0.95;
    }

    for (const larva of this.larvae) {
      const growthNeed = this.larvaNeedsGrowthFood(larva) ? 0.34 : 0;
      const hungerNeed = Math.max(0, larva.hunger - 0.38) * 1.15;
      const starvationNeed = larva.starvationSeconds * 0.08;
      const score = hungerNeed + growthNeed + starvationNeed + Math.min(0.24, larva.age / this.config.larvaMatureSeconds * 0.14);

      if (score > bestScore) {
        bestTarget = { type: 'larva', id: larva.id };
        bestScore = score;
      }
    }

    return bestTarget;
  }

  private validCareTarget(target: CareTarget | null): CareTarget | null {
    if (!target) {
      return null;
    }

    if (target.type === 'queen') {
      return target;
    }

    return this.larvae.some((larva) => larva.id === target.id) ? target : null;
  }

  private careTargetPoint(target: CareTarget): Vec2 | null {
    if (target.type === 'queen') {
      return this.queen;
    }

    return this.larvae.find((larva) => larva.id === target.id) ?? null;
  }

  private feedCareTarget(target: CareTarget): 'queen' | 'larva' {
    if (target.type === 'queen') {
      this.queen.hunger = this.clamp(this.queen.hunger - this.config.queenFoodValue, 0, 1);
      this.queen.lastAction = 'queenEatStoredFood';
      this.emitEvent('queenEatStoredFood', this.queen);
      return 'queen';
    }

    const larva = this.larvae.find((candidate) => candidate.id === target.id);

    if (larva) {
      larva.hunger = this.clamp(larva.hunger - this.config.larvaFoodValue, 0, 1);
      larva.fedProgress = Math.min(this.config.larvaGrowthRequired, larva.fedProgress + this.config.larvaGrowthPerFeed);
      larva.starvationSeconds = 0;
      larva.lastAction = 'larvaEatStoredFood';
      this.emitEvent('larvaEatStoredFood', larva, { larvaId: larva.id });
    }

    return 'larva';
  }

  private larvaNeedsGrowthFood(larva: Larva): boolean {
    return larva.fedProgress < this.config.larvaGrowthRequired && larva.age >= this.config.larvaMatureSeconds * 0.35;
  }

  private tunnelDestinationForPoint(point: Vec2): StorageDestination | null {
    const cell = this.cellAt(point.x, point.y);

    if (!cell || cell.zone !== 'inside' || cell.terrain !== 'tunnel') {
      return null;
    }

    return {
      x: cell.x,
      y: cell.y,
      cellIndex: this.index(cell.x, cell.y),
      siteId: null,
    };
  }

  private nestExitDestination(): StorageDestination | null {
    const cell = this.cellAt(NEST_ENTRANCE.x, SURFACE_ROWS);

    if (!cell || cell.zone !== 'inside' || cell.terrain !== 'tunnel') {
      return null;
    }

    return {
      x: cell.x,
      y: cell.y,
      cellIndex: this.index(cell.x, cell.y),
      siteId: null,
    };
  }

  private steerTowardNestExit(ant: Ant, strength: number): void {
    const destination = this.nestExitDestination();

    if (destination && this.isOpenTunnel(ant.x, ant.y)) {
      ant.targetCellIndex = destination.cellIndex;

      if (this.distance(ant, destination) > 1.2) {
        const exitStep = this.nextTunnelStepToward(ant, destination);
        this.steerToward(ant, exitStep ?? destination, strength);
        return;
      }
    }

    ant.targetCellIndex = null;
    this.steerToward(ant, NEST_ENTRANCE, strength);
  }

  private openTunnelCellNear(point: Vec2, radius: number): Cell | null {
    const centerX = Math.round(point.x);
    const centerY = Math.round(point.y);
    let best: Cell | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let y = centerY - Math.ceil(radius); y <= centerY + Math.ceil(radius); y += 1) {
      for (let x = centerX - Math.ceil(radius); x <= centerX + Math.ceil(radius); x += 1) {
        const cell = this.cellAt(x, y);

        if (!cell || cell.zone !== 'inside' || cell.terrain !== 'tunnel') {
          continue;
        }

        const distance = this.distance(point, cell);

        if (distance > radius) {
          continue;
        }

        const score = Math.abs(distance - radius * 0.55) + this.random() * 0.7;

        if (score < bestScore) {
          best = cell;
          bestScore = score;
        }
      }
    }

    return best;
  }

  private openPointNear(point: Vec2, radius: number): Vec2 {
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const angle = this.randomBetween(0, Math.PI * 2);
      const distance = this.randomBetween(0.4, radius);
      const x = point.x + Math.cos(angle) * distance;
      const y = point.y + Math.sin(angle) * distance * 0.7;

      if (this.isOpenTunnel(x, y)) {
        return { x, y };
      }
    }

    return { x: point.x, y: point.y };
  }

  private moveAnt(ant: Ant, delta: number): void {
    const previous = { x: ant.x, y: ant.y };
    const speed = ant.speed * (ant.carryingFood || ant.carryingCareFood ? 0.82 : 1) * ant.energy;
    ant.x += Math.cos(ant.heading) * speed * delta;
    ant.y += Math.sin(ant.heading) * speed * delta;

    if (ant.y >= SURFACE_ROWS && !this.isOpenTunnel(ant.x, ant.y)) {
      ant.x = previous.x;
      ant.y = previous.y;
      ant.heading += Math.PI * this.randomBetween(0.6, 1.4);
    }

    const hitVerticalBounds = ant.y < 3 || ant.y > GRID_HEIGHT - 4;
    const hitHorizontalBounds = ant.x < 3 || ant.x > GRID_WIDTH - 4;

    if (hitVerticalBounds) {
      ant.heading *= -1;
    }

    if (hitHorizontalBounds) {
      ant.heading = Math.PI - ant.heading;
    }

    ant.x = this.clamp(ant.x, 3, GRID_WIDTH - 4);
    ant.y = this.clamp(ant.y, 3, GRID_HEIGHT - 4);

    if (hitVerticalBounds || hitHorizontalBounds || this.isNearBoundary(ant)) {
      const target = ant.y < SURFACE_ROWS
        ? this.surfaceBoundaryRecoveryTarget(ant)
        : NEST_ENTRANCE;
      const strength = ant.hunger > 0.9 || hitVerticalBounds || hitHorizontalBounds ? 0.58 : 0.34;
      this.steerToward(ant, target, strength);

      if (hitVerticalBounds || hitHorizontalBounds) {
        ant.lastAction = 'avoidBoundary';
      }
    }
  }

  private surfaceBoundaryRecoveryTarget(ant: Ant): Vec2 {
    const nearestFood = this.nearestFood(ant, Number.POSITIVE_INFINITY);

    if (ant.hunger > 0.9 && nearestFood) {
      return nearestFood;
    }

    return {
      x: this.clamp(ant.x, this.config.boundaryAvoidanceMargin + 4, GRID_WIDTH - this.config.boundaryAvoidanceMargin - 4),
      y: SURFACE_ROWS * 0.45,
    };
  }

  private steerToward(ant: Ant, target: Vec2, strength: number): void {
    const desired = Math.atan2(target.y - ant.y, target.x - ant.x);
    let difference = desired - ant.heading;

    while (difference > Math.PI) {
      difference -= Math.PI * 2;
    }

    while (difference < -Math.PI) {
      difference += Math.PI * 2;
    }

    ant.heading += difference * strength;
  }

  private isNearBoundary(point: Vec2): boolean {
    const margin = this.config.boundaryAvoidanceMargin;
    return point.x < margin || point.x > GRID_WIDTH - margin || point.y < margin || point.y > GRID_HEIGHT - margin;
  }

  private decayPheromones(delta: number): void {
    const foodDecay = 1 - delta * this.config.foodPheromoneDecayPerSecond;
    const homeDecay = 1 - delta * this.config.homePheromoneDecayPerSecond;

    for (const cell of this.cells) {
      cell.pheromoneFood *= foodDecay;
      cell.pheromoneHome *= homeDecay;
    }
  }

  private reinforceNestPheromone(): void {
    const centerX = Math.round(NEST_ENTRANCE.x);
    const centerY = Math.round(NEST_ENTRANCE.y);

    for (let y = centerY - 12; y <= centerY + 4; y += 1) {
      for (let x = centerX - 12; x <= centerX + 12; x += 1) {
        const cell = this.cellAt(x, y);

        if (!cell || cell.zone !== 'outside') {
          continue;
        }

        const distance = this.distance(cell, NEST_ENTRANCE);
        const marker = Math.max(0, 1 - distance / 13);
        cell.pheromoneHome = Math.max(cell.pheromoneHome, marker);
      }
    }
  }

  private rebalanceTasks(): void {
    const desired = this.desiredTaskCounts();

    for (const task of this.taskOrder()) {
      while (this.ants.filter((ant) => ant.task === task).length < desired[task]) {
        const donor = this.ants.find(
          (ant) =>
            !ant.carryingFood &&
            !ant.carryingCareFood &&
            ant.task !== task &&
            this.ants.filter((candidate) => candidate.task === ant.task).length > desired[ant.task],
        );

        if (!donor) {
          break;
        }

        donor.task = task;
        donor.activity = task === 'forage' ? 'seekFood' : task === 'dig' ? (this.isOpenTunnel(donor.x, donor.y) ? 'seekDigSite' : 'enterNest') : 'nurseIdle';
        donor.state = task === 'forage' ? 'seekFood' : 'wander';
        donor.targetCellIndex = null;
        donor.lastAction = 'assignTask';
      }
    }
  }

  private desiredTaskCounts(): Record<AntTask, number> {
    const total = this.ants.length;
    const counts = { forage: 0, dig: 0, nurse: 0 };

    if (total === 0) {
      return counts;
    }

    const activeTasks = this.taskOrder().filter((task) => this.taskAllocation[task] > 0.015 && (task !== 'nurse' || this.nursingDemandExists()));
    let assigned = 0;

    if (activeTasks.length <= total) {
      for (const task of activeTasks) {
        counts[task] = 1;
        assigned += 1;
      }
    }

    const remaining = total - assigned;

    if (remaining <= 0) {
      return counts;
    }

    const allocations = this.taskOrder().map((task) => ({
      task,
      exact: this.taskAllocation[task] * remaining,
    }));
    const extraCounts = Object.fromEntries(allocations.map(({ task, exact }) => [task, Math.floor(exact)])) as Record<AntTask, number>;
    let extraAssigned = this.taskOrder().reduce((sum, task) => sum + extraCounts[task], 0);

    for (const task of this.taskOrder()) {
      counts[task] += extraCounts[task];
    }

    for (const { task } of [...allocations].sort((a, b) => b.exact % 1 - a.exact % 1)) {
      if (extraAssigned >= remaining) {
        break;
      }

      counts[task] += 1;
      extraAssigned += 1;
    }

    const minimumNurses = this.minimumNurseCount(total);

    while (counts.nurse < minimumNurses) {
      const donor = counts.forage >= counts.dig ? 'forage' : 'dig';

      if (counts[donor] <= 1) {
        break;
      }

      counts[donor] -= 1;
      counts.nurse += 1;
    }

    return counts;
  }

  private taskCounts(): Record<AntTask, number> {
    return this.taskOrder().reduce(
      (counts, task) => {
        counts[task] = this.ants.filter((ant) => ant.task === task).length;
        return counts;
      },
      { forage: 0, dig: 0, nurse: 0 },
    );
  }

  private nursingDemandExists(): boolean {
    return this.larvae.length > 0 || this.queen.hunger >= this.config.queenEatThreshold - 0.08;
  }

  private minimumNurseCount(totalAnts: number): number {
    if (!this.nursingDemandExists()) {
      return 0;
    }

    const larvaPressure = Math.ceil(this.larvae.length / 4);
    const queenPressure = this.queen.hunger >= this.config.queenEatThreshold - 0.04 ? 1 : 0;
    return Math.min(totalAnts, Math.max(1, larvaPressure, queenPressure));
  }

  private activityCounts(): Record<AntActivity, number> {
    return this.activityOrder().reduce(
      (counts, activity) => {
        counts[activity] = this.ants.filter((ant) => ant.activity === activity).length;
        return counts;
      },
      {
        idle: 0,
        seekFood: 0,
        carryFood: 0,
        followFoodTrail: 0,
        returnHome: 0,
        enterNest: 0,
        seekStoredFood: 0,
        eatStoredFood: 0,
        eatFieldFood: 0,
        seekDigSite: 0,
        digging: 0,
        seekCareFood: 0,
        deliverCareFood: 0,
        feedQueen: 0,
        feedLarva: 0,
        nurseIdle: 0,
      },
    );
  }

  private tunnelCount(): number {
    return this.cells.filter((cell) => cell.zone === 'inside' && cell.terrain === 'tunnel').length;
  }

  private frontierCells(): Cell[] {
    return this.cells.filter((cell) => cell.zone === 'inside' && cell.terrain === 'soil' && this.tunnelNeighbors(cell).length > 0);
  }

  private digTargetFor(ant: Ant): Cell | null {
    const existing = ant.targetCellIndex === null ? null : this.cells[ant.targetCellIndex] ?? null;

    if (existing && this.isDigTargetAllowed(existing) && this.digPlanScore(existing) <= MAX_DIG_PLAN_SCORE && this.tunnelNeighbors(existing).length > 0) {
      return existing;
    }

    let best: Cell | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const cell of this.frontierCells()) {
      if (!this.isDigTargetAllowed(cell)) {
        continue;
      }

      const nearestTunnel = this.nearestTunnelNeighbor(cell, ant) ?? cell;
      const planScore = this.digPlanScore(cell);

      if (planScore > MAX_DIG_PLAN_SCORE) {
        continue;
      }

      const tunnelNeighborCount = this.tunnelNeighbors(cell).length;
      const nearbyTunnelCount = this.tunnelCountNear(cell, 2);
      const chamberCore = this.distance(cell, STORAGE_CELL) < 8 || this.distance(cell, QUEEN_CELL) < 8;
      const junctionPenalty = Math.max(0, tunnelNeighborCount - (chamberCore ? 3 : 2)) * 2.4;
      const crowdPenalty = Math.max(0, nearbyTunnelCount - (chamberCore ? 12 : 6)) * 0.72;
      const surfacePenalty = Math.max(0, MIN_EXPANSION_Y + 5 - cell.y) * 4;
      const progressBias = (1 - cell.digProgress) * 1.4;
      const score =
        this.distance(ant, nearestTunnel) * 0.55 +
        planScore +
        junctionPenalty +
        crowdPenalty +
        surfacePenalty +
        progressBias +
        this.random() * 0.7;

      if (score < bestScore) {
        best = cell;
        bestScore = score;
      }
    }

    return best;
  }

  private digPlanScore(cell: Cell): number {
    let bestRoomScore = Number.POSITIVE_INFINITY;

    for (const room of this.digRooms()) {
      const normalized = this.ellipseDistance(cell, room);
      const outsidePenalty = normalized > 1 ? (normalized - 1) * 16 : 0;
      const rimPreference = Math.abs(normalized - 0.72) * 1.1;
      const centerFillBonus = normalized < 0.42 ? -0.45 : 0;
      const score = room.priority + rimPreference + outsidePenalty + centerFillBonus;
      bestRoomScore = Math.min(bestRoomScore, score);
    }

    const corridorScore = this.digCorridorScore(cell);
    return Math.min(bestRoomScore, corridorScore);
  }

  private digRooms(): DigRoom[] {
    const rooms: DigRoom[] = [
      { x: STORAGE_CELL.x - 1, y: STORAGE_CELL.y + 4, radiusX: 4.7, radiusY: 3.7, priority: 0, kind: 'storage' },
      { x: QUEEN_CELL.x, y: QUEEN_CELL.y + 1, radiusX: 4.4, radiusY: 3.3, priority: 0.25, kind: 'brood' },
    ];
    const templates: Array<{ dx: number; dy: number; radiusX: number; radiusY: number; priority: number; kind: DigRoomKind }> = [
      { dx: -14, dy: 14, radiusX: 5.4, radiusY: 4.1, priority: 0.7, kind: 'storage' },
      { dx: 14, dy: 15, radiusX: 5.4, radiusY: 4.1, priority: 0.9, kind: 'storage' },
      { dx: -4, dy: 27, radiusX: 5.8, radiusY: 4.4, priority: 1.1, kind: 'brood' },
      { dx: -27, dy: 25, radiusX: 5.2, radiusY: 4, priority: 1.25, kind: 'storage' },
      { dx: 26, dy: 27, radiusX: 5.2, radiusY: 4, priority: 1.4, kind: 'storage' },
      { dx: -14, dy: 39, radiusX: 5.7, radiusY: 4.3, priority: 1.6, kind: 'brood' },
      { dx: 14, dy: 41, radiusX: 5.7, radiusY: 4.3, priority: 1.75, kind: 'storage' },
      { dx: -33, dy: 43, radiusX: 5.1, radiusY: 3.9, priority: 1.95, kind: 'storage' },
      { dx: 33, dy: 45, radiusX: 5.1, radiusY: 3.9, priority: 2.1, kind: 'storage' },
      { dx: 0, dy: 54, radiusX: 6.2, radiusY: 4.6, priority: 2.3, kind: 'expansion' },
      { dx: -51, dy: 33, radiusX: 5.6, radiusY: 4.1, priority: 2.45, kind: 'storage' },
      { dx: 51, dy: 35, radiusX: 5.6, radiusY: 4.1, priority: 2.6, kind: 'storage' },
      { dx: -42, dy: 56, radiusX: 5.5, radiusY: 4.2, priority: 2.8, kind: 'expansion' },
      { dx: 43, dy: 57, radiusX: 5.5, radiusY: 4.2, priority: 2.95, kind: 'expansion' },
      { dx: -65, dy: 49, radiusX: 5, radiusY: 3.8, priority: 3.15, kind: 'storage' },
      { dx: 65, dy: 51, radiusX: 5, radiusY: 3.8, priority: 3.3, kind: 'storage' },
      { dx: -22, dy: 65, radiusX: 5.7, radiusY: 4, priority: 3.5, kind: 'brood' },
      { dx: 24, dy: 66, radiusX: 5.7, radiusY: 4, priority: 3.65, kind: 'storage' },
    ];
    const unlockedRooms = Math.min(this.digExpansionPhase(), templates.length);

    for (let index = 0; index < unlockedRooms; index += 1) {
      const template = templates[index];

      if (!template) {
        continue;
      }

      rooms.push(this.jitteredDigRoom(index, template));
    }

    return rooms;
  }

  private digExpansionPhase(): number {
    const colonyPressure = this.ants.length + this.larvae.length;
    const populationPhase = Math.floor(Math.max(0, colonyPressure - 6) / 4);
    const tunnelPhase = Math.floor(Math.max(0, this.tunnelsDug - 85) / 55);
    const broodPhase = Math.floor(this.larvae.length / 4);
    const foodPhase = Math.floor(this.storedFoodPellets.length / 16);
    return Math.floor(this.clamp(Math.max(populationPhase, tunnelPhase, broodPhase, foodPhase), 0, 18));
  }

  private jitteredDigRoom(
    index: number,
    template: { dx: number; dy: number; radiusX: number; radiusY: number; priority: number; kind: DigRoomKind },
  ): DigRoom {
    const salt = index * 8;
    const jitterX = Math.round((this.stableUnit(salt + 1) - 0.5) * 6);
    const jitterY = Math.round((this.stableUnit(salt + 2) - 0.5) * 5);
    const radiusX = template.radiusX + (this.stableUnit(salt + 3) - 0.5) * 0.9;
    const radiusY = template.radiusY + (this.stableUnit(salt + 4) - 0.5) * 0.7;

    return {
      x: this.clamp(STORAGE_CELL.x + template.dx + jitterX, 12, GRID_WIDTH - 12),
      y: this.clamp(STORAGE_CELL.y + template.dy + jitterY, MIN_EXPANSION_Y + 2, GRID_HEIGHT - 7),
      radiusX,
      radiusY,
      priority: template.priority + index * 0.04,
      kind: template.kind,
    };
  }

  private digCorridorScore(cell: Cell): number {
    const rooms = this.digRooms();
    const corridors: Array<[Vec2, Vec2, number]> = [
      [{ x: NEST_ENTRANCE.x, y: SURFACE_ROWS }, STORAGE_CELL, 0.95],
      [STORAGE_CELL, QUEEN_CELL, 1.05],
    ];

    for (let index = 2; index < rooms.length; index += 1) {
      const room = rooms[index];

      if (!room) {
        continue;
      }

      let parent: DigRoom = rooms[0] ?? room;
      let parentScore = Number.POSITIVE_INFINITY;

      for (let parentIndex = 0; parentIndex < index; parentIndex += 1) {
        const candidate = rooms[parentIndex];

        if (!candidate) {
          continue;
        }

        const broodPenalty = candidate.kind === 'brood' && room.kind === 'storage' ? 4 : 0;
        const score = this.distance(room, candidate) + broodPenalty + candidate.priority * 1.5;

        if (score < parentScore) {
          parent = candidate;
          parentScore = score;
        }
      }

      corridors.push([parent, room, 1.2 + room.priority * 0.55]);
    }

    let best = Number.POSITIVE_INFINITY;

    for (const [from, to, priority] of corridors) {
      const distance = this.distanceToSegment(cell, from, to);
      best = Math.min(best, priority + Math.max(0, distance - 0.95) * 8 + distance * 0.2);
    }

    return best;
  }

  private stableUnit(salt: number): number {
    let value = Math.imul(this.config.seed ^ 0x9e3779b1, 0x85ebca6b + salt);
    value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
    value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  }

  private ellipseDistance(point: Vec2, room: DigRoom): number {
    const dx = (point.x - room.x) / room.radiusX;
    const dy = (point.y - room.y) / room.radiusY;
    return Math.hypot(dx, dy);
  }

  private distanceToSegment(point: Vec2, from: Vec2, to: Vec2): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      return this.distance(point, from);
    }

    const t = this.clamp(((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared, 0, 1);
    return this.distance(point, { x: from.x + dx * t, y: from.y + dy * t });
  }

  private isDigTargetAllowed(cell: Cell): boolean {
    if (cell.zone !== 'inside' || cell.terrain !== 'soil') {
      return false;
    }

    if (cell.y < MIN_EXPANSION_Y) {
      return false;
    }

    if (this.distance(cell, NEST_ENTRANCE) < ENTRY_EXPANSION_RADIUS) {
      return false;
    }

    return true;
  }

  private nearestTunnelNeighbor(cell: Cell, point: Vec2): Cell | null {
    let best: Cell | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const neighbor of this.tunnelNeighbors(cell)) {
      const distance = this.distance(point, neighbor);

      if (distance < bestDistance) {
        best = neighbor;
        bestDistance = distance;
      }
    }

    return best;
  }

  private tunnelNeighbors(cell: Cell): Cell[] {
    return this.neighborCells(cell).filter((neighbor) => neighbor.zone === 'inside' && neighbor.terrain === 'tunnel');
  }

  private tunnelCountNear(point: Vec2, radius: number): number {
    let count = 0;
    const centerX = Math.round(point.x);
    const centerY = Math.round(point.y);

    for (let y = centerY - radius; y <= centerY + radius; y += 1) {
      for (let x = centerX - radius; x <= centerX + radius; x += 1) {
        const cell = this.cellAt(x, y);

        if (cell?.zone === 'inside' && cell.terrain === 'tunnel' && this.distance(point, cell) <= radius) {
          count += 1;
        }
      }
    }

    return count;
  }

  private neighborCells(cell: Cell): Cell[] {
    const neighbors: Cell[] = [];
    const offsets = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const offset of offsets) {
      const neighbor = this.cellAt(cell.x + offset.x, cell.y + offset.y);

      if (neighbor) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  private taskOrder(): AntTask[] {
    return ['forage', 'dig', 'nurse'];
  }

  private activityOrder(): AntActivity[] {
    return [
      'idle',
      'seekFood',
      'carryFood',
      'followFoodTrail',
      'returnHome',
      'enterNest',
      'seekStoredFood',
      'eatStoredFood',
      'eatFieldFood',
      'seekDigSite',
      'digging',
      'seekCareFood',
      'deliverCareFood',
      'feedQueen',
      'feedLarva',
      'nurseIdle',
    ];
  }

  private createFood(): Food {
    const kinds: FoodKind[] = ['crumb', 'seed', 'leaf'];
    const kind = kinds[Math.floor(this.random() * kinds.length)] ?? 'crumb';

    return {
      id: this.nextFoodId++,
      x: this.randomBetween(12, GRID_WIDTH - 12),
      y: this.randomBetween(8, SURFACE_ROWS - 8),
      amount: Math.floor(this.randomBetween(3, 9)),
      kind,
    };
  }

  private consumeFieldFood(food: Food): void {
    food.amount -= 1;

    if (food.amount <= 0) {
      this.food.splice(this.food.indexOf(food), 1);
    }
  }

  private feedAnt(ant: Ant, value: number): void {
    ant.hunger = this.clamp(ant.hunger - value, 0, 1);
    ant.energy = this.clamp(ant.energy + value * 0.35, 0.2, 1);
  }

  private nearestStoredFoodPellet(point: Vec2, maxDistance = Number.POSITIVE_INFINITY): StoredFoodPellet | null {
    let nearest: StoredFoodPellet | null = null;
    let nearestDistance = maxDistance;

    for (const pellet of this.storedFoodPellets) {
      const distance = this.storedFoodAccessDistance(point, pellet);

      if (distance < nearestDistance) {
        nearest = pellet;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private canAccessStoredFood(point: Vec2, pellet: StoredFoodPellet, destination: StorageDestination | null, radius: number): boolean {
    if (this.distance(point, pellet) <= radius) {
      return true;
    }

    if (destination && this.distance(point, destination) <= radius) {
      return true;
    }

    if (pellet.siteId === null) {
      return false;
    }

    const site = this.storageSites.find((candidate) => candidate.id === pellet.siteId);
    return site ? this.distance(point, site) <= radius : false;
  }

  private storedFoodAccessDistance(point: Vec2, pellet: StoredFoodPellet): number {
    const distances = [this.distance(point, pellet)];
    const destination = this.storageDestinationForPellet(pellet);

    if (destination) {
      distances.push(this.distance(point, destination));
    }

    if (pellet.siteId !== null) {
      const site = this.storageSites.find((candidate) => candidate.id === pellet.siteId);

      if (site) {
        distances.push(this.distance(point, site));
      }
    }

    return Math.min(...distances);
  }

  private consumeStoredFoodPellet(pellet: StoredFoodPellet): void {
    const index = this.storedFoodPellets.indexOf(pellet);

    if (index < 0) {
      return;
    }

    this.storedFoodPellets.splice(index, 1);
    this.storedFood = Math.max(0, this.storedFood - 1);

    if (pellet.siteId === null) {
      return;
    }

    const site = this.storageSites.find((candidate) => candidate.id === pellet.siteId);

    if (site) {
      site.stored = Math.max(0, site.stored - 1);
    }
  }

  private storageDestinationFor(ant: Ant): StorageDestination {
    const storageSearchPoint = this.isOpenTunnel(ant.x, ant.y) ? ant : STORAGE_CELL;
    const targetCell = this.isOpenTunnel(ant.x, ant.y) && ant.targetCellIndex !== null ? this.cells[ant.targetCellIndex] ?? null : null;

    if (targetCell && targetCell.zone === 'inside' && targetCell.terrain === 'tunnel') {
      const targetSite = this.storageSiteAt(targetCell);

      if (targetSite && targetSite.stored < targetSite.capacity) {
        return this.storageDestinationFromSite(targetSite);
      }

      if (!targetSite && this.storageCapacityFor(targetCell) > 0) {
        return {
          x: targetCell.x,
          y: targetCell.y,
          cellIndex: this.index(targetCell.x, targetCell.y),
          siteId: null,
        };
      }
    }

    const availableSite = this.nearestAvailableStorageSite(storageSearchPoint);

    if (availableSite) {
      return this.storageDestinationFromSite(availableSite);
    }

    const newCell = this.bestNewStorageCell(storageSearchPoint);

    if (newCell) {
      return {
        x: newCell.x,
        y: newCell.y,
        cellIndex: this.index(newCell.x, newCell.y),
        siteId: null,
      };
    }

    return {
      x: NEST_ENTRANCE.x,
      y: NEST_ENTRANCE.y,
      cellIndex: null,
      siteId: null,
    };
  }

  private nearestCarryDepositDestination(point: Vec2, radius: number): StorageDestination | null {
    const centerX = Math.round(point.x);
    const centerY = Math.round(point.y);
    let best: StorageDestination | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let y = centerY - Math.ceil(radius); y <= centerY + Math.ceil(radius); y += 1) {
      for (let x = centerX - Math.ceil(radius); x <= centerX + Math.ceil(radius); x += 1) {
        const cell = this.cellAt(x, y);

        if (!cell || cell.zone !== 'inside' || cell.terrain !== 'tunnel') {
          continue;
        }

        const distance = this.distance(point, cell);

        if (distance > radius) {
          continue;
        }

        const site = this.storageSiteAt(cell);
        const hasRoom = site ? site.stored < site.capacity : this.storageCapacityFor(cell) > 0;

        if (!hasRoom) {
          continue;
        }

        const pathStep = this.nextTunnelStepToward(point, {
          x: cell.x,
          y: cell.y,
          cellIndex: this.index(cell.x, cell.y),
          siteId: site?.id ?? null,
        });

        if (!pathStep) {
          continue;
        }

        const tunnelNeighborCount = this.tunnelNeighbors(cell).length;
        const chamberBonus = tunnelNeighborCount >= 3 ? 1.8 : 0;
        const storageAffinity = this.storageAffinityScore(cell) * 0.45;
        const score = distance + storageAffinity - chamberBonus + this.random() * 0.12;

        if (score < bestScore) {
          bestScore = score;
          best = {
            x: cell.x,
            y: cell.y,
            cellIndex: this.index(cell.x, cell.y),
            siteId: site?.id ?? null,
          };
        }
      }
    }

    return best;
  }

  private storageDestinationFromSite(site: StorageSite): StorageDestination {
    return {
      x: site.x,
      y: site.y,
      cellIndex: site.cellIndex,
      siteId: site.id,
    };
  }

  private storageDestinationForPellet(pellet: StoredFoodPellet): StorageDestination | null {
    if (pellet.siteId !== null) {
      const site = this.storageSites.find((candidate) => candidate.id === pellet.siteId);

      if (site) {
        return this.storageDestinationFromSite(site);
      }
    }

    const cell = this.cellAt(pellet.x, pellet.y);

    if (!cell || cell.zone !== 'inside' || cell.terrain !== 'tunnel') {
      return null;
    }

    return {
      x: cell.x,
      y: cell.y,
      cellIndex: this.index(cell.x, cell.y),
      siteId: null,
    };
  }

  private nextTunnelStepToward(point: Vec2, destination: StorageDestination): Cell | null {
    if (destination.cellIndex === null) {
      return null;
    }

    const start = this.cellAt(point.x, point.y);
    const target = this.cells[destination.cellIndex] ?? null;

    if (!start || !target || start.zone !== 'inside' || start.terrain !== 'tunnel' || target.zone !== 'inside' || target.terrain !== 'tunnel') {
      return null;
    }

    const startIndex = this.index(start.x, start.y);
    const targetIndex = this.index(target.x, target.y);

    if (startIndex === targetIndex) {
      return target;
    }

    const queue: Cell[] = [start];
    const previous = new Map<number, number | null>([[startIndex, null]]);

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];

      if (!current) {
        continue;
      }

      for (const neighbor of this.tunnelNeighbors(current)) {
        const neighborIndex = this.index(neighbor.x, neighbor.y);

        if (previous.has(neighborIndex)) {
          continue;
        }

        previous.set(neighborIndex, this.index(current.x, current.y));

        if (neighborIndex === targetIndex) {
          cursor = queue.length;
          break;
        }

        queue.push(neighbor);
      }
    }

    if (!previous.has(targetIndex)) {
      return null;
    }

    let stepIndex = targetIndex;
    let parentIndex = previous.get(stepIndex) ?? null;

    while (parentIndex !== null && parentIndex !== startIndex) {
      stepIndex = parentIndex;
      parentIndex = previous.get(stepIndex) ?? null;
    }

    return this.cells[stepIndex] ?? null;
  }

  private nearestAvailableStorageSite(point: Vec2): StorageSite | null {
    let best: StorageSite | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    const rooms = this.digRooms();

    for (const site of this.storageSites) {
      if (site.stored >= site.capacity) {
        continue;
      }

      const fullness = site.stored / site.capacity;
      const score =
        this.distance(point, site) * 0.28 +
        fullness * 7 +
        this.storageAffinityScore(site, rooms) * 2.4 +
        this.broodStoragePenalty(site, rooms);

      if (score < bestScore) {
        best = site;
        bestScore = score;
      }
    }

    return best;
  }

  private bestNewStorageCell(point: Vec2): Cell | null {
    let best: Cell | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    const rooms = this.digRooms();

    for (const cell of this.cells) {
      if (cell.zone !== 'inside' || cell.terrain !== 'tunnel' || this.storageSiteAt(cell)) {
        continue;
      }

      const capacity = this.storageCapacityFor(cell);

      if (capacity <= 0) {
        continue;
      }

      const distanceFromEntry = this.distance(cell, NEST_ENTRANCE);
      const entryPenalty = distanceFromEntry < 5 ? 12 : 0;
      const tunnelNeighborCount = this.tunnelNeighbors(cell).length;
      const corridorPenalty = tunnelNeighborCount < 3 ? 2.4 : 0;
      const score =
        this.distance(point, cell) * 0.18 +
        this.storageAffinityScore(cell, rooms) * 3.2 +
        this.broodStoragePenalty(cell, rooms) +
        corridorPenalty -
        capacity * 0.45 -
        Math.min(distanceFromEntry, 22) * 0.06 +
        entryPenalty +
        this.random() * 0.35;

      if (score < bestScore) {
        best = cell;
        bestScore = score;
      }
    }

    return best;
  }

  private storageAffinityScore(point: Vec2, rooms = this.digRooms()): number {
    let best = Number.POSITIVE_INFINITY;

    for (const room of rooms) {
      if (room.kind === 'brood') {
        continue;
      }

      const normalized = this.ellipseDistance(point, room);
      const centerBias = this.distance(point, room) * 0.015;
      const score = normalized <= 1 ? Math.abs(normalized - 0.45) * 0.7 : (normalized - 1) * 6 + 0.9;
      best = Math.min(best, score + room.priority * 0.08 + centerBias);
    }

    return Number.isFinite(best) ? best : 8;
  }

  private broodStoragePenalty(point: Vec2, rooms = this.digRooms()): number {
    let penalty = this.distance(point, this.queen) < 5 ? 3.5 : 0;

    for (const room of rooms) {
      if (room.kind !== 'brood') {
        continue;
      }

      const normalized = this.ellipseDistance(point, room);

      if (normalized < 1.28) {
        penalty += (1.28 - normalized) * 3.4;
      }
    }

    return penalty;
  }

  private storageCapacityFor(cell: Cell): number {
    if (cell.zone !== 'inside' || cell.terrain !== 'tunnel') {
      return 0;
    }

    const tunnelNeighborCount = this.tunnelNeighbors(cell).length;

    if (tunnelNeighborCount < 2 && this.distance(cell, NEST_ENTRANCE) > 4) {
      return 0;
    }

    const corridorCapacity = Math.max(2, Math.floor(this.config.storageSiteCapacity * 0.28));
    const chamberCapacity = this.config.storageSiteCapacity + Math.max(0, tunnelNeighborCount - 2) * 2;
    return tunnelNeighborCount >= 3 ? chamberCapacity : corridorCapacity;
  }

  private storageSiteAt(cell: Cell): StorageSite | null {
    const cellIndex = this.index(cell.x, cell.y);
    return this.storageSites.find((site) => site.cellIndex === cellIndex) ?? null;
  }

  private createStorageSite(cell: Cell, capacity = this.storageCapacityFor(cell)): StorageSite {
    const site = {
      id: this.nextStorageSiteId++,
      cellIndex: this.index(cell.x, cell.y),
      x: cell.x,
      y: cell.y,
      capacity,
      stored: 0,
    };
    this.storageSites.push(site);
    return site;
  }

  private storageSiteFromDestination(destination: StorageDestination, fallbackCapacity = 0): StorageSite | null {
    if (destination.siteId !== null) {
      const site = this.storageSites.find((candidate) => candidate.id === destination.siteId) ?? null;

      if (site && site.stored < site.capacity) {
        return site;
      }
    }

    if (destination.cellIndex === null) {
      return null;
    }

    const cell = this.cells[destination.cellIndex] ?? null;

    if (!cell || cell.zone !== 'inside' || cell.terrain !== 'tunnel') {
      return null;
    }

    const existingSite = this.storageSiteAt(cell);

    if (existingSite) {
      return existingSite.stored < existingSite.capacity ? existingSite : null;
    }

    const capacity = this.storageCapacityFor(cell);

    if (capacity > 0) {
      return this.createStorageSite(cell, capacity);
    }

    return fallbackCapacity > 0 ? this.createStorageSite(cell, fallbackCapacity) : null;
  }

  private depositStoredFood(kind: FoodKind, destination: StorageDestination, ant?: Ant, emergencyCapacity = 0): void {
    const existingSite = this.storageSiteFromDestination(destination, emergencyCapacity);
    const newStorageCell = existingSite ? null : this.bestNewStorageCell(destination);
    const site = existingSite ?? this.nearestAvailableStorageSite(destination) ?? (newStorageCell ? this.createStorageSite(newStorageCell) : null);
    const depositPoint = site ?? destination;
    const capacity = site?.capacity ?? 6;
    const fullness = site ? site.stored / site.capacity : 0;
    const pelletPoint = this.storedFoodPelletPoint(depositPoint, capacity, fullness);
    const storedFoodId = this.nextStoredFoodId++;

    this.storedFoodPellets.push({
      id: storedFoodId,
      siteId: site?.id ?? null,
      kind,
      x: pelletPoint.x,
      y: pelletPoint.y,
    });

    if (site) {
      site.stored += 1;
    }

    this.emitEvent('depositFood', pelletPoint, {
      antId: ant?.id,
      storedFoodId,
      storageSiteId: site?.id ?? null,
      cellIndex: this.cellAt(pelletPoint.x, pelletPoint.y) ? this.index(Math.round(pelletPoint.x), Math.round(pelletPoint.y)) : null,
    });

    if (this.storedFoodPellets.length > 140) {
      const removed = this.storedFoodPellets.shift();
      const removedSite = removed?.siteId === null ? null : this.storageSites.find((candidate) => candidate.id === removed?.siteId);
      this.storedFood = Math.max(0, this.storedFood - 1);

      if (removedSite) {
        removedSite.stored = Math.max(0, removedSite.stored - 1);
      }
    }
  }

  private storedFoodPelletPoint(depositPoint: Vec2, capacity: number, fullness: number): Vec2 {
    const maxRadius = 0.8 + Math.min(3.8, capacity * 0.32 + fullness * 1.2);

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const angle = (this.nextStoredFoodId + attempt) * 2.399 + this.randomBetween(-0.2, 0.2);
      const radius = this.randomBetween(0.2, maxRadius);
      const point = {
        x: depositPoint.x + Math.cos(angle) * radius,
        y: depositPoint.y + Math.sin(angle) * radius * 0.55,
      };

      const safePoint = this.safeTunnelPelletPoint(point);

      if (safePoint) {
        return safePoint;
      }
    }

    const openCell = this.openTunnelCellNear(depositPoint, Math.max(1.4, Math.min(5.2, maxRadius + 0.8)));

    if (openCell) {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const point = {
          x: openCell.x + this.randomBetween(-0.35, 0.35),
          y: openCell.y + this.randomBetween(-0.35, 0.35),
        };

        const safePoint = this.safeTunnelPelletPoint(point);

        if (safePoint) {
          return safePoint;
        }
      }

      return { x: openCell.x, y: openCell.y };
    }

    const cell = this.cellAt(depositPoint.x, depositPoint.y);

    if (cell?.zone === 'inside' && cell.terrain === 'tunnel') {
      return { x: cell.x, y: cell.y };
    }

    return { x: STORAGE_CELL.x, y: STORAGE_CELL.y };
  }

  private safeTunnelPelletPoint(point: Vec2): Vec2 | null {
    const cell = this.cellAt(point.x, point.y);

    if (cell?.zone !== 'inside' || cell.terrain !== 'tunnel') {
      return null;
    }

    return {
      x: cell.x + this.clamp(point.x - cell.x, -0.38, 0.38),
      y: cell.y + this.clamp(point.y - cell.y, -0.38, 0.38),
    };
  }

  private nearestFood(point: Vec2, maxDistance: number): Food | null {
    let nearest: Food | null = null;
    let nearestDistance = maxDistance;

    for (const food of this.food) {
      const distance = this.distance(point, food);

      if (distance < nearestDistance) {
        nearest = food;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private bestScentCell(ant: Ant): Cell | null {
    let best: Cell | null = null;
    let bestScore = 0.03;
    const centerX = Math.round(ant.x);
    const centerY = Math.round(ant.y);
    const currentDistanceHome = this.distance(ant, NEST_ENTRANCE);

    for (let y = centerY - this.config.pheromoneSenseRadius; y <= centerY + this.config.pheromoneSenseRadius; y += 1) {
      for (let x = centerX - this.config.pheromoneSenseRadius; x <= centerX + this.config.pheromoneSenseRadius; x += 1) {
        const cell = this.cellAt(x, y);

        if (!cell || cell.zone !== 'outside') {
          continue;
        }

        const distanceFromAnt = this.distance(ant, cell);
        const outboundProgress = Math.max(0, this.distance(cell, NEST_ENTRANCE) - currentDistanceHome);
        const score =
          cell.pheromoneFood +
          outboundProgress * this.config.foodTrailOutboundBias -
          distanceFromAnt * 0.01 +
          this.random() * 0.02;

        if (score > bestScore) {
          best = cell;
          bestScore = score;
        }
      }
    }

    return best;
  }

  private isStaleFoodTrailEnd(ant: Ant, scentedCell: Cell): boolean {
    const localFood = this.nearestFood(ant, this.config.staleFoodSearchRadius);

    if (localFood) {
      return false;
    }

    const currentCell = this.cellAt(ant.x, ant.y);
    const localFoodPheromone = Math.max(currentCell?.pheromoneFood ?? 0, scentedCell.pheromoneFood);
    return localFoodPheromone > 0.16 && this.distance(ant, scentedCell) < 2.2;
  }

  private clearFoodPheromoneNear(point: Vec2, radius: number): void {
    const centerX = Math.round(point.x);
    const centerY = Math.round(point.y);

    for (let y = centerY - radius; y <= centerY + radius; y += 1) {
      for (let x = centerX - radius; x <= centerX + radius; x += 1) {
        const cell = this.cellAt(x, y);

        if (!cell || this.distance(point, cell) > radius) {
          continue;
        }

        cell.pheromoneFood *= 0.18;
      }
    }
  }

  private bestHomeScentCell(ant: Ant): Cell | null {
    let best: Cell | null = null;
    let bestScore = 0.04;
    const centerX = Math.round(ant.x);
    const centerY = Math.round(ant.y);
    const currentDistanceHome = this.distance(ant, NEST_ENTRANCE);

    for (let y = centerY - this.config.pheromoneSenseRadius; y <= centerY + this.config.pheromoneSenseRadius; y += 1) {
      for (let x = centerX - this.config.pheromoneSenseRadius; x <= centerX + this.config.pheromoneSenseRadius; x += 1) {
        const cell = this.cellAt(x, y);

        if (!cell || cell.zone !== 'outside') {
          continue;
        }

        const distanceFromAnt = this.distance(ant, cell);
        const distanceFromHome = this.distance(cell, NEST_ENTRANCE);

        if (distanceFromAnt < 0.8) {
          continue;
        }

        const homeProgress = currentDistanceHome - distanceFromHome;

        if (homeProgress <= 0.15) {
          continue;
        }

        const score = homeProgress * 0.13 + cell.pheromoneHome * 0.35 - distanceFromAnt * 0.01 + this.random() * 0.006;

        if (score > bestScore) {
          best = cell;
          bestScore = score;
        }
      }
    }

    return best;
  }

  private openLine(from: Vec2, to: Vec2, radius: number): void {
    const steps = Math.max(1, Math.ceil(this.distance(from, to) * 2));

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      this.openTunnel(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, radius);
    }
  }

  private openTunnel(cx: number, cy: number, radius: number): void {
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > radius * radius) {
          continue;
        }

        const cell = this.cellAt(x, y);

        if (cell?.zone === 'inside') {
          cell.terrain = 'tunnel';
        }
      }
    }
  }

  private isOpenTunnel(x: number, y: number): boolean {
    const cell = this.cellAt(x, y);
    return cell?.zone === 'inside' && cell.terrain === 'tunnel';
  }

  private random(): number {
    this.seed |= 0;
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let value = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  private randomBetween(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
