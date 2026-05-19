document.addEventListener("DOMContentLoaded", async () => {
  // Cloudflare Pagesの環境変数（正しいDB ID）に任せるため、URLパラメータは付けません
  const apiUrl = "/notion-news";

  // index.htmlのNewsセクションの中にある ul 要素を取得
  const newsContainer = document.querySelector(".news-section ul");

  if (!newsContainer) {
    console.error("Newsセクションのul要素が見つかりませんでした。");
    return;
  }

  try {
    // Notion APIのデータを取得
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("ネットワークの応答が良くありません。");
    
    const data = await response.json();

    // 元々HTMLに書いてある静的なダミーニュースを一度空にする
    newsContainer.innerHTML = "";

    // Notionから返ってきた記事データをループ処理でHTMLに変換
    data.results.forEach((page) => {
      // 1. タイトル（名前）の取得
      const title = page.properties.名前.title[0]?.plain_text || "無題のニュース";
      
      // 2. 日付の取得（2026-04-26 などの文字列を 2026.04.26 に変換）
      const rawDate = page.properties.日付.date?.start || "";
      const date = rawDate ? rawDate.replace(/-/g, ".") : "日付未設定";

      // 3. マルチセレクト（カテゴリタグ。今回は最初の1つを取得）
      const category = page.properties.マルチセレクト.multi_select[0]?.name || "INFO";

      // index.htmlの元のデザイン（main.cssのスタイル）に合わせたHTMLパーツを組み立て
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
    newsContainer.innerHTML = `<li><p class="news-title" style="color: #ff4d4d;">ニュースの読み込みに失敗しました。</p></li>`;
  }
});