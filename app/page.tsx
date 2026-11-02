import Image from "next/image";
import { Suspense } from "react";
import donas from "@/public/images/equipe/donas.png";
import { Logo } from "@/components/Logo";
import { LinkButton } from "@/components/ui/Button";
import { Ornament } from "@/components/ui/Ornament";
import { MyRequests } from "@/components/public/MyRequests";
import { ServiceList } from "@/components/public/ServiceList";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SALON } from "@/lib/salon";

export default function Home() {
  return (
    <>
      <main className="mx-auto max-w-md px-4 lg:max-w-6xl lg:px-8">
        <header className="flex flex-col items-center pt-6 text-center lg:pt-12">
          <h1 className="sr-only">Longo Bucco Beauty Studio: agende seu horário</h1>
          <Logo width={176} priority />
          <p className="mt-3 font-script text-3xl leading-tight text-cocoa lg:text-4xl">Mais que beleza, é sobre você!</p>
          <p className="mt-2 text-lg lg:text-xl">Escolha o serviço, o dia e o horário. É rápido e fácil.</p>
          <Suspense fallback={null}>
            <MyRequests />
          </Suspense>
          <LinkButton href="/agendar" className="mt-4 w-full text-xl lg:mt-6 lg:w-auto lg:px-14">
            Agendar horário
          </LinkButton>
        </header>

        <section aria-labelledby="servicos" className="mt-10 lg:mt-16">
          <h2 id="servicos" className="mb-4 text-center font-brand text-2xl font-semibold text-coffee lg:mb-6 lg:text-3xl">
            Nossos serviços
          </h2>
          <ServiceList />
        </section>

        <section aria-labelledby="quem-somos" className="mt-12 text-center lg:mt-20">
          <Ornament className="mb-6" />
          <h2 id="quem-somos" className="font-brand text-2xl font-semibold text-coffee lg:text-3xl">
            Quem somos
          </h2>
          {/* No computador, foto e texto lado a lado. */}
          <div className="lg:mx-auto lg:mt-8 lg:grid lg:max-w-4xl lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-center lg:gap-12 lg:text-left">
          <div className="mx-auto mt-5 w-56 max-w-full overflow-hidden rounded-[2rem] bg-blush-2 lg:mt-0 lg:w-72">
            <Image
              src={donas}
              alt="As donas do Longo Bucco Beauty Studio, sorrindo lado a lado"
              sizes="(min-width: 1024px) 288px, 224px"
              placeholder="blur"
              className="h-auto w-full"
            />
          </div>
          <div>
          {/* Texto baseado no flyer e no post de reinauguração do salão; validar com as donas. */}
          <p className="mt-5 font-script text-2xl leading-snug text-cocoa">
            Um novo capítulo, um novo nome e o mesmo amor pela beleza.
          </p>
          <p className="mt-3">
            O {SALON.name} está de cara nova. Unhas, tranças e depilação em um só lugar, em {SALON.district}, com horário
            marcado para você ser atendida sem pressa.
          </p>
          <p className="mt-3 text-base">{SALON.hours}.</p>
          <ul className="mt-4 space-y-1 text-base">
            {SALON.team.map((p) => (
              <li key={p.name}>
                <span className="font-bold">{p.name}</span> · {p.role}
              </li>
            ))}
          </ul>
          </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
