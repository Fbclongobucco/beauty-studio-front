import Image from "next/image";
import donas from "@/public/images/equipe/donas.png";
import { Logo } from "@/components/Logo";
import { LinkButton } from "@/components/ui/Button";
import { Ornament } from "@/components/ui/Ornament";
import { ServiceList } from "@/components/public/ServiceList";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SALON } from "@/lib/salon";

export default function Home() {
  return (
    <>
      <main className="mx-auto max-w-md px-4">
        <header className="flex flex-col items-center pt-6 text-center">
          <h1 className="sr-only">Longo Bucco Beauty Studio: agende seu horário</h1>
          <Logo width={176} priority />
          <p className="mt-3 font-script text-3xl leading-tight text-cocoa">Mais que beleza, é sobre você!</p>
          <p className="mt-2 text-lg">Escolha o serviço, o dia e o horário. É rápido e fácil.</p>
          <LinkButton href="/agendar" className="mt-4 w-full text-xl">
            Agendar horário
          </LinkButton>
        </header>

        <section aria-labelledby="servicos" className="mt-10">
          <h2 id="servicos" className="mb-4 text-center font-brand text-2xl font-semibold text-coffee">
            Nossos serviços
          </h2>
          <ServiceList />
        </section>

        <section aria-labelledby="quem-somos" className="mt-12 text-center">
          <Ornament className="mb-6" />
          <h2 id="quem-somos" className="font-brand text-2xl font-semibold text-coffee">
            Quem somos
          </h2>
          <div className="mx-auto mt-5 w-56 max-w-full overflow-hidden rounded-[2rem] bg-blush-2">
            <Image
              src={donas}
              alt="As donas do Longo Bucco Beauty Studio, sorrindo lado a lado"
              sizes="224px"
              placeholder="blur"
              className="h-auto w-full"
            />
          </div>
          <p className="mt-5">Um espaço feito com carinho para cuidar de você.</p>
          <ul className="mt-4 space-y-1 text-base">
            {SALON.team.map((p) => (
              <li key={p.name}>
                <span className="font-bold">{p.name}</span> · {p.role}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
