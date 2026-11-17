/* 学伴+行·院校推广助手 —— 交互逻辑 */
(function(){
  const { META, SCHOOLS, PARAMS, HOT_STAGES, METHODS, TODO_LIST } = window.XB_DATA;
  const CALC = window.XB_CALC;

  const state = {
    school: null,
    board: '陪跑',
    category: '自动',
    purpose: '全部',
    channel: '全部',
    lastDemand: null
  };

  const $ = id => document.getElementById(id);
  const CAT_ORDER = ['课程','考研','转专业','四六级'];
  const CAT_KEY = { '课程':'course','考研':'kaoyan','转专业':'zhuanye','四六级':'cet' };
  const CAT_LABEL = { course:'课程辅导', kaoyan:'考研辅导', zhuanye:'转专业辅导', cet:'四六级辅导' };

  function toast(msg){
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(t._timer); t._timer = setTimeout(()=>t.hidden=true, 2200);
  }

  // ---------- 初始化底部信息 ----------
  function initMeta(){
    $('syncTime').textContent = META.syncTime;
    $('modelName').textContent = META.modelName;
    $('dataName').textContent = META.dataName || '院校市场数据';
    $('sourceLink').href = META.sourceUrl;
    const ul = $('todoList');
    TODO_LIST.forEach(x=>{ const li=document.createElement('li'); li.textContent=x; ul.appendChild(li); });
  }

  // ---------- 院校搜索 ----------
  function renderSearch(q){
    const box = $('schoolResults');
    if(!q.trim()){ box.hidden=true; box.innerHTML=''; return; }
    const kw = q.trim().toLowerCase();
    const hits = SCHOOLS.filter(s =>
      s.name.toLowerCase().includes(kw) || s.short.some(x=>x.toLowerCase().includes(kw))
    );
    if(!hits.length){
      box.innerHTML = '<div class="school-empty">未收录该院校，可联系运营补充数据。</div>';
      box.hidden=false; return;
    }
    box.innerHTML = '';
    const shown = hits.slice(0,30);
    shown.forEach(s=>{
      const div=document.createElement('div'); div.className='school-item';
      const mid = s.o && s.o.total ? ` · 中性 ${CALC.round(s.o.total.n)} 单` : '';
      const loc = s.data.province ? `${s.data.province}` : '';
      div.innerHTML = `<span class="si-name">${s.rank?`<small>#${s.rank} </small>`:''}${s.name}</span><span class="si-meta">${loc}${mid}</span>`;
      div.onclick = ()=>selectSchool(s);
      box.appendChild(div);
    });
    if(hits.length>shown.length){
      const more=document.createElement('div'); more.className='school-empty';
      more.textContent=`还有 ${hits.length-shown.length} 所匹配，请输入更完整的校名`;
      box.appendChild(more);
    }
    box.hidden=false;
  }

  function selectSchool(s){
    state.school = s;
    $('schoolSearch').value = s.name;
    $('schoolResults').hidden = true;
    $('boardTabs').hidden = false;
    try{ localStorage.setItem('xb_last_school', s.id); }catch(e){}
    refresh();
  }

  // ---------- 热点阶段判断（北京时间）----------
  function currentStageKeys(){
    const month = new Date().getMonth()+1;
    const keys = [];
    Object.keys(HOT_STAGES).forEach(k=>{
      HOT_STAGES[k].forEach(st=>{
        if(st.months.includes(month)) keys.push({ biz:k, name:st.name, desc:st.desc });
      });
    });
    return keys;
  }

  function nextStageFor(biz){
    const month = new Date().getMonth()+1;
    const stages = HOT_STAGES[biz];
    // 找最近的未来阶段（按月份最小值大于当前月，或循环到明年）
    const upcoming = stages.filter(s=>Math.min(...s.months)>month).sort((a,b)=>Math.min(...a.months)-Math.min(...b.months));
    if(upcoming.length) return upcoming[0].name + '（约' + Math.min(...upcoming[0].months) + '月）';
    const sorted = [...stages].sort((a,b)=>Math.min(...a.months)-Math.min(...b.months));
    return sorted[0] ? sorted[0].name + '（约' + Math.min(...sorted[0].months) + '月）' : '—';
  }

  // ---------- 市场渲染 ----------
  function renderMarket(){
    const s = state.school;
    // 优先用 xlsx 预计算订单（已按 c=0.6 口径翻倍），否则前端现算
    const dem = getDemand(s);
    state.lastDemand = dem;
    const r = CALC.round;
    const period = CALC.periodText();

    $('heroRange').textContent = `${r(dem.total.c)} ~ ${r(dem.total.o)} 单`;
    $('heroMid').textContent = r(dem.total.n);
    $('heroPeriod').textContent = `测算期间 ${period.label} · 宣传覆盖率假设 ${PARAMS.cDefault*100}%`;

    // 可信度标签
    const tag = $('confidenceTag');
    tag.textContent = '条件情景 · 待校准';
    tag.className = 'tag tag-soft low';

    // 分类表
    const tbody = $('categoryTable').querySelector('tbody');
    tbody.innerHTML = '';
    CAT_ORDER.forEach(cat=>{
      const k = CAT_KEY[cat], d = dem.cat[k];
      const pct = dem.total.n ? (d.n/dem.total.n*100).toFixed(1) : '0.0';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${CAT_LABEL[k]}</td><td>${r(d.c)}</td><td>${r(d.n)}</td><td>${r(d.o)}</td><td>${pct}%</td>`;
      tbody.appendChild(tr);
    });
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>合计</td><td>${r(dem.total.c)}</td><td>${r(dem.total.n)}</td><td>${r(dem.total.o)}</td><td>100%</td>`;
    tbody.appendChild(tr);

    renderFocus(dem);
  }

  // ---------- 年度重点 / 当前重点 ----------
  function renderFocus(dem){
    // 年度重点：中性预测 Top2
    const ranked = CAT_ORDER.map(cat=>({ cat, k:CAT_KEY[cat], n:dem.cat[CAT_KEY[cat]].n }))
      .sort((a,b)=>b.n-a.n);
    const top2 = ranked.slice(0,2);
    $('yearFocus').innerHTML = top2.map((x,i)=>`
      <div class="focus-item"><b>${i+1}. ${CAT_LABEL[x.k]}</b>
      <div class="reason">中性预测 ${CALC.round(x.n)} 单，占比 ${(x.n/dem.total.n*100).toFixed(1)}%</div></div>`).join('');

    // 当前重点：热点阶段 ∩ 类目，同阶段按订单潜力排序
    const stages = currentStageKeys();
    const stageBiz = [...new Set(stages.map(s=>s.biz))];
    let curK = [];
    if(stageBiz.length){
      curK = stageBiz.map(biz=>({ biz, n:dem.cat[biz].n })).sort((a,b)=>b.n-a.n);
    } else {
      curK = ranked.slice(0,1).map(x=>({biz:x.k,n:x.n}));
    }
    $('currentFocus').innerHTML = curK.map(x=>{
      const st = stages.filter(s=>s.biz===x.biz).map(s=>s.name).join('、');
      return `<div class="focus-item"><b>${CAT_LABEL[x.biz]}</b>
        <div class="reason">${st ? '当前阶段：'+st : '暂无确认阶段'} · 期内潜力 ${CALC.round(x.n)} 单</div></div>`;
    }).join('');

    // 热点阶段列表
    $('stageList').innerHTML = CAT_ORDER.map(cat=>{
      const k=CAT_KEY[cat];
      const active = stages.filter(s=>s.biz===k);
      if(active.length){
        return active.map(s=>`<div class="stage-chip now"><b>${CAT_LABEL[k]} · ${s.name}</b>${s.desc}<br>下一阶段：${nextStageFor(k)}</div>`).join('');
      }
      return `<div class="stage-chip"><b>${CAT_LABEL[k]}</b>下一阶段：${nextStageFor(k)}</div>`;
    }).join('');
  }

  // ---------- 筛选器 ----------
  function initFilters(){
    const catWrap = $('filterCategory');
    const opts = ['自动', ...CAT_ORDER, '通用'];
    catWrap.innerHTML = opts.map((o,i)=>`<button class="chip ${i===0?'active':''}" data-value="${o}">${o==='自动'?'自动（当前重点）':o}</button>`).join('');
    catWrap.querySelectorAll('.chip').forEach(btn=>btn.onclick=()=>{
      catWrap.querySelectorAll('.chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); state.category=btn.dataset.value; renderMethods();
    });
    bindChips('filterPurpose','purpose');
  }

  function bindChips(id, key){
    $(id).querySelectorAll('.chip').forEach(btn=>btn.onclick=()=>{
      $(id).querySelectorAll('.chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); state[key]=btn.dataset.value;
      renderMethods();
    });
  }

  function renderChannelOptions(){
    // 首版仅校园渠道
    const channels = ['朋友圈','群聊','论坛','表白墙','海报/传单'];
    const wrap = $('filterChannel');
    wrap.innerHTML = ['全部',...channels].map((c,i)=>`<button class="chip ${i===0?'active':''}" data-value="${c}">${c}</button>`).join('');
    wrap.querySelectorAll('.chip').forEach(btn=>btn.onclick=()=>{
      wrap.querySelectorAll('.chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); state.channel=btn.dataset.value; renderMethods();
    });
    state.channel='全部';
  }

  function resetFilter(){
    state.category='自动'; state.purpose='全部'; state.channel='全部';
    $('filterCategory').querySelectorAll('.chip').forEach((b,i)=>b.classList.toggle('active',i===0));
    $('filterPurpose').querySelectorAll('.chip').forEach((b,i)=>b.classList.toggle('active',i===0));
    renderChannelOptions(); renderMethods();
  }

  // ---------- 方法卡片 ----------
  function matchChannel(m){
    if(state.channel==='全部') return true;
    const ch = m.channel || '';
    const c = state.channel;
    if(c==='朋友圈') return /朋友圈/.test(ch);
    if(c==='群聊') return /群/.test(ch);
    if(c==='论坛') return /论坛/.test(ch);
    if(c==='表白墙') return /墙|频道/.test(ch);
    if(c==='海报/传单') return /海报|传单/.test(ch);
    return ch.includes(c);
  }

  function matchCategory(m){
    if(state.category==='自动'){
      // 家教板块：显示全部家教方法
      if(state.board==='家教') return m.board==='家教' || m.board==='通用' && m.category.includes('通用');
      const stages = currentStageKeys();
      let keys = stages.length ? [...new Set(stages.map(s=>s.biz))] : [];
      if(!keys.length && state.lastDemand){
        keys = CAT_ORDER.map(c=>CAT_KEY[c]).sort((a,b)=>state.lastDemand.cat[b].n-state.lastDemand.cat[a].n).slice(0,1);
      }
      return m.board===state.board && (m.category.includes('通用') || m.category.some(c=>keys.includes(CAT_KEY[c]||c)));
    }
    const want = state.category;
    if(state.board==='家教') return m.board==='家教' && want==='家教';
    return m.board===state.board && (m.category.includes('通用') || m.category.includes(want));
  }

  function renderMethods(){
    const list = $('methodList');
    const filtered = METHODS.filter(m=>{
      if(state.board==='陪跑' && m.board==='通用') { /* 通用拉新保留 */ }
      if(state.board==='陪跑' && !['陪跑','通用'].includes(m.board)) return false;
      if(state.board==='家教' && !['家教','通用'].includes(m.board)) return false;
      if(!matchCategory(m)) return false;
      if(state.purpose!=='全部' && m.purpose!==state.purpose) return false;
      if(!matchChannel(m)) return false;
      return true;
    });
    $('resultCount').textContent = filtered.length;
    $('filterStep').textContent = state.board==='家教' ? '3' : '4';
    $('filterHint').textContent = state.board==='家教'
      ? '家教板块仅做内容推荐（无市场测算模型）。'
      : '默认展示当前重点类目的推荐结果，可手动切换。';
    $('resultNote').textContent = filtered.length ? '复制内容仅含发布正文；占位符发布前请替换。' : '';

    if(!filtered.length){
      list.innerHTML = `<div class="card" style="text-align:center;color:var(--text-3)">暂无适用文案／素材。可调整筛选条件查看通用方案。</div>`;
      return;
    }
    list.innerHTML = filtered.map((m,idx)=>renderCard(m,idx)).join('');
    bindCardEvents(filtered);
  }

  function renderCard(m, idx){
    const boardClass = m.board==='陪跑'?'board-peipao':(m.board==='家教'?'board-jiajiao':'');
    const tags = `
      <span class="mc-tag ${boardClass}">${m.board}</span>
      <span class="mc-tag">${m.category.join('/')}</span>
      <span class="mc-tag ${m.purpose==='招募'?'purpose-recruit':''}">${m.purpose==='招募'?'招募服务者':'吸引下单'}</span>
      <span class="mc-tag">${m.channel}</span>`;
    const f = m.frequency;
    const freq = `<div class="freq-box"><div class="freq-grid">
      <span>常规频次</span><b>${f.normal}</b>
      <span>热点期频次</span><b>${f.hot}</b>
      <span>发布间隔</span><b>${f.interval}（${f.scope}）</b>
      <span>文案轮换</span><b>${f.rotation}</b>
    </div></div>`;
    let copyHtml = '';
    if(m.copies.length){
      const vTabs = m.copies.map((c,i)=>`<button class="version-tab ${i===0?'active':''}" data-card="${idx}" data-v="${i}">${c.version}</button>`).join('');
      copyHtml = `<div class="copy-section">
        <div class="copy-label">配套文案 · 可切换版本</div>
        <div class="version-tabs">${vTabs}</div>
        <div class="copy-text fade" id="copyText-${idx}">${escapeHtml(m.copies[0].text)}</div>
        <div class="copy-actions">
          <button class="btn btn-primary" data-copy="${idx}">复制文案</button>
          <button class="btn btn-sm" data-expand="${idx}">展开全文</button>
        </div>
      </div>`;
    } else {
      copyHtml = `<div class="warn-note">该方法是操作流程类，无固定文案，按步骤执行即可。</div>`;
    }
    let matHtml = '';
    if(m.materials.length){
      matHtml = `<div style="margin-top:12px"><div class="copy-label">配套素材</div>` +
        m.materials.map(x=>`<div class="material-row"><span class="mk">${x.type}</span><span>${x.name}${x.access && x.access.startsWith('http')?` · <a href="${x.access}" target="_blank" rel="noopener">打开原入口</a>`:''}</span></div>`).join('') + `</div>`;
    }
    const warn = m.notes ? `<div class="warn-note">📌 ${escapeHtml(m.notes)}</div>` : '';
    return `<article class="method-card">
      <div class="mc-head"><div class="mc-tags">${tags}</div><div class="mc-title">${m.name}</div>
        <div class="mc-audience">适用对象：${m.audience} · 阶段：${m.stage}</div></div>
      <div class="mc-body">
        <div class="info-row"><span class="info-key">推荐原因</span><span class="info-val reason">与${m.category.join('/')}、${m.channel}及当前阶段匹配，适用于${m.audience}。</span></div>
        <div class="info-row"><span class="info-key">操作步骤</span><span class="info-val">${m.steps.map((s,i)=>`${i+1}. ${s}`).join('<br>')}</span></div>
        ${freq}${copyHtml}${matHtml}${warn}
        <div class="material-row" style="margin-top:12px"><span class="mk">来源</span><span><a href="${m.source}" target="_blank" rel="noopener">腾讯文档原文</a> · 更新 ${m.updateTime}</span></div>
      </div>
    </article>`;
  }

  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function currentCopies(filtered){ return filtered; }

  let lastFiltered = [];
  function bindCardEvents(filtered){
    lastFiltered = filtered;
    document.querySelectorAll('.version-tab').forEach(btn=>btn.onclick=()=>{
      const ci=+btn.dataset.card, vi=+btn.dataset.v;
      btn.parentElement.querySelectorAll('.version-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const el=$('copyText-'+ci);
      el.textContent = filtered[ci].copies[vi].text;
      el.classList.remove('fade'); el.classList.add('expanded');
      el.dataset.v = vi;
    });
    document.querySelectorAll('[data-copy]').forEach(btn=>btn.onclick=()=>{
      const ci=+btn.dataset.copy;
      const el=$('copyText-'+ci);
      const vi = el.dataset.v ? +el.dataset.v : 0;
      let text = filtered[ci].copies[vi].text;
      // 通用模板自动填入院校名
      if(state.school) text = text.replace(/【学校】/g, state.school.name);
      // 必要信息校验：占位符
      const leftover = text.match(/【[^】]+】/g);
      copyText(text).then(ok=>{
        if(ok){
          let msg='已复制发布正文';
          if(leftover && leftover.length) msg+=`；注意仍有占位符 ${leftover.join(' ')} 需手动替换`;
          toast(msg);
        } else {
          // 复制失败 → 选中文本手动复制
          selectText(el); toast('自动复制失败，已为你选中文本，请手动复制');
        }
      });
    });
    document.querySelectorAll('[data-expand]').forEach(btn=>btn.onclick=()=>{
      const ci=+btn.dataset.expand, el=$('copyText-'+ci);
      const exp = el.classList.toggle('expanded');
      el.classList.toggle('fade', !exp);
      btn.textContent = exp ? '收起' : '展开全文';
    });
  }

  function copyText(text){
    if(navigator.clipboard && window.isSecureContext){
      return navigator.clipboard.writeText(text).then(()=>true).catch(()=>fallbackCopy(text));
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text){
    const ta=document.createElement('textarea'); ta.value=text;
    ta.style.position='fixed'; ta.style.top='-9999px'; document.body.appendChild(ta);
    ta.select(); let ok=false;
    try{ ok=document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta); return ok;
  }
  function selectText(el){
    const range=document.createRange(); range.selectNodeContents(el);
    const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  }

  // ---------- 板块切换 ----------
  function switchBoard(board){
    state.board=board; state.category='自动'; state.purpose='全部'; state.channel='全部';
    document.querySelectorAll('.board-tab').forEach(b=>b.classList.toggle('active', b.dataset.board===board));
    $('peipaoOnly').style.display = board==='陪跑' ? '' : 'none';
    $('desktopLayout').classList.toggle('single', board==='家教');
    resetFilter();
  }

  // 从院校取需求预测（优先预计算值）
  function getDemand(s){
    if(s.o && s.o.total){
      return { total:s.o.total, cat:{ course:s.o.course, kaoyan:s.o.kaoyan, zhuanye:s.o.zhuanye, cet:s.o.cet } };
    }
    return CALC.demand(s.data, PARAMS.cDefault);
  }

  // ---------- 刷新 ----------
  function refresh(){
    if(!state.school) return;
    state.lastDemand = getDemand(state.school);
    if(state.board==='陪跑') renderMarket();
    else renderFocus(state.lastDemand);
    renderMethods();
  }

  // ---------- 吸顶偏移同步（顶栏 + 选校卡高度）----------
  function layoutSync(){
    const header = document.querySelector('.topbar');
    const school = $('sec-school');
    if(!header || !school) return;
    const topH = header.offsetHeight;
    const schoolH = school.offsetHeight;
    const root = document.documentElement;
    root.style.setProperty('--top-h', topH + 'px');
    // 左栏顶部 = 顶栏 + 选校卡高度 + 一点间距
    root.style.setProperty('--rail-top', Math.round(topH + schoolH + 14) + 'px');
  }

  // ---------- 事件绑定 ----------
  function bind(){
    $('schoolSearch').addEventListener('input', e=>renderSearch(e.target.value));
    $('schoolClear').onclick=()=>{ $('schoolSearch').value=''; $('schoolResults').hidden=true; };
    document.querySelectorAll('.board-tab').forEach(b=>b.onclick=()=>switchBoard(b.dataset.board));
    $('resetFilter').onclick=resetFilter;
    document.addEventListener('click', e=>{
      if(!e.target.closest('.search-wrap') && !e.target.closest('.school-results')) $('schoolResults').hidden=true;
    });
  }

  // ---------- 启动 ----------
  initMeta(); initFilters(); renderChannelOptions(); bind();
  // 记忆上次选择
  try{
    const last = localStorage.getItem('xb_last_school');
    if(last){ const s=SCHOOLS.find(x=>x.id===last); if(s) selectSchool(s); }
  }catch(e){}
  layoutSync();
  window.addEventListener('resize', layoutSync);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(layoutSync);
})();
