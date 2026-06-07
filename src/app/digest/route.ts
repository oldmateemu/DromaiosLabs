import { requireUser } from "@/lib/auth";
import { getOperatingDigest } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();
  const markdown = await getOperatingDigest();
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="dromaios-operating-digest-${stamp}.md"`
    }
  });
}
