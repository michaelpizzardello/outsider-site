import clsx from "clsx";

import Container from "@/components/layout/Container";
import ExpandableText from "@/components/exhibition/ExpandableText";
import PortraitVideoPlayer, {
  type PortraitVideoSource,
} from "@/components/media/PortraitVideoPlayer";

type Props = {
  shortHtml?: string | null;
  longHtml?: string | null;
  portraitVideo?: PortraitVideoSource | null;
  artistName?: string;
};

export default function ArtistBioSection({
  shortHtml,
  longHtml,
  portraitVideo,
  artistName,
}: Props) {
  const hasCopy = Boolean(shortHtml || longHtml);
  if (!hasCopy && !portraitVideo) return null;

  const posterAlt =
    portraitVideo?.poster?.alt ||
    (artistName ? `${artistName} — portrait video` : "Artist portrait video");

  return (
    <section className="py-12 md:py-16">
      <Container>
        <div
          className={clsx(
            "flex w-full flex-col gap-10 text-left",
            portraitVideo
              ? "lg:mx-auto lg:grid lg:max-w-[1040px] lg:grid-cols-[minmax(0,380px)_minmax(0,520px)] lg:items-center lg:justify-center lg:gap-x-12 xl:gap-x-16"
              : ""
          )}
          style={{
            minHeight: portraitVideo ? "min(640px, 60vh)" : undefined,
          }}
        >
          {portraitVideo ? (
            <div className="mx-auto w-full max-w-[420px] lg:mx-0 lg:justify-self-start">
              <PortraitVideoPlayer
                source={portraitVideo}
                posterAlt={posterAlt}
                className="w-full"
              />
            </div>
          ) : null}

          {hasCopy ? (
            <div
              className={clsx(
                "w-full",
                portraitVideo
                  ? "mx-auto max-w-[520px] lg:mx-0 lg:justify-self-center"
                  : "mx-auto max-w-[68ch]"
              )}
            >
              <ExpandableText
                shortText={shortHtml ?? undefined}
                longTextHtml={longHtml ?? undefined}
                shortClassName="text-lg leading-8 lg:text-xl lg:leading-[2.1] prose-p:text-lg prose-p:leading-8 lg:prose-p:text-xl lg:prose-p:leading-[2.1]"
              />
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
