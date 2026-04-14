# 变形积木识字乐园

> 面向 3~6 岁幼儿的汉字识字卡片应用，BBC 数字积木风格，纯前端，无需后端。

---

## 一、产品设计

### 目标用户
- 3~6 岁学龄前幼儿
- 在平板（iPad / Android）上使用，由家长或幼儿自主操作

### 设计理念
- **极简操作**：换卡片自动读，无需复杂交互
- **听觉优先**：TTS 全程伴随，朗读序列为「汉字 → 词语 → 句子」
- **视觉友好**：大字体、高对比度、霓虹积木风格
- **语音交互**：🎤 语音识别说汉字，自动跳转下一张，答对有奖励

### 核心功能

| 功能 | 说明 |
|------|------|
| 10 套字库切换 | 每套 50 字（部分套含重复字，实际 36~50 字不等） |
| 自动朗读 | 切换卡片后自动读：汉字 → [200ms] → 词语1 → 词语2 → 词语3 → 句子 |
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
单文件 HTML（~930行）
├── <style>           CSS（响应式布局，无外部依赖）
├── <body>            DOM 结构
└── <script>          JavaScript 全部逻辑

依赖资源（同级目录）
├── blocks-data.json  字库数据（271KB，10套×~50字=468字）
└── manifest.json     PWA 配置
```

### 核心技术方案

| 模块 | 技术选型 | 说明 |
|------|----------|------|
| 前端框架 | 原生 HTML/CSS/JS | 无框架依赖，单文件部署 |
| 文字转语音 | Web Speech API（`SpeechSynthesis`）| 浏览器内置，Chrome/Edge/Safari 均支持 |
| 语音识别 | Web Speech API（`SpeechRecognition`）| continuous 模式，实时识别 |
| 字库加载 | **XMLHttpRequest**（非 fetch） | Edge 兼容性修复 |
| 麦克风 | `navigator.mediaDevices` | 需用户授权麦克风权限 |
| 动画 | CSS `@keyframes` + JS | 撒星粒子、浮动积木、星空 |
| PWA | `manifest.json` | 支持添加到主屏幕 |

---

## 三、文件结构

```
github-deploy/               ← 上传至 GitHub / Gitee 的文件夹
│
├── index.html               主应用（重命名为简单名称）
├── blocks-data.json         字库数据
├── manifest.json            PWA 配置
├── server.js                本地开发服务器（可选）
└── README.md                本文件
```

> **注意**：不包含背景图片文件夹 `assets/`，应用使用纯 CSS 渐变背景，无需外部图片即可正常运行。

---

## 四、本地开发

### 启动服务器
```bash
cd github-deploy
node server.js
# 输出: Server running at http://localhost:3456/
```

然后用浏览器打开 `http://localhost:3456/`

### 添加新字库
1. 编辑源 Markdown 文件（格式参考现有 `blocks-data.json` 结构）
2. 运行解析脚本（如 `build_sets.py`）生成新的 `blocks-data.json`
3. 替换 `github-deploy/blocks-data.json`，刷新页面即可

### 字库 JSON 格式
```json
{
  "sets": [
    {
      "id": 1,
      "name": "第一套",
      "items": [
        {
          "c": "人",
          "p": "rén",
          "w": [{"w": "大人", "p": "dà rén"}],
          "s": "我是一个大人在走。"
        }
      ]
    }
  ]
}
```

---

## 五、部署到 Gitee Pages

> Gitee Pages = 免费的静态网站托管，生成 HTTPS 网址供平板访问。

### 步骤 1：上传文件到 Gitee 仓库

在 Gitee 新建仓库（如 `zishi-leyuan`），上传 `github-deploy/` 内的**全部文件**（不包含 `github-deploy` 本身这一层文件夹）：

```
仓库根目录/
├── index.html
├── blocks-data.json
├── manifest.json
├── server.js          ← 可选，不影响线上运行
└── README.md
```

### 步骤 2：开启 Gitee Pages

1. 仓库页面 → **服务** → **Gitee Pages**
2. 分支选 `master`，目录选 `/（根目录）`
3. 点击**部署**
4. 等待 30 秒，获得网址如：`https://yourname.gitee.io/zishi-leyuan/`

### 步骤 3：平板访问

1. 平板浏览器打开该网址
2. 首次点 🎤 时，浏览器会弹出麦克风权限请求 → 点**允许**
3. 可将网址**添加到主屏幕**，离线也能使用

---

## 六、开发经验总结

### 1. Edge 浏览器兼容性问题（最重要）

**问题**：`fetch()` 在 Edge localhost 环境下报 `TypeError: Failed to fetch`，导致字库加载失败。

**原因**：Edge 的 fetch 实现比 Chrome 更严格，localhost 有时触发 CORS 安全限制。

**解决方案**：用 `XMLHttpRequest` 替代 `fetch`，兼容性更好：
```javascript
// ❌ 出错：fetch 在 Edge localhost 被阻断
const r = await fetch('blocks-data.json');

// ✅ 正确：XMLHttpRequest 全浏览器兼容
const xhr = new XMLHttpRequest();
xhr.open('GET', 'blocks-data.json', true);
xhr.onreadystatechange = () => {
  if (xhr.readyState === 4 && xhr.status === 200) {
    const data = JSON.parse(xhr.responseText);
    // ...
  }
};
xhr.send();
```

### 2. TTS（文字转语音）最佳实践

**语音选择**：按优先级查找中文语音
```javascript
const prefs = ['Aria', 'Xiaoxiao', 'Huaiting', 'Yaoyao', 'Yunyang'];
// Aria = 微软 Edge 内置，声音最自然
// Xiaoxiao = 备选温柔女声
```

