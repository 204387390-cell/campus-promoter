/* 学伴+行·院校推广助手 —— 内容与参数数据
 * 话术来源：腾讯文档「副本-推广方法及素材」https://docs.qq.com/aio/DSEdPc21kamJFcVZh
 * 院校数据：学伴加行_院校市场前300初筛_含服务者预测.xlsx（V1.1口径，覆盖率c按0.6）
 * 测算口径：学伴加行院校年度订单预测模型 V1.1（含服务者端）
 * 仅整理「陪跑」「家教」两个板块；长者、实习不在首版范围。
 */

// ============ 元信息 ============
const META = {
  sourceName: '副本-推广方法及素材',
  sourceUrl: 'https://docs.qq.com/aio/DSEdPc21kamJFcVZh',
  modelName: '院校年度订单预测模型 V1.1（覆盖率 c=0.6）',
  modelDate: '2026-11-13',
  dataName: '院校市场前300初筛（含服务者预测）',
  syncTime: '2026-11-17 16:32',
  scope: ['陪跑', '家教'],
  notice: '话术中的【学校】请在发布前替换为实际校名；同一学校多人同时发布时请选用不同风格，避免内容雷同被判定为刷屏。'
};

// ============ 院校数据 ============
// 优先使用 xlsx 导入的 300 所真实院校（schools.js 先于本文件加载）；
// 若未加载则回退到内置示例数据（仅用于跑通计算）。
const SCHOOLS = (typeof window.XB_SCHOOLS !== 'undefined' && window.XB_SCHOOLS.length)
  ? window.XB_SCHOOLS
  : [
  { id: 'jlu', name: '吉林大学', short: ['吉大', '吉林大学'],
    data: { B: 40000, N: 9500, M: 18000, r: 0.15, alpha: 2, bR: 0.35, z: 0.06, b4: 0.35, b6: 0.30,
            transferSuccess: null, year: 2025, source: '示例数据（待核实）', confidence: '参考估计' } },
  { id: 'example-a', name: '示例大学甲', short: ['甲大学', '示例甲'],
    data: { B: 22000, N: 5500, M: 9000, r: 0.12, alpha: 2, bR: 0.35, z: 0.06, b4: 0.35, b6: 0.30,
            transferSuccess: null, year: 2025, source: '示例数据（待核实）', confidence: '参考估计' } },
  { id: 'example-b', name: '示例大学乙', short: ['乙大学', '示例乙'],
    data: { B: 15000, N: 3800, M: 5000, r: 0.08, alpha: 2, bR: 0.35, z: 0.06, b4: 0.35, b6: 0.30,
            transferSuccess: null, year: 2025, source: '示例数据（待核实）', confidence: '参考估计' } }
];

// ============ V1.1 模型参数表 ============
const PARAMS = {
  // 付费意愿率 p
  p: {
    course:   { c: 0.05, n: 0.10, o: 0.15 },
    kaoyan:   { c: 0.08, n: 0.15, o: 0.25 },
    zhuanye:  { c: 0.10, n: 0.20, o: 0.35 },
    cet4:     { c: 0.02, n: 0.05, o: 0.10 },
    cet6:     { c: 0.03, n: 0.06, o: 0.12 }
  },
  // 人均订单数 m（低/基准/高）
  m: {
    course:   { l: 2, b: 3,   h: 4 },
    kaoyan:   { l: 1, b: 1.5, h: 2 },
    zhuanye:  { l: 1, b: 1.2, h: 1.5 },
    cet4:     { l: 1, b: 1.2, h: 1.5 },
    cet6:     { l: 1, b: 1.2, h: 1.5 }
  },
  // 意愿兑现率 β
  beta: { c: 0.30, n: 0.50, o: 0.70 },
  cDefault: 0.60,
  // 服务者端参数
  e: { course: 0.15, kaoyan: 0.55, zhuanye: 0.60, cet: 0.15 },
  cs: 0.30,
  j: { c: 0.05, n: 0.08, o: 0.12 },
  a: { c: 0.50, n: 0.60, o: 0.70 },
  tau: 1,
  k: { course: { l: 3, b: 5, h: 8 }, kaoyan: { l: 4, b: 6, h: 8 },
       zhuanye: { l: 5, b: 8, h: 12 }, cet: { l: 5, b: 8, h: 12 } }
};

