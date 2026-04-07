import { createAssetProxy } from "@/lib/createAssetProxy";

export const { GET, HEAD } = createAssetProxy("contents");
