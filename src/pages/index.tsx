import Head from "next/head";
import Link from "next/link";
import { HomeClient } from "~/components/homepage/homeClient";

import { api } from "~/utils/api";

export default function Home() {
  // const hello = api.post.hello.useQuery({ text: "from tRPC" });

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
