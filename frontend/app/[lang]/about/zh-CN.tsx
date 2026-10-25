import { REPO_URL } from "@/lib/site";

export function AboutZhCN() {
  return (
    <>
      <h1>Maple Route 如何运作</h1>
      <p>
        Maple Route 回答科技行业从业者关于加拿大工作签证和永久居民的问题，主要针对安大略省。它只使用官方来源，每项陈述都附上出处，并在你读过的规定已经变更时提醒你。
      </p>

      <h2>回答是怎么产生的</h2>
      <p>四个 AI 代理依序工作，各负责一件事。最后一个步骤把它们找到的内容整理起来。</p>
      <ol>
        <li>
          <strong>了解你的情况。</strong>找出你提供的事实（工作、地点、学历、身份），以及你认为正确的规定，以便核查。
        </li>
        <li>
          <strong>核查现行规定。</strong>阅读知识库中最相关的条目，包括记录规定何时变更的条目，并让每项陈述都保留它的来源。
        </li>
        <li>
          <strong>撰写回答。</strong>只用这些陈述，以浅白的语言写成回答。没有来源的陈述会被删除。
        </li>
        <li>
          <strong>核对来源。</strong>把每项陈述，以及你提到的每条规定，与来源原文比对。如果有内容已经过时，就把回答退回重新核查（最多两次）。
        </li>
        <li>
          <strong>显示变更内容。</strong>当某条规定已经变更，回答会显示“已变更”说明，列出旧规定和现行规定的内容，各自附上来源。
        </li>
      </ol>
      <p>
        信息来源是英文的官方网页，核查也以英文进行。中文版的回答是根据这些英文来源翻译撰写的，来源链接会指向英文原文。如果翻译和原文有出入，请以官方原文为准。
      </p>

      <h2>知识库</h2>
      <p>
        所有政策信息都来自一个{" "}
        <a href="https://www.sanity.io/docs/ai/sanity-context-knowledge-bases">Sanity 知识库（Knowledge Base）</a>
        ，通过 Sanity Context 读取。它以 canada.ca（IRCC 和 ESDC）和 ontario.ca（安大略省移民提名计划）的官方网页建成。知识库把这些网页整理成主题条目，为每项陈述保留指回原网页与段落的引用，并记录规定何时变更。
      </p>
      <p>
        <strong>数据新鲜度：</strong>官方网页以实时来源的方式连接，知识库会按照更新计划重新检查，所以回答会跟着每个网页的最新版本。
      </p>
      <p>知识库所依据的官方网页（英文）：</p>
      <ul>
        <li>
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html">
            Express Entry：综合排名系统（CRS）评分标准
          </a>{" "}
          （canada.ca）
        </li>
        <li>
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/special-instructions/spouses-dependent-children/eligibility.html">
            配偶和家庭成员的开放式工作签证：申请资格
          </a>{" "}
          （canada.ca）
        </li>
        <li>
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html">
            毕业后工作签证（PGWP）：申请资格
          </a>{" "}
          （canada.ca）
        </li>
        <li>
          <a href="https://www.ontario.ca/page/2026-ontario-immigrant-nominee-program-updates">
            2026 年安大略省移民提名计划（OINP）更新
          </a>{" "}
          （ontario.ca）
        </li>
        <li>
          其他几个来自{" "}
          <a href="https://www.canada.ca/en/immigration-refugees-citizenship.html">加拿大移民、难民及公民部（IRCC）</a>
          的相关网页，例如全球人才计划（Global Talent Stream）
        </li>
      </ul>

      <h2>限制</h2>
      <ul>
        <li>这是信息，不是法律建议。关于你的个人情况，请咨询持牌移民顾问（RCIC）或律师。</li>
        <li>它只涵盖安大略省科技行业从业者的一小部分主题。如果来源没有涵盖你的问题，它会直接告诉你。</li>
        <li>它使用免费服务运作，所以每天的回答次数有限，偶尔也会有一两分钟比较慢或忙碌。</li>
        <li>它与加拿大政府或安大略省政府无关。</li>
      </ul>

      <h2>致谢</h2>
      <p>
        为{" "}
        <a href="https://dev.to/challenges/sanity-2026-09-16">DEV.to Sanity Challenge</a>{" "}
        而做（Path One：查询真实内容的代理）。
      </p>
      <p>
        由一位独立开发者创建和维护，不是持牌移民顾问。代码开源于 <a href={REPO_URL}>GitHub</a>
        ，你也可以在那里反馈错误或过时的回答。
      </p>
    </>
  );
}
