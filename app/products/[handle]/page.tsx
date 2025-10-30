import { redirect } from "next/navigation";

type Params = {
  handle: string;
};

export default function LegacyProductRedirect({
  params,
}: {
  params: Params;
}) {
  const slug = params?.handle;
  if (!slug) {
    redirect("/collect");
  }
  redirect(`/artworks/${slug}`);
}
