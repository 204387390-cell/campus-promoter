/* 测算逻辑 —— 严格按 V1.1 模型
 * 需求端: O = T × p × c × β × m
 * 情景: 固定 T/c/m，只变 p 与 β（保守 p保守+β30% / 中性 p中性+β50% / 乐观 p乐观+β70%）
 * 先汇总未取整值再四舍五入
 */
(function(){
  const { PARAMS } = window.XB_DATA;

  function periodText(){
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    end.setFullYear(end.getFullYear()+1);
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { start: fmt(start), end: fmt(end), label: `${fmt(start)} 至 ${fmt(end)}` };
  }

  // 需求端：四类 + 四六级合并。返回每类三情景（未取整）
  function demand(d, c){
    const { p, m, beta } = PARAMS;
    const G = 2; // 课程/考研/转专业默认覆盖年级（假设）
    const TC = d.N * G * d.r * d.alpha;
    const TR = d.N * G * d.bR;
    const TZ = d.N * G * d.z;
    const T4 = d.B * d.b4;
    const T6 = d.B * d.b6;

    const calc = (T, pObj, mVal, betaVal) => T * pObj * c * betaVal * mVal;

    const cat = {
      course: {
        T: TC,
        c: calc(TC, p.course.c, m.course.b, beta.c),
        n: calc(TC, p.course.n, m.course.b, beta.n),
        o: calc(TC, p.course.o, m.course.b, beta.o)
      },
      kaoyan: {
        T: TR,
        c: calc(TR, p.kaoyan.c, m.kaoyan.b, beta.c),
        n: calc(TR, p.kaoyan.n, m.kaoyan.b, beta.n),
        o: calc(TR, p.kaoyan.o, m.kaoyan.b, beta.o)
      },
      zhuanye: {
        T: TZ,
        c: calc(TZ, p.zhuanye.c, m.zhuanye.b, beta.c),
        n: calc(TZ, p.zhuanye.n, m.zhuanye.b, beta.n),
        o: calc(TZ, p.zhuanye.o, m.zhuanye.b, beta.o)
      },
      cet4: {
        T: T4,
        c: calc(T4, p.cet4.c, m.cet4.b, beta.c),
        n: calc(T4, p.cet4.n, m.cet4.b, beta.n),
        o: calc(T4, p.cet4.o, m.cet4.b, beta.o)
      },
      cet6: {
        T: T6,
        c: calc(T6, p.cet6.c, m.cet6.b, beta.c),
        n: calc(T6, p.cet6.n, m.cet6.b, beta.n),
        o: calc(T6, p.cet6.o, m.cet6.b, beta.o)
      }
    };
    // 四六级合并（四级+六级）
    cat.cet = { T: T4+T6,
      c: cat.cet4.c+cat.cet6.c, n: cat.cet4.n+cat.cet6.n, o: cat.cet4.o+cat.cet6.o };

    const total = { c:0, n:0, o:0 };
    ['course','kaoyan','zhuanye','cet'].forEach(k=>{
      total.c+=cat[k].c; total.n+=cat[k].n; total.o+=cat[k].o;
    });
    return { cat, total, T: { TC,TR,TZ,T4,T6 } };
  }

  // 服务者端（新建渠道口径，已有服务者为0）
  function supply(d, dem, cRecruit){
    const { e, cs, j, a, k, tau, m } = PARAMS;
    const M = d.M;
    // 来源池 P
    const P = {
      course: (3*d.B/4) + M,       // 缺年级明细时的近似
      kaoyan: M,                    // 在读硕士
      zhuanye: d.transferSuccess || 0, // 近年成功转专业者，缺失则为0→待核实
      cet: d.B + M                  // 本科生+硕士去重（近似）
    };
    const scen = ['c','n','o'];
    const out = {};
    ['course','kaoyan','zhuanye','cet'].forEach(biz=>{
      out[biz] = {};
      const E = P[biz] * e[biz];
      scen.forEach(s=>{
        const R = E * cs * j[s];
        const A = R * a[s];
        const Oneed = dem.cat[biz][s];
        const mVal = biz==='cet' ? m.cet4.b : m[biz].b;
        const U = Oneed / mVal;              // 去重付费学生
        const D = U * tau;                   // 服务关系数
        const Sneed = Math.ceil(D / k[biz].b); // 所需服务者
        const K = A * k[biz].b * mVal / tau;   // 情景容量上限
        const fulfill = Math.min(Oneed, K);    // 供需约束后订单
        out[biz][s] = { E, R, A, Sneed, K, fulfill,
          gap: Math.max(0, Sneed - Math.floor(A)) };
      });
      out[biz].P = P[biz];
    });
    return out;
  }

  const round = x => Math.round(x);

  window.XB_CALC = { periodText, demand, supply, round };
})();
