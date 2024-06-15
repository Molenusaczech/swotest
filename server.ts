import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { gameState } from "@/types/replay/gameState";
import { replayEffect, replayState, replayWeapon } from "@/types/replay/replayState";
import { Socket } from "socket.io-client";
import { weaponTypeData } from "@/data/weaponTypeData";
import effectMap from "@/data/swo/effectMap";
import { effectType } from "@/types/replay/effectType";
import colorMap from "@/data/swo/colorMap";
import { swoColor } from "@/types/replay/color";
import { hasDurability } from "@/tools/hasDurability";
import invertPlayerIndex from "@/tools/replay/invertPlayerIndex";
import { getCurrentBonuses } from "@/tools/getCurrentBonuses";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

let curGameState: replayState = {
  "startingPlayer": 0,
  status: "START",
  endIndex: null,
  chooseStartPlayer: null,
  "players": [
    {
      "hp": 24, "max_hp": 24, "energy": 3,
      "actions": 4,
      firstRollWeaponIndex: null,
      firstRollEffect: null,
      "hero":
      {
        "t": "hero",
        "name": "Sir Božilev",
        "cid": "Naftin",
        "isFoil": false,
        "primaryHealth": 23,
        "secondaryHealth": 0,
        "energy":
          [
            { "value": 3, "isUpgraded": false },
            { "value": 4, "isUpgraded": false },
            { "value": 3, "isUpgraded": false },
            { "value": 2, "isUpgraded": false }
          ],
        "bonuses":
          [
            { "value": 4, "isUpgraded": false, isUsed: false },
            null,
            { "value": 3, "isUpgraded": false, isUsed: false },
            { "value": 3, "isUpgraded": false, isUsed: false },
            { "value": 2, "isUpgraded": false, isUsed: false },
            { "value": 3, "isUpgraded": false, isUsed: false },
            { "value": 2, "isUpgraded": false, isUsed: false },
            { "value": 1, "isUpgraded": false, isUsed: false }]
      },
      "selectedWeaponIndex": 0,
      "weapons":
        [
          {
            "card":
            {
              "t": "weapon", "name": "HSJG", "cid": "Wand_Diamond", "durability": 5, "effects": [
                { "isUpgraded": false, "value": 2 }, { "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 4 }, { "isUpgraded": false, "value": 5 }, { "isUpgraded": false, "value": 2 }, { "isUpgraded": false, "value": 5 }, { "isUpgraded": false, "value": 6 }, { "isUpgraded": false, "value": 4 }, { "isUpgraded": false, "value": 4 }]
            }, "broken": "NOT_BROKEN", "stashedEffect": null, "cost": 2
          }, { "card": { "t": "weapon", "name": "ZFHF", "cid": "Sword_SilverBlade", "durability": 1, "effects": [{ "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 2 }, { "isUpgraded": false, "value": 1, "durability": 2 }, { "isUpgraded": false, "value": 1, "durability": 3 }, { "isUpgraded": false, "value": 2, "durability": 2 }, { "isUpgraded": false, "value": 1, "durability": 3 }, { "isUpgraded": false, "value": 3, "durability": 2 }, { "isUpgraded": false, "value": 2, "durability": 1 }, { "isUpgraded": false, "value": 1 }] }, "broken": "NOT_BROKEN", "stashedEffect": null, "cost": 1 }, { "card": { "t": "weapon", "name": "RDWP", "cid": "Wand_Octo", "durability": 4, "effects": [{ "isUpgraded": false, "value": 4 }, { "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 4, "durability": 1 }, { "isUpgraded": false, "value": 3, "durability": 1 }, { "isUpgraded": false, "value": 2, "durability": 2 }, { "isUpgraded": false, "value": 2, "durability": 2 }, { "isUpgraded": false, "value": 3, "durability": 1 }, { "isUpgraded": false, "value": 5, "durability": 1 }, { "isUpgraded": false, "value": 3 }] }, "broken": "NOT_BROKEN", "stashedEffect": null, "cost": 2 }, { "card": { "t": "weapon", "name": "FDVZ", "cid": "Sword_Nimble", "durability": 2, "effects": [{ "isUpgraded": false, "value": 1 }, { "isUpgraded": false, "value": 1 }, { "isUpgraded": false, "value": 2, "durability": 2 }, { "isUpgraded": false, "value": 3, "durability": 1 }, { "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 4, "durability": 1 }, { "isUpgraded": false, "value": 2, "durability": 1 }, { "isUpgraded": false, "value": 3, "durability": 2 }, { "isUpgraded": false, "value": 3 }] }, "broken": "NOT_BROKEN", "stashedEffect": null, "cost": 1 }, { "card": { "t": "weapon", "name": "CVGY", "cid": "Axe_DeepwoodClub", "durability": 2, "effects": [{ "isUpgraded": false, "value": 2 }, { "isUpgraded": false, "value": 2 }, { "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 4 }, { "isUpgraded": false, "value": 2 }, { "isUpgraded": false, "value": 1 }, { "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 1 }, { "isUpgraded": false, "value": 4 }] }, "broken": "NOT_BROKEN", "stashedEffect": null, "cost": 1 }]
    },
    {
      "hp": 20,
      "max_hp": 20,
      "energy": 3,
      "actions": 4,
      firstRollWeaponIndex: null,
      firstRollEffect: null,
      "hero":
      {
        "t": "hero",
        "name": "Drsnovál",
        "cid": "Brocco",
        "isFoil": false,
        "primaryHealth": 20,
        "secondaryHealth": 0,
        "energy": [
          { "value": 3, "isUpgraded": false },
          { "value": 4, "isUpgraded": false },
          { "value": 3, "isUpgraded": false },
          { "value": 2, "isUpgraded": false }
        ],
        "bonuses": [
          { "value": 1, "isUpgraded": false, isUsed: false },
          { "value": 1, "isUpgraded": false, isUsed: false },
          { "value": 2, "isUpgraded": false, isUsed: false },
          { "value": 5, "isUpgraded": false, isUsed: false },
          { "value": 3, "isUpgraded": false, isUsed: false },
          null,
          { "value": 4, "isUpgraded": false, isUsed: false },
          null
        ]
      },
      "selectedWeaponIndex": 0,
      "weapons": [{ "card": { "t": "weapon", "name": "LVXB", "cid": "Bow_ElderDragon", "durability": 4, "effects": [{ "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 3, "durability": 1 }, { "isUpgraded": false, "value": 3, "durability": 1 }, { "isUpgraded": false, "value": 3, "durability": 1 }, { "isUpgraded": false, "value": 2, "durability": 2 }, { "isUpgraded": false, "value": 2, "durability": 1 }, { "isUpgraded": false, "value": 3, "durability": 2 }, { "isUpgraded": false, "value": 1 }] }, "broken": "NOT_BROKEN", "stashedEffect": null, "cost": 1 }, { "card": { "t": "weapon", "name": "LDNR", "cid": "Wand_Fire", "durability": 2, "effects": [{ "isUpgraded": false, "value": 2 }, { "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 2, "durability": 1 }, { "isUpgraded": false, "value": 4, "durability": 3 }, { "isUpgraded": false, "value": 2 }, { "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 2, "durability": 2 }, { "isUpgraded": false, "value": 2 }] }, "broken": "NOT_BROKEN", "stashedEffect": null, "cost": 1 }, { "card": { "t": "weapon", "name": "SWFW", "cid": "Bow_Long", "durability": 3, "effects": [{ "isUpgraded": false, "value": 2 }, { "isUpgraded": false, "value": 2 }, { "isUpgraded": false, "value": 2, "durability": 1 }, { "isUpgraded": false, "value": 2, "durability": 1 }, { "isUpgraded": false, "value": 1, "durability": 2 }, { "isUpgraded": false, "value": 2, "durability": 2 }, { "isUpgraded": false, "value": 2, "durability": 2 }, { "isUpgraded": false, "value": 2, "durability": 2 }, { "isUpgraded": false, "value": 1 }] }, "broken": "NOT_BROKEN", "stashedEffect": null, "cost": 1 }, { "card": { "t": "weapon", "name": "KRZN", "cid": "Wand_Pyro", "durability": 3, "effects": [{ "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 1 }, { "isUpgraded": false, "value": 4, "durability": 1 }, { "isUpgraded": false, "value": 5, "durability": 2 }, { "isUpgraded": false, "value": 3, "durability": 4 }, { "isUpgraded": false, "value": 3, "durability": 4 }, { "isUpgraded": false, "value": 3, "durability": 1 }, { "isUpgraded": false, "value": 4, "durability": 1 }, { "isUpgraded": false, "value": 4 }] }, "broken": "NOT_BROKEN", "stashedEffect": null, "cost": 2 }, { "card": { "t": "weapon", "name": "CNDQ", "cid": "Wand_Octo", "durability": 4, "effects": [{ "isUpgraded": false, "value": 4 }, { "isUpgraded": false, "value": 3 }, { "isUpgraded": false, "value": 4, "durability": 2 }, { "isUpgraded": false, "value": 3, "durability": 2 }, { "isUpgraded": false, "value": 3, "durability": 2 }, { "isUpgraded": false, "value": 3, "durability": 2 }, { "isUpgraded": false, "value": 2, "durability": 1 }, { "isUpgraded": false, "value": 5, "durability": 1 }, { "isUpgraded": false, "value": 2 }] }, "broken": "NOT_BROKEN", "stashedEffect": null, "cost": 2 }]
    }], "playerTurn": 0, "rolledEffect": null, "message": null, "targetPlayerIndex": null, "targetCardIndex": null, "round": 0
};

function endPhaseStep() {

  if (curGameState.endIndex === null) {
    curGameState.endIndex = 0;
  }

  if (curGameState.endIndex == 0) {
    let permaSum = 0;
    let permaCount = 0;

    curGameState.players[curGameState.playerTurn].weapons.forEach((weapon) => {
      if (weapon.stashedEffect !== null) {
        if (weapon.stashedEffect.type === "PERMANENT_ATTACK") {
          permaSum += weapon.stashedEffect.value;
          permaCount++;
        }
      }
    });

    if (permaCount == 0) {
      curGameState.endIndex++;
      endPhaseStep();
    } else {
      curGameState.rolledEffect = {
        type: "PERMANENT_ATTACK",
        value: permaSum,
        durability: null,
        color: null
      };
    }

  } else if (curGameState.endIndex == 1) {
    let comboSum = 0;
    let comboCount = 0;

    curGameState.players[curGameState.playerTurn].weapons.forEach((weapon) => {
      if (weapon.stashedEffect !== null) {
        if (weapon.stashedEffect.type === "COMBO") {
          comboSum += weapon.stashedEffect.value;
          comboCount++;
        }
      }
    });

    if (comboCount < 2) {
      curGameState.endIndex++;
      endPhaseStep();
    } else {
      curGameState.rolledEffect = {
        type: "COMBO",
        value: comboSum,
        durability: null,
        color: null
      };
    }

  } else if (curGameState.endIndex >= 2) {
    endTurn();
  }
}

function endPhase() {

  curGameState.endIndex = 0;
  curGameState.status = "END";

  endPhaseStep();

  //endTurn();
}

function endTurn() {
  curGameState.playerTurn = invertPlayerIndex(curGameState.playerTurn);
  curGameState.players[curGameState.playerTurn].actions = 4;
  curGameState.status = "MAIN";

  curGameState.players[curGameState.playerTurn].weapons.forEach((weapon) => {
    if (weapon.broken === "FIXING") {
      weapon.broken = "NOT_BROKEN";
    }
  });

  if (curGameState.playerTurn == curGameState.startingPlayer) {
    curGameState.round++;
    curGameState.players[0].energy += curGameState.players[0].hero.energy[curGameState.round % 4].value;
    curGameState.players[1].energy += curGameState.players[1].hero.energy[curGameState.round % 4].value;
    curGameState.players[0].actions = 4;
    curGameState.players[1].actions = 4;

    if (curGameState.players[0].energy > 12) {
      curGameState.players[0].energy = 12;
    }

    if (curGameState.players[1].energy > 12) {
      curGameState.players[1].energy = 12;
    }

    curGameState.players[0].hero.bonuses.forEach((bonus) => {
      if (bonus !== null) {
        bonus.isUsed = false;
      }
    });

    curGameState.players[1].hero.bonuses.forEach((bonus) => {
      if (bonus !== null) {
        bonus.isUsed = false;
      }
    });

  }
}

function getRolledEffect(weapon: replayWeapon): replayEffect {
  const rolledIndex = Math.floor(Math.random() * 9);
  const type = weaponTypeData[weapon.card.cid].effects[rolledIndex];
  return {
    type: Object.keys(effectMap).find(key => effectMap[key as effectType] === type.t) as effectType,
    value: weapon.card.effects[rolledIndex].value,
    durability: weapon.card.effects[rolledIndex]?.durability ?? null,
    color: Object.keys(colorMap).find(key => colorMap[key as swoColor] === type.f) as swoColor
  };
}

function removeCombos(playerIndex: number) {
  curGameState.players[playerIndex].weapons.forEach((weapon) => {
    if (weapon.stashedEffect !== null) {
      if (weapon.stashedEffect.type === "COMBO") {
        weapon.stashedEffect = null;
      }
    }
  });

}

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    // ...

    console.log("connected");

    socket.on("setState", (data: replayState) => {
      console.log(data);
      curGameState = data;
      io.emit("setState", curGameState);
    });

    socket.on("getState", () => {
      socket.emit("setState", curGameState);
    });

    socket.on("equipWeapon", (data: { playerIndex: number, weaponIndex: number }) => {

      if (curGameState.status == "START") {
        console.log("Game not started yet");
        return;
      }

      if (curGameState.status == "END") {
        console.log("Game in end state");
        return;
      }

      if (data.playerIndex == curGameState.playerTurn) {

        const curWeapon = curGameState.players[data.playerIndex].weapons[data.weaponIndex];

        if (curWeapon.stashedEffect !== null) {
          curWeapon.stashedEffect = null;
        }

        curGameState.players[data.playerIndex].selectedWeaponIndex = data.weaponIndex;
        io.emit("setState", curGameState);
      }
    });

    socket.on("roll", (data: { playerIndex: number }) => {
      if (data.playerIndex == curGameState.playerTurn) {

        if (curGameState.players[data.playerIndex].weapons[curGameState.players[data.playerIndex].selectedWeaponIndex].broken !== "NOT_BROKEN") {
          console.log("Weapon is broken");
          return;
        }

        if (curGameState.players[data.playerIndex].actions <= 0) {
          console.log("No actions left");
          return;
        }

        if (curGameState.players[data.playerIndex].energy < curGameState.players[data.playerIndex].weapons[curGameState.players[data.playerIndex].selectedWeaponIndex].cost) {
          console.log("Not enough energy");
          return;
        }

        if (curGameState.rolledEffect !== null) {
          console.log("Effect already rolled");
          return;
        }

        if (curGameState.status == "START") {
          console.log("Game not started yet");
          return;
        }

        curGameState.players[data.playerIndex].actions--;
        curGameState.players[data.playerIndex].energy -= curGameState.players[data.playerIndex].weapons[curGameState.players[data.playerIndex].selectedWeaponIndex].cost;

        /*const rolledIndex = Math.floor(Math.random() * 9);
        const type = weaponTypeData[curGameState.players[curGameState.playerTurn].weapons[curGameState.players[curGameState.playerTurn].selectedWeaponIndex].card.cid].effects[rolledIndex];
        curGameState.rolledEffect = {
          type: Object.keys(effectMap).find(key => effectMap[key as effectType] === type.t) as effectType,
          value: curGameState.players[data.playerIndex].weapons[curGameState.players[data.playerIndex].selectedWeaponIndex].card.effects[rolledIndex].value,
          durability: curGameState.players[data.playerIndex].weapons[curGameState.players[data.playerIndex].selectedWeaponIndex].card.effects[rolledIndex]?.durability ?? null,
          color: Object.keys(colorMap).find(key => colorMap[key as swoColor] === type.f) as swoColor
        };*/

        curGameState.rolledEffect = getRolledEffect(curGameState.players[data.playerIndex].weapons[curGameState.players[data.playerIndex].selectedWeaponIndex]);

        io.emit("setState", curGameState);
      }
    });

    socket.on("useEffect", (data: {
      playerIndex: number,
      targetWeaponIndex: number,
      target: "player" | "weapon",
      bonusIndex: number
    }) => {

      if (data.playerIndex !== curGameState.playerTurn) {
        console.log("Not your turn");
        return;
      }

      if (curGameState.rolledEffect === null) {
        console.log("No effect rolled");
        return;
      }

      if (curGameState.rolledEffect.type == null) {
        console.log("No effect rolled");
        return;
      }

      if (curGameState.status == "START") {
        console.log("Game not started yet");
        return;
      }

      if (data.bonusIndex !== 0 && data.bonusIndex) {
        console.log("Bonus index not 0");
        const bonuses = getCurrentBonuses(curGameState.players[curGameState.playerTurn].hero, curGameState.round, curGameState.rolledEffect.type);

        if (bonuses === null) {
          console.log("Invalid hero");
          return;
        }

        /*if (bonuses.length < data.bonusIndex) {
          console.log("Invalid bonus index");
          return;
        }*/

        if (bonuses[data.bonusIndex - 1] === null) {
          console.log(bonuses, data.bonusIndex);
          console.log("Invalid bonus index");
          return;
        }

        const heroBonus = bonuses[data.bonusIndex - 1];

        if (heroBonus === null) {
          return;
        }

        if (heroBonus.isUsed) {
          console.log("Bonus already used");
          return;
        }

        curGameState.rolledEffect.value += heroBonus.value;
        //heroBonus.isUsed = true;

        
        const curBonus = curGameState.players[curGameState.playerTurn].hero.bonuses[(curGameState.round % 4) * 2 + data.bonusIndex - 1];

        if (curBonus === null) {
          console.log("Invalid curbonus index");
          return;
        }

        curBonus.isUsed = true;
        
      }

      if (curGameState.status == "END") {
        if (curGameState.endIndex == 0) {
          curGameState.players[invertPlayerIndex(curGameState.playerTurn)].hp -= curGameState.rolledEffect.value;
          curGameState.rolledEffect = null;
          curGameState.endIndex++;
          endPhaseStep();
          io.emit("setState", curGameState);
        } else if (curGameState.endIndex == 1) {
          if (data.target == "player") {
            curGameState.players[invertPlayerIndex(curGameState.playerTurn)].hp -= curGameState.rolledEffect.value;
          } else {
            if (curGameState.rolledEffect.value >= curGameState.players[invertPlayerIndex(curGameState.playerTurn)].weapons[data.targetWeaponIndex].card.durability) {
              curGameState.players[invertPlayerIndex(curGameState.playerTurn)].weapons[data.targetWeaponIndex].broken = "BROKEN";
            }
          }
          curGameState.rolledEffect = null;
          curGameState.endIndex++;
          removeCombos(curGameState.playerTurn);
          endPhaseStep();
          io.emit("setState", curGameState);
        }

        return;
      }

      const stopRound = curGameState.rolledEffect.color !== "GREEN";
      let curPlayer = curGameState.players[curGameState.playerTurn];
      let enemyPlayer = curGameState.players[invertPlayerIndex(curGameState.playerTurn)];

      if (curGameState.rolledEffect.type === "ENERGY") {
        curGameState.players[curGameState.playerTurn].energy += curGameState.rolledEffect.value;
        curGameState.rolledEffect = null;
      } else if (hasDurability(effectMap[curGameState.rolledEffect.type])) {


        curPlayer.weapons[curPlayer.selectedWeaponIndex].stashedEffect = curGameState.rolledEffect;
        curGameState.rolledEffect = null;
      } else if (curGameState.rolledEffect.type === "HEAL") {
        curGameState.players[curGameState.playerTurn].hp += curGameState.rolledEffect.value;
        curGameState.rolledEffect = null;
      } else if (curGameState.rolledEffect.type === "HERO_ATTACK") {
        enemyPlayer.hp -= curGameState.rolledEffect.value;
        curGameState.rolledEffect = null;
      } else if (curGameState.rolledEffect.type === "WEAPON_ATTACK") {

        if (enemyPlayer.weapons[data.targetWeaponIndex].broken !== "NOT_BROKEN") {
          console.log("Can't attack broken weapon");
          return;
        }

        const targetedWeapon = enemyPlayer.weapons[data.targetWeaponIndex];

        if (targetedWeapon.stashedEffect === null) {
          if (curGameState.rolledEffect.value >= targetedWeapon.card.durability) {
            targetedWeapon.broken = "BROKEN";
          }
        } else {
          if (targetedWeapon.stashedEffect.durability === null) {
            console.log("Can't attack weapon with non-durability effect");
            return;
          }
          if (curGameState.rolledEffect.value >= targetedWeapon.stashedEffect.durability) {
            targetedWeapon.stashedEffect = null;
          }
        }

        curGameState.rolledEffect = null;
      } else if (curGameState.rolledEffect.type === "UNIVERSAL_ATTACK") {
        if (data.target == "player") {
          enemyPlayer.hp -= curGameState.rolledEffect.value;
          curGameState.rolledEffect = null;
        } else {
          if (enemyPlayer.weapons[data.targetWeaponIndex].broken !== "NOT_BROKEN") {
            console.log("Can't attack broken weapon");
            return;
          }

          const targetedWeapon = enemyPlayer.weapons[data.targetWeaponIndex];

          if (targetedWeapon.stashedEffect === null) {
            if (curGameState.rolledEffect.value >= targetedWeapon.card.durability) {
              targetedWeapon.broken = "BROKEN";
            }
          } else {
            if (targetedWeapon.stashedEffect.durability === null) {
              console.log("Can't attack weapon with non-durability effect");
              return;
            }
            if (curGameState.rolledEffect.value >= targetedWeapon.stashedEffect.durability) {
              targetedWeapon.stashedEffect = null;
            }
          }

          curGameState.rolledEffect = null;
        }
      }

      if (stopRound) {
        endPhase();
      }

      io.emit("setState", curGameState);
    });

    socket.on("endTurn", (data: { playerIndex: number }) => {
      if (data.playerIndex == curGameState.playerTurn) {
        endPhase();
        io.emit("setState", curGameState);
      }
    });

    socket.on("discardEffect", (data: { playerIndex: number }) => {

      if (data.playerIndex == curGameState.playerTurn) {


        if (curGameState.status == "END") {
          if (curGameState.endIndex == 2) {
            curGameState.rolledEffect = null;
            curGameState.endIndex++;
            endPhaseStep();
            io.emit("setState", curGameState);
            return;
          }
        }

        if (curGameState.rolledEffect === null) {
          console.log("No effect rolled");
          return;
        }

        if (curGameState.rolledEffect.color === "RED") {
          console.log("Can't discard red effect");
          return;
        }

        curGameState.rolledEffect = null;
        io.emit("setState", curGameState);
      }
    });

    socket.on("selectWeaponForFirstRoll", (data: { playerIndex: number, weaponIndex: number }) => {
      if (curGameState.players[data.playerIndex].firstRollEffect !== null) {
        console.log("Effect already rolled");
        return;
      }

      if (curGameState.players[data.playerIndex].firstRollWeaponIndex !== null) {
        console.log("Weapon already selected");
        return;
      }

      if (curGameState.status !== "START") {
        console.log("Not start of the game");
        return;
      }

      curGameState.players[data.playerIndex].firstRollWeaponIndex = data.weaponIndex;

      if (curGameState.players[0].firstRollWeaponIndex !== null && curGameState.players[1].firstRollWeaponIndex !== null) {
        //curGameState.status = "MAIN";

        // roll start effects

        let loop = true;

        while (loop) {
          curGameState.players[0].firstRollEffect = getRolledEffect(curGameState.players[0].weapons[curGameState.players[0].firstRollWeaponIndex]);
          curGameState.players[1].firstRollEffect = getRolledEffect(curGameState.players[1].weapons[curGameState.players[1].firstRollWeaponIndex]);

          if (curGameState.players[0].firstRollEffect.value !== curGameState.players[1].firstRollEffect.value) {
            loop = false;

            if (curGameState.players[0].firstRollEffect.value > curGameState.players[1].firstRollEffect.value) {
              curGameState.chooseStartPlayer = 0;
            } else {
              curGameState.chooseStartPlayer = 1;
            }

          }

        }



        io.emit("setState", curGameState);
      }
    });

    socket.on("startGame", (data: { playerIndex: number, startingPlayerIndex: number }) => {

      if (data.playerIndex !== curGameState.chooseStartPlayer) {
        console.log("Not your turn");
        console.log(data.playerIndex, curGameState.chooseStartPlayer);
        return;
      }


      if (curGameState.status === "START") {
        curGameState.status = "MAIN";

        curGameState.startingPlayer = data.startingPlayerIndex;

        curGameState.players[data.startingPlayerIndex].hp -= 2;
        curGameState.playerTurn = data.startingPlayerIndex;

        io.emit("setState", curGameState);
      }
    });

    socket.on("repairWeapon", (data: { playerIndex: number, targetWeaponIndex: number }) => {

      if (data.playerIndex !== curGameState.playerTurn) {
        console.log("Not your turn");
        return;
      }

      if (curGameState.status !== "MAIN") {
        console.log("You can only repair weapons at the main of the game");
        return;
      }

      if (curGameState.players[data.playerIndex].actions <= 0) {
        console.log("No actions left");
        return;
      }

      if (curGameState.players[data.playerIndex].energy < curGameState.players[data.playerIndex].weapons[data.targetWeaponIndex].cost) {
        console.log("Not enough energy");
        return;
      }

      if (curGameState.players[data.playerIndex].weapons[data.targetWeaponIndex].broken !== "BROKEN") {
        console.log("Weapon is not broken");
        return;
      }

      curGameState.players[data.playerIndex].actions--;
      curGameState.players[data.playerIndex].energy -= curGameState.players[data.playerIndex].weapons[data.targetWeaponIndex].cost;

      curGameState.players[data.playerIndex].weapons[data.targetWeaponIndex].broken = "FIXING";

      io.emit("setState", curGameState);
    });

  });


  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});