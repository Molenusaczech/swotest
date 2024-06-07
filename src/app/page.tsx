"use client";
import ReplayState from "@/components/replay/replayState";
import ReplayView from "@/components/replay/replayView";
import ReplayWeapon from "@/components/replay/replayWeapon";
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
              socket.emit("useEffect", { playerIndex, target: "player" });
            }}
          >Použít</Button>

          <div>
            {[0, 1, 2, 3, 4].map((i) => (
              <Button
                key={i}
                onClick={() => {
                  socket.emit("useEffect", { playerIndex, target: "weapon", targetWeaponIndex: i });
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


        <div>
          Cur state: {JSON.stringify(state)}
        </div>

      </div>
      }

    </div>
  );
}
