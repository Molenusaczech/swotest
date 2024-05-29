import { heroCid } from "@/data/heroTypeData";
import { weaponCid } from "@/data/weaponTypeData";

type condition = {
    target: "energy" | "bonuses" | "primaryHealth" | "secondaryHealth" | "durability",
    targetIndex: number,
    threshold: number,
    operator: "<" | ">" | "<=" | ">=" | "==",
}

type winner = {
    id: string,
    name: string,
    appId: string,
    discordId: string,
}

type quest = {
    name: string,
    cardCid: heroCid | weaponCid,
    description: string,
    prize: string,
    winnerCount: number,
    hasToOwn: boolean,
    conditions: condition[],
    winners: winner[],
}

export type { quest, condition };
