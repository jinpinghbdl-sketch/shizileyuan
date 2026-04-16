# 变形积木识字乐园 V26

> 最终稳定版（2026-04-16），面向 3~6 岁幼儿的汉字识字卡片应用，BBC 数字积木风格，纯前端，无需后端。

---

## 一、产品设计

### 目标用户
- 3~6 岁学龄前幼儿
- 在平板（iPad / Android）上使用，由家长或幼儿自主操作

### 设计理念
- **极简操作**：换卡片自动读，无需复杂交互
- **听觉优先**：TTS 全程伴随，朗读序列为「汉字 → 词语1 → 词语2 → 词语3 → 句子」
- **视觉友好**：大字体、高对比度、霓虹积木风格
- **语音交互**：🎤 语音识别说汉字，自动跳转下一张，答对有奖励

### 核心功能

| 功能 | 说明 |
|------|------|
| 10 套字库切换 | 每套 50 字（共 500 字） |
| **翻页自动朗读（V26）** | 切换卡片后自动读完整链路：汉字 → [200ms] → 词语1 → 词语2 → 词语3 → [0ms] → 造句 |
| 手动朗读 | 点击左侧大字或词语，拼接整句快速朗读（最快模式） |
| 语音识别 | 🎤 按钮，说出当前汉字，自动跳转下一张 |
| 答对奖励 | 识别正确触发撒星动画 + 积分累计 |
| 诊断面板 | 顶部显示浏览器/TTS/SR 状态，方便排查问题 |
| PWA 支持 | 可添加到平板主屏幕，离线使用 |

### 视觉风格
- **BBC 数字积木风格**：深色背景 + 霓虹彩色边框
- **左侧卡片**：青色系（`#00D4FF`），显示大字 + 拼音 + 词语
- **右侧卡片**：粉色系（`#FF6B9D`），显示造句，关键词高亮
- **氛围动画**：浮动彩色积木 + 星空粒子
- **字体**：系统默认无衬线字体，适合幼儿屏幕阅读

---

## 二、技术架构

```
单文件 HTML（~1167行，含完整内嵌字库）
├── <style>           CSS（响应式布局，无外部依赖）
├── <body>            DOM 结构
└── <script>          JavaScript 全部逻辑（含 __BLOCKS_DATA__ 内嵌字库）
```

### 核心技术方案

| 模块 | 技术选型 | 说明 |
|------|----------|------|
| 前端框架 | 原生 HTML/CSS/JS | 无框架依赖，单文件部署 |
| 文字转语音 | Web Speech API（`SpeechSynthesis`）| 浏览器内置，Chrome/Edge/Safari 均支持 |
| 语音识别 | Web Speech API（`SpeechRecognition`）| Safari iPad 兼容，仅首次询问权限 |
| 字库 | JS 内嵌变量（`__BLOCKS_DATA__`） | 无 XHR，Edge 兼容性修复 |
| 麦克风 | `navigator.mediaDevices` | 启动时预热，后续不再弹窗 |
| 动画 | CSS `@keyframes` + JS | 撒星粒子、浮动积木、星空 |
| PWA | `manifest.json` | 支持添加到主屏幕 |

---

## 三、文件结构

```
C:\Users\AI-Agent\Desktop\0415\           ← 工作目录
│
├── index-v26.html         主应用（含内嵌字库，完整单文件）
├── embed_showcase.py      字库更新脚本（更新字库时运行）
├── 顺口溜识字卡1-10套.md   源数据文件（修改后重跑脚本）
├── 更新字库方法.txt        字库更新操作指南
└── README.md              本文件
```

