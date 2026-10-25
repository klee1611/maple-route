import { REPO_URL } from "@/lib/site";

export function AboutZhTW() {
  return (
    <>
      <h1>Maple Route 如何運作</h1>
      <p>
        Maple Route 回答科技業工作者關於加拿大工作簽證和永久居民的問題，主要針對安大略省。它只使用官方來源，每項陳述都附上出處，並在你讀過的規定已經變更時提醒你。
      </p>

      <h2>回答是怎麼產生的</h2>
      <p>四個 AI 代理依序工作，各負責一件事。最後一個步驟把它們找到的內容整理起來。</p>
      <ol>
        <li>
          <strong>了解你的情況。</strong>找出你提供的事實（工作、地點、學歷、身分），以及你認為正確的規定，以便查核。
        </li>
        <li>
          <strong>查核現行規定。</strong>閱讀知識庫中最相關的條目，包括記錄規定何時變更的條目，並讓每項陳述都保留它的來源。
        </li>
        <li>
          <strong>撰寫回答。</strong>只用這些陳述，以淺白的語言寫成回答。沒有來源的陳述會被刪除。
        </li>
        <li>
          <strong>核對來源。</strong>把每項陳述，以及你提到的每條規定，與來源原文比對。如果有內容已經過時，就把回答退回重新查核（最多兩次）。
        </li>
        <li>
          <strong>顯示變更內容。</strong>當某條規定已經變更，回答會顯示「已變更」說明，列出舊規定和現行規定的內容，各自附上來源。
        </li>
      </ol>
      <p>
        資料來源是英文的官方網頁，查核也以英文進行。中文版的回答是根據這些英文來源翻譯撰寫的，來源連結會指向英文原文。如果翻譯和原文有出入，請以官方原文為準。
      </p>

      <h2>知識庫</h2>
      <p>
        所有政策資訊都來自一個{" "}
        <a href="https://www.sanity.io/docs/ai/sanity-context-knowledge-bases">Sanity 知識庫（Knowledge Base）</a>
        ，透過 Sanity Context 讀取。它以 canada.ca（IRCC 和 ESDC）和 ontario.ca（安大略省移民提名計畫）的官方網頁建成。知識庫把這些網頁整理成主題條目，為每項陳述保留指回原網頁與段落的引用，並記錄規定何時變更。
      </p>
      <p>
        <strong>資料新鮮度：</strong>官方網頁以即時來源的方式連接，知識庫會按照更新排程重新檢查，所以回答會跟著每個網頁的最新版本。
      </p>
      <p>知識庫所依據的官方網頁（英文）：</p>
      <ul>
        <li>
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html">
            Express Entry：綜合排名系統（CRS）評分標準
          </a>{" "}
          （canada.ca）
        </li>
        <li>
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/special-instructions/spouses-dependent-children/eligibility.html">
            配偶和家庭成員的開放式工作簽證：申請資格
          </a>{" "}
          （canada.ca）
        </li>
        <li>
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html">
            畢業後工作簽證（PGWP）：申請資格
          </a>{" "}
          （canada.ca）
        </li>
        <li>
          <a href="https://www.ontario.ca/page/2026-ontario-immigrant-nominee-program-updates">
            2026 年安大略省移民提名計畫（OINP）更新
          </a>{" "}
          （ontario.ca）
        </li>
        <li>
          其他幾個來自{" "}
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship.html">加拿大移民、難民及公民部（IRCC）</a>
          的相關網頁，例如全球人才計畫（Global Talent Stream）
        </li>
      </ul>

      <h2>限制</h2>
      <ul>
        <li>這是資訊，不是法律建議。關於你的個人情況，請諮詢持牌移民顧問（RCIC）或律師。</li>
        <li>它只涵蓋安大略省科技業工作者的一小部分主題。如果來源沒有涵蓋你的問題，它會直接告訴你。</li>
        <li>它使用免費服務運作，所以每天的回答次數有限，偶爾也會有一兩分鐘比較慢或忙碌。</li>
        <li>它與加拿大政府或安大略省政府無關。</li>
      </ul>

      <h2>致謝</h2>
      <p>
        為{" "}
        <a href="https://dev.to/challenges/sanity-2026-09-16">DEV.to Sanity Challenge</a>{" "}
        而做（Path One：查詢真實內容的代理）。
      </p>
      <p>
        由一位獨立開發者建立和維護，不是持牌移民顧問。程式碼開源於 <a href={REPO_URL}>GitHub</a>
        ，你也可以在那裡回報錯誤或過時的回答。
      </p>
    </>
  );
}
