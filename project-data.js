// Public project notes, kept separate so the homepage does not load them upfront.
const platform = 'https://github.com/Eternally72/trpc-agent-service';
const review = 'https://github.com/trpc-group/trpc-agent-python';
const example = `${review}/tree/main/examples/skills_code_review_agent`;
const exampleFile = `${review}/blob/main/examples/skills_code_review_agent`;
const platformSource = (path) => `${platform}/${path.endsWith('.py') ? 'blob' : 'tree'}/feature/baijun/${path}`;
const platformDoc = (name) => `${platform}/blob/feature/baijun/docs/${name}.md`;

export const projects = {
  platform: {
    title: '多租户 Agent 平台',
    subtitle: '独立开发 / Python、FastAPI、PostgreSQL',
    source: `${platform}/tree/feature/baijun`,
    architecture: {
      title: '接入、执行与状态分开管理',
      intro: 'IM 消息由 Channel Runtime 接收。Worker 从共享队列领取任务，完整会话和执行状态保存在 PostgreSQL。',
      image: 'assets/platform-architecture.svg',
      note: '连线表示依赖与数据读写。任务和回复由消费者领取，数据库不主动推送。',
      initial: 'worker',
      nodes: [
        { id: 'gateway', title: 'Gateway', label: '管理与配置', x: 17, y: 22, source: platformSource('trpc_service/web'),
          description: '提供平台与租户管理入口，维护 Agent 配置、权限及知识库。企业微信、飞书的长连接消息直接进入 Channel Runtime。',
          points: ['通过共享数据库读取和更新配置。', '知识文档和媒体正文使用对象存储。'] },
        { id: 'channel', title: 'Channel Runtime', label: 'IM 接入与回复', x: 50, y: 22, source: platformSource('trpc_service/channels'),
          description: '连接企业微信和飞书，解析消息、映射用户与会话，将请求持久化入队；Delivery Worker 负责领取 Outbox 并投递回复。',
          points: ['相同外部消息按租户范围去重。', '发送结果不明时转入人工核对，避免盲目重发。'] },
        { id: 'worker', title: 'Agent Worker', label: '任务执行与接管', x: 83, y: 22, source: platformSource('trpc_service/agent/worker.py'),
          description: '每个 Worker 进程包含异步执行槽位。空闲槽位领取可执行任务，恢复上下文后调用 Runner，再提交结果。',
          points: ['同一会话按队首执行，不同会话可以并发。', '执行期间续租；过期 fencing token 无权提交。', '工作目录按执行尝试隔离，减少旧进程持锁影响。'] },
        { id: 'objects', title: '对象存储', label: '文档、媒体与产物', x: 17, y: 76, source: platformSource('trpc_service/storage'),
          description: '通过 S3 接口保存原始知识文档、IM 媒体和 Artifact 正文。临时工作目录只服务于当前执行尝试。',
          points: ['跨进程或跨 Pod 的文件通过持久存储共享。', '对象引用与任务、租户上下文关联。'] },
        { id: 'postgres', title: 'PostgreSQL', label: '任务、会话与 Outbox', x: 50, y: 76, source: platformSource('trpc_service/agent/queue.py'),
          description: '保存任务队列、租约、会话和回复记录。Worker 领取任务时使用短事务，模型调用期间不会一直持有数据库事务。',
          points: ['Session 的完整状态以数据库为准。', 'Redis 只保存带版本的近期会话缓存。', '结果与 Reply Outbox 一起提交后，再进入回复投递。'] },
        { id: 'tools', title: '模型与工具', label: 'LLM / MCP / RAG', x: 83, y: 76, source: platformSource('trpc_service/agent/governance.py'),
          description: 'Runner 使用当前租户的配置快照，装配已授权的模型、远程 MCP 工具和知识检索能力。',
          points: ['连接可用与 Agent 获得工具权限分别管理。', '写入类工具需要确认，检索限定在授权知识库内。'] }
      ]
    },
    sequence: {
      title: '一条消息，从接收到回复',
      intro: '下图省略媒体下载和可选工具调用，展示持久化入队、执行与投递的主要顺序。',
      diagram: 'platform',
      alt: 'IM 将消息交给 Channel，Channel 幂等写入 PostgreSQL 并返回处理中提示；Worker 领取任务并调用模型，随后提交结果和 Outbox；Channel 领取 Outbox，投递回复并记录回执。',
      steps: ['Channel 解析消息并映射租户与会话，幂等写入任务后尝试发送处理中提示。', 'Worker 领取同会话队首任务，恢复上下文，检查权限并调用 Runner。', '执行结果与 Reply Outbox 提交成功后，Channel 领取回复进行投递，记录回执。'],
      note: '处理中提示不代表任务完成。当前链路先汇总模型结果并提交 Outbox，再向 IM 投递回复。',
      extraTitle: 'Worker 在执行中退出，会发生什么？',
      extra: ['未完成任务在租约过期后可以被其他 Worker 接管。', '新尝试使用新的 fencing token 和工作目录；旧 Worker 恢复后无法提交过期结果。', '已保存的 Runner 结果可供恢复使用；投递结果不明的回复停止自动重发，交由人工核对。'],
      source: platformDoc('故障运维与恢复'), sourceLabel: '故障恢复文档'
    },
    results: {
      title: '压测、故障注入与部署验证',
      intro: '以下为 2026 年 9 月项目开发期间的历史记录，数据来自本地项目文档与简历。',
      metrics: [
        { value: '4,028', label: '业务请求', note: '3,908 次模拟请求 + 120 次真实 LLM 请求，本轮业务失败为 0。' },
        { value: '18', label: '可靠性场景', note: '覆盖进程终止、暂停、租约续期、重复消息、投递异常与断连恢复。' },
        { value: '3 节点', label: 'Kubernetes 部署', note: '已完成人工部署及功能验收；与单机压测是两组独立记录。' }
      ],
      comparison: true,
      rows: [
        ['重复入站', '同一外部消息 ID 并发提交 50 次，产生 1 个任务、1 次执行、1 条 Outbox。'],
        ['竞争投递', '12 个 Delivery Worker 实例并发领取，同一回复只被成功领取并接受 1 次。'],
        ['记忆与知识隔离', '人工验证同群机器人、飞书跨渠道记忆及冲突知识场景，未观察到串扰。'],
        ['故障恢复', '修复旧工作目录持锁和投递不确定性问题，再完成可靠性复测。']
      ],
      note: '容量测试运行于单台 WSL 主机。可靠性测试使用本地 HTTP / WebSocket 模拟端；人工 IM 验收没有统一样本量，不换算成准确率。',
      sources: [ { label: '仓库测试记录', href: platformDoc('测试结果') }, { label: 'Kubernetes 部署', href: platformDoc('Kubernetes部署') } ]
    }
  },
  review: {
    title: '自动代码审查 Agent',
    subtitle: '开源贡献 / tRPC-Agent-Python PR #164',
    source: example,
    architecture: {
      title: '模型做判断，程序约束执行',
      intro: 'Workflow 管理任务生命周期；Agent 选择检查步骤；Filter 和 Docker 沙箱共同限制实际执行权限。',
      image: 'assets/review-architecture.svg',
      note: '实线展示主要调用关系。脚本产生候选证据，Agent 综合判断，Workflow 校验并保存最终报告。',
      initial: 'filter',
      nodes: [
        { id: 'workflow', title: 'Workflow', label: '确定性主流程', x: 17, y: 22, source: `${exampleFile}/workflow.py`,
          description: '负责解析输入、创建任务、调用 Agent、校验输出、持久化和生成报告。任务在执行前先以 running 状态保存。',
          points: ['维护总时限、工具预算与证据完整性。', '失败也留下任务状态和审计记录。'] },
        { id: 'agent', title: 'LLM Agent', label: '选择与综合判断', x: 50, y: 22, source: `${example}/agent`,
          description: '由 Runner 驱动，判断是否复用完全匹配的历史证据、选择检查步骤，并结合上下文给出结构化结论。',
          points: ['在调用规则脚本前加载 code-review Skill。', '规则命中只作为候选，不能直接等同最终 finding。'] },
        { id: 'skill', title: 'Code Review Skill', label: '规则与检查脚本', x: 83, y: 22, source: `${example}/skills/code-review`,
          description: '将审查步骤、规则文档和检查脚本封装为能力包，按需加载参考资料并分页获取证据。',
          points: ['涵盖安全、异步、资源、数据库、测试与敏感信息。', '证据未读完或被截断时，报告会标记人工复核。'] },
        { id: 'store', title: '审计与报告', label: 'SQLite / PostgreSQL', x: 17, y: 76, source: `${example}/storage`,
          description: '保存任务、输入、Filter 决策、沙箱运行、finding 与报告；同时提供 JSON 和 Markdown 文件。',
          points: ['规范化字段支持按任务查询完整审计过程。', '报告和持久化记录在写入前执行敏感信息脱敏。'] },
        { id: 'filter', title: 'Tool Filter', label: '模型外权限检查', x: 50, y: 76, source: `${example}/filters`,
          description: '在创建 Docker runtime 前检查命令、脚本、路径、输入模式和预算。被拒绝或需要人工确认的操作不会进入沙箱。',
          points: ['仅允许受限的命令及脚本集合。', '仓库测试可能执行不可信代码，默认需要人工复核。'] },
        { id: 'sandbox', title: 'Docker Sandbox', label: '受限执行环境', x: 83, y: 76, source: `${example}/sandbox`,
          description: '通过惰性创建的容器执行获准命令。代码只读挂载，容器禁网、非 root，根文件系统只读。',
          points: ['限制 CPU、内存、PID、临时目录与输出大小。', '模型请求由宿主进程发出，不在禁网容器中执行。'] }
      ]
    },
    sequence: {
      title: '一次代码审查的执行顺序',
      intro: '示例展示需要运行检查脚本的路径。输入可以是 diff、文件列表、Git 工作区或内置 fixture。',
      diagram: 'review',
      alt: 'Workflow 解析输入并保存任务，然后调用 Agent；Agent 加载 Skill 并请求检查；Filter 校验权限，通过后 Docker 执行脚本，证据返回 Agent；Agent 生成结构化结论，Workflow 校验并输出审计和报告。',
      steps: ['Workflow 解析受审输入，先创建任务，再将上下文交给 Runner 与 Agent。', 'Agent 加载 Skill 并请求脚本检查；Filter 通过后才会创建和调用 Docker runtime。', '脚本证据返回 Agent，最终结论经过范围校验、去重和脱敏，再保存为报告与审计记录。'],
      note: '确定性脚本提供候选证据，模型负责语义判断；最终 finding 仍须通过工作流校验。',
      extraTitle: '权限被拒绝或证据不完整时如何处理？',
      extra: ['Filter 返回拒绝或人工复核决定，命令不进入 Docker。', '分页未读完、执行超时或输出截断会形成限制说明或人工复核项。', '低置信度 finding 转为 warning，执行失败仍保留审计状态。'],
      source: `${exampleFile}/docs/design.md`, sourceLabel: '完整设计说明'
    },
    results: {
      title: '上游合并与分层验证',
      intro: '完成代码审查示例的设计、开发、测试与文档，并通过上游审查。',
      metrics: [
        { value: 'PR #164', label: '已合入上游', note: '2026-08-02 合入 trpc-group/trpc-agent-python。' },
        { value: '6 类', label: '规则检查', note: '安全、异步、资源、数据库生命周期、测试缺失和敏感信息。' },
        { value: '2 种', label: '报告格式', note: '输出 JSON 和 Markdown，并保存可按任务查询的审计记录。' }
      ],
      rows: [
        ['非 Docker 测试', '通过确定性 fake 链路验证输入、治理、输出校验和报告。'],
        ['Docker 集成', '验证真实容器中的 Skill 执行、只读挂载、禁网、超时及资源约束。'],
        ['公开 fixture', '覆盖有问题与无问题的样本，并生成对应 JSON / Markdown 报告。'],
        ['存储与脱敏', '验证审计记录持久化及敏感信息脱敏；提供 PostgreSQL 存储契约测试入口。']
      ],
      note: '公开 fixture 和 fake model 主要验证确定性流程。这些结果不能作为真实仓库分布下的模型审查准确率。',
      sources: [ { label: '合并记录 PR #164', href: `${review}/pull/164` }, { label: '测试与运行说明', href: `${example}#测试` }, { label: '示例报告', href: `${example}/examples` } ]
    }
  }
};
