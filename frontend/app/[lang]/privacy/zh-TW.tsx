import { AnalyticsSettings } from "@/components/Analytics";

export function PrivacyZhTW() {
  return (
    <>
      <h1>隱私</h1>
      <p>Maple Route 沒有帳號，也不會保存你的對話。</p>

      <h2>儲存了哪些資料</h2>
      <ul>
        <li>
          <strong>你的問題不會存進資料庫。</strong>你的問題和回答只留在這個瀏覽器分頁中，離開或重新整理頁面後就會消失。
        </li>
        <li>
          <strong>保存的回答（12 小時）。</strong>為了節省免費額度，最終回答會以問題產生的雜湊碼（hash）為鍵，保存最多 12 小時。問題原文本身不會被儲存。
        </li>
        <li>
          <strong>使用次數限制（1 小時到 2 天）。</strong>為了限制每小時的提問次數，我們會以你 IP 位址的雜湊碼計算一小時內的請求次數，另外還有一個全站共用的每日計數器。你的 IP 位址本身不會被儲存。
        </li>
        <li>
          <strong>除錯追蹤記錄。</strong>我們使用 LangSmith 查看執行了哪些步驟、花了多少時間、用了多少 AI token。在公開版本中，問題和回答的文字不會出現在這些追蹤記錄裡。
        </li>
      </ul>

      <h2>分析工具（只有在你允許時）</h2>
      <p>
        如果你點選「允許分析」，我們會使用 Google Analytics 統計造訪次數，並了解哪些頁面有人使用。它會設定 Cookie，並傳送一些資訊給 Google，例如你瀏覽的頁面、瀏覽器和裝置類型，以及大概的所在位置。
        <strong>你的問題和回答絕不會傳送給 Google。</strong>如果你選擇「不用了」，就完全不會載入 Google Analytics。你的選擇只保存在這個瀏覽器中。
      </p>
      <AnalyticsSettings />

      <h2>使用到的服務</h2>
      <p>
        問題會傳送給 Groq（AI 模型供應商）來撰寫和核對回答，知識庫則從 Sanity 讀取。機器人防護使用 Cloudflare Turnstile。這些服務各有自己的隱私權政策。
      </p>

      <h2>請不要分享敏感資料</h2>
      <p>你不需要提供姓名、護照號碼或其他個人身分資料就能得到回答。請用一般性的方式描述你的情況。</p>

      <h2>聯絡方式</h2>
      <p>對這個頁面有疑問？請在本專案的 DEV.to 文章下方留言。</p>
    </>
  );
}
