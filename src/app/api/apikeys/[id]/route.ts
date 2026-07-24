import {
  jsonError,
  jsonOk,
  omitSecretHash,
  requireCloudUser,
} from "@/server/helia/http";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { container, user } = await requireCloudUser(request);
    await container.apiKeys.delete(id, user.id);
    return jsonOk({});
  } catch (error) {
    return jsonError(error);
  }
}
