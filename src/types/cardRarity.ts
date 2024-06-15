import { heroCid } from "@/data/heroTypeData";

type energy = {
    value: number,
    isUpgraded: boolean
}

type bonus = {
    value: number,
    isUpgraded: boolean,
    isUsed: boolean,
}

type heroRarity = {
    t: "hero",
    name: string,
    cid: heroCid,
    isFoil: boolean,
    primaryHealth: number,
    secondaryHealth: number,
    energy: energy[],
    bonuses: (bonus | null)[],
}

export type { heroRarity, bonus};