> **关于 github-deploy/**：需部署时将 `index-v26.html`（重命名为 `index.html`）+ `manifest.json` + `server.js` 上传至 GitHub，再连接 Cloudflare Pages。

---

## 四、V26 关键技术实现

### 1. 翻页自动朗读（autoSpeak 链式朗读）

```javascript
function autoSpeak(){
  cancelPendingSpeeches();
  speechSynthesis.cancel();
  const item=D[idx];if(!item)return;
  const seqId=++currentSeqId;            // 本地闭包seqId
  const wordCount=item.w?item.w.length:0;
  let step=0;
  function ensureVoice(){/* 查找温柔女声 Aria/Xiaoxiao/Huaiting */}
  function nextUtterance(text,rate,onDone){
    if(seqId!==currentSeqId) return;    // 外层seqId变更时自动失效
    ensureVoice();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='zh-CN';u.rate=rate;u.pitch=1.15;
    if(cVoice) u.voice=cVoice;
    u.onstart=()=>{showBubble('🔊 '+text.slice(0,8))};
    u.onend=()=>{if(seqId===currentSeqId) onDone()};
    speechSynthesis.speak(u);
  }
  function run(){
    if(seqId!==currentSeqId) return;
    if(step===0){
      nextUtterance(item.c,0.88,()=>{step++;setTimeout(run,200)});  // 汉字
    } else if(step<=wordCount){
      nextUtterance(item.w[step-1].w,0.88,()=>{step++;setTimeout(run,0)});  // 词语
    } else if(step===wordCount+1){
      nextUtterance(item.s,0.75,()=>{step++});  // 造句
    }
  }
  run();
}
```

**关键点**：
- `seqId=++currentSeqId` 仅在 autoSpeak 内递增，外部 nextUtterance 不操作 seqId
- 汉字间隔 200ms，词语间隔 0ms（紧接朗读），造句速率 0.75（稍慢更清晰）
- prev/next 导航直接调 `autoSpeak()`，无 setTimeout 包装

### 2. 温柔女声（篇章朗读 & 卡片朗读）

```javascript
// window.onload 中预热 voices
window.onload=()=>{
  speechSynthesis.getVoices();           // 触发 voices 加载
  ensureVoice();                          // 立即查找女声
  setTimeout(()=>{ensureVoice()},1500);   // 备用补调
  speechSynthesis.onvoiceschanged=()=>{
    ensureVoice();
    loadSets();
  };
};

function ensureVoice(){
  if(cVoice) return;                     // 已有则跳过
  const vs=speechSynthesis.getVoices();
  if(!vs.length){
    // voices 延迟加载，动态注册回调（Safari/Edge 兼容性）
    const prev=speechSynthesis.onvoiceschanged;
    speechSynthesis.onvoiceschanged=()=>{
      const vvs=speechSynthesis.getVoices();
      const zh=['Aria','Xiaoxiao','Huaiting'].find(n=>
        vvs.find(v=>v.name.includes(n)&&v.lang.startsWith('zh'))
      );
      cVoice=zh?vvs.find(v=>v.name.includes(zh)):vvs.find(v=>v.lang.startsWith('zh'))||vvs[0];
      if(prev) prev();
    };
    return;
  }
  const zh=['Aria','Xiaoxiao','Huaiting'].find(n=>
    vs.find(v=>v.name.includes(n)&&v.lang.startsWith('zh'))
  );
  cVoice=zh?vs.find(v=>v.name.includes(zh)):vs.find(v=>v.lang.startsWith('zh'))||vs[0];
}
```

**TTS 参数**：
```javascript
u.rate  = 0.88;   // 稍快，更自然（rate=1.0 为正常速）
u.pitch = 1.15;   // 稍高，更可爱
u.lang  = 'zh-CN';
```

### 3. 麦克风权限（Safari iPad 兼容）

```javascript
// 启动时预热：仅执行一次，后续 startRecognition 不再弹窗
window.onload=()=>{
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
    navigator.mediaDevices.getUserMedia({audio:true})
      .then(s=>{audioStream=s;})
      .catch(()=>{});
  }
};

