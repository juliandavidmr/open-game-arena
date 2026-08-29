import { GitHubIcon, REPOSITORY_URL } from "./github-link";

const IDEA_URL = `${REPOSITORY_URL}/issues/new?template=new-idea.yml`;

export type OpenSourceSectionProps = {
  title: string;
  description: string;
  gamesLabel: string;
  improvementsLabel: string;
  fixesLabel: string;
  ctaLabel: string;
  repositoryLabel: string;
  openSourceLabel: string;
  newIssueLabel: string;
  publicLabel: string;
};

export function OpenSourceSection({
  title,
  description,
  gamesLabel,
  improvementsLabel,
  fixesLabel,
  ctaLabel,
  repositoryLabel,
  openSourceLabel,
  newIssueLabel,
  publicLabel,
}: OpenSourceSectionProps) {
  const ideaTypes = [
    {
      label: gamesLabel,
      meta: newIssueLabel,
      className:
        "left-0 top-0 z-10 -rotate-3 bg-base-100 text-base-content group-hover:-translate-x-3 group-hover:-translate-y-2",
      badgeClassName: "badge-primary",
    },
    {
      label: improvementsLabel,
      meta: publicLabel,
      className:
        "right-0 top-36 z-20 rotate-3 bg-secondary text-secondary-content group-hover:translate-x-3 group-hover:-translate-y-1",
      badgeClassName: "badge-neutral",
    },
    {
      label: fixesLabel,
      meta: "GitHub",
      className:
        "bottom-0 left-4 z-30 -rotate-1 bg-accent text-accent-content group-hover:translate-x-1 group-hover:translate-y-2",
      badgeClassName: "badge-neutral",
    },
  ];

  return (
    <section
      className="hero min-h-[38rem] bg-primary text-primary-content"
      aria-labelledby="open-source-title"
    >
      <div className="hero-content w-full max-w-6xl flex-col items-stretch gap-12 px-6 py-20 lg:flex-row lg:items-center lg:gap-20 lg:py-28">
        <div className="flex-1">
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="badge badge-lg badge-outline mb-8 gap-2 border-primary-content/40 text-primary-content"
          >
            <GitHubIcon />
            {openSourceLabel}
          </a>
          <h2
            id="open-source-title"
            className="max-w-3xl text-4xl font-black tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl"
          >
            {title}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-content/80 text-pretty">
            {description}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={IDEA_URL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-neutral btn-lg justify-between sm:min-w-64"
            >
              <span>{ctaLabel}</span>
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-lg gap-2 border-primary-content/60 text-primary-content hover:border-primary-content hover:bg-primary-content hover:text-primary"
            >
              <GitHubIcon />
              GitHub
            </a>
          </div>
        </div>

        <div
          className="group relative min-h-[27rem] w-full lg:max-w-md"
          aria-label={repositoryLabel}
        >
          {ideaTypes.map((idea) => (
            <a
              key={idea.label}
              href={IDEA_URL}
              target="_blank"
              rel="noreferrer"
              aria-label={`${ctaLabel}: ${idea.label}`}
              className={`card absolute w-[88%] shadow-lg transition-transform duration-300 ease-out hover:z-40 hover:rotate-0 hover:scale-[1.03] focus-visible:z-40 focus-visible:rotate-0 focus-visible:scale-[1.03] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-primary-content motion-reduce:transition-none ${idea.className}`}
            >
              <div className="card-body min-h-40 justify-between p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className={`badge ${idea.badgeClassName}`}>{idea.meta}</span>
                  <span className="opacity-65" aria-hidden="true">
                    ↗
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <h3 className="card-title text-2xl text-balance">{idea.label}</h3>
                  <GitHubIcon />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
