import { AnalyticsSettings } from "@/components/Analytics";

export function PrivacyZhCN() {
  return (
    <>
      <h1>隐私</h1>
      <p>Maple Route 没有账号，也不会保存你的对话。</p>

      <h2>保存了哪些数据</h2>
      <ul>
        <li>
          <strong>你的问题不会存进数据库。</strong>你的问题和回答只留在这个浏览器标签页中，离开或刷新页面后就会消失。
        </li>
        <li>
          <strong>保存的回答（12 小时）。</strong>为了节省免费额度，最终回答会以问题产生的哈希值（hash）为键，保存最多 12 小时。问题原文本身不会被保存。
        </li>
        <li>
          <strong>使用次数限制（1 小时到 2 天）。</strong>为了限制每小时的提问次数，我们会以你 IP 地址的哈希值计算一小时内的请求次数，另外还有一个全站共用的每日计数器。你的 IP 地址本身不会被保存。
        </li>
        <li>
          <strong>调试追踪记录。</strong>我们使用 LangSmith 查看运行了哪些步骤、花了多少时间、用了多少 AI token。在公开版本中，问题和回答的文字不会出现在这些追踪记录里。
        </li>
      </ul>

      <h2>分析工具（只有在你允许时）</h2>
      <p>
        如果你点击“允许分析”，我们会使用 Google Analytics 统计访问次数，并了解哪些页面有人使用。它会设置 Cookie，并发送一些信息给 Google，例如你浏览的页面、浏览器和设备类型，以及大概的所在位置。
        <strong>你的问题和回答绝不会发送给 Google。</strong>如果你选择“不用了”，就完全不会加载 Google Analytics。你的选择只保存在这个浏览器中。
      </p>
      <AnalyticsSettings />

      <h2>使用到的服务</h2>
      <p>
        问题会发送给 Groq（AI 模型供应商）来撰写和核对回答，知识库则从 Sanity 读取。机器人防护使用 Cloudflare Turnstile。这些服务各有自己的隐私政策。
      </p>

      <h2>请不要分享敏感信息</h2>
      <p>你不需要提供姓名、护照号码或其他个人身份信息就能得到回答。请用一般性的方式描述你的情况。</p>

      <h2>联系方式</h2>
      <p>对这个页面有疑问？请在本项目的 DEV.to 文章下方留言。</p>
    </>
  );
}