// ============ 热点阶段（参考阶段，具体以学校通知为准） ============
const HOT_STAGES = {
  course: [
    { name: '开学选课', months: [9, 2], desc: '开学初选课、补退选窗口' },
    { name: '期中', months: [4, 10], desc: '期中测评前后' },
    { name: '期末', months: [1, 6, 12], desc: '期末考试周前' },
    { name: '保研成绩节点', months: [9], desc: '推免资格与成绩认定' }
  ],
  kaoyan: [
    { name: '基础复习', months: [3, 4, 5, 6], desc: '初期基础阶段' },
    { name: '暑期强化', months: [7, 8], desc: '暑假强化集训' },
    { name: '报名', months: [9, 10], desc: '研究生招生考试报名' },
    { name: '初试冲刺', months: [11, 12], desc: '初试前冲刺' },
    { name: '复试', months: [3, 4], desc: '复试准备' }
  ],
  zhuanye: [
    { name: '政策公布', months: [3, 9], desc: '转专业政策发布' },
    { name: '申请', months: [4, 10], desc: '申请提交窗口' },
    { name: '笔试', months: [5, 11], desc: '转专业考核笔试' },
    { name: '面试', months: [5, 11], desc: '转专业考核面试' }
  ],
  cet: [
    { name: '报名', months: [3, 9], desc: '四六级考试报名' },
    { name: '备考', months: [4, 5, 10, 11], desc: '系统备考期' },
    { name: '考前冲刺', months: [6, 12], desc: '考前冲刺' },
    { name: '成绩公布', months: [2, 8], desc: '成绩发布，刷分需求上升' }
  ]
};

