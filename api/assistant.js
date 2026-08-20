const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "intent", "action"],
  properties: {
    reply: { type: "string" },
    intent: { type: "string", enum: ["chat", "query", "create", "update", "complete", "delete"] },
    action: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["type", "taskId", "title", "date", "time", "repeat", "tag"],
          properties: {
            type: { type: "string", enum: ["create_task", "update_task", "complete_task", "delete_task"] },
            taskId: { anyOf: [{ type: "number" }, { type: "null" }] },
            title: { anyOf: [{ type: "string" }, { type: "null" }] },
            date: { anyOf: [{ type: "string" }, { type: "null" }] },
            time: { anyOf: [{ type: "string" }, { type: "null" }] },
            repeat: { anyOf: [{ type: "string", enum: ["daily", "weekdays", "weekends", "weekly", "monthly", "yearly"] }, { type: "null" }] },
            tag: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
        },
      ],
    },
  },
};

function getOutputText(response) {
  if (response.output_text) return response.output_text;
  return response.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text || "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "Liva 还没有配置 OPENAI_API_KEY，微光暂时无法连接真正的 AI。" });
  }
  try {
    const { message, history = [], context = {} } = req.body || {};
    if (!message || typeof message !== "string") return res.status(400).json({ error: "缺少消息内容" });
    const recentHistory = history.slice(-20).map(({ role, text }) => ({
      role: role === "assistant" ? "assistant" : "user",
      content: String(text || "").slice(0, 4000),
    }));
    const today = new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" });
    const instructions = `你是“微光”，住在 Liva 个人生活管理应用里的一颗温柔、清醒、可靠的小星星。你的职责是照亮重点、梳理生活星轨，并陪用户稳稳推进。当前日期是 ${today}（Asia/Shanghai）。

你的首要职责是准确理解用户，而不是靠关键词猜测：
1. 查询、汇报、解释、闲聊时，action 必须为 null，直接依据 Liva 数据回答。绝不能把“告诉我今日安排”“有什么待办”等查询误判为创建。
2. 只有用户明确要求新增、修改、完成或删除时才返回 action；所有写操作都由前端再次确认。
3. 从自然语言中提炼干净的事项名称。例：“给我增加一个每天喝八杯水的待办” => title“喝八杯水”、repeat“daily”，不可把命令前缀写进标题。
4. 能结合上下文理解指代、追问和纠正。若目标事项不明确，先询问，不要产生 action。
5. 日期用 YYYY-MM-DD；具体时间用 HH:mm；没有明确值就用 null。tag 优先选现有事项分类。
6. 回答使用自然中文。可适量使用“点亮、微光、星轨、一直亮着”等星光意象，但不能堆砌修辞，更不能牺牲准确性。
7. 日报按工作重点、习惯、其他待办、灵感、已完成、明日日程分组；只展示真实数据，最后给简短优先级建议。`;
    const input = [
      ...recentHistory,
      { role: "user", content: `以下是当前 Liva 数据快照：\n${JSON.stringify(context)}\n\n用户刚刚说：${message}` },
    ];
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        instructions,
        input,
        text: { format: { type: "json_schema", name: "liva_assistant_response", strict: true, schema: responseSchema } },
      }),
    });
    const response = await apiResponse.json();
    if (!apiResponse.ok) throw new Error(response.error?.message || "OpenAI request failed");
    const output = JSON.parse(getOutputText(response));
    return res.status(200).json(output);
  } catch (error) {
    console.error("Liva assistant error:", error);
    return res.status(500).json({ error: "微光刚才没能照清这句话，请稍后再说一次。", detail: error.message });
  }
}

