import GetDecksFromReplay from "@/tools/replay/getDecksFromReplay";
import getReplayFromSwo from "@/tools/replay/getReplayFromSwo";
import getReplayState from "@/tools/replay/getReplayState";

export default async function DebugPage() {

    const replay = await getReplayFromSwo("http://scratchwars-online.cz/cs/battles/88653/spectate/de2f0ea76b484c39ab3688118b675cd6/");

    const decks = GetDecksFromReplay(replay);

    const state = getReplayState(replay, decks, 20);

    return (
        <div>
            {JSON.stringify(state)}
        </div>
    )
}