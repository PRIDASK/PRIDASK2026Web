export async function onRequest(context) {
  const { request, env } = context;

  /* =========================
     環境変数
  ========================= */
  const NOTION_API_KEY = env.NOTION_API_KEY;

  /* =========================
     URLパラメータ取得
     /notion-news?db=XXXX
  ========================= */
  const url = new URL(request.url);
  const db = url.searchParams.get("db");

  /* =========================
     共通レスポンスヘッダ
  ========================= */
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    // 5分キャッシュ（Cloudflare側）
    "Cache-Control": "public, max-age=300",
  };

  /* =========================
     OPTIONS（CORS preflight）
  ========================= */
  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  /* =========================
     エラーチェック
  ========================= */
  if (!NOTION_API_KEY) {
    return new Response(
      JSON.stringify({ error: "NOTION_API_KEY is not set" }),
      { status: 500, headers }
    );
  }

  if (!db) {
    return new Response(
      JSON.stringify({ error: "db parameter is required" }),
      { status: 400, headers }
    );
  }

  /* =========================
     Notion API 呼び出し
  ========================= */
  let notionRes;
  try {
    notionRes = await fetch(
      `https://api.notion.com/v1/databases/${db}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size: 10,
          sorts: [
            {
              property: "日付", // ← Notionのプロパティ名と完全一致させる
              direction: "descending",
            },
          ],
        }),
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch Notion API", detail: err.message }),
      { status: 500, headers }
    );
  }

  /* =========================
     Notion API エラー処理
  ========================= */
  if (!notionRes.ok) {
    const text = await notionRes.text();
    return new Response(
      JSON.stringify({
        error: "Notion API error",
        status: notionRes.status,
        detail: text,
      }),
      { status: notionRes.status, headers }
    );
  }

  /* =========================
     正常レスポンス
  ========================= */
 const data = await notionRes.json();

  // Notionの複雑なデータから、サイトに必要な情報だけをシンプルに抽出する
  const formattedResults = (data.results || []).map(page => {
    // 1. タイトルプロパティの取得（「タイトル」に修正済み対応）
    const titleProperty = page.properties.タイトル;
    const titleText = titleProperty?.title?.[0]?.plain_text || "Untitled";

    // 2. 日付プロパティの取得
    const dateProperty = page.properties.日付;
    const dateText = dateProperty?.date?.start || "";

    // 3. マルチセレクト（タグ）プロパティの取得
    // ※Notionの実際の列名が「タグ」や「カテゴリ」の場合は、下記の「"タグ"」の部分を実際の列名に変更してください。
    const selectProperty = page.properties.タグ; 
    const tags = (selectProperty?.multi_select || []).map(item => ({
      name: item.name,   // タグの名前（例: "重要", "お知らせ"）
      color: item.color  // Notionでの色（例: "blue", "pink", "default"）
    }));

    return {
      id: page.id,
      url: page.url, // Notionページへのリンク
      title: titleText,
      date: dateText,
      tags: tags     // これでマルチセレクトの名前と色のリストがサイトに送られます
    };
  });

  // 整形したシンプルな配列データをJSONとして返す
  return new Response(JSON.stringify({ results: formattedResults }), {
    status: 200,
    headers,
  });
}