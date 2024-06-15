import { heroTypeData } from "@/data/heroTypeData";
import { heroRarity } from "@/types/cardRarity";
import { effectName } from "@/types/effects";
import { heroBonus } from "@/types/heroBonus";
import { hasDurability } from "./hasDurability";
import { effectType } from "@/types/replay/effectType";
import effectMap from "@/data/swo/effectMap";

function getCurrentBonuses(
    hero: heroRarity,
    roundIndex: number,
    curEffect: effectType,
): (heroBonus | null)[] {

    console.log(hero, roundIndex, curEffect);

    const type = heroTypeData[hero.cid];

    const daytimeIndex = roundIndex % 4;

    let res: (heroBonus | null)[] = [];

    /*[0, 1].forEach((i) => {
        if (type.effects[daytimeIndex * 2 + i] === null || type.effects[daytimeIndex * 2 + i] !== curEffect) {
            res.push(null);
        } else {
            res.push({
                type: type.effects[daytimeIndex * 4 + i] as effectName,
                value: hero.bonuses[daytimeIndex * 4 + i]?.value || 0,
                isUsed: hero.bonuses[daytimeIndex * 4 + i]?.isUsed || false,
            });
        }
    });*/

    res = [0, 1].map((i) => {
        if (type.effects[daytimeIndex * 2 + i] === null) {
            return null;
        }

        if (hero.bonuses[daytimeIndex * 2 + i]?.isUsed === true) {
            return null;
        }

        const curType = type.effects[daytimeIndex * 2 + i] as effectName;
        console.log(curType);

        if (type.effects[daytimeIndex * 2 + i] !== effectMap[curEffect]) {
            if (hasDurability(curType) || curType !== "all") {
                return null;
            }
        }

        return {
            type: curType,
            value: hero.bonuses[daytimeIndex * 2 + i]?.value || 0,
            isUsed: hero.bonuses[daytimeIndex * 2 + i]?.isUsed || false,
        }
    });

    console.log(res);

    return res;

}

export { getCurrentBonuses };