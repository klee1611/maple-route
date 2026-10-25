"""User-facing text in each supported language. Knowledge Base work stays in English; only what the
user reads (answer, Changed callouts, progress, errors, disclaimer) follows the page language."""

from typing import Literal, get_args

Lang = Literal["en", "zh-TW", "zh-CN"]
LANGS: tuple[Lang, ...] = get_args(Lang)

# Named in English for the prompts: the models follow "Traditional Chinese (Taiwan)" more reliably than a code.
LANGUAGE_NAMES: dict[Lang, str] = {
    "en": "English",
    "zh-TW": "Traditional Chinese (Taiwan)",
    "zh-CN": "Simplified Chinese (Mainland China)",
}

_TEXT: dict[str, dict[Lang, str]] = {
    "disclaimer": {
        "en": "This is information from official sources, not legal advice. For your specific "
              "case, talk to a licensed immigration consultant (RCIC) or lawyer.",
        "zh-TW": "以上是來自官方來源的資訊，不是法律建議。關於你的個人情況，"
                 "請諮詢持牌移民顧問（RCIC）或律師。",
        "zh-CN": "以上是来自官方来源的信息，不是法律建议。关于你的个人情况，"
                 "请咨询持牌移民顾问（RCIC）或律师。",
    },
    "not_covered": {
        "en": "I can't answer this from the sources I use. They cover Canadian work permits and "
              "permanent residence pathways for tech workers, mainly in Ontario.",
        "zh-TW": "我無法根據我使用的來源回答這個問題。這些來源涵蓋的是科技業工作者的加拿大工作簽證"
                 "和永久居民途徑，主要針對安大略省。",
        "zh-CN": "我无法根据我使用的来源回答这个问题。这些来源涵盖的是科技行业从业者的加拿大工作签证"
                 "和永久居民途径，主要针对安大略省。",
    },
    "step.orchestrator": {"en": "Understanding your situation", "zh-TW": "了解你的情況", "zh-CN": "了解你的情况"},
    "step.policy_agent": {"en": "Checking current rules", "zh-TW": "查核現行規定", "zh-CN": "核查现行规定"},
    "step.synthesizer": {"en": "Writing the answer", "zh-TW": "撰寫回答", "zh-CN": "撰写回答"},
    "step.verifier": {"en": "Verifying sources", "zh-TW": "核對來源", "zh-CN": "核对来源"},
    "done.orchestrator": {"en": "Understood your question", "zh-TW": "已理解你的問題", "zh-CN": "已理解你的问题"},
    "done.orchestrator.premises": {
        "en": "Understood your question and {n} rule{s} you mentioned",
        "zh-TW": "已理解你的問題，以及你提到的 {n} 條規定",
        "zh-CN": "已理解你的问题，以及你提到的 {n} 条规定",
    },
    "done.policy_agent": {
        "en": "Read {n} Knowledge Base entr{ies}",
        "zh-TW": "已讀取 {n} 筆知識庫條目",
        "zh-CN": "已读取 {n} 条知识库条目",
    },
    "done.synthesizer": {"en": "Drafted the answer", "zh-TW": "已完成回答草稿", "zh-CN": "已完成回答草稿"},
    "done.verifier": {
        "en": "Checked {n} statements against their sources",
        "zh-TW": "已將 {n} 項陳述與來源核對",
        "zh-CN": "已将 {n} 项陈述与来源核对",
    },
    "done.verifier.recheck": {
        "en": "Found a rule that changed — rechecking",
        "zh-TW": "發現有規定已變更，正在重新查核",
        "zh-CN": "发现有规定已变更，正在重新核查",
    },
    "waiting": {
        "en": "The free AI service is busy — waiting {n} seconds",
        "zh-TW": "免費 AI 服務忙碌中，等待 {n} 秒",
        "zh-CN": "免费 AI 服务繁忙，等待 {n} 秒",
    },
    "error.empty": {"en": "Please type a question first.", "zh-TW": "請先輸入問題。", "zh-CN": "请先输入问题。"},
    "error.too_long": {
        "en": "Please shorten your question to {n} characters or fewer.",
        "zh-TW": "請將問題縮短到 {n} 個字元以內。",
        "zh-CN": "请将问题缩短到 {n} 个字符以内。",
    },
    "error.bot": {
        "en": "We couldn't confirm you're not a bot. Please reload the page and try again.",
        "zh-TW": "我們無法確認你不是機器人。請重新整理頁面後再試一次。",
        "zh-CN": "我们无法确认你不是机器人。请刷新页面后再试一次。",
    },
    "error.rate_limited": {
        "en": "You've asked several questions recently. Please try again in an hour or tomorrow.",
        "zh-TW": "你最近已經問了好幾個問題。請一小時後或明天再試。",
        "zh-CN": "你最近已经问了好几个问题。请一小时后或明天再试。",
    },
    "error.quota_exhausted": {
        "en": "The free daily limit has been reached.",
        "zh-TW": "今天的免費回答次數已用完。",
        "zh-CN": "今天的免费回答次数已用完。",
    },
    "error.upstream_busy": {
        "en": "The AI service is busy right now. Please try again in a minute.",
        "zh-TW": "AI 服務目前忙碌中。請一分鐘後再試。",
        "zh-CN": "AI 服务目前繁忙。请一分钟后再试。",
    },
    "error.internal": {
        "en": "Something went wrong on our side. Please try again.",
        "zh-TW": "我們這邊出了點問題。請再試一次。",
        "zh-CN": "我们这边出了点问题。请再试一次。",
    },
}


def t(key: str, lang: Lang = "en", **values: object) -> str:
    return _TEXT[key][lang].format(**values)