**幼儿 TTS 参数**：
```javascript
u.rate  = 0.88;   // 稍快，更自然（rate=1.0 为正常速）
u.pitch = 1.15;   // 稍高，更可爱
u.lang  = 'zh-CN';
```

**Edge onend 回调时序问题**：Edge TTS 比 Chrome 慢（汉字朗读 ~600~800ms），用 `onend` 链式触发替代 `setTimeout` 固定间隔，避免间隙重叠：
```javascript
function nextUtterance(text, onDone) {
  const u = new SpeechSynthesisUtterance(text);
  u.onend = onDone;            // 朗读结束才触发下一个
  speechSynthesis.speak(u);
}
```

**手动朗读最快模式**：将多个字拼接为一句话，让 TTS 引擎自己控制节奏，延迟最低：
```javascript
// 拼接：词语之间加"，"逗号，引擎自然停顿
const allText = w.c + '，' + w.w.map(x=>x.w).join('，');
speak(allText);  // 一句话，无额外间隙
```

### 3. 语音识别（Web Speech API）

**权限要求**：
- 麦克风必须被浏览器授权（`not-allowed` = 权限被拒）
- Windows 系统设置中需开启麦克风隐私
- `localhost` 不需要 HTTPS，但权限仍需手动允许

**continuous 模式**：一次启动后持续监听，不需要反复点按钮：
```javascript
rec.continuous = true;
rec.interimResults = true;  // 返回中间结果，显示实时文字
```

**识别后自动跳转**：
```javascript
rec.onresult = e => {
  const finalTx = Array.from(e.results)
    .filter(r => r.isFinal)
    .map(r => r[0].transcript)
    .join('');
  if (finalTx) check(finalTx.trim());  // 校验并跳转
};
```

### 4. VMware 虚拟机开发环境特殊注意事项

> 这是本项目最核心的经验教训：**VMware 无法真实验证麦克风和 TTS 功能**。

**VMware 下的已知限制**：

| 功能 | VMware 表现 | 真机表现 |
|------|-----------|----------|
| TTS 朗读 | 声音可能被路由到宿主机，音量异常 | 正常 |
| 麦克风识别 | `audio-capture` 错误，麦克风被虚拟机阻断 | 正常 |
| `navigator.mediaDevices` | 可能返回空列表 | 正常 |
| `getUserMedia` | 失败或被拒绝 | 正常 |

**正确开发流程**：
1. **不要在 VMware 里调试 TTS/SR**——浪费大量时间排查环境问题
2. 用 VMware 调试 UI、布局、动画、逻辑
3. 将 `index.html` 部署到 Gitee Pages
4. 用**平板真机**打开 HTTPS 网址测试麦克风和语音识别
5. 功能验证通过后，再回到 VMware 做 UI 微调

**麦克风 `not-allowed` 排查顺序**：
1. 浏览器权限设置（`chrome://settings/content/microphone`）
2. Windows 系统麦克风隐私设置（`Win + I` → 麦克风隐私）
3. VMware 音频设置（虚拟机是否桥接到宿主机的麦克风）
4. **最终结论**：VMware 下 `not-allowed` 是环境问题，部署到 Gitee Pages 用真机测试

### 5. `let` 变量重复声明陷阱

**问题**：`let` 在同一作用域重复声明会抛出 `SyntaxError`，导致整个 `<script>` 块崩溃，页面完全空白（无任何报错）。

**教训**：在任何 JS 文件中搜索 `let xxx` 确认无重复声明：
```bash
# 检查重复声明
grep -n "^let \|^  let " index.html
```

### 6. 单文件部署原则

- 所有 CSS 和 JS **内联**到 `index.html`，零外部依赖
- JSON 数据文件独立存放（方便后续更新字库，不改 HTML）
- `manifest.json` 实现 PWA（添加到主屏幕）
- 不引入任何 CDN、字体文件或图片（减少加载失败点）

---

## 七、麦克风权限开启指南

### Windows 系统级
1. `Win + I` → 搜索「麦克风隐私设置」
2. 确认「允许应用访问你的麦克风」已打开
3. 在下方列表中，找到浏览器（Chrome / Edge），设为允许

### Chrome 浏览器
1. 地址栏左侧 🔒 → 权限 → 麦克风 → 允许
2. 或输入 `chrome://settings/content/microphone` → 添加 `localhost`

### Edge 浏览器
1. 地址栏左侧 🔒 → 权限 → 麦克风 → 允许
2. 或输入 `edge://settings/content/microphone` → 添加 `localhost`

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
| 字库加载失败 | Edge 用 fetch 被阻断 | 改用 XMLHttpRequest（已修复） |
| 麦克风未检测到 | VMware 虚拟机限制 | 部署到 Gitee Pages 用平板真机测试 |
| `not-allowed` 错误 | 麦克风权限未授权 | 在浏览器和系统设置中允许麦克风 |
| 页面完全空白 | `let` 重复声明 SyntaxError | 检查 JS 文件中无重复 let 声明 |
| TTS 无声音 | VMware 音频路由问题 | 真机测试；检查系统音量 |
| 朗读停顿过长 | Edge TTS 引擎慢，setTimeout 固定等待 | 改用 `onend` 链式回调（已修复） |
| 切换卡片后 autoSpeak 乱窜 | 旧卡片的 setTimeout 未取消 | `cancelPendingSpeeches()` + `seqId` 递增保护（已修复） |

---

## 九、版权与许可

本项目为个人/教育用途开源，可自由使用、修改和分发。
