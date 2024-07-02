"use client";
import ReplayState from "@/components/replay/replayState";
import ReplayView from "@/components/replay/replayView";
import ReplayWeapon from "@/components/replay/replayWeapon";
import effectMap from "@/data/swo/effectMap";
import { getCurrentBonuses } from "@/tools/getCurrentBonuses";
import { hasDurability } from "@/tools/hasDurability";
import { effectType } from "@/types/replay/effectType";
import { replayState } from "@/types/replay/replayState";
import { Button, TextField } from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Socket, io } from "socket.io-client";

const socket = io();

function invertPlayerIndex(playerIndex: number) {
  return playerIndex === 0 ? 1 : 0;
}

export default function Home() {
  "use client";

  const [state, setState] = useState<null | replayState>(null);
  const [playerIndex, setPlayerIndex] = useState<number>(0);
  const [bonusIndex, setBonusIndex] = useState<number>(0);
  const [shieldsList, setShieldsList] = useState<number[]>([]);

  let curBonuses = null;

  if (state !== null && state.rolledEffect !== null) {
    curBonuses = getCurrentBonuses(state.players[playerIndex].hero, state?.round, state.rolledEffect.type);

    if (curBonuses[bonusIndex + 1] === null && bonusIndex !== 0) {
      setBonusIndex(0);
    }

    if (hasDurability(effectMap[state.rolledEffect.type]) && state.rolledEffect.color !== null && bonusIndex !== 0) {
      setBonusIndex(0);
    }
  }

  useEffect(() => {


    console.log("run useeffect");
    //socket.emit("test", { test: "test" });

    socket.on("setState", (data: replayState) => {
      console.log(data);
      setState(data);
    });

    socket.emit("getState", {});
  }, []);

  return (
    <div>
      Index hráče: <TextField
        type="number"
        value={playerIndex}
        onChange={(e) => setPlayerIndex(parseInt(e.target.value))}
      />
      {state !== null && <div>
        <ReplayState state={state} />


        <div>
          {[0, 1, 2, 3, 4].map((i) => (
            <Button
              key={i}
              onClick={() => {
                socket.emit("equipWeapon", { playerIndex, weaponIndex: i });
              }}
            >Equip {i}</Button>
          )
          )}

          <Button
            onClick={() => {
              socket.emit("roll", { playerIndex });
            }}
          >Točit</Button>
        </div>

        <div>
          <Button
            onClick={() => {
              socket.emit("endTurn", { playerIndex });
            }}
          >Konec tahu</Button>

          <Button
            onClick={() => {
              socket.emit("discardEffect", { playerIndex });
            }}
          >Zahodit efekt</Button>

          <Button
            onClick={() => {
              socket.emit("useEffect", { playerIndex, target: "player", bonusIndex });
            }}
          >Použít</Button>

          <div>
            {[0, 1, 2, 3, 4].map((i) => (
              <Button
                key={i}
                onClick={() => {
                  socket.emit("useEffect", { playerIndex, target: "weapon", targetWeaponIndex: i, bonusIndex });
                }}
              >Použít na soupeřovu zbraň {i}</Button>
            )
            )}
          </div>

          <div>
            {[0, 1, 2, 3, 4].map((i) => (
              <Button
                key={i}
                onClick={() => {
                  socket.emit("repairWeapon", { playerIndex, targetWeaponIndex: i });
                }}
              >Opravit zbraň {i}</Button>
            )
            )}

          </div>

        </div>

        {state.status == "START" && <div>
          <div>
            Výběr zbraní pro točení o začátek
            {[0, 1, 2, 3, 4].map((i) => (
              <Button
                key={i}
                onClick={() => {
                  socket.emit("selectWeaponForFirstRoll", { playerIndex, weaponIndex: i });
                }}
              >Vybrat {i}</Button>
            )
            )}
          </div>

          <div>
            P0: <ReplayWeapon
              weapon={
                {
                  ...state.players[0].weapons[state.players[0].firstRollWeaponIndex as number],
                  stashedEffect: state.players[0].firstRollEffect
                }
              }
              isOnTurn={true}
              isSelected={true}
            />

            P1: <ReplayWeapon
              weapon={{ ...state.players[1].weapons[state.players[1].firstRollWeaponIndex as number], stashedEffect: state.players[1].firstRollEffect }}
              isOnTurn={false}
              isSelected={true}
            />
          </div>

        </div>}

        {state.chooseStartPlayer == playerIndex && state.status == "START" && <div>
          <Button
            onClick={() => {
              socket.emit("startGame", { playerIndex, startingPlayerIndex: playerIndex });
            }}
          >Začnu já</Button>

          <Button
            onClick={() => {
              socket.emit("startGame", { playerIndex, startingPlayerIndex: invertPlayerIndex(playerIndex) });
            }}
          >Začne soupeř</Button>
        </div>}

        {
          state.rolledEffect !== null &&
          state.playerTurn === playerIndex &&
          state.rolledEffect.type !== null &&
          ((state.status === "MAIN" && !hasDurability(effectMap[state.rolledEffect.type])) || (state.status === "END" && hasDurability(effectMap[state.rolledEffect.type]))) &&
          <div>
            <div>
              <Button variant={0 === bonusIndex ? "contained" : "outlined"}
                onClick={() => { setBonusIndex(0); }}

              >
                Bez bonusu
              </Button>
            </div>            {getCurrentBonuses(state.players[state.playerTurn].hero, state.round, state.rolledEffect?.type).map((bonus, i) => (
              <div key={i + 1}>
                {bonus !== null && <Button variant={(i + 1) === bonusIndex ? "contained" : "outlined"}
                  onClick={() => { setBonusIndex(i + 1); }}
                >
                  {bonus.type}: {bonus.value}
                </Button>}
              </div>
            ))

            }
          </div>}

        {state.status === "BLOCK" && state.playerTurn === invertPlayerIndex(playerIndex) && <div>

          {JSON.stringify(shieldsList)}
          <div>

            {[0, 1, 2, 3, 4].map((i) => {
              return (
                <Button
                  key={i}
                  onClick={() => {
                    if (shieldsList.includes(i)) {
                      setShieldsList(shieldsList.filter((j) => j !== i));
                    } else {
                      setShieldsList([...shieldsList, i]);
                    }
                  }}
                >{shieldsList.includes(i) ? "Odvybrat štít" : "Vybrat štít"} {i}</Button>
              )
            })}

          </div>

          <Button
            onClick={() => {
              socket.emit("block", { playerIndex, shieldsList });
            }}
          >{shieldsList.length === 0 ? "Nepoužít štíty" : "Použít vybrané štíty"}</Button>

        </div>}

        <div>
          Cur state: {JSON.stringify(state)}
        </div>

      </div>
      }

    </div>
  );
}
