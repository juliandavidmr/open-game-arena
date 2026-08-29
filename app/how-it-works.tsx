import { CreateMatchCta } from "./hero";

type Step = {
  title: string;
  description: string;
  artifact: string;
};

type HowItWorksProps = {
  label: string;
  title: string;
  introduction: string;
  steps: readonly Step[];
  ctaLabel: string;
  busy: boolean;
  onCreate: () => void;
};

export function HowItWorks({
  label,
  title,
  introduction,
  steps,
  ctaLabel,
  busy,
  onCreate,
}: HowItWorksProps) {
  return (
    <section className="bg-base-200 text-base-content" aria-labelledby="how-it-works-title">
      <div className="mx-auto max-w-6xl px-6 py-18 md:py-24 lg:py-28">
        <header className="grid items-end gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <p className="mb-3 font-bold text-primary">{label}</p>
            <h2
              id="how-it-works-title"
              className="max-w-3xl text-4xl leading-none font-black tracking-tight text-balance sm:text-5xl lg:text-7xl"
            >
              {title}
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-8 text-base-content/75 text-pretty">
            {introduction}
          </p>
        </header>

        <ol className="steps steps-vertical mt-14 w-full lg:steps-horizontal lg:mt-20">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="step step-primary items-start pb-10 text-left lg:items-center lg:px-4 lg:pb-0 lg:text-center"
              data-content={String(index + 1).padStart(2, "0")}
            >
              <div className="max-w-sm pt-3 lg:pt-6">
                <h3 className="text-xl font-extrabold">{step.title}</h3>
                <p className="mt-3 leading-7 text-base-content/70">{step.description}</p>
                <kbd className="kbd kbd-sm mt-5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {step.artifact}
                </kbd>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center lg:mt-16">
          <CreateMatchCta label={ctaLabel} busy={busy} onCreate={onCreate} />
        </div>
      </div>
    </section>
  );
}
