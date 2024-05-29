"use server";

import { quest } from "@/types/quests/quest";
import { put, list, getDownloadUrl, del, copy } from "@vercel/blob"

async function getAllQuests(): Promise<quest[]> {
    let fileList = await list();
    let questFileUrl = fileList.blobs.find((blob) => blob.pathname === "quests.json")?.downloadUrl;
    console.log(questFileUrl);

    if (questFileUrl === undefined) {
        return [];
    }

    let questData: quest[] = await fetch(questFileUrl).then((res) => res.json());
   

    return questData;
}

export { getAllQuests };