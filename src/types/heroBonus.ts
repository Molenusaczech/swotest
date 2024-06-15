import { effectName } from "./effects";

type heroBonus = {
    type: effectName,
    value: number,
    isUsed: boolean,
}

export type { heroBonus };