// ============ 推广方法 + 文案 + 素材 ============
// purpose: '下单' | '招募'
// channelGroup: '私聊' | '公域' | '校园'
// category: 数组，'课程'|'考研'|'转专业'|'四六级'|'通用'（陪跑）；'家教'
const METHODS = [
  // ---------- 有效拉新（通用）----------
  {
    id: 'm-bind-1', name: '合作伙伴个人二维码拉新', board: '通用', category: ['通用'],
    purpose: '下单', channelGroup: '校园', channel: '海报/传单',
    audience: '新用户', steps: ['我的-合作伙伴-个人二维码', '保存二维码至相册', '放入海报或传单，新用户扫码即完成绑定'],
    stage: '常规期', frequency: { normal: '按物料投放', hot: '按物料投放', interval: '—', scope: '每张物料', rotation: '—' },
    copies: [], materials: [{ type: '二维码', name: '个人二维码', access: '小程序：我的-合作伙伴' }],
    source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-bind-2', name: '小程序转发绑定', board: '通用', category: ['通用'],
    purpose: '下单', channelGroup: '私聊', channel: '微信转发',
    audience: '好友/朋友圈', steps: ['点小程序右上角胶囊「更多」', '选择转发给朋友或分享到朋友圈', '新用户点击卡片进入即完成绑定'],
    stage: '常规期', frequency: { normal: '按需', hot: '按需', interval: '—', scope: '每次转发', rotation: '—' },
    copies: [], materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-bind-3', name: '复制小程序链接拉新', board: '通用', category: ['通用'],
    purpose: '下单', channelGroup: '私聊', channel: '链接分享',
    audience: '任意', steps: ['点小程序右上角胶囊「更多」', '点击复制链接', '粘贴到文案中发送，新用户点击即绑定'],
    stage: '常规期', frequency: { normal: '按需', hot: '按需', interval: '—', scope: '每次发送', rotation: '—' },
    copies: [], materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },

  // ---------- 陪跑 / 下单 ----------
  {
    id: 'm-pp-post-common-student', name: '通用文案（面向大学生）', board: '陪跑', category: ['通用'],
    purpose: '下单', channelGroup: '校园', channel: '朋友圈/群聊/论坛',
    audience: '在校大学生', steps: ['选合适风格', '替换【学校】', '结尾带小程序入口'],
    stage: '常规期', frequency: { normal: '每周2-3次', hot: '每周3-5次', interval: '同一群≥2天', scope: '单个群/账号', rotation: '多风格轮换' },
    copies: [
      { version: '通用版', text: '#学伴+行小程序，大学生自营知识变现平台\n\n在这里，你可以找到全国各个高校的优秀学长学姐，进行考研、保研、转专业、竞赛科研、小初高学业等一对一辅导服务\n\n没有中间商赚差价，服务质量不打折，正规平台有保障\n\n点击查看小程序👇👇\n【小程序链接/卡片/图片】' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-pp-post-common-parent', name: '通用文案（面向家长）', board: '陪跑', category: ['通用'],
    purpose: '下单', channelGroup: '校园', channel: '朋友圈/群聊',
    audience: 'K12家长/大学生家长', steps: ['家长群/熟人圈发布', '结尾带小程序入口'],
    stage: '常规期', frequency: { normal: '每周2-3次', hot: '每周3-5次', interval: '同一群≥2天', scope: '单个群/账号', rotation: '多风格轮换' },
    copies: [
      { version: '通用版', text: '#学伴+行小程序，大学生一对一经验分享平台\n\n大学不是终点，而是新的阶段的开始\n转专业、四六级、竞赛、考研保研，重要性都不比高考低\n\n优秀的学长学姐领着走，能少走许多弯路\n在这里你可以找到全国各个高校的学长学姐进行一对一辅导陪跑服务\n直接对接学长学姐，没有中间商赚差价，平台订单有保障\n\n点击进入小程序，看看有没有你的榜样学长学姐吧！👇👇\n【小程序链接/卡片/图片】' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-pp-moment-empathy', name: '朋友圈·共情型（找不到优秀的人）', board: '陪跑', category: ['通用'],
    purpose: '下单', channelGroup: '校园', channel: '朋友圈',
    audience: '在校大学生', steps: ['发朋友圈', '配小程序卡片'],
    stage: '常规期', frequency: { normal: '每周1-2次', hot: '每周3次', interval: '同一账号≥2天', scope: '单个账号', rotation: '与直给/故事型轮换' },
    copies: [
      { version: '风格一·共情型', text: '上大学遇到问题了不知道应该找谁\n不敢找老师，不知道去哪里加到优秀的学长学姐\n发了消息怕对方不回，多问几次担心对方反感\n送礼物、请吃饭，还不如明码标价\n需要什么样的帮助，你就提\n上学伴平台，认识更多高校优秀学长学姐！' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-pp-moment-vertical', name: '朋友圈·垂直型（转专业/考研/四六级）', board: '陪跑',
    category: ['转专业', '考研', '四六级'], purpose: '下单', channelGroup: '校园', channel: '朋友圈',
    audience: '对应备考/申请学生', steps: ['按类目选版本', '替换【学校】', '配小程序卡片'],
    stage: '报名期/备考期', frequency: { normal: '每周1-2次', hot: '每周3-4次', interval: '同一账号≥2天', scope: '单个账号', rotation: '三类目分开发' },
    copies: [
      { version: '转专业', text: '⭐【学校】|转专业一对一咨询辅导\n均为在校转专业成功的学长学姐，资质有保障✔\n政策解读、备考规划、志愿填报、笔面试辅导自由组合✔\n学长学姐自行定价，明码标价，性价比极高✔\n平台订单保障，不用担心交完钱老师跑路✔\n想预约的同学点击进入小程序即可查看学长学姐信息👇' },
      { version: '四六级', text: '⭐【学校】|四六级一对一辅导\n🙋均为各高校四六级高分学长学姐，能力有保障\n✅直接对接学长学姐，一对一定制服务内容与形式\n✅学长学姐自行定价，价格透明，没有中间商赚差价\n🎯平台订单保障，课后一次一结' },
      { version: '考研', text: '⭐【学校】|考研一对一辅导\n均为本校考研上岸的学长学姐，经验可核验✔\n专业课按目标院校+科目匹配，公共课按科目版本匹配✔\n学长学姐自行定价，明码标价✔\n平台订单保障，课后一次一结✔\n想预约的同学点击进入小程序查看学长学姐信息👇' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: '考研版原文标题仅在素材库标注“垂直型·考研辅导”，正文按同风格补齐，发布前请运营核对。'
  },
  {
    id: 'm-pp-moment-story', name: '朋友圈·故事型（转述他人经历）', board: '陪跑', category: ['通用'],
    purpose: '下单', channelGroup: '校园', channel: '朋友圈',
    audience: '在校大学生', steps: ['转述真实经历，不要编造', '配小程序卡片'],
    stage: '常规期', frequency: { normal: '每周1次', hot: '每周2次', interval: '同一账号≥3天', scope: '单个账号', rotation: '与共情型轮换' },
    copies: [
      { version: '故事型', text: '（此处参考素材库的“故事型·转述他人经历”框架）\n身边一个学弟，之前转专业一头雾水，后来在「学伴+行」上找了位转成功的学长做一对一咨询，政策、笔试、面试一路捋下来，少走了很多弯路。\n有类似迷茫的同学，可以去小程序看看学长学姐的经验。' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: '⚠️ 素材库该风格正文未给出，以上为结构示例，务必用真实经历改写，不要编造。'
  },
  {
    id: 'm-pp-moment-cet-push', name: '朋友圈·推动型（四六级证书重要性）', board: '陪跑', category: ['四六级'],
    purpose: '下单', channelGroup: '校园', channel: '朋友圈',
    audience: '备考四六级学生', steps: ['考试月前后发布', '配小程序卡片'],
    stage: '考前冲刺/成绩公布', frequency: { normal: '每月2次', hot: '每周2-3次', interval: '同一账号≥2天', scope: '单个账号', rotation: '—' },
    copies: [
      { version: '推动型·四六级', text: '6/12月即将开始四六级考试\n四六级证书是大学里最重要的证书，没有之一\n央国企、民企外企、保研等通通会要求四六级成绩\n想要快速提升自己的英语水平，点击下方小程序，寻找学长学姐的帮助吧！' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-pp-moment-parent', name: '朋友圈·面向家长（焦虑/低价策略）', board: '陪跑', category: ['通用'],
    purpose: '下单', channelGroup: '校园', channel: '朋友圈',
    audience: '大学生家长', steps: ['面向家长发布', '配小程序卡片'],
    stage: '常规期/开学季', frequency: { normal: '每周1-2次', hot: '每周3次', interval: '同一账号≥2天', scope: '单个账号', rotation: '两种策略轮换' },
    copies: [
      { version: '共情型·贩卖焦虑', text: '每年开学以后，都有新生家长和我说，他们接到了机构的电话，问他们孩子想不想保研，想不想转专业。（后文参见素材库原文）' },
      { version: '低价有效策略', text: '每年开学以后，都有新生家长和我说，他们接到了机构的电话，问他们孩子想不想保研，想不想转专业。\n与其报高价机构，不如直接找本校过来人——「学伴+行」上都是本校优秀的学长学姐，一对一经验辅导，明码标价，平台有保障。' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: '共情型原文在素材库中未完整展示，以上为框架/补齐版，发布前请核对。'
  },
  {
    id: 'm-pp-group', name: '群聊话术（学生群/考研群/转专业群）', board: '陪跑', category: ['通用'],
    purpose: '下单', channelGroup: '校园', channel: '学生群/备考群/求职群',
    audience: '对应群成员', steps: ['自有群每周2-3次；非自有群一次性发完', '文案后紧跟小程序入口：卡片＞链接＞图片'],
    stage: '常规期/备考期', frequency: { normal: '每周2-3次（自有群）', hot: '每周3-4次', interval: '同一群≥2天', scope: '单个群', rotation: '多版本轮换' },
    copies: [
      { version: '通用学生群', text: '同学你好，分享一个大学生一对一经验咨询平台「学伴+行」——本校考研/保研/转专业上岸的学长学姐在线，经验辅导明码标价，平台订单有保障。有需要的同学可以看看👇【小程序卡片】' },
      { version: '备考/求职群', text: '备考/找实习的同学留意下，「学伴+行」上有本校过来人做一对一经验咨询和辅导，考研、保研、秋招、转专业都能找到对应的人，无中间商，平台有保障。' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: '素材库该部分仅列版本名（通用学生群/研究生群/转专业交流群/竞赛交流群/求职群/备考群），正文未给出，以上为示范文案。'
  },
  {
    id: 'm-pp-wall', name: '墙与频道投稿（陪跑）', board: '陪跑', category: ['通用'],
    purpose: '下单', channelGroup: '校园', channel: '表白墙/频道',
    audience: '全校学生', steps: ['控制字数，像学生自己发的', '结尾引导，配小程序入口'],
    stage: '常规期', frequency: { normal: '每周1-2次', hot: '每周3次', interval: '同一墙≥2天', scope: '单个墙/频道', rotation: '多风格轮换' },
    copies: [
      { version: '投稿版', text: '分享一个大学生一对一经验咨询平台「学伴+行」，本校考研、保研、转专业、四六级的高分学长学姐都在，经验辅导明码标价，平台有保障。有需要的同学自己看👇' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: '素材库该部分正文未给出，以上为示范文案。'
  },

  // ---------- 陪跑 / 招募服务者 ----------
  {
    id: 'm-pp-recruit-common', name: '通用文案（招募服务者）', board: '陪跑', category: ['通用'],
    purpose: '招募', channelGroup: '校园', channel: '朋友圈/群聊/论坛',
    audience: '有成果的学长学姐', steps: ['突出身份+回报+优势', '配入驻入口'],
    stage: '常规期', frequency: { normal: '每周2-3次', hot: '每周4次', interval: '同一群≥2天', scope: '单个群/账号', rotation: '多风格轮换' },
    copies: [
      { version: '通用版', text: '#学伴+行小程序，大学生自营知识变现平台\n\n在这里，考研保研上岸、转专业成功、竞赛科研拿奖、收到offer等等，你的经验、知识、成果通通能够转化成财富\n\n没有信息费，没有抽成，时间灵活，价格自定\n\n点击马上入驻赚生活费吧👇👇\n【小程序链接/卡片/图片】' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-pp-moment-recruit', name: '朋友圈·招募学长学姐（5种风格）', board: '陪跑', category: ['通用'],
    purpose: '招募', channelGroup: '校园', channel: '朋友圈',
    audience: '有成果的学长学姐', steps: ['按号主人设选风格', '第一人称经历型必须本人真的上岸过，不要编', '配入驻入口'],
    stage: '常规期/成绩公布后', frequency: { normal: '每周1-2次', hot: '每周3次', interval: '同一账号≥2天', scope: '单个账号', rotation: '5种风格轮换' },
    copies: [
      { version: '风格三·算账型', text: '在当下，知识经验就是财富，结果就是最好的名片\n不管你是保研上岸/考研上岸/转专业成功，还是某门课拿到满绩\n在和你拥有同样目标的学弟学妹面前，都是有价值的\n上学伴平台，将你的知识经验转化为财富和正反馈\n点击下方小程序，赶紧入驻吧' },
      { version: '风格一·直给利益型', text: '（素材库标注该风格，正文参见原文）\n你有上岸/高分/科研竞赛成果吗？把经验整理成有偿服务，无信息费、无抽成、时间自由。点击下方入驻👇' },
      { version: '风格二·第一人称经历型', text: '（素材库标注该风格，正文参见原文，必须本人真实经历，不要编）' },
      { version: '风格四·种草型', text: '（素材库标注该风格，正文参见原文）' },
      { version: '风格五·书面档', text: '（素材库标注该风格，面向做事比较稳的学长学姐，避免用“零花钱”这类说法，正文参见原文）' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: '素材库仅给出风格三正文，其余四种仅标注风格名，以上为占位框架，发布前需补齐原文。'
  },
  {
    id: 'm-pp-public-post', name: '公域·发帖招募服务者', board: '陪跑', category: ['考研', '转专业', '通用'],
    purpose: '招募', channelGroup: '公域', channel: '小红书/抖音/快手',
    audience: '上岸/有成果学长学姐', steps: ['发招募帖，核心=身份+回报+优势', '可扮演用户发需求内容精准招募', '图文/视频形式'],
    stage: '常规期/放榜季', frequency: { normal: '每周3-5条', hot: '每日1-2条', interval: '同账号≥1天', scope: '单个账号', rotation: '多账号矩阵' },
    copies: [
      { version: '转专业需求帖', text: '有无【学校】转专业成功的学长学姐？各个专业都要，有偿咨询' },
      { version: '通用招募帖', text: '招募就业、考研、保研学长学姐（标题）\n用你的真实经历和知识，获得回报\n辅导时薪：预计100-200元/小时\n单次咨询：预计30-60元/次\n长期陪跑：预计2000-3000元\n不需要自己找用户，不要求长期在线，无抽成，自己设定服务内容和价格\n目前已有1000+学长学姐入驻' }
    ],
    materials: [{ type: '入驻流程', name: '服务者入驻流程', access: 'https://docs.qq.com/doc/DSEdJWkJtdWFDR3Vs' }],
    source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-pp-public-jieliu', name: '公域·评论区截流', board: '陪跑', category: ['考研', '转专业', '通用'],
    purpose: '招募', channelGroup: '公域', channel: '小红书/抖音/快手评论区',
    audience: '热门帖下的目标对象', steps: ['搜关键词：学校名+考研上岸/保研/复试经验/调剂上岸/转专业成功/秋招上岸/竞赛获奖等', '筛选热门帖', '评论区留言引导私信'],
    stage: '常规期/放榜季', frequency: { normal: '每日5-10条', hot: '每日10-20条', interval: '同帖只留1条', scope: '单账号', rotation: '固定话术+微调' },
    copies: [
      { version: '评论区话术', text: '借楼，我是【学校】的，我们自己做了一个小程序，做考研/保研/转专业/就业辅导，没有信息费也没有任何抽成，有兴趣了解一下吗？' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: '注意规避违规词，控制每日私信数量。'
  },
  {
    id: 'm-pp-public-dm', name: '公域·主动私信潜在服务者', board: '陪跑', category: ['考研', '转专业', '通用'],
    purpose: '招募', channelGroup: '公域', channel: '小红书/抖音私信',
    audience: '有相关经历的学长学姐', steps: ['搜学校名+关键词', '看主页和帖子确认身份与意愿', '发私信，感兴趣后引导加微信', '发小程序与入驻规则'],
    stage: '常规期', frequency: { normal: '每日≤20条', hot: '每日≤30条', interval: '分批发送', scope: '单账号', rotation: '4种话术按对象选' },
    copies: [
      { version: '考研/保研/考公经历', text: '学长/学姐你好，看到你【考研上岸/成功保研/考公上岸】了，真的很优秀。我们是【学校】的学生，自己做了一个大学生1对1经验咨询和辅导小程序，可以把自己的经验整理成有偿服务，服务内容和价格由自己决定。你有兴趣入驻吗？' },
      { version: '转专业经历', text: '学长/学姐你好，看到你成功从【原专业】转到了【现专业】。我们是【学校】的学生，自己做了一个大学生1对1经验咨询和辅导小程序，可以为准备转专业的同学提供经验咨询和辅导，服务内容和价格由自己决定。你有兴趣入驻吗？' },
      { version: '求职/实习经历', text: '同学你好，看到你拿到了【公司/岗位】的Offer，也分享过一些求职经验。我们是【学校】的学生，自己做了一个大学生1对1经验咨询小程序，可以为学弟学妹提供有偿的就业经验咨询。你有兴趣入驻吗？' },
      { version: '竞赛/科研经历', text: '同学你好，看到你参加过【竞赛/科研项目】，还取得了【具体成果】，真的很优秀。我们是【学校】的学生，自己做了一个大学生1对1经验咨询小程序，可以为准备参加相关项目的同学提供经验咨询。你有兴趣入驻吗？' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: '控制每日私信次数，平台对高频私信账号有监管。'
  },

  // ---------- 家教 / 下单（只做内容推荐）----------
  {
    id: 'm-jj-moment-parent', name: '朋友圈·家教（面向K12家长）', board: '家教', category: ['家教'],
    purpose: '下单', channelGroup: '校园', channel: '朋友圈',
    audience: 'K12家长', steps: ['前3行最关键，超6行折叠', '配小程序链接'],
    stage: '常规期/开学季', frequency: { normal: '每周1-2次', hot: '每周3次', interval: '同一账号≥2天', scope: '单个账号', rotation: '两种风格轮换' },
    copies: [
      { version: '用户种草型', text: '给孩子在学伴平台上找家教，体验很不错👍都是在校大学生，一对一辅导，耐心又专业，孩子状态改善很明显。\n找学霸上学伴，大学生一对一辅导，分享给有需要的家长✨\n【小程序链接】' },
      { version: '直给型', text: '学伴+行，大学生家教平台，吉林大学团队开发。可自由选择各高校成绩优秀、勤工俭学的大学生陪伴孩子学习成长。价格合适，没有中间商赚差价，服务不打折。有需要的朋友们可以点击进入小程序，查看并预约大学生上门服务👇👇\n【小程序链接】' }
    ],
    materials: [{ type: '小程序卡片', name: '家教板块·面向家长', access: '素材库：小程序卡片' }],
    source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-jj-group-parent', name: '群聊·面向K12家长', board: '家教', category: ['家教'],
    purpose: '下单', channelGroup: '校园', channel: '家长群',
    audience: 'K12家长', steps: ['语气客气、信息清楚', '配小程序卡片/链接'],
    stage: '常规期', frequency: { normal: '每周1-2次', hot: '每周3次', interval: '同一群≥2天', scope: '单个群', rotation: '—' },
    copies: [
      { version: '家长群版', text: '打扰一下各位家长。给大家分享一个能够直接找到大学生家教的平台，「学伴+行」小程序可自由选择各高校成绩优秀、勤工俭学的大学生陪伴孩子学习成长。价格合适，没有中间商赚差价，服务质量不打折。有需要的朋友们可以点击进入小程序，查看并预约大学生上门服务。\n【小程序卡片/链接】' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-jj-faq', name: '家长常见问题应答', board: '家教', category: ['家教'],
    purpose: '下单', channelGroup: '私聊', channel: '一对一私聊',
    audience: 'K12家长', steps: ['家长提问时按此应答', '客观说明，不夸大'],
    stage: '常规期', frequency: { normal: '按需', hot: '按需', interval: '—', scope: '单次对话', rotation: '—' },
    copies: [
      { version: '老师靠谱吗', text: '都是实名认证的在读大学生，资料经过审核，可以看经历、评价、价目表。' },
      { version: '是哪个学校的', text: '都是本地高校的在读大学生，具体学校、专业、年级在个人主页上都能看到。' },
      { version: '多少钱', text: '首次200元，含一次不超过2小时的辅导。后续参考家教公开的价目表协商。' },
      { version: '不合适能退吗', text: '付款前能看到退款说明。如果出现未按约定服务、失联等情况，可以申请退款或售后。' },
      { version: '怎么选老师', text: '可以直接选家教下单，也可以发布需求，让符合条件的家教报名后你来选。' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-jj-forum', name: '本校论坛·家教（直给/钩子型）', board: '家教', category: ['家教'],
    purpose: '下单', channelGroup: '校园', channel: '本校论坛',
    audience: '学生/家长', steps: ['发论坛帖', '钩子型用于找家教资源'],
    stage: '常规期', frequency: { normal: '每周1-2次', hot: '每周3次', interval: '同论坛≥2天', scope: '单个论坛', rotation: '两种风格轮换' },
    copies: [
      { version: '直给型', text: '想做家教的同学可以私信我/进群，大学生自己开发的小程序/建的群，单子很多，无信息费。' },
      { version: '钩子型', text: '有没有能教小学/初中/高中【科目】的同学，不要中介' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },

  // ---------- 家教 / 招募服务者 ----------
  {
    id: 'm-jj-moment-recruit', name: '朋友圈·招募家教服务者', board: '家教', category: ['家教'],
    purpose: '招募', channelGroup: '校园', channel: '朋友圈',
    audience: '想做家教的大学生', steps: ['突出无信息费', '配入驻入口'],
    stage: '常规期', frequency: { normal: '每周1-2次', hot: '每周3次', interval: '同一账号≥2天', scope: '单个账号', rotation: '两种风格轮换' },
    copies: [
      { version: '通用型·突出无信息费', text: '想做家教不知道怎么找单子的学弟学妹们可以试试这个小程序\n不用交信息费，没有被骗的风险\n入驻填写完信息后等着接单就行，点击下方小程序立即入驻👇\n【小程序链接/卡片/海报】' },
      { version: '第一人称经历型', text: '朋友圈有想做家教的朋友可以试试这个小程序，是学校里的一个学长自己开发的，不用交信息费。我在上面已经接到过单子了，真实可靠。' }
    ],
    materials: [{ type: '小程序卡片', name: '家教板块·面向服务者', access: '素材库：小程序卡片' }],
    source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-jj-public-tuwen', name: '公域·家教图文账号（3类）', board: '家教', category: ['家教'],
    purpose: '招募', channelGroup: '公域', channel: '小红书/抖音/快手',
    audience: '家教兼职大学生/家长', steps: ['选账号定位', '高频铺量或长期真实感', '配评论区引流'],
    stage: '常规期', frequency: { normal: '每周5-10条', hot: '每日1-2条', interval: '同账号≥1天', scope: '单个账号', rotation: '多账号矩阵' },
    copies: [
      { version: '直接找家教类账号', text: '内容围绕：家教兼职/大学生赚钱/稳定接单/正规小程序/无需缴纳信息费/无风险。图片优先用小程序截图、接单页面、收入页面、聊天截图等真实内容。' },
      { version: '家教身份IP账号', text: '定位为大学生家教日常记录账号。内容方向：家教日常/上课记录/学习分享/学生反馈/大学生生活/收入记录/辅导经验。重点是真实感与信任，无需注册小号。' },
      { version: '直接找家长类账号', text: '内容贴近中年人，简单直接。重点展现大学生身份、勤工俭学、成绩优异。发帖文字尽量不直接说“家教”，可用谐音字、陪读、伴学等代替；图片视频审核强度低于文字。平台审核强度：小红书＞抖音＞快手。' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: '发帖规避违规词：用陪读/伴学等替代“家教”。'
  },
  {
    id: 'm-jj-public-jieliu', name: '公域·家教截流', board: '家教', category: ['家教'],
    purpose: '招募', channelGroup: '公域', channel: '小红书/抖音/快手评论区',
    audience: '找家教/兼职帖下用户', steps: ['搜家教、兼职、补课、大学生家教等帖', '评论区留言引导私聊', '先建立真实感再引流'],
    stage: '常规期', frequency: { normal: '每日5-10条', hot: '每日10-20条', interval: '同帖只留1条', scope: '单账号', rotation: '固定话术长期用' },
    copies: [
      { version: '推荐回复1', text: '正规家教小程序，不用给信息费，单子很多' },
      { version: '推荐回复2', text: '大学生自己做的家教小程序，不用给信息费，单子很多' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  },
  {
    id: 'm-jj-public-dm', name: '公域·主动私信家教服务者', board: '家教', category: ['家教'],
    purpose: '招募', channelGroup: '公域', channel: '小红书/抖音私信',
    audience: '找家教兼职/分享备考经验的大学生', steps: ['搜学校名/城市名+找家教/家教兼职/学科名称等', '看主页判断', '发私信'],
    stage: '常规期', frequency: { normal: '每日≤20条', hot: '每日≤30条', interval: '分批发送', scope: '单账号', rotation: '3种话术按对象选' },
    copies: [
      { version: '明确想做家教', text: '同学你好，看到你想做家教是吗？我们是【学校】的学生，自己做了一个大学生家教小程序，不收大学生的信息费，单子很多，你需要的话我可以推你。' },
      { version: '有家教经历', text: '同学你好，看到你之前做过【学科/年级】家教。我们是【学校】的学生，自己做了一个大学生家教小程序，不收大学生的信息费，单子很多，你需要的话我可以推你。' },
      { version: '成绩/学科突出', text: '同学你好，看到你在【学科/考试】方面成绩很好，也分享过一些学习经验。我们是【学校】的学生，自己做了一个大学生家教小程序，想邀请专业和学科能力比较匹配的大学生入驻，不收大学生的信息费，单子很多，你需要的话我可以推你。' }
    ],
    materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: '控制每日私信次数，平台对高频私信账号有监管。'
  },
  {
    id: 'm-jj-group-jieliu', name: '家教群截流与建群', board: '家教', category: ['家教'],
    purpose: '招募', channelGroup: '校园', channel: '家教群',
    audience: '家教群成员', steps: ['装作家教或家长进群观察', '时机成熟逐个添加成员', '群成员从下往上加，避开群管理，微信上限一天50条好友邀请', '可自建本校家教群，满60人转企业微信群'],
    stage: '常规期', frequency: { normal: '每日≤50条邀请', hot: '每日≤50条邀请', interval: '分批', scope: '单个微信号', rotation: '—' },
    copies: [], materials: [], source: META.sourceUrl, updateTime: '2026-11-17', notes: ''
  }
];

// ============ 待核对清单（结构化时发现的缺失） ============
const TODO_LIST = [
  '素材库中「朋友圈话术·陪跑」部分有多个风格（直给利益型/第一人称经历型/种草型/书面档、故事型、共情型面向家长等）仅给出风格名，正文未完整展示，网页中已用框架/示范文案占位，需运营补齐原文。',
  '「群聊话术」「墙与频道投稿」（陪跑/家教）多数仅列版本名，正文未给出，网页中为示范文案，需运营核对。',
  '各业务宣传频次（常规/热点/间隔）素材库仅零散提及（如“自有群每周2-3次”），网页按此整理为建议值，需运营确认。',
  '各校热点日期与通知来源未提供，网页用通用参考阶段（标注“具体以学校通知为准”），需运营维护本校校历。',
  '院校数据来自《院校市场前300初筛》（V1.1，覆盖率c=0.3口径），网页按覆盖率0.6将订单值翻倍展示；前300为该样本内排序，硕士数仅115所可得，供需约束后订单仍未核对。',
  '家教板块按约定只做内容推荐，不做市场测算。',
  '长者、实习板块不在首版范围，未纳入。'
];

// 首版仅保留校园渠道、有固定文案的方法（公域、私聊、操作流程类暂不纳入）
const CAMPUS_METHODS = METHODS.filter(m => m.channelGroup === '校园' && m.copies && m.copies.length > 0);

// 暴露到全局
window.XB_DATA = { META, SCHOOLS, PARAMS, HOT_STAGES, METHODS: CAMPUS_METHODS, TODO_LIST };
