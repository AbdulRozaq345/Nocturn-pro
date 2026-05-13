import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MaintenanceStatus = {
  active: boolean;
  message: string;
  estimatedTime: string;
  fullscreen: boolean;
};

const FALLBACK: MaintenanceStatus = {
  active: false,
  message: "",
  estimatedTime: "",
  fullscreen: false,
};

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "maintenance.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as Partial<MaintenanceStatus>;

    const payload: MaintenanceStatus = {
      active: Boolean(data.active),
      message: data.message ?? FALLBACK.message,
      estimatedTime: data.estimatedTime ?? "",
      fullscreen: Boolean(data.fullscreen),
    };

    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return Response.json(FALLBACK, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
