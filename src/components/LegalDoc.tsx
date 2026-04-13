export function LegalDoc({
  title,
  lastUpdated,
  identityHeading,
  identityLines,
  blocks,
  closingLines,
}: {
  title: string;
  lastUpdated: string;
  identityHeading: string;
  identityLines: string[];
  blocks: string[];
  closingLines: string[];
}) {
  return (
    <article className="container-main max-w-3xl py-20 md:py-28">
      <header className="border-b border-white/10 pb-10">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-sm font-medium text-accent">
          <time dateTime="2026">{lastUpdated}</time>
        </p>
        <div className="mt-10 rounded-2xl border border-white/10 bg-[#161618]/80 p-6 md:p-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
            {identityHeading}
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-white/75 md:text-[15px]">
            {identityLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </header>
      <div className="mt-12 space-y-5 text-sm leading-relaxed text-white/65 md:mt-14 md:text-[15px] md:leading-[1.7]">
        {blocks.map((block, index) => (
          <p key={index}>{block}</p>
        ))}
      </div>
      <footer className="mt-14 border-t border-white/10 pt-10">
        <ul className="space-y-1.5 text-xs leading-relaxed text-white/50">
          {closingLines.map((line, index) => (
            <li
              key={`${line}-${index}`}
              className={
                index === closingLines.length - 1 ? "mt-4 font-medium" : ""
              }
            >
              {line}
            </li>
          ))}
        </ul>
      </footer>
    </article>
  );
}
