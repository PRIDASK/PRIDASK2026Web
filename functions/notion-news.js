/**
 * Cloudflare Pages Function
 * GET /functions/notion-news?db=DATABASE_ID
 *
 * Notion APIはブラウザから直接叩けない（CORS制限）ため
 * このサーバーサイド関数を通して取得する
 */

export async function onRequest(context) {
  const NOTION_API_KEY = "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";
  const { searchParams } = new URL(context.request.url);
  const db = searchParams.get("db") || "";

  if (!db) {
    return new Response(JSON.stringify({ error: "db parameter required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const notionRes = await fetch(
    `https://api.notion.com/v1/databases/${db}/query`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sorts: [{ property: "日付", direction: "descending" }],
        page_size: 10,
      }),
    }
  );

  if (!notionRes.ok) {
    const err = await notionRes.text();
    return new Response(JSON.stringify({ error: err }), {
      status: notionRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const data = await notionRes.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300", // 5分キャッシュ
    },
  });
}
