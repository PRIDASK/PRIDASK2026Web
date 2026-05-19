document.addEventListener("DOMContentLoaded", async () => {
  // 1. 正しいデータベースIDを指定してAPIを叩く
  const dbId = "35fca6b1bc7d80e2bf0ac3ffd02a7349";
  const apiUrl = `/notion-news?db=${dbId}`;

  // index.htmlのNewsセクションの中にある、リストを入れるコンテナ要素（ul）を取得
  const newsContainer = document.querySelector(".news-section ul");

  if (!newsContainer) {
    console.error("Newsセクションのul要素が見つかりませんでした。");
    return;
  }

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("ネットワークの応答が良くありません。");
    
    const data = await response.json();

    // 既存の静的なダミーニュース（HTMLに元々書いてあるやつ）を一度空にする
    newsContainer.innerHTML = "";

    // 2. Notionから返ってきた記事データをループ処理でHTMLに変換する
    data.results.forEach((page) => {
      // タイトル（名前）の取得
      const title = page.properties.名前.title[0]?.plain_text || "無題のニュース";
      
      // 日付の取得（2026-04-26 などの文字列を 2026.04.26 に変換）
      const rawDate = page.properties.日付.date?.start || "";
      const date = rawDate ? rawDate.replace(/-/g, ".") : "日付未設定";

      // マルチセレクト（カテゴリタグなど。今回は最初の1つを取得）
      const category = page.properties.マルチセレクト.multi_select[0]?.name || "INFO";

      // 3. index.htmlの元のデザインに合わせたHTMLパーツを組み立て
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="news-date">${date}</span>
        <span class="news-category">${category}</span>
        <p class="news-title">${title}</p>
      `;

      // 画面（ulの中）に追加
      newsContainer.appendChild(li);
    });

  } catch (error) {
    console.error("Notionデータの読み込みに失敗しました:", error);
    newsContainer.innerHTML = `<li><p class="news-title" style="color: red;">ニュースの読み込みに失敗しました。</p></li>`;
  }
});