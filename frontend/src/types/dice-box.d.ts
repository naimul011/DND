declare module '@3d-dice/dice-box' {
  interface DiceBoxConfig {
    assetPath: string;
    container?: string;
    id?: string;
    gravity?: number;
    mass?: number;
    friction?: number;
    restitution?: number;
    angularDamping?: number;
    linearDamping?: number;
    spinForce?: number;
    throwForce?: number;
    startingHeight?: number;
    settleTimeout?: number;
    offscreen?: boolean;
    delay?: number;
    lightIntensity?: number;
    enableShadows?: boolean;
    shadowTransparency?: number;
    theme?: string;
    themeColor?: string;
    scale?: number;
    suspendSimulation?: boolean;
    origin?: string;
    onBeforeRoll?: (parsedNotation: any) => void;
    onDieComplete?: (dieResult: any) => void;
    onRollComplete?: (rollResult: any) => void;
    onRemoveComplete?: (dieResult: any) => void;
    onThemeConfigLoaded?: (config: any) => void;
    onThemeLoaded?: (config: any) => void;
  }

  interface DieResult {
    groupId: number;
    rollId: number;
    sides: number;
    theme: string;
    themeColor: string | null;
    value: number;
  }

  interface RollGroupResult {
    id: number;
    mods: any[];
    qty: number;
    rolls: DieResult[];
    sides: number;
    theme: string;
    themeColor: string;
    value: number;
  }

  class DiceBox {
    constructor(config: DiceBoxConfig);
    init(): Promise<void>;
    roll(notation: string | string[] | object | object[], options?: { theme?: string; newStartPoint?: boolean }): Promise<RollGroupResult[]>;
    add(notation: string | string[] | object | object[], options?: { theme?: string; newStartPoint?: boolean }): Promise<RollGroupResult[]>;
    reroll(notation: object | object[], options?: { remove?: boolean; newStartPoint?: boolean }): Promise<RollGroupResult[]>;
    remove(notation: object | object[]): Promise<RollGroupResult[]>;
    clear(): void;
    hide(className?: string): void;
    show(): void;
    getRollResults(): RollGroupResult[];
    updateConfig(config: Partial<DiceBoxConfig>): void;
    onBeforeRoll: ((parsedNotation: any) => void) | null;
    onDieComplete: ((dieResult: DieResult) => void) | null;
    onRollComplete: ((rollResult: RollGroupResult[]) => void) | null;
    onRemoveComplete: ((dieResult: DieResult) => void) | null;
    onThemeConfigLoaded: ((config: any) => void) | null;
    onThemeLoaded: ((config: any) => void) | null;
  }

  export default DiceBox;
}
