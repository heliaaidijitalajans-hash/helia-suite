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
    const created = await container.apiKeys.rotate({
      userId: user.id,
      apiKeyId: id,
    });
    return jsonOk({
      apiKey: omitSecretHash(created.record),
      secret: created.secret,
      warning: "Store this secret now. It will not be shown again.",
    });
  } catch (error) {
    return jsonError(error);
  }
}
