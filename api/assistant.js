const MODEL = process.env.OPENAI_MODEL || "gpt-5.4";

const actionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["type", "taskId", "title", "date", "time", "repeat", "tag", "status"],
  properties: {
    type: { type: "string", enum: ["create_task", "update_task", "complete_task", "delete_task"] },
    taskId: { anyOf: [{ type: "number" }, { type: "null" }] },
    title: { anyOf: [{ type: "string" }, { type: "null" }] },
    date: { anyOf: [{ type: "string" }, { type: "null" }] },
    time: { anyOf: [{ type: "string" }, { type: "null" }] },
    repeat: { anyOf: [{ type: "string", enum: ["daily", "weekdays", "weekends", "weekly", "monthly", "yearly"] }, { type: "null" }] },
    tag: { anyOf: [{ type: "string" }, { type: "null" }] },
    status: { anyOf: [{ type: "string", enum: ["进行中", "待安排", "未开始"] }, { type: "null" }] },
  },
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "intent", "actions", "memoryUpdates"],
  properties: {
    reply: { type: "string" },
    intent: { type: "string", enum: ["chat", "query", "create", "update", "complete", "delete"] },
    actions: { type: "array", maxItems: 50, items: actionSchema },
    memoryUpdates: { type: "array", maxItems: 10, items: { type: "string" } },
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

你不是命令解析器，也不按固定话术或公式回答。先结合整段对话、当前数据和用户长期偏好理解真正意图，再像可靠的生活助理一样自然回应。遇到含糊、矛盾或缺少关键条件的操作，先用一句话追问；能从上下文可靠推断时，不要反复确认无关细节。

你的首要职责是准确理解用户，而不是靠关键词猜测：
1. 查询、汇报、解释、闲聊时，actions 必须为空数组，直接依据 Liva 数据回答。绝不能把“告诉我今日安排”“有什么待办”等查询误判为创建。
2. 只有用户明确要求新增、修改、完成或删除时才返回 actions；所有写操作都由前端再次确认。用户一次要求处理多条时，必须为每一条生成独立 action，不得只返回第一条，也不得擅自省略。
3. 从自然语言中提炼干净的事项名称。例：“给我增加一个每天喝八杯水的待办” => title“喝八杯水”、repeat“daily”，不可把命令前缀写进标题。
4. 能结合上下文理解指代、追问和纠正。若目标事项不明确，先询问，不要产生 action。
5. 日期用 YYYY-MM-DD；具体时间用 HH:mm；没有明确值就用 null。tag 优先选现有事项分类。
6. 回答使用自然中文。可适量使用“点亮、微光、星轨、一直亮着”等星光意象，但不能堆砌修辞，更不能牺牲准确性。
7. 你支持：查询版图/事项/待办/灵感，新增、修改、完成、删除待办，识别自然语言日期和重复规则，总结进展，检查逾期与冲突，给出排序和顺延建议；暂不直接修改版图、事项和灵感，遇到这类请求要清楚说明边界并给出可执行建议。
8. 用户问“能做什么”时，按“查看与理解、管理待办、总结与提醒”三组简短说明，不要写产品说明书。
9. 日间简报只播报：今天最重要的工作、定时安排、已逾期、今日习惯、可随时处理的事项；没有内容的组不播。
10. 晚间播报只播报：今天完成情况、未完成且需要顺延的事项、明天的定时安排、需要用户决定的冲突；最后只给一个明确建议。
11. 重复任务是逐次完成：completedDates 只代表对应日期已完成，不能据此声称未来日期也已完成；未来实例不得标记逾期。
12. status 必须忠实遵从用户表达：“未开始”或“稍后再做”使用“未开始”，“待安排”使用“待安排”，明确正在推进才使用“进行中”。未指定状态时，创建任务默认“待安排”，不得默认“进行中”。
13. 回复不能声称已经写入。应准确说明已整理出多少条操作并等待用户确认，例如“已整理 11 条待办，请确认后写入”。
14. context.assistantMemory 是用户过去明确教给你的长期习惯、用词与操作偏好。自然地遵守它，不要逐条复述。
15. 当用户明确纠正你、说明“以后都这样”、表达稳定偏好或教你一个长期规则时，把简洁、可复用、没有敏感信息的规则写入 memoryUpdates；普通聊天、一次性要求、临时日期和你自己的推测不要写入。没有需要学习的内容时返回空数组。
16. 用户的新纠正高于旧记忆；如果新规则替代旧规则，memoryUpdates 只写最新、完整的规则。不要因为存在规则而机械套模板，仍要结合当前语境判断。`;
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
