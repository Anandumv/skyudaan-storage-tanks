import { ScrollDriver } from '@/components/ScrollDriver';
import { StageMount } from '@/components/three/StageMount';
import { Configurator } from '@/components/sections/Configurator';
import { Film } from '@/components/sections/Film';
import { Footer, Products, Works } from '@/components/sections/Closing';
import { Hud, Nav } from '@/components/ui/Chrome';
import { Cursor, Gate, QuoteBar, SoundLoop } from '@/components/ui/Experience';

export default function Home() {
  return (
    <>
      <a className="skip" href="#configure">Skip the film</a>
      <StageMount />
      <Nav />
      <Hud />
      <main>
        <Film />
        <Configurator />
        <Products />
        <Works />
      </main>
      <Footer />
      <ScrollDriver />
      <SoundLoop />
      <QuoteBar />
      <Cursor />
      <Gate />
    </>
  );
}
