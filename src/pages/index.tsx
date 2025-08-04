import Head from "next/head";
import { HomeClient } from "~/components/homepage/homeClient";


export default function Home() {

  return (
    <>
      <Head>
        <title>Airduple</title>
        <link rel="icon" href="/logo/airtable.png" />
      </Head>
      <main>
        <HomeClient />
      </main>
    </>
  );
}
