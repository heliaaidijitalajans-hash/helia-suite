import {
  jsonError,
  jsonOk,
  omitSecretHash,
  requireCloudUser,
} from "@/server/helia/http";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { container, user } = await requireCloudUser(request);
    const apiKey = await container.apiKeys.disable(id, user.id);
    return jsonOk({ apiKey: omitSecretHash(apiKey) });
  } catch (error) {
    return jsonError(error);
  }
}
