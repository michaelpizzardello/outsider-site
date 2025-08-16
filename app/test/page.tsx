import { shopifyFetch } from "@/lib/shopify";

const QUERY = `
  query Test {
    shop { name }
    metaobjects(type: "artist", first: 5) {
      nodes { handle fields { key value } }
    }
  }
`;

export default async function TestPage() {
  const data = await shopifyFetch<any>(QUERY);

  return (
    <main style={{ padding: 24 }}>
      <h1>{data.shop.name}</h1>
      <h2>Artists</h2>
      <ul>
        {data.metaobjects.nodes.map((n: any) => {
          const name = n.fields.find((f: any) => f.key === "name")?.value || n.handle;
          return <li key={n.handle}>{name}</li>;
        })}
      </ul>
    </main>
  );
}