function startRecognition(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(rec){try{rec.abort();}catch(e){}}  // 不 rec=null，保持实例存活
  rec=new SR();
  rec.continuous=true;
  rec.interimResults=true;
  rec.lang='zh-CN';
  rec.onresult= e => { /* 校验+跳转 */ stopL(); };
  rec.onerror= e => { if(e.error!=='aborted'&&e.error!=='no-speech') stopL(); };
  rec.onend= () => { if(onL)startRecognition(); };
  rec.start();
}
```

---

## 五、本地开发

### 启动服务器
```bash
cd C:\Users\AI-Agent\WorkBuddy\20260410103053
node server.js
# 访问 http://localhost:3456/0415/index-v26.html
```

### 更新字库流程
1. 编辑 `C:\Users\AI-Agent\Desktop\0415\顺口溜识字卡1-10套.md`
2. 运行 `embed_showcase.py`（路径已指向 index-v26.html）
3. 脚本自动替换 index-v26.html 中的 `__BLOCKS_DATA__` 变量
4. 刷新页面即可

详细步骤见 `更新字库方法.txt`

---

## 六、部署到 Cloudflare Pages

> Cloudflare Pages = 免费的静态网站托管 + 强制 HTTPS，语音识别必须 HTTPS 才能在平板上工作。

### 步骤 1：上传文件到 GitHub

在 GitHub 新建仓库（如 `zishi-leyuan`），上传以下文件：

```
仓库根目录/
├── index.html              ← index-v26.html 重命名上传
├── manifest.json           PWA 配置
├── server.js               本地服务器（不影响线上）
└── README.md               部署说明
```

### 步骤 2：连接 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Pages** → **Create a project**
2. 选择 **Connect to Git** → 授权 GitHub → 选择刚创建的仓库
3. **Build settings**：Framework preset 选 `None`，Build output 目录留空（根目录）
4. 点击 **Save and Deploy**

### 步骤 3：获得 HTTPS 访问地址

等待约 1 分钟部署完成，获得永久 HTTPS 网址，如：
`https://zishi-leyuan.pages.dev/`

### 步骤 4：平板访问

1. 平板浏览器打开该 HTTPS 网址
2. 首次点 🎤 时，浏览器弹出麦克风权限请求 → 点**允许**
3. 可将网址**添加到主屏幕**，离线也能使用（PWA）

> ⚠️ **注意**：访问线上版本时，URL 路径为 `/index.html`（不是根路径），如 `https://xxx.pages.dev/index.html`

---

## 七、麦克风权限开启指南

### Windows 系统级
1. `Win + I` → 搜索「麦克风隐私设置」
2. 确认「允许应用访问你的麦克风」已打开
3. 在下方列表中，找到浏览器（Chrome / Edge），设为允许

### Chrome / Edge 浏览器
1. 地址栏左侧 🔒 → 权限 → 麦克风 → 允许
2. 或输入 `chrome://settings/content/microphone`

### 验证麦克风是否可用
在浏览器 Console（F12）中输入：
```javascript
navigator.mediaDevices.getUserMedia({audio: true})
  .then(() => console.log('麦克风正常'))
  .catch(e => console.error('麦克风失败:', e.message));
```

---

## 八、常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 字库加载失败 | Edge 用 fetch 被阻断 | 数据已内嵌为 `__BLOCKS_DATA__`，无 XHR |
| 麦克风未检测到 | VMware 虚拟机限制 | 部署到 Gitee Pages 用平板真机测试 |
| `not-allowed` 错误 | 麦克风权限未授权 | 在浏览器和系统设置中允许麦克风 |
| 页面完全空白 | `let` 重复声明 SyntaxError | 检查 JS 文件中无重复 let 声明 |
| TTS 无声音 | VMware 音频路由问题 | 真机测试；检查系统音量 |
| 翻页只读一个汉字 | nextUtterance seqId 引用冲突 | V26 已修复（seqId 闭包隔离） |
| 篇章朗读机械声 | voices 未加载时 cVoice=null | V26 已修复（预热 voices + voiceschanged 回调） |

---

## 九、版本历史

| 版本 | 日期 | 关键变更 |
|------|------|----------|
| v8 | 2026-04-15 | Edge字库加载修复（数据内嵌） |
| v17 | 2026-04-15 | 麦克风权限弹窗修复（仅首次询问） |
| v22 | 2026-04-16 | 篇章页朗读改为温柔女声 |
| v26 | 2026-04-16 | **翻页自动朗读完整链路**（V8移植，seqId闭包隔离，voices预热）|

---

## 十、版权与许可

本项目为个人/教育用途开源，可自由使用、修改和分发。