// ==UserScript==
// @name         NovelAI助手（汉化+图片管理+Tags增强）
// @namespace    novelai-zh-cn
// @version      1.0
// @description  NovelAI 绘图页汉化、标签联想与提示词增强、历史管理。
// @author       Hayasakai
// @license      MIT
// @match        https://novelai.net/image*
// @run-at       document-start
// @noframes
// @icon         https://novelai.net/icons/novelai-round.png
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @connect      gelbooru.com
// @connect      danbooru.donmai.us
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net
// ==/UserScript==

(() => {
  'use strict';

  const NAI_ZH_CSS = "html[data-nai-zh] button,\nhtml[data-nai-zh] [role='button'],\nhtml[data-nai-zh] [role='menuitem'],\nhtml[data-nai-zh] a {\n  line-height: 1.5 !important;\n  overflow: visible !important;\n}\n\nhtml[data-nai-zh] .ProseMirror,\nhtml[data-nai-zh] [contenteditable='true'] {\n  font-family: inherit;\n}\n";
  const NAI_BUNDLED_TAG_TRANSLATIONS = [];

const NAI_ZH_STORAGE_KEY = 'novelai-zh-enabled';

function naiZhReadEnabled() {
  try {
    if (typeof GM_getValue === 'function') {
      const value = GM_getValue(NAI_ZH_STORAGE_KEY, true);
      if (value && typeof value.then === 'function') return true;
      return value !== false;
    }
  } catch {
  }
  try {
    const value = localStorage.getItem(NAI_ZH_STORAGE_KEY);
    return value === null ? true : value !== '0' && value !== 'false';
  } catch {
    return true;
  }
}

function naiZhWriteEnabled(enabled) {
  const value = enabled !== false;
  try {
    if (typeof GM_setValue === 'function') GM_setValue(NAI_ZH_STORAGE_KEY, value);
  } catch {
  }
  try {
    localStorage.setItem(NAI_ZH_STORAGE_KEY, value ? '1' : '0');
  } catch {
  }
}

const chrome = {
  storage: {
    local: {
      get(defaults, callback) {
        const result = Object.assign({}, defaults || {}, {
          enabled: naiZhReadEnabled(),
        });
        if (typeof callback === 'function') callback(result);
        return Promise.resolve(result);
      },
      set(values, callback) {
        if (values && Object.prototype.hasOwnProperty.call(values, 'enabled')) {
          naiZhWriteEnabled(values.enabled !== false);
        }
        if (typeof callback === 'function') callback();
        return Promise.resolve();
      },
    },
    onChanged: {
      addListener() {},
    },
  },
  runtime: {
    onMessage: {
      addListener() {},
    },
  },
};

function naiZhInjectStyle(css) {
  try {
    if (typeof GM_addStyle === 'function') {
      GM_addStyle(css);
      return;
    }
  } catch {
  }

  const install = () => {
    const root = document.head || document.documentElement;
    if (!root) return false;
    const style = document.createElement('style');
    style.id = 'nai-zh-style';
    style.textContent = css;
    root.appendChild(style);
    return true;
  };

  if (!install()) {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  }
}

naiZhInjectStyle(NAI_ZH_CSS);

try {
  for (const host of ['https://danbooru.donmai.us', 'https://gelbooru.com']) {
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = host;
    preconnect.crossOrigin = 'anonymous';
    (document.head || document.documentElement).appendChild(preconnect);
  }
} catch (_) { }

const NAI_ZH_FIX_CSS = `
html[data-nai-zh] [data-nai-zh-text],
html[data-nai-zh] h1,
html[data-nai-zh] h2,
html[data-nai-zh] h3,
html[data-nai-zh] h4,
html[data-nai-zh] h5,
html[data-nai-zh] h6,
html[data-nai-zh] [role='heading'] {
  line-height: 1.5 !important;
  overflow: visible !important;
}
`;
naiZhInjectStyle(NAI_ZH_FIX_CSS);


if (naiZhReadEnabled()) {
  try { document.documentElement.classList.add('nai-zh-booting'); } catch (_) { }
  naiZhInjectStyle('html.nai-zh-booting body{visibility:hidden!important}');
  setTimeout(() => {
    try {
      document.documentElement.classList.remove('nai-zh-booting');
      document.dispatchEvent(new Event('nai-zh-revealed'));
    } catch (_) { }
  }, 3000);
}


globalThis.NAI_ZH_DICT = Object.freeze({
  "To activate the free trial, please verify your email.": "请先验证邮箱，以激活免费试用。",
  "IP Limit Reached": "已达到 IP 限制",
  "The limit of anonymous generations for your IP address has been reached. Create an account to continue with another 50 free actions.": "此 IP 地址的匿名生成次数已达上限。创建账户后可再获得 50 次免费操作。",
  "The inkwell’s run dry.": "墨水用完了。",
  "The paint’s run dry.": "颜料用完了。",
  "You need a subscription to continue.\nCompare and pick the right plan for you.": "你需要订阅才能继续。\n比较并选择适合你的方案。",
  "You need a subscription or to purchase Anlas to continue.\nCompare and pick the right plan for you.": "你需要订阅或购买 Anlas 才能继续。\n比较并选择适合你的方案。",
  "Take me to the Pricing": "带我去价格页面",
  "Subscribe": "订阅",
  "Purchase Anlas": "购买 Anlas",
  "No thanks.": "不用了，谢谢。",
  "Free": "免费",
  "[0]/[1] image generations remaining.": "剩余 [0]/[1] 次图像生成。",
  "Pay As You Go": "按量付费",
  "Welcome to NovelAI!": "欢迎来到 NovelAI！",
  "AI-Powered Anime Image Generation": "AI 驱动的动漫图像生成",
  "Create high-quality anime art easily with NovelAI’s powerful creative tools.": "借助 NovelAI 强大的创作工具，轻松生成高质量动漫图像。",
  "Your ": "你的 ",
  "Free Trial": "免费试用",
  " includes:": " 包含：",
  "30 free high quality image generations": "30 次免费高质量图像生成",
  "Full access to our latest model": "完整使用权：我们最新的模型",
  "No credit card required": "无需信用卡",
  "Start Free Trial": "开始免费试用",
  "Tier": "会员等级",
  "Other": "其他",
  "Help": "帮助",
  "Logout": "退出登录",
  "End Session": "结束会话",
  "Login": "登录",
  "Version": "版本",
  "Sign In": "登录",
  "Sign Up": "注册",
  "Log In": "登录",
  "Note:": "注意：",
  "Welcome back!": "欢迎回来！",
  "Loading...": "加载中…",
  "Registering...": "正在注册…",
  "Redirecting...": "正在跳转…",
  "Authenticating...": "正在验证…",
  "Deleting...": "正在删除…",
  "Uploading...": "正在上传…",
  "Manage": "管理",
  "Change": "更改",
  "Request": "请求",
  "Confirm": "确认",
  "Cancel": "取消",
  "Save": "保存",
  "Upgrade": "升级",
  "OK": "确定",
  "Yes": "是",
  "Got it!": "知道了！",
  "Read More": "阅读更多",
  "Manage Subscription": "管理订阅",
  "Overwrite": "覆盖",
  "Start Writing": "开始写作",
  "Register": "注册",
  "Submit": "提交",
  "Click Here": "点击这里",
  "Delete": "删除",
  "Default: [0]": "默认：[0]",
  "Apply & Save": "应用并保存",
  "Import": "导入",
  "Export": "导出",
  "Anonymous Trial": "匿名试用",
  "Processing": "处理中",
  "Not Subscribed": "未订阅",
  "Something went wrong!": "出了点问题！",
  "Copy": "复制",
  "Hide": "隐藏",
  "Reveal": "显示",
  "Unknown": "未知",
  "Back": "返回",
  "Gift Key": "礼品码",
  "(optional)": "（可选）",
  "File type not supported.": "不支持此文件类型。",
  "Maximum allowed file size is [0]MB.": "最大允许文件大小为 [0]MB。",
  "Expand": "展开",
  "Collapse": "收起",
  "Don't show this again.": "不再显示此提示。",
  "Learn More": "了解更多",
  "Blog Post": "博客文章",
  "Skip": "跳过",
  "Fix": "修复",
  "Select an option to continue.": "请选择一个选项以继续。",
  "Storyteller": "故事讲述者",
  "Text Adventure": "文字冒险",
  "Shuffle": "随机排列",
  "Stories": "故事",
  "Generate Inline": "行内生成",
  "Memory": "记忆",
  "Author's Note": "作者注记",
  "Undo": "撤销",
  "Redo": "重做",
  "Lorebook": "世界书",
  "Token Probabilities": "Token 概率",
  "Apply": "应用",
  "Send": "发送",
  "Reload": "重新加载",
  "Close Modal": "关闭弹窗",
  "Select All": "全选",
  "Deselect": "取消选择",
  "Search": "搜索",
  "Enabled": "已启用",
  "Disabled": "已禁用",
  "Generate": "生成",
  "Story": "故事",
  "[0] Tokens": "[0] 个 Token",
  "[0] tokens": "[0] 个 token",
  "Tokens": "Token",
  "I changed my mind.": "我改变主意了。",
  "No Story selected.": "未选择故事。",
  "Ignore": "忽略",
  "disable": "禁用",
  "enable": "启用",
  "Characters": "角色",
  "Accept": "接受",
  "Settings": "设置",
  "Done": "完成",
  "Copied to clipboard.": "已复制到剪贴板。",
  " [Reset to default]": " [恢复默认值]",
  "Reset": "重置",
  "Copied link to clipboard.": "链接已复制到剪贴板。",
  "Error": "错误",
  "Show Details": "显示详情",
  "Hide Details": "隐藏详情",
  "Continue": "继续",
  "Finish": "完成",
  "or": "或",
  "Edit": "编辑",
  "Close": "关闭",
  "Upload": "上传",
  "Create": "创建",
  "Clear": "清除",
  "Your Stories": "你的故事",
  "Filters": "筛选器",
  "Display": "显示",
  "Compact View": "紧凑视图",
  "Show On Top": "置顶显示",
  "Shelves": "书架",
  "Favorites": "收藏",
  "Local Stories": "本地故事",
  "Sort By": "排序方式",
  "Most Recent": "最近修改",
  "Alphabetical": "按字母顺序",
  "Creation Date": "创建日期",
  "Search your stories": "搜索你的故事",
  "Search this shelf": "搜索此书架",
  "Duplicate Story": "复制故事",
  "Download Story": "下载故事",
  "Delete Story": "删除故事",
  "Edit Information": "编辑信息",
  "Uses Editor V2": "使用编辑器 V2",
  "New Story": "新建故事",
  "New Shelf": "新建书架",
  "Import File": "导入文件",
  "[0]/[1] text generations remaining.": "剩余 [0]/[1] 次文本生成。",
  "You're getting [0] tokens of AI context. Equivalent to our [1].": "你将获得 [0] 个 token 的 AI 上下文，相当于我们的 [1]。",
  "Scroll tier": "Scroll 等级",
  "Seen enough?": "看够了吗？",
  "Check out our plans": "查看我们的方案",
  "Create an account": "创建账户",
  "Quickly Access Your Favorites": "快速访问你的收藏",
  "Click the Heart icon next to your stories to view them here!": "点击故事旁的心形图标，即可在此查看！",
  "Desktop-only": "仅限桌面端",
  "User Settings": "用户设置",
  "AI Modules": "AI 模块",
  "Story Settings": "故事设置",
  "Context Viewer": "上下文查看器",
  "Image Generation": "图像生成",
  "Text Generation": "文本生成",
  "AI Module Training": "AI 模块训练",
  "Tokenizer": "分词器",
  "Interactive Tutorials": "交互式教程",
  "Tutorial": "教程",
  "Tips": "提示",
  "Documentation": "文档",
  "Quick Start Gallery": "快速入门画廊",
  "Inspect Image Metadata": "检查图像元数据",
  "Explore": "探索",
  "User Scripts": "用户脚本",
  "Remove BG": "移除背景",
  "Declutter": "清理杂物",
  "Declutter (Keep Bubbles)": "清理杂物（保留对话框）",
  "Line Art": "线稿",
  "Sketch": "草图",
  "Colorize": "上色",
  "Emotion": "表情",
  "Upscale": "放大",
  "Pixel Snap": "像素吸附",
  "Remove backgrounds from images, leaving only the characters. ": "移除图像背景，只保留角色。",
  "Removes clutter like text, speech bubbles or other things drawn on top of the image.": "移除文字、对话气泡或叠加在图像上的其他杂物。",
  "ダミー": "清理杂物，但保留文字对话框。",
  "Draw an outline of your image.": "提取图像的轮廓线稿。",
  "Revert your image to a sketch stage.": "将图像还原为草图阶段。",
  "Turn your sketch or line art picture into something colorful. You can also guide your colorization with a prompt and even make slight modifications to the image.": "为草图或线稿上色。你也可以用提示词引导上色，甚至对图像做轻微修改。",
  "Change the expression of any given character.": "改变指定角色的表情。",
  "Clean up AI-generated pixel art.": "清理 AI 生成的像素画。",
  "Prompt (Optional)": "提示词（可选）",
  "Defry": "去脆化",
  "Palettize": "调色板",
  "Off": "关",
  "Auto": "自动",
  "Custom": "自定义",
  "Colors": "颜色数",
  "Avoid Over-Refining": "避免过度细化",
  "The detected pixel size is always kept.": "始终保留检测到的像素尺寸。",
  "A finer pixel size may be used when it matches the image better.": "当更细的像素尺寸更贴合图像时，可能会采用它。",
  "The result is scaled back up to roughly the input size.": "结果会被缩放回接近输入图像的大小。",
  "The result is kept at its snapped pixel size.": "结果保持吸附后的像素尺寸。",
  "Pixel Snap is not supported in this browser.": "此浏览器不支持像素吸附。",
  "Transform": "变换",
  "Masked": "蒙版区域",
  "Generated": "生成结果",
  "Blend": "混合",
  "Blended": "已混合",
  "Raw Result": "原始结果",
  "Overlay": "叠加",
  "Keep Text Bubbles": "保留文字对话框",
  "The selected image is too large. The maximum resolution is 1536 * 2048 pixels.": "所选图像过大，最大分辨率为 1536×2048 像素。",
  "The selected image is too large to upscale. The maximum resolution is 1536 * 2048 pixels.": "所选图像过大，无法放大。最大分辨率为 1536×2048 像素。",
  "Emotion Strength": "表情强度",
  "Normal": "标准",
  "Slightly Weak": "稍弱",
  "Weak": "弱",
  "Even Weaker": "更弱",
  "Very Weak": "很弱",
  "Weakest": "最弱",
  "Anime Only. Start with a neutral emotion image.": "仅支持动漫风格。请从一张中性表情的图像开始。",
  "Metadata": "元数据",
  "Title": "标题",
  "Description": "描述",
  "Generation Time": "生成时间",
  "Software": "软件",
  "Source": "来源",
  "Parameters": "参数",
  "Simplified": "简化版",
  "Raw Parameters": "原始参数",
  "Request Type": "请求类型",
  "Unknown Request Type": "未知请求类型",
  "Text to Image": "文生图",
  "Image to Image": "图生图",
  "Inpainting": "局部重绘",
  "This image contains no metadata.": "这张图像不包含元数据。",
  "Click the upload button or drag an image into the window to check its metadata.": "点击上传按钮，或将图像拖入窗口，即可检查其元数据。",
  "Skip Tutorial": "跳过教程",
  "Congratulations!": "恭喜！",
  "You've successfully generated your first NovelAI image!": "你已成功生成第一张 NovelAI 图像！",
  "Now let's explore how to customize and improve your creations with a quick ": "现在，让我们通过一个简短的 ",
  "tutorial": "教程",
  ".": "。",
  "Start Tutorial": "开始教程",
  "Create an account and start for free": "创建账户，免费开始",
  "Confirm your email": "验证你的邮箱",
  "We’ve updated our Terms of Service to explain how we temporarily cache encrypted input images to improve performance.": "我们更新了服务条款，说明了我们如何临时缓存加密的输入图像以提升性能。",
  "Learn more": "了解更多",
  "View Terms": "查看条款",
  "Get Started": "开始使用",
  "Repeat Email": "重复邮箱",
  "Repeat Password": "重复密码",
  "Email cannot be empty": "邮箱不能为空",
  "Email and Password cannot be empty": "邮箱和密码不能为空",
  "Remember me": "记住我",
  "Login is remembered for 30 days": "在 30 天内保持登录",
  "Login will not be remembered": "不保持登录",
  "Please take good care of your login credentials. Due to local encryption, losing your email or password results in permanently losing access to your remotely stored stories.": "请妥善保管登录凭据。由于本地加密，丢失邮箱或密码将永久失去远程存储的故事。",
  "This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply": "本站受 reCAPTCHA 保护，并适用 Google 隐私政策与服务条款。",
  "By registering, you agree to consent to the NovelAI ": "注册即表示你同意 NovelAI 的 ",
  "Privacy Policy": "隐私政策",
  " and ": "和",
  "Terms of Service": "服务条款",
  "This site is protected by reCAPTCHA and the Google": "本站受 reCAPTCHA 保护，并适用 Google 的",
  "apply.": "适用。",
  "Would you like to receive emails about updates from us in the future?": "你希望以后接收我们的更新邮件吗？",
  "NOTE": "注意",
  "Your account is not eligible for the free trial. Please purchase a subscription or Anlas to use NovelAI.": "你的账户不符合免费试用条件。请购买订阅或 Anlas 后使用 NovelAI。",
  "The account is already verified or the token is invalid. Try logging in or resending the verification email.": "账户已验证，或令牌无效。请尝试登录或重新发送验证邮件。",
  "Like what you see?\nCreate an account to start.": "喜欢看到的效果吗？\n创建账户即可开始。",
  "Boom.": "砰。",
  "It’s been sent!": "已发送！",
  "A confirmation email has been sent to your email address.": "确认邮件已发送到你的邮箱。",
  "Resend email": "重新发送邮件",
  "Check your inbox to verify your email. Or, copy and paste the code that was sent below.": "请查看收件箱以验证邮箱，或在下方粘贴收到的验证码。",
  "Passwords do not match": "两次输入的密码不一致",
  "Email must be in email format": "请输入有效的邮箱格式",
  "Password must be 8 characters or more": "密码至少需要 8 个字符",
  "Account already exists.": "账户已存在。",
  "Hide or Expand Gift Key Input": "隐藏或展开礼品码输入框",
  "Already have an account?": "已经有账户了？",
  "Email Confirmed.": "邮箱已验证。",
  "You're all set!": "一切就绪！",
  "Welcome to NovelAI": "欢迎来到 NovelAI",
  "Ready to create your first masterpiece?": "准备好创作你的第一幅杰作了吗？",
  "Register for free and unlock ": "免费注册并解锁 ",
  "30 high quality": "30 次高质量",
  " generations.": " 生成。",
  "Register for free and unlock 50 text generation actions.": "免费注册并解锁 50 次文本生成操作。",
  "Start Creating!": "开始创作！",
  "reCAPTCHA not loaded. Please disable any extensions that might be blocking it and try again.": "reCAPTCHA 未加载。请禁用可能拦截它的扩展后重试。",
  "Please login using your email and password.": "请使用邮箱和密码登录。",
  "Last used": "上次使用",
  "If an account with that email exists, we will send an email to [0]. Please note that you cannot use our account recovery for accounts created via our \"Sign in with Google\" button.": "如果该邮箱对应的账户存在，我们会向 [0] 发送一封邮件。请注意，通过“使用 Google 登录”创建的账户无法使用账户恢复功能。",
  "Select a language": "选择语言",
  "Locked Settings": "锁定设置",
  "Locked settings are not changed by history clicks or image imports.": "锁定后的设置不会因点击历史记录或导入图像而改变。",
  "Model": "模型",
  "Model Mode (Anime/Furry)": "模型模式（动漫/兽人）",
  "Prompt": "提示词",
  "Undesired Content": "负面提示词",
  "Character Prompts": "角色提示词",
  "Character Coordinates": "角色坐标",
  "Vibe Transfer": "氛围转移",
  "Resolution": "分辨率",
  "Image Count": "图像数量",
  "Steps": "步数",
  "Prompt Guidance (CFG)": "提示词引导（CFG）",
  "Prompt Guidance Rescale": "提示词引导重缩放",
  "Variety+ / CFG Delay": "多样性+ / CFG 延迟",
  "Sampler": "采样器",
  "Noise Schedule": "噪声调度",
  "Seed": "种子",
  "Decrisper": "去脆化",
  "UC Preset": "负面预设",
  "Quality Tags": "质量标签",
  "Legacy UC": "旧版负面模式",
  "Strength (img2img)": "强度（图生图）",
  "Noise (img2img)": "噪声（图生图）",
  "Reference Strength": "参考强度",
  "Overlay Original Image": "叠加原图",
  "Recommended": "推荐",
  "Paint New Image": "绘制新图像",
  "Upload Image": "上传图像",
  "Model-Specific Settings": "模型专属设置",
  "Steps: The number of iterations to refine the image for.": "步数：用于细化图像的迭代次数。",
  "Scale: At high scale the prompt will be followed more closely, with finer detail and sharpness. Low scale often results in greater creative freedom, but reduced definition.": "缩放：数值越高，生成结果越严格遵循提示词，细节和锐度也越丰富；数值较低通常更有创作自由，但清晰度会下降。",
  "Portrait": "竖图",
  "Landscape": "横图",
  "Square": "方形",
  "Small": "小",
  "Large": "大",
  "Large+": "特大",
  "Wallpaper": "壁纸",
  "[0] tokens out of [1] tokens used": "已使用 [0] / [1] 个 token",
  "This prompt is using [0] of the currently used [1] tokens. Max total tokens: [2]": "本提示词使用了当前 [1] 个 token 中的 [0] 个。最大 token 总数：[2]",
  "Base Prompt": "基础提示词",
  "Write what you want removed from the generation.": "填写你希望从生成结果中排除的内容。",
  "Write your prompt here. Use tags to sculpt your outputs.": "在此输入提示词，用标签塑造画面。",
  "Low Quality + Bad Anatomy": "低质量 + 不良人体",
  "Low Quality": "低质量",
  "Light": "轻度",
  "Heavy": "重度",
  "Test UC": "测试负面",
  "Dummy": "占位",
  "Heavy+DeAI": "重度 + 去 AI",
  "Human Focus": "人物侧重",
  "Furry Focus": "兽人侧重",
  "Bad Anatomy": "不良人体",
  "None": "无",
  "Add Quality Tags": "添加质量标签",
  "The prompt will be used unmodified.": "提示词将保持原样使用。",
  "Tags to increase quality will be prepended to the prompt.": "用于提升质量的标签会前置到提示词中。",
  "Disable Tag Suggestions": "禁用标签建议",
  "Prompt Guidance": "提示词引导",
  "Undesired Content Strength": "负面提示词强度",
  "Values other than 100% will increase generation time and Anlas cost.": "非 100% 的数值会增加生成时间与 Anlas 消耗。",
  "Guidance": "引导强度",
  "Scale": "缩放",
  "Enter a seed": "输入种子",
  "Advanced: Sampler": "高级：采样器",
  "Number of Images": "生成数量",
  "Mode": "模式",
  "Effort": "生成档位",
  "Medium": "中",
  "High": "高",
  "Medium effort generations cost fewer Anlas and use less of your Opus Usage Limit. Some settings are unavailable on medium effort.": "中档位生成消耗的 Anlas 更少，占用的 Opus 使用额度也更低；部分设置在中档位下不可用。",
  "Random": "随机",
  "History": "历史记录",
  "Ctrl+Click on an image to set your settings to the ones used to generate it (except for any init image).": "按住 Ctrl 点击图像，可将当前设置切换为该图生成时使用的设置（初始图像除外）。",
  "One of our original models trained on an expanded dataset. No longer recommended for use.": "我们的早期模型之一，基于扩展数据集训练。现已不再推荐使用。",
  "One of our original models. No longer recommended for use.": "我们的早期模型之一。现已不再推荐使用。",
  "Beta model for furry and other non-human content. No longer recommended for use.": "面向兽人及其他非人类内容的测试模型。现已不再推荐使用。",
  "One of our older models. No longer recommended for use.": "我们的较旧模型之一。现已不再推荐使用。",
  "Our previous model. No longer recommended for use.": "我们的上一代模型。现已不再推荐使用。",
  "Our V4.5 model trained on a curated subset of images. No longer recommended for use.": "我们的 V4.5 模型，基于精选图像子集训练。现已不再推荐使用。",
  "Our V4 model trained on a curated subset of images. No longer recommended for use.": "我们的 V4 模型，基于精选图像子集训练。现已不再推荐使用。",
  "Our V4 model. No longer recommended for use.": "我们的 V4 模型。现已不再推荐使用。",
  "Our V4.5 model. No longer recommended for use.": "我们的 V4.5 模型。现已不再推荐使用。",
  "Our newest model, trained on a curated subset of images.  Recommended for streaming.": "我们的最新模型，基于精选图像子集训练。推荐开启流式生成。",
  "Our newest and best model.": "我们目前最新、效果最好的模型。",
  "Faster and cheaper, with some settings unavailable.": "速度更快、消耗更低，但部分设置不可用。",
  "Sends generations to a custom model URL, added and selected below.": "将生成请求发送到下方添加并选择的自定义模型 URL。",
  "Download ZIP": "下载 ZIP",
  "Selected:": "已选择：",
  "W": "宽",
  "H": "高",
  "Swap width and height": "交换宽高",
  "Draw": "画笔",
  "Erase": "橡皮",
  "Fill": "填充",
  "Select": "选择",
  "Lasso": "套索",
  "Color Picker": "颜色选择器",
  "Pen Size": "笔刷大小",
  "Pressure Sensitivity": "压感",
  "Resize Canvas": "调整画布大小",
  "Auto nai_smea": "自动 nai_smea",
  "nai_smea will be used automatically at high resolutions.": "在高分辨率下将自动使用 nai_smea。",
  "nai_smea will not be used automatically.": "不会自动使用 nai_smea。",
  "Use smea": "使用 SMEA",
  "Smea versions of samplers are modified to perform better at high resolutions.": "采样器的 SMEA 版本经过调整，在高分辨率下表现更好。",
  "SMEA style sampling is not available for this sampler.": "此采样器不支持 SMEA 风格采样。",
  "High resolution samplers will automatically be used above a certain image size.": "当图像尺寸超过一定值后，会自动使用高分辨率采样器。",
  "Dyn variant": "Dyn 变体",
  "SMEA Dyn variants of samplers are optimized to increase the coherence of higher resolution images without introducing the characteristic SMEA look. The effective range of resolutions is smaller than for regular SMEA.": "采样器的 SMEA Dyn 变体经过优化，可提升高分辨率图像的连贯性，同时避免出现典型的 SMEA 风格；其有效分辨率范围比普通 SMEA 更小。",
  "Enhance!": "增强！",
  "Enhance Image": "增强图像",
  "Invalid": "无效",
  "Upscale Amount": "放大倍数",
  "Max": "最大",
  "Strength": "强度",
  "Noise": "噪声",
  "Advanced": "高级",
  "Magnitude": "幅度",
  "Show Advanced": "显示高级选项",
  "Hide Advanced": "隐藏高级选项",
  "AI Settings": "AI 设置",
  "Advanced Settings": "高级设置",
  "Image2Image": "图生图",
  "Transform your image.": "以现有图像为基础进行转换。",
  "Did you mean?": "你是不是想输入？",
  "Value Threshold": "数值阈值",
  "Dist Threshold": "距离阈值",
  "Generate 1 Image": "生成 1 张图像",
  "Generate [0] Images": "生成 [0] 张图像",
  "Decrisp": "去脆化",
  "Variety+": "多样性+",
  "Enhance": "增强",
  "Variations": "变体",
  "Use as Base": "设为基础图",
  "Use as Base Image": "设为基础图像",
  "Generate Variations": "生成变体",
  "Edit Image": "编辑图像",
  "Inpaint Image": "局部重绘",
  "Undesired Content Preset": "负面提示词预设",
  "Quality Preset": "质量预设",
  "Standard": "标准",
  "Draw Mask": "绘制蒙版",
  "Erase Mask": "擦除蒙版",
  "Focused Area\nSelection": "聚焦区域\n选择",
  "Save & Close": "保存并关闭",
  "Remove Inpainting Mask": "移除重绘蒙版",
  "Use the seed of the displayed image": "使用当前显示图像的种子",
  "Reset all settings to default?": "要将所有设置恢复为默认值吗？",
  "Image with Metadata found!": "发现带元数据的图像！",
  "Import the Image or import Settings and Prompt?": "要导入图像，还是导入设置与提示词？",
  "Import Image": "导入图像",
  "Imports an image to edit or use as reference.": "导入图像以进行编辑或用作参考。",
  "Clean Imports": "清理导入内容",
  "Remove [] / {}, add spaces after commas": "移除 [] / {}，并在逗号后添加空格",
  "Import Settings + Seed": "导入设置 + 种子",
  "Upscale the generated image.": "放大生成后的图像。",
  "Reduce artifacts caused by high prompt guidance values.": "减少高提示词引导值造成的画面伪影。",
  "Enable guidance only after body has been formed, to improve diversity and saturation of samples. May reduce relevance.": "在画面主体成型后才启用引导，以提升样本的多样性与饱和度；可能会降低提示词相关性。",
  "Copy to Clipboard": "复制到剪贴板",
  "Pin Image": "钉住图像",
  "Download Image": "下载图像",
  "Upload to Explore": "上传到探索",
  "Copy to Seed": "复制到种子",
  "Detach Undesired Content": "分离负面提示词",
  "Reattach Undesired Content": "重新附加负面提示词",
  "Prompt Chunks": "提示词片段",
  "Reset Settings": "重置设置",
  "Remove Pinned Image": "取消钉住图像",
  "Go to Image": "转到图像",
  "OLD": "旧",
  "NEW": "新",
  "Image Settings": "图像设置",
  "Regenerate": "重新生成",
  "Change Size": "更改尺寸",
  "Crop to closest valid generation size": "裁剪到最接近的有效生成尺寸",
  "Shift Edges": "平移边缘",
  "Resize": "调整大小",
  "Image is larger than 1536x2048.": "图像尺寸大于 1536×2048。",
  "Compare with Original": "与原图对比",
  "Edit Inpainting Mask": "编辑重绘蒙版",
  "Prevents the existing image from changing, but can introduce seams along the edge of the mask.": "防止现有图像发生变化，但可能在蒙版边缘产生接缝。",
  "Prevents seams along the edge of the mask, but means the existing image may change slightly.": "可防止蒙版边缘出现接缝，但现有图像可能发生轻微变化。",
  "Inpaint": "局部重绘",
  "Change part of an image.": "修改图像的局部内容。",
  "Mask": "蒙版",
  "Quality Tags Enabled": "已启用质量标签",
  "UC Preset Enabled": "已启用负面预设",
  "Our new and much improved image generation model is here: NovelAI Diffusion V4.5 Curated!": "我们全新且大幅改进的图像生成模型来了：NovelAI Diffusion V4.5 Curated！",
  "Your model has automatically been set to this new model, though you can change it back in the model dropdown if you like.": "你的模型已自动切换到这一新模型；如果愿意，也可以在下拉菜单中改回原模型。",
  "Our new and much improved image generation model is here: NovelAI Diffusion V5!": "我们全新且大幅改进的图像生成模型来了：NovelAI Diffusion V5！",
  "Notice: Prompts don't always carry over cleanly between model versions. Try adjusting tag strength or reordering tags, and test a few prompt variations to see what works best.": "注意：提示词在不同模型版本之间不一定能完美迁移。可以尝试调整标签权重或重新排序，并多试几种提示词写法，找到最佳效果。",
  "CFG Rescale": "CFG 重缩放",
  "Randomize": "随机化",
  "Random Prompt": "随机提示词",
  "Outdated legacy prompt import detected: ": "检测到旧版提示词导入方式：",
  "For image reproduction purposes a flag has been set to use old behavior. Changing any settings or prompt will reset this flag.": "为复现图像，已设置一个标志来沿用旧行为。更改任何设置或提示词都会重置该标志。",
  "Automatic Download": "自动下载",
  "Images will automatically download after generation.": "生成完成后将自动下载图像。",
  "Images will not automatically download after generation.": "生成完成后不会自动下载图像。",
  "These settings would take too long to generate.": "当前设置生成所需时间过长。",
  "Image": "图像",
  "Change the image, keep the vision.": "改变图像，保留感觉。",
  "Information Extracted": "已提取信息",
  "Vibe Transfer is not supported for this model.": "当前模型不支持氛围转移。",
  "Made with NAI Diffusion V5": "由 NAI Diffusion V5 生成",
  "What do you want to do with this image?": "你想用这张图像做什么？",
  "Import for": "导入用途",
  "Vibes": "氛围参考",
  "This image has metadata!": "这张图像带有元数据！",
  "Did you want to import that instead?": "要改为导入这些元数据吗？",
  "Import Metadata": "导入元数据",
  "Your session has expired. Please log in again.": "你的会话已过期，请重新登录。",
  "Send to Director Tools": "发送到导演工具",
  "Cannot copy history settings from this image.": "无法从这张图像复制历史设置。",
  "Copied settings from image.": "已复制图像设置。",
  "Copied seed from image.": "已复制图像种子。",
  "Copied settings and seed from image.": "已复制图像设置与种子。",
  "Director Tools": "导演工具",
  "Use a variety of AI tools to edit your images.": "使用多种 AI 工具编辑图像。",
  "Maximum prompt mixes of [0] exceeded. Extra \"[1]\" will be ignored.": "提示词混合数量超过上限 [0]。多余的“[1]”将被忽略。",
  "In order to use NovelAI Diffusion, you must first read and agree with the Stable Diffusion license:": "使用 NovelAI Diffusion 前，你必须先阅读并同意 Stable Diffusion 许可证：",
  "This model will be removed soon.": "此模型即将被移除。",
  "This image is from a deprecated model. Settings import not available.": "这张图像来自已弃用的模型，无法导入设置。",
  "Char Prompts": "角色提示词",
  "Click to edit a character.": "点击以编辑角色。",
  "Create a separate prompt for characters in your scene.": "为画面中的每个角色分别撰写提示词。",
  "Add Character": "添加角色",
  "Character [0]": "角色 [0]",
  "Random Character [0]": "随机角色 [0]",
  "Position": "位置",
  "AI’s Choice": "AI 自动选择",
  "Adjust": "调整",
  "Finish Editing Positions": "完成位置编辑",
  "A panel will minimize to make room": "面板会自动收起以腾出空间",
  "Show Grid": "显示网格",
  "Thirds": "三分法",
  "Phi": "黄金比例",
  "Grid": "网格",
  "Columns": "列",
  "Rows": "行",
  "Set Character [0]’s Position": "设置角色 [0] 的位置",
  "Clear Random Prompt Characters": "清除随机提示词角色",
  "Image Generation Basic Tutorial": "图像生成基础教程",
  "Read this Tutorial in text form": "以文本形式阅读本教程",
  "I know what I’m doing, skip this!": "我已经会了，跳过本教程！",
  "Inpainting is not yet supported for this model. NovelAI Diffusion V3 will be used instead. Character prompts will be ignored.": "当前模型尚不支持局部重绘，将改用 NovelAI Diffusion V3。角色提示词会被忽略。",
  "Character [0] Prompt": "角色 [0] 提示词",
  "Character [0] UC": "角色 [0] 负面提示词",
  "A generation is currently in progress. Download will start when generation is complete.": "当前正在生成图像，生成完成后将开始下载。",
  "Payment Processor Update": "支付服务商更新",
  "To enjoy our other image generation models you are required to update your subscription with our new payment processor.": "若要继续使用我们的其他图像生成模型，你需要通过新的支付服务商更新订阅。",
  "We are sunsetting our current payment provider as they are no longer supporting generative AI products (": "我们正在停用当前的支付服务商，因为他们不再支持生成式 AI 产品（",
  "Learn more here": "在此了解更多",
  "). Users who do not manually update their billing info will eventually be switched to our new payment processor at a later date. However, for users who manually update their billing info now, we will credit ": "）。未手动更新账单信息的用户最终会在之后被切换到新的支付服务商。不过，如果用户现在手动更新账单信息，我们将赠送 ",
  "bonus Anlas": "额外 Anlas",
  " as a Thank You.": " 作为感谢。",
  "You will be awarded 5000 Anlas if you use a credit card, and 2000 Anlas if you use PayPal.": "使用信用卡支付可获得 5000 Anlas，使用 PayPal 支付可获得 2000 Anlas。",
  "Rest assured, ": "请放心，",
  "you will not be charged right now": "你现在不会被扣款",
  " and your billing schedule will remain unchanged. Your next payment will occur on your original subscription renewal date on [0].": "，账单周期也保持不变。下一次付款将在你原本的订阅续费日 [0] 进行。",
  "If you have any questions or need customer support, please contact us at support@novelai.net.": "如有疑问或需要客服支持，请通过 support@novelai.net 联系我们。",
  "Thank You!": "感谢你！",
  "You have successfully completed the migration! You won’t be double charged, your next billing date is on [0]": "迁移已成功完成！你不会被重复扣款，下一次账单日期为 [0]",
  "Thanks for taking the time to switch to our new payment processor. As a thank you gift, we have deposited the bonus Anlas to your account.": "感谢你抽时间切换到新的支付服务商。作为答谢，我们已将额外 Anlas 存入你的账户。",
  "We are switching to a new payment processor, to read more, ": "我们正在切换新的支付服务商，如需了解更多，",
  "click here": "请点击这里",
  "No Migration Needed": "无需迁移",
  "You do not have a renewing Paddle subscription and do not need to migrate.": "你没有正在续订的 Paddle 订阅，无需迁移。",
  "Some card providers (Discover) card processing currently doesn’t work. We’re actively working on a fix.": "部分卡组织（Discover）的银行卡目前无法完成支付，我们正在积极修复。",
  "Minimum Context Area": "最小上下文区域",
  "Your browser is interfering with canvas api functionality in a way that prevents us from scaling images properly.\nImages may appear blurry or otherwise not as intended.\nUsing a different browser or disabling these features when using NovelAI is recommended.": "你的浏览器正在干扰 Canvas API 的功能，导致我们无法正确缩放图像。\n图像可能显得模糊或不符合预期。\n建议换用其他浏览器，或在访问 NovelAI 时关闭相关隐私保护功能。",
  "Legacy Prompt Conditioning Mode (Not Recommended)": "旧版提示词条件模式（不推荐）",
  "LPC Mode": "LPC 模式",
  "Your prompt guidance is too high, your images may become overly saturated and blurry.": "提示词引导值过高，图像可能会过度饱和并变得模糊。",
  "Your prompt guidance is too low, your images may become incoherent and nonsensical.": "提示词引导值过低，图像可能会缺乏连贯性、变得不知所云。",
  "Male": "男性",
  "Female": "女性",
  "Highlight Emphasis": "高亮强调",
  "Vibe Transfer reference image not found in storage. Try removing the image and re-adding it.": "在存储中找不到氛围转移参考图。请尝试移除该图像后重新添加。",
  "Vibe Transfer reference image had no image defined on a model that requires it. Try removing the image and re-adding it.": "当前模型需要氛围转移参考图，但未指定图像。请尝试移除后重新添加。",
  "Vibe Transfer encoding failed. Please try again.": "氛围转移编码失败，请重试。",
  "Vibe Transfer encoding not supported for this model.": "当前模型不支持氛围转移编码。",
  "An already encoded image was used on a model that does not support it. Please remove the Vibe Transfer reference image before generating.": "已将一张编码后的图像用于不支持它的模型。请在生成前移除该氛围转移参考图。",
  "Failed to encode the Vibe Transfer reference image as no image was found. Please try removing the image and re-adding it.": "找不到图像，无法对氛围转移参考图进行编码。请尝试移除后重新添加。",
  "Failed to access the indexeddb Vibe Transfer storage. Please ensure indexeddb functions in your browser.": "无法访问 IndexedDB 中的氛围转移存储。请确认浏览器允许使用 IndexedDB。",
  " Learn more here.": " 在此了解更多。",
  "Failed to export Vibe Transfer file.": "导出氛围转移文件失败。",
  "Append": "追加",
  "Importing image failed. Invalid image.": "导入图像失败：图像无效。",
  "Vibe Transfer import failed.": "氛围转移导入失败。",
  "Vibe Transfer reference image imported.": "氛围转移参考图已导入。",
  "Imported [0] Vibe Transfer reference image(s).": "已导入 [0] 张氛围转移参考图。",
  "Only one copy of a Vibe Transfer reference image is allowed. Image not added.": "同一张氛围转移参考图只能添加一次，未添加图像。",
  "embedded": "已嵌入",
  "This Vibe Transfer reference image is for a different model and will be ignored when generating.": "这张氛围转移参考图属于其他模型，生成时将被忽略。",
  "Actual Prompt": "实际提示词",
  "When importing prompt/uc will import with the actual randomized values used for the randomized section of the prompt.": "导入提示词/负面提示词时，会使用提示词随机部分实际生效的随机值。",
  "Enable/Disable Vibe Transfer Reference Image": "启用/禁用氛围转移参考图",
  "Export Bundle": "导出捆绑包",
  "Embed Into Image": "嵌入图像",
  "You can only download a bundle of the Vibe Transfer reference images if all the images are encoded.": "只有当所有图像都完成编码后，才能下载氛围转移参考图捆绑包。",
  "Export as Encodings": "导出为编码",
  "Encoding exports don't include the original image and can't be reencoded for other models or Information Extracted values.": "导出编码不会包含原始图像，也无法为其他模型重新编码或保留“已提取信息”的数值。",
  "Embed the Vibe Transfer files into a selected image.": "将氛围转移文件嵌入选中的图像。",
  "Each Vibe Transfer reference image after the fourth costs an additional [0] (currently [1]).": "第 4 张之后的每张氛围转移参考图会额外消耗 [0]（当前为 [1]）。",
  "Vibe Transfer is not currently supported for inpainting.": "局部重绘目前不支持氛围转移。",
  "Maximum characters is [0]. [1] character(s) will be imported.": "最多允许 [0] 个字符，将导入 [1] 个字符。",
  "Normalize Reference Strength Values": "归一化参考强度值",
  "When using multiple reference images, Reference Strength values will be scaled to prevent going over recommended values.": "使用多张参考图时，会按比例缩放参考强度，以免超过推荐值。",
  "skip_cfg_above_sigma value is unexpected for this model. To fix turn Variety+ it off and on again.": "当前模型的 skip_cfg_above_sigma 值不符合预期。要修复此问题，请将“多样性+”关闭后再重新开启。",
  "At \"[0]\", the space is preventing the number from being used as the emphasis value, you may want to remove it (e.g. \"[1]\").": "在“[0]”处，空格导致数字无法作为强调值使用，建议删除该空格（例如“[1]”）。",
  "At \"[0]\", the number must be placed directly before the :: (e.g. \"[1]\"), not after it.": "在“[0]”处，数字必须直接放在 :: 之前（例如“[1]”），不能放在其后。",
  "At \"[0]\", the emphasis value is extremely high. Did you mean to put a space between the number and :: (e.g. \"[1]\")?": "在“[0]”处，强调值极高。你是不是想在数字与 :: 之间加一个空格（例如“[1]”）？",
  "+ [0] more not shown.": "还有 [0] 条错误未显示。",
  "You are currently using [0] mode.\nThe mode changes the tag suggestions and adds a dataset tag to the prompt. You can click the icon to switch.": "你当前使用的是 [0] 模式。\n模式会改变标签建议，并在提示词中加入数据集标签。点击图标即可切换。",
  "Anime": "动漫",
  "Furry": "兽人",
  "Model mode switched to [0].": "模型模式已切换为 [0]。",
  "Image [0] failed with error: [1]": "第 [0] 张图像生成失败：[1]",
  "Did not receive a final image.": "未收到最终图像。",
  "Error: Generation finished but there were no images.": "错误：生成已结束，但没有产生任何图像。",
  "Disable ": "如果此错误持续出现，请禁用 ",
  "Streamed Generations": "流式生成",
  " if this error persists.": "。",
  "Get Inspiration from our quick start gallery!": "从快速入门画廊中获取灵感！",
  "Click an image to copy the prompt.": "点击图像即可复制提示词。",
  "Prompt and settings imported.": "提示词与设置已导入。",
  "Copied!": "已复制！",
  "Added to the beginning of the prompt:\n[0]": "已添加到提示词开头：\n[0]",
  "Added to the end of the prompt:\n[0]": "已添加到提示词末尾：\n[0]",
  "Added to the beginning of the UC:\n[0]": "已添加到负面提示词开头：\n[0]",
  "Transparent BG": "透明背景",
  "Adds \"transparent background\" to the prompt.": "在提示词中加入“transparent background（透明背景）”。",
  "Images generated are not saved and you must download any you want to keep. Are you sure you want to exit?": "生成的图像不会被保存，想保留的图像必须手动下载。确定要退出吗？",
  "reCAPTCHA token creation failed.": "reCAPTCHA 令牌创建失败。",
  "Failed to copy settings from history.": "无法从历史记录复制设置。",
  "Image not found in storage. Please try reloading the page.": "存储中找不到图像，请尝试重新加载页面。",
  "This board has reached its pin limit. Unpin an image to make room or create a new board.": "此钉图板已达到钉图上限。请取消钉住某张图像来腾出空间，或创建新的钉图板。",
  "Overlapping characters can cause low quality results. Please adjust the positions of your characters or enable AI's Choice.": "角色位置重叠可能导致生成质量下降。请调整角色位置，或启用“AI 自动选择”。",
  "reCAPTCHA Check Failed": "reCAPTCHA 验证失败",
  "You have failed the bot detection we use for the free trial. Please try using a different browser/device or disabling any VPN you may be using. Alternatively, you can subscribe or purchase Anlas.": "免费试用的机器人检测未通过。请尝试更换浏览器或设备，或关闭正在使用的 VPN。你也可以订阅会员或购买 Anlas。",
  "You have failed the bot detection we use for the free trial. Please try using a different browser/device or disabling any VPN you may be using. Alternatively, you can subscribe to continue using NovelAI.": "免费试用的机器人检测未通过。请尝试更换浏览器或设备，或关闭正在使用的 VPN。你也可以订阅会员以继续使用 NovelAI。",
  "Precise Reference": "精确参考",
  "Precise Ref": "精确参考",
  "Add a reference image for a character or style.": "为角色或风格添加参考图。",
  "Select a description...": "选择描述…",
  "Character": "角色",
  "Style": "风格",
  "Costume": "服装",
  "Character & Style": "角色与风格",
  "Delta": "差异",
  "Style Aware": "风格感知",
  "Load a previous session?": "加载之前的会话？",
  "Load": "加载",
  "New Session": "新会话",
  "[0] Images": "[0] 张图像",
  "Last Saved On: [0]": "上次保存：[0]",
  "Sessions are stored temporarily in your browser and may be cleared at any time.": "会话临时保存在浏览器中，可能随时被清除。",
  "Custom Models": "自定义模型",
  "Manage model URLs": "管理模型 URL",
  "Inpainting Model URL": "局部重绘模型 URL",
  "Select an Inpainting Model URL to inpaint with a custom model.": "选择一个局部重绘模型 URL，才能使用自定义模型进行重绘。",
  "+ Add model": "+ 添加模型",
  "Name": "名称",
  "None Selected": "未选择",
  "No custom models added.": "尚未添加自定义模型。",
  "Grid Generation": "网格生成",
  "Generate Grid": "生成网格",
  "Configure": "配置",
  "Configure ⚠": "配置 ⚠",
  "Configure ([0])": "配置（[0]）",
  "X axis (columns)": "X 轴（列）",
  "Y axis (rows)": "Y 轴（行）",
  "+ Add parameter": "+ 添加参数",
  "No parameters varied.": "没有变化的参数。",
  "Select a parameter": "选择参数",
  "e.g. 1,2,5-9 or 0.5-2:0.25": "例如 1,2,5-9 或 0.5-2:0.25",
  "e.g. 123,456 or r3 for 3 new random seeds each generation": "例如 123,456，或 r3 表示每次生成 3 个新的随机种子",
  "One value per line": "每行一个值",
  "+ Add fixed random seed": "+ 添加固定随机种子",
  "On": "开",
  "Stop": "停止",
  "Stopping after this image…": "完成当前图像后停止…",
  "[0] images ([1]×[2])": "[0] 张图像（[1]×[2]）",
  "1 image ([0]×[1])": "1 张图像（[0]×[1]）",
  "Invalid range \"[0]\"": "无效范围“[0]”",
  "Range \"[0]\" produces too many values": "范围“[0]”产生的值过多",
  "Invalid number \"[0]\"": "无效数字“[0]”",
  "Invalid random seed count \"[0]\"": "无效的随机种子数量“[0]”",
  "[0] is used more than once on the same axis.": "[0] 在同一轴上使用了多次。",
  "[0] is used on both axes.": "[0] 同时用于两个轴。",
  "Select a parameter and values for at least one axis.": "至少为一个轴选择参数和值。",
  "Grid would generate [0] images (maximum [1]).": "网格将生成 [0] 张图像（上限 [1] 张）。",
  "Width": "宽度",
  "Height": "高度",
  "Passthrough Testing": "透传测试",
  "Manage ([0])": "管理（[0]）",
  "+ Add variable": "+ 添加变量",
  "+ Add child": "+ 添加子项",
  "+ Add item": "+ 添加项目",
  "Item type": "项目类型",
  "Key": "键",
  "No variables defined.": "未定义变量。",
  "Upload image": "上传图像",
  "Image does not persist, upload it again.": "图像不会持久保存，请重新上传。",
  "Fill background": "填充背景",
  "Fill color": "填充颜色",
  "Sizes": "尺寸",
  "+ Add size": "+ 添加尺寸",
  "Invalid passthrough definitions file.": "无效的透传定义文件。",
  "String": "字符串",
  "Number": "数字",
  "Slider": "滑块",
  "Checkbox": "复选框",
  "Object": "对象",
  "Array": "数组",
  "Min": "最小值",
  "Step": "步长",
  "Firefox Canvas Bug Detected": "检测到 Firefox Canvas 错误",
  "Your browser appears to be experiencing an issue with the canvas element common in Firefox.": "你的浏览器似乎遇到了 Firefox 中常见的 Canvas 元素问题。",
  "The bug results in the canvas not rendering properly and becoming entirely black. This will cause thumbnails in the history to appear black as well as affect the results of image generations that rely on the canvas.": "该错误会导致 Canvas 无法正常渲染，并完全变黑；这会使历史记录中的缩略图变黑，也会影响依赖 Canvas 的图像生成结果。",
  "Proper canvas functionality can typically be restored by restarting the browser.": "通常重启浏览器即可恢复 Canvas 的正常功能。",
  "Inpainting is not supported while using a precise reference. The precise reference image will be ignored.": "使用精确参考时不支持局部重绘，精确参考图将被忽略。",
  "This image was generated using [0] cannot be reproduced from its metadata.": "这张图像在生成时使用了 [0]，无法根据其元数据复现。",
  "Image2Image and": "图生图以及",
  "Inpainting and": "局部重绘以及",
  "Vibe Transfer and contains no encodings, it": "氛围转移，且不含编码，因此",
  "Precise Reference and": "精确参考以及",
  "Fidelity": "保真度",
  "Edit Prompt Chunk": "编辑提示词片段",
  "New Prompt Chunk": "新建提示词片段",
  "Color": "颜色",
  "Content": "内容",
  "Prompt chunk saved.": "提示词片段已保存。",
  "Failed to save prompt chunk.": "保存提示词片段失败。",
  "Prompt chunk deleted.": "提示词片段已删除。",
  "Failed to delete prompt chunk.": "删除提示词片段失败。",
  "Click in a prompt field first, then click a chunk to insert it.": "请先点击提示词输入框，再点击片段将其插入。",
  "Official": "官方",
  "Edit Chunk": "编辑片段",
  "No custom prompt chunks yet. Click + to add one.": "还没有自定义提示词片段。点击 + 添加一个。",
  "All prompt chunks deleted.": "已删除所有提示词片段。",
  "Failed to delete all prompt chunks.": "删除所有提示词片段失败。",
  "Delete All Prompt Chunks": "删除所有提示词片段",
  "Are you sure you want to delete all prompt chunks? This action cannot be undone.": "确定要删除所有提示词片段吗？此操作无法撤销。",
  "Delete All Prompt Chunks?": "删除所有提示词片段？",
  "Delete All": "全部删除",
  "e.g., My Style Tags": "例如：我的风格标签",
  "Enter the tags/content this chunk will expand to...": "输入该片段将展开成的标签/内容…",
  "Download All Precise References as ZIP": "将所有精确参考下载为 ZIP",
  "Import [0] Images": "导入 [0] 张图像",
  "What would you like to do with these images?": "你想用这些图像做什么？",
  "No prompt chunks found.": "未找到提示词片段。",
  "Having Style References during Inpaint with too much Strength may lead to distortion.": "局部重绘时使用风格参考且强度过高，可能导致画面失真。",
  "You have exceeded the maximum number of allowed Precise References ([0]). Please remove or disable some before generating.": "精确参考数量已超过上限（[0]）。请在生成前移除或禁用一些参考图。",
  "Clear Image History": "清除图像历史记录",
  "Clear Image History?": "清除图像历史记录？",
  "Are you sure you want to clear your image history? This action cannot be undone.": "确定要清除图像历史记录吗？此操作无法撤销。",
  "Clear History": "清除历史记录",
  "No, Keep History": "不，保留历史记录",
  "Clear Selection": "清除选择",
  "Delete Selected Images": "删除所选图像",
  "Delete Selected Images?": "删除所选图像？",
  "Are you sure you want to delete the [0] selected generation(s) from your image history? This action cannot be undone.": "确定要从图像历史记录中删除选中的 [0] 次生成吗？此操作无法撤销。",
  "Delete Selected": "删除所选",
  "No, Keep Them": "不，保留它们",
  "Download All Images?": "下载所有图像？",
  "Downloading could take a while, or fail entirely, with large numbers of images.": "图像数量较多时，下载可能需要较长时间，甚至可能失败。",
  "Never Mind": "算了",
  "Download Selected as ZIP": "将所选内容下载为 ZIP",
  "Download Selected Images?": "下载所选图像？",
  "This will download the [0] selected generation(s) as a ZIP file.": "这将把选中的 [0] 次生成下载为 ZIP 文件。",
  "Delete this image?": "要删除这张图像吗？",
  "Delete it!": "删除！",
  "No, keep it!": "不，保留！",
  "Delete?": "删除？",
  "Downloading [0] images in [1] zip files...": "正在将 [0] 张图像下载到 [1] 个 ZIP 文件中…",
  "Images downloaded": "图像已下载",
  "Pins": "钉图板",
  "Add note": "添加便签",
  "Draw arrow (drag between items)": "绘制箭头（在项目间拖动）",
  "New board": "新建钉图板",
  "Note": "便签",
  "Drag to resize, double-click to auto-size": "拖动调整大小，双击自动适配",
  "Board": "钉图板",
  "Open Explore": "打开探索",
  "New": "最新",
  "Hot": "热门",
  "Use prompt": "使用提示词",
  "View post": "查看帖子",
  "Back to generations": "返回生成结果",
  "Back to top": "回到顶部",
  "Lock scroll position (disable auto-scroll)": "锁定滚动位置（禁用自动滚动）",
  "Reference Images": "参考图",
  "Chunks": "片段",
  "Tap to add a prompt...": "点按以添加提示词…",
  "Mask Color": "蒙版颜色",
  "Mask Opacity": "蒙版不透明度",
  "Border": "边框",
  "Mask Pattern": "蒙版图案",
  "Solid": "纯色",
  "Lines": "线条",
  "Dots": "圆点",
  "Crosshatch": "交叉线",
  "Checker": "棋盘格",
  "Hearts": "爱心",
  "Transparency Background": "透明背景",
  "Theme Checkerboard": "主题棋盘格",
  "Light Checkerboard": "浅色棋盘格",
  "Dark Checkerboard": "深色棋盘格",
  "Black": "黑色",
  "White": "白色",
  "Gray": "灰色",
  "Red": "红色",
  "Green": "绿色",
  "Blue": "蓝色",
  "Custom Color": "自定义颜色",
  "Model\nTransform": "模型\n变换",
  "Pose": "姿势",
  "HSV Adjustment": "HSV 调整",
  "Hue": "色相",
  "Saturation": "饱和度",
  "Brightness": "亮度",
  "Projection": "投影",
  "Perspective": "透视",
  "Orthographic": "正交",
  "FOV": "视野（FOV）",
  "Lighting": "光照",
  "Ambient": "环境光",
  "Direct": "直射光",
  "Light Direction": "光照方向",
  "Front": "正面",
  "Front-Top": "正面偏上",
  "Top": "顶部",
  "Left": "左侧",
  "Right": "右侧",
  "Shadows": "阴影",
  "Quality": "质量",
  "Very Low": "极低",
  "Low": "低",
  "Very High": "极高",
  "Show Bones": "显示骨骼",
  "Physics": "物理",
  "Bone List": "骨骼列表",
  "No bones found": "未找到骨骼",
  "Expressions": "表情",
  "Morph Targets": "变形目标",
  "No morph targets found": "未找到变形目标",
  "Blur": "模糊",
  "Clone": "克隆",
  "Edit Category": "编辑分类",
  "New Category": "新建分类",
  "Category name...": "分类名称…",
  "Category": "分类",
  "Uncategorized": "未分类",
  "Failed to move prompt chunk to category.": "无法将提示词片段移动到分类。",
  "Failed to reorder prompt chunks.": "无法重新排序提示词片段。",
  "Failed to reorder categories.": "无法重新排序分类。",
  "Category saved.": "分类已保存。",
  "Failed to save category.": "保存分类失败。",
  "Category deleted.": "分类已删除。",
  "Failed to delete category.": "删除分类失败。",
  "Add Category": "添加分类",
  "Empty category": "空分类",
  "Add Prompt Chunk": "添加提示词片段",
  "Used": "已使用",
  "Remaining": "剩余",
  "B2B Account": "企业账户（B2B）",
  "Opus Generation Usage Limit": "Opus 生成使用额度",
  "Opus Usage Limit": "Opus 使用额度",
  "[0]% of Opus Generations remaining": "Opus 生成额度剩余 [0]%",
  "[0]% of Opus Generations remaining, +[1]% Extra Usage": "Opus 生成额度剩余 [0]%，另有 +[1]% 额外额度",
  "Your Opus subscription includes free NovelAI Diffusion V5 generations at normal resolutions and up to 28 steps.\nThis allowance is limited and refills automatically over time. When it runs out, you can still generate images by spending Anlas.": "你的 Opus 订阅包含免费的 NovelAI Diffusion V5 生成额度，适用于常规分辨率、最多 28 步。\n该额度有限，会随时间自动恢复；用完后仍可消耗 Anlas 继续生成图像。",
  "[0]% remaining (~[1] images)": "剩余 [0]%（约 [1] 张图像）",
  "[0]% remaining, +[1]% Extra Usage (~[2] images)": "剩余 [0]%，另有 +[1]% 额外额度（约 [2] 张图像）",
  "Currently refills at [0]% per day (~[1] images).": "目前每天恢复 [0]%（约 [1] 张图像）。",
  "Recovery is paused above 100%.": "超过 100% 时暂停恢复。",
  "Your Opus Generations allowance is used up. Generations will cost Anlas until it refills.": "你的 Opus 生成额度已用完；在额度恢复前，生成将消耗 Anlas。",
  "More Info": "更多信息",
  "Always Show Usage Limit Bar": "始终显示额度进度条",
  "Usage Override": "覆盖使用量",
  "Percent": "百分比",
  "Sec / %": "秒 / %",
  "Negative": "负数",
  "Purchased": "已购买",
  "Text To Speech": "文本转语音",
  "Defaults": "默认值",
  "Hotkeys": "快捷键",
  "Support": "支持",
  "Change Log": "更新日志",
  "AI Responses": "AI 回复",
  "Experimental": "实验性功能",
  "Text Settings": "文本设置",
  "Interaction Settings": "交互设置",
  "Other Settings": "其他设置",
  "Special": "特殊",
  "Confetti": "彩纸动画",
  "Gift Keys": "礼品码",
  "Date Created": "创建日期",
  "Status": "状态",
  "No Gift Keys yet!": "还没有礼品码！",
  "Gift Key copied to clipboard.": "礼品码已复制到剪贴板。",
  "Redeemed": "已兑换",
  "Available": "可用",
  "Gift key purchases are currently disabled.": "礼品码购买目前已停用。",
  "Gift key purchases have been removed indefinitely due to abuse.": "由于滥用，礼品码购买已被无限期移除。",
  "Gift Key (Purchasing Disabled)": "礼品码（购买已停用）",
  "Local storage is currently unavailable and disabled.": "本地存储当前不可用，已禁用。",
  "Download All Stories": "下载所有故事",
  "Downloading all stories...": "正在下载所有故事…",
  "Download all failed.": "下载全部内容失败。",
  "Failed to get persistent token.": "获取持久 API 令牌失败。",
  "Get Persistent API Token": "获取持久 API 令牌",
  "Persistent API Token": "持久 API 令牌",
  "Below is a persistent API token that can be used to access the API.": "以下是一个可用于访问 API 的持久令牌。",
  "Show Full Token": "显示完整令牌",
  "Copied token to clipboard.": "令牌已复制到剪贴板。",
  "Note: You can only have a single persistent token at a time. Creating a new one will invalidate the old one. You will not be able to view this token again after closing this window.": "注意：同一时间只能拥有一个持久令牌。创建新令牌会使旧令牌失效。关闭此窗口后，你将无法再次查看该令牌。",
  "Overwrite Persistent API Token": "覆盖持久 API 令牌",
  "You have an existing persistent API token. Creating a new one will invalidate the old one.": "你已经有一个持久 API 令牌。创建新令牌会使旧令牌失效。",
  "Are you sure you want to overwrite it?": "确定要覆盖它吗？",
  "You need to enter your existing email and password.": "你需要输入当前邮箱和密码。",
  "You need to enter a new email or a new password.": "你需要输入新邮箱或新密码。",
  "Email must be in email format.": "邮箱必须符合邮箱格式。",
  "Password must be 8 characters or more.": "密码至少需要 8 个字符。",
  "Passwords do not match.": "两次输入的密码不一致。",
  "Failed to change details.": "更改账户信息失败。",
  "Details changed! A confirmation email has been sent to your new email address.": "账户信息已更改！确认邮件已发送到你的新邮箱。",
  "Details changed!": "账户信息已更改！",
  "Incorrect username and password combination.": "用户名和密码组合不正确。",
  "Resent confirmation email!": "确认邮件已重新发送！",
  " Refresh the page after confirming your email to claim your 50 free actions.": " 确认邮箱后请刷新页面，以领取 50 次免费操作。",
  "Sent account deletion confirmation email!": "账户删除确认邮件已发送！",
  " Follow the link in your email to confirm the deletion of your account.": " 请按邮件中的链接确认删除账户。",
  "Old Email": "旧邮箱",
  "New Email": "新邮箱",
  "Current Email": "当前邮箱",
  "Current Password": "当前密码",
  "New Password": "新密码",
  "Confirm New Password": "确认新密码",
  "Enter your email address below to receive an account deletion confirmation email.": "在下方输入邮箱地址，以接收账户删除确认邮件。",
  "Be aware that the deletion of your account results in the permanent loss of your stories and other content! Make sure to export the content you want to keep available beforehand; For example by using the \"Export all Stories\" option in the Account Settings. Keep in mind that trained AI Modules and some other content are not exportable and will be lost if not saved beforehand.": "请注意，删除账户会导致你的故事及其他内容永久丢失！请务必提前导出想保留的内容，例如使用账户设置中的“导出所有故事”功能。已训练的 AI 模块及其他部分内容无法导出，若未提前保存将会丢失。",
  "Send Deletion Confirmation Email": "发送删除确认邮件",
  "Verify your email to gain 50 free actions.": "验证邮箱以获得 50 次免费操作。",
  "Change Password": "更改密码",
  "Invalid theme file.": "主题文件无效。",
  "Theme imported to theme editor.": "主题已导入主题编辑器。",
  "Apply & Save Theme": "应用并保存主题",
  "Import Theme File": "导入主题文件",
  "Export Theme File": "导出主题文件",
  "Default Themes": "默认主题",
  "Theme Editor": "主题编辑器",
  "New & imported stories will be saved locally only.": "新建和导入的故事只会保存在本地。",
  "New & imported stories will be saved locally and stored encrypted remotely.": "新建和导入的故事会保存在本地，并加密存储到远程服务器。",
  "Exporting and backing up your stories is highly recommended, should your browser cache get cleared, or if you lose access to your account.": "强烈建议导出并备份故事，以防浏览器缓存被清除或你失去账户访问权限。",
  "Default AI Model": "默认 AI 模型",
  "New stories will use this model by default.": "新故事默认使用此模型。",
  "Select an AI Model": "选择一个 AI 模型",
  "Default Preset": "默认预设",
  "New Stories will use the selected preset as a default.": "新故事默认使用所选预设。",
  "Default AI Module": "默认 AI 模块",
  "New Stories will use the selected Module as a default.": "新故事默认使用所选模块。",
  "The selected AI Model does not support Modules.": "所选 AI 模型不支持模块。",
  "Lorebook Generation Settings": "世界书生成设置",
  "Change the Model and settings preset used by the Lorebook Generator.": "更改世界书生成器使用的模型和设置预设。",
  "Lorebook Generation Model": "世界书生成模型",
  "Select an AI Model for lorebook generation": "选择用于世界书生成的 AI 模型",
  "Lore Generation Preset": "世界书生成预设",
  "Legacy Lore Generation": "旧版世界书生成",
  "The less consistent fewshot prompt based Lore Generator will be used.": "将使用一致性较低的 fewshot 提示词世界书生成器。",
  "The module of the selected story will be used for generation if available for the selected model. Arbitrary generation types are not supported.": "如果所选模型支持，将使用所选故事的模块进行生成；不支持任意生成类型。",
  "A bespoke module will be used for Lore Generator.": "世界书生成器将使用专用模块。",
  "Story not found in story list.": "故事列表中找不到该故事。",
  "Story deleted.": "故事已删除。",
  "Story deletion failed.": "删除故事失败。",
  "Story deletion failed: [0]": "删除故事失败：[0]",
  "Story download failed.": "下载故事失败。",
  "Story download failed: [0]": "下载故事失败：[0]",
  "Story is not remote.": "该故事不在远程存储中。",
  "Story clone failed: [0]": "克隆故事失败：[0]",
  "Story with id [0] cloned.": "已克隆 ID 为 [0] 的故事。",
  "Hide Debug Settings": "隐藏调试设置",
  "Remove All Account Scripts": "移除所有账户脚本",
  "This permanently deletes every account script, including ones that failed to load. Story scripts are not affected. This cannot be undone.": "这会永久删除所有账户脚本，包括加载失败的脚本。故事脚本不受影响。此操作无法撤销。",
  "All account scripts removed.": "所有账户脚本已移除。",
  "Removing account scripts failed: [0]": "移除账户脚本失败：[0]",
  "Stories & Storage": "故事与存储",
  "Raw Settings": "原始设置",
  "Editor": "编辑器",
  "Editor Input Trace": "编辑器输入追踪",
  "Recording keyboard events, DOM mutations and transactions.": "正在记录键盘事件、DOM 变更和事务。",
  "Not recording.": "未在记录。",
  "Copy Trace": "复制追踪记录",
  "Clear Trace": "清除追踪记录",
  "Trace copied to clipboard.": "追踪记录已复制到剪贴板。",
  "Trace is empty.": "追踪记录为空。",
  "Debug Story Download": "调试：下载故事",
  "Enter a story id and click \"Download\".": "输入故事 ID，然后点击“下载”。",
  "Debug Story Deletion": "调试：删除故事",
  "Enter a story id and click \"Delete\". Cannot be undone.": "输入故事 ID，然后点击“删除”。此操作无法撤销。",
  "Logprobs Count": "Logprobs 数量",
  "Prevent Module Override": "防止模块覆盖",
  "The selected module will always be used for generation.": "生成时将始终使用所选模块。",
  "The selected module will be overridden in specific situations.": "所选模块会在特定情况下被覆盖。",
  "Prevent Preamble": "禁用前言",
  "The context will never have a preamble prepended. This can cause problems or incorrect behaviour.": "上下文中永远不会添加前言。这可能导致问题或异常行为。",
  "The context will have a preamble prepended depending on various factors.": "上下文会根据多种因素添加前言。",
  "Trim Excess Whitespace": "裁剪多余空白",
  "Excess whitespace will be trimmed from context before it is sent to the AI.": "在发送给 AI 前，会从上下文中裁剪多余空白。",
  "Excess whitespace will not be trimmed from context before it is sent to the AI. Excess whitespace can significantly degrade output quality.": "不会从上下文中裁剪多余空白。多余空白可能会显著降低输出质量。",
  "Excess whitespace includes trailing spaces and repeated newline characters.": "多余空白包括行尾空格和重复的换行符。",
  "Ignore Remote Story Conflicts": "忽略远程故事冲突",
  "Remote storage conflicts will be ignored, local changes always override remote saves.": "忽略远程存储冲突，本地更改始终覆盖远程保存。",
  "Remote storage conflicts will be detected.": "将检测远程存储冲突。",
  "Disable Genre & Tags Popup for New Stories": "禁用新故事的类型与标签弹窗",
  "The genre and tags popup will not be shown when starting a new story.": "开始新故事时不会显示类型和标签弹窗。",
  "The genre and tags popup will be shown when starting a new story without genre or tags set.": "开始未设置类型或标签的新故事时，会显示类型和标签弹窗。",
  "Debug Remote Story Clone": "调试：克隆远程故事",
  "Creates an identical remote story with same ID": "创建一个 ID 相同的远程故事副本",
  "Enter a story id and click \"Clone\".": "输入故事 ID，然后点击“克隆”。",
  "Download Raw Remote Meta": "下载远程原始元数据",
  "Download Raw Remote Content": "下载远程原始内容",
  "Inspect Image Results": "检查图像生成结果",
  "A button will appear to inspect image generation results.": "会显示一个用于检查图像生成结果的按钮。",
  "No button will appear to inspect image generation results.": "不会显示用于检查图像生成结果的按钮。",
  "Persist Image Generation History": "持久保存图像生成历史",
  "Image generation history will be persisted across sessions in indexeddb. Experimental and potentially unreliable.": "图像生成历史会通过 IndexedDB 跨会话保存。此功能为实验性，可能不稳定。",
  "Image generation history will not be persisted across sessions.": "图像生成历史不会跨会话保存。",
  "Use Legacy Image Generation Request Format": "使用旧版图像生成请求格式",
  "Image generation requests will be sent as JSON (pre-multipart-form format).": "图像生成请求将以 JSON 发送（multipart/form 之前的格式）。",
  "Image generation requests will be sent as multipart form data.": "图像生成请求将以 multipart 表单数据发送。",
  "Show System Prompt Settings": "显示系统提示词设置",
  "System prompt settings will be shown.": "将显示系统提示词设置。",
  "System prompt settings will be hidden.": "将隐藏系统提示词设置。",
  "Alternate Image Generation Endpoint": "备用图像生成端点",
  "Use an alternate endpoint for image generation requests.": "使用备用端点处理图像生成请求。",
  "Enable Experimental Scripting API": "启用实验性脚本 API",
  "Scripts can use experimental APIs (should any currently exist) that are subject to change without warning.": "脚本可以使用实验性 API（如果当前存在），这些 API 可能随时更改且不会提前通知。",
  "Scripts cannot use experimental APIs.": "脚本不能使用实验性 API。",
  "Use Legacy Context with New Models": "新模型使用旧版上下文",
  "Legacy context building will be used with new models.": "新模型将使用旧版上下文构建方式。",
  "New models will use updated context building logic.": "新模型将使用更新后的上下文构建逻辑。",
  "Text entered here will be used for the test/download buttons.": "此处输入的文本将用于测试/下载按钮。",
  "Text to Speech Source": "文本转语音来源",
  "Local TTS uses your browsers available speech synthesis capabilities.": "本地 TTS 使用浏览器提供的语音合成能力。",
  "Streamed TTS is higher quality, uses a model hosted by NovelAI, and requires an active subscription. 100 free generations given for trial purposes.": "流式 TTS 质量更高，使用 NovelAI 托管的模型，需要有效订阅。试用期提供 100 次免费生成。",
  "Your browser does not support local TTS.": "你的浏览器不支持本地 TTS。",
  "Streamed": "流式",
  "Local": "本地",
  "TTS will use the browsers Speech Synthesis API.": "TTS 将使用浏览器的语音合成 API。",
  "TTS will use NovelAI's remote TTS service.": "TTS 将使用 NovelAI 的远程 TTS 服务。",
  "Your browser does not support MediaSource. Streamed TTS will still work, but you may notice higher latency.": "你的浏览器不支持 MediaSource。流式 TTS 仍可使用，但延迟可能较高。",
  "Your browser does not support 'audio/mpeg' as a MediaSource type. Streamed TTS will still work, but you may notice slightly higher latency.": "你的浏览器不支持将“audio/mpeg”作为 MediaSource 类型。流式 TTS 仍可使用，但延迟可能略高。",
  "Text to speech is turned off.": "文本转语音已关闭。",
  "Speak Outputs": "朗读输出",
  "Outputs will be read by TTS.": "输出内容将由 TTS 朗读。",
  "Outputs will not be read.": "输出内容不会被朗读。",
  "Speak Inputs": "朗读输入",
  "In addition to outputs, Inputs will be read by TTS.": "除输出外，输入内容也将由 TTS 朗读。",
  "Inputs will not be read.": "输入内容不会被朗读。",
  " Has no effect if speak outputs is disabled": " 如果未启用朗读输出，此设置无效",
  "Speak HypeBot Comments": "朗读 HypeBot 评论",
  "HypeBot comments will be read by TTS.": "HypeBot 评论将由 TTS 朗读。",
  "HypeBot comments will not be read.": "HypeBot 评论不会被朗读。",
  " But HypeBot is disabled.": " HypeBot 已禁用。",
  " HypeBot is disabled.": " HypeBot 已禁用。",
  "Local TTS Settings": "本地 TTS 设置",
  "Select a voice": "选择声音",
  "Testing...": "正在测试…",
  "Test Voice": "测试声音",
  "Volume": "音量",
  "Speed": "速度",
  "Pitch": "音调",
  "Streamed TTS Settings": "流式 TTS 设置",
  "Voice": "声音",
  "unknown voice": "未知声音",
  "Use a voice based on the given seed.": "使用基于给定种子生成的声音。",
  "Streamed Text to Speech Seed": "流式文本转语音种子",
  "Enter a seed here": "在此输入种子",
  "Randomize Seed": "随机化种子",
  "Note: Starting with a common first name will have a relevant influence on pitch and intonation. The voice for any given seed is liable to change in the future as we continue to develop the TTS.": "注意：使用常见的名字作为开头会影响音调和语调。随着 TTS 的持续开发，任何种子的声音都可能在未来发生变化。",
  "Story Voice": "故事声音",
  "HypeBot Voice": "HypeBot 声音",
  "Saved Voices": "已保存的声音",
  "Select a voice to edit": "选择要编辑的声音",
  "No saved voices. Add one first.": "没有已保存的声音，请先添加一个。",
  "unnamed voice": "未命名声音",
  "Save Voice": "保存声音",
  "Delete Voice": "删除声音",
  "Are you sure you want to delete the voice \"[0]\"?": "确定要删除声音“[0]”吗？",
  "This cannot be reversed.": "此操作无法撤销。",
  "Note: Will not affect the speed of downloaded audio.": "注意：不会影响已下载音频的播放速度。",
  "Interface": "界面",
  "Theme": "主题",
  "Stream Image Generation": "流式图像生成",
  "Intermediates of generating images will be streamed.": "生成图像的中间过程将以流式方式显示。",
  "Intermediates of generating images will not be streamed.": "生成图像的中间过程不会以流式方式显示。",
  "Show Streamed Images Unprocessed": "显示未处理的流式图像",
  "All streamed images will be shown unprocessed.": "所有流式图像都会以未处理状态显示。",
  "In progress streamed images will be blurred and the first few steps will not be shown.": "进行中的流式图像会被模糊处理，且前几步不会显示。",
  "Simple Output Viewer": "简洁输出视图",
  "Only the current generation is shown, without decorations. Only applies on desktop.": "仅显示当前生成结果，不带装饰效果。仅在桌面端生效。",
  "The output view shows recent generations with decorations. Only applies on desktop.": "输出视图会显示最近的生成结果及装饰效果。仅在桌面端生效。",
  "Reduced Motion": "减少动态效果",
  "The output viewer will move without animations.": "输出视图移动时不会播放动画。",
  "Output viewer movement will be animated.": "输出视图移动时会播放动画。",
  "Lock Output Viewer Camera": "锁定输出视图相机",
  "Panning and zooming the output viewer is disabled.": "禁用输出视图的平移和缩放。",
  "The output viewer can be panned and zoomed.": "输出视图可以平移和缩放。",
  "Explore Shelf": "探索架",
  "Recent images from the Explore gallery are shown to the right of generations.": "在生成结果右侧显示探索画廊中的近期图像。",
  "No Explore gallery images are shown in the output viewer.": "输出视图中不显示探索画廊的图像。",
  "Page Layout": "页面布局",
  "How the image generation page arranges its panels.": "图像生成页面各面板的排列方式。",
  "Hide Quickstart Gallery": "隐藏快速入门画廊",
  "The quickstart gallery will be hidden on the image generation page.": "图像生成页将隐藏快速入门画廊。",
  "The quickstart gallery will be shown on the image generation page.": "图像生成页将显示快速入门画廊。",
  "Alpha Mode for Transparent Images": "透明图像的 Alpha 模式",
  "Straight": "直通",
  "Premultiplied": "预乘",
  "WebP (Lossless)": "WebP（无损）",
  "Image Format for Generated Images": "生成图像的文件格式",
  "Custom File Name Template": "自定义文件名模板",
  "Downloaded images are named using the template.": "下载的图像将按模板命名。",
  "Downloaded images are named with the default prompt and seed format.": "下载的图像将使用默认的提示词与种子格式命名。",
  "Preview": "预览",
  "Invalid template": "模板无效",
  "File Name Template Syntax": "文件名模板语法",
  "Tokens are written as {token} and can be passed through filters with |, for example {prompt|first:40|pre:-}. Tokens without a value render as nothing, and their pre/suf affixes are skipped with them. Filters chain left to right, so {prompt|tags:4|tags:-2} skips the first two tags and keeps the next two.": "Token 写作 {token}，并可通过 | 传递过滤器，例如 {prompt|first:40|pre:-}。没有值的 token 会渲染为空，其 pre/suf 前后缀也会一并跳过。过滤器从左到右依次执行，因此 {prompt|tags:4|tags:-2} 会跳过前两个标签，保留接下来的两个。",
  "Character List Filters (before text filters)": "角色列表过滤器（在文本过滤器之前执行）",
  "Image Generation Confetti Animation": "图像生成彩纸动画",
  "Confetti will be shown when generating images.": "生成图像时会显示彩纸动画。",
  "Confetti will not be shown when generating images.": "生成图像时不会显示彩纸动画。",
  "Keyboard Displaces Content": "键盘顶起页面",
  "The onscreen keyboard of some mobile devices will displace the content of the page.": "部分移动设备的屏幕键盘会顶起页面内容。",
  "The onscreen keyboard of some mobile devices will overlay the content of the page.": "部分移动设备的屏幕键盘会覆盖页面内容。",
  "UI Language": "界面语言",
  "Show Tips": "显示提示",
  "Tips will be shown below the editor.": "提示将显示在编辑器下方。",
  "Tips will not be shown.": "不显示提示。",
  "Tips are temporarily disabled for this session.": "本次会话中已暂时禁用提示。",
  "Button Scale": "按钮缩放",
  "Interface Font Size": "界面字号",
  "Line Spacing": "行间距",
  "Paragraph Spacing": "段落间距",
  "Max Line Width": "最大行宽",
  "Output Font Size": "输出字号",
  "Paragraph Indent": "段落缩进",
  "Your subscription ends on [0] and does not renew.": "你的订阅将于 [0] 到期，且不会自动续订。",
  "Your subscription expired on [0].": "你的订阅已于 [0] 过期。",
  "Change Pen Name": "更改笔名",
  "Change Email": "更改邮箱",
  "Request to Delete Account": "申请删除账户",
  "Send Confirmation Email": "发送确认邮件",
  "Account ID": "账户 ID",
  "Default Storage Location": "默认存储位置",
  "Server": "服务器",
  "Inventory": "物品栏",
  "You do not own any items yet.": "你还没有任何物品。",
  "Select an item to see its details.": "选择一个物品以查看详情。",
  "Empty slot": "空栏位",
  "Expired": "已过期",
  "Not available": "不可用",
  "Use": "使用",
  "The item could not be used. Please try again.": "无法使用该物品，请重试。",
  "Prev": "上一页",
  "Used Item History": "已使用物品记录",
  "Used Items": "已使用物品",
  "You have not used any items yet.": "你还没有使用过任何物品。",
  "Obtained [0]": "获得于 [0]",
  "Unknown Item": "未知物品",
  "Use this item?": "要使用这个物品吗？",
  "This will consume the item and cannot be undone.": "这会消耗该物品，且无法撤销。",
  "Opus Usage Boost": "Opus 额度加成",
  "Use an Opus Usage Boost?": "要使用 Opus 额度加成吗？",
  "Usage Boosts Owned": "已拥有的额度加成",
  "Buy": "购买",
  "Usage Boosts can only be used with an active Opus subscription.": "只有拥有有效的 Opus 订阅时才能使用额度加成。",
  "Buy an Opus Usage Boost": "购买 Opus 额度加成",
  "Your Opus Usage Boost has been added to your inventory.": "Opus 额度加成已添加到你的物品栏。",
  "Open Inventory": "打开物品栏",
  "You are already holding the maximum number of Usage Boosts.": "你已持有最大数量的额度加成。",
  "Out of Opus Generations": "Opus 生成额度已用完",
  "Your V5 Opus usage limit is used up. Use one of your Usage Boosts?": "你的 V5 Opus 使用额度已用完。要使用一个额度加成吗？",
  "Buy a Boost": "购买额度加成",
  "No Thanks": "不用了，谢谢",
  "Inventory Override": "物品栏调试",
  "Items": "物品数量",
  "Image Generation - NovelAI": "图像生成 - NovelAI",
  "There are issues connecting to the backend right now, please check your connection or try again...": "目前连接后端时出现问题，请检查网络连接后重试……",
  "Anlas:": "Anlas：",
  "Author": "作者",
  "V5 Curated": "V5 精选",
  "V5 Full": "V5 完整",
  "V5 Full Turbo": "V5 完整 Turbo",
  "V4.5 Curated": "V4.5 精选",
  "V4.5 Full": "V4.5 完整",
  "V4 Curated": "V4 精选",
  "V4 Full": "V4 完整",
  "V3 Curated": "V3 精选",
  "V3 Full": "V3 完整",
  "OTHER": "其他",
  "English": "英语",
  "Japanese": "日语",
  "Chinese": "中文",
  "deselect image": "取消选择图像",
  "menu": "菜单",
  "collapse History": "收起历史记录",
  "expand History": "展开历史记录",
  "Select the Model": "选择模型",
  "Select a Resolution Category": "选择分辨率分类",
  "Select a sampler": "选择采样器",
  "Notifications Alt+T": "通知 Alt+T",
  "Opens in a new window": "在新窗口打开",
  "Opens an external website": "打开外部网站",
  "Opens an external website in a new window": "在新窗口打开外部网站",
  "Cookie Consent Banner": "Cookie 同意横幅",
  "Close this consent banner": "关闭此同意横幅",
  "This website utilizes technologies such as cookies to enable essential site functionality, as well as for analytics, personalization, and targeted advertising. You may change your settings at any time or accept the default settings. You may close this banner to continue with only essential cookies.": "本网站使用 Cookie 等技术来实现基本网站功能，并用于分析、个性化和定向广告。你可以随时更改设置或接受默认设置；也可以关闭此横幅，仅使用必要的 Cookie 继续浏览。",
  "This website utilizes technologies such as cookies to enable essential site functionality, as well as for analytics, personalization, and targeted advertising.": "本网站使用 Cookie 等技术来实现基本网站功能，并用于分析、个性化和定向广告。",
  "You may change your settings at any time or accept the default settings.": "你可以随时更改设置或接受默认设置。",
  "You may close this banner to continue with only essential cookies.": "你也可以关闭此横幅，仅使用必要的 Cookie 继续浏览。",
  "Storage Preferences": "存储偏好",
  "Targeted Advertising": "定向广告",
  "Personalization": "个性化",
  "Analytics": "分析",
  "Accept All": "全部接受",
  "Reject Non-Essential": "拒绝非必要",
  "Powered by Osano": "由 Osano 提供支持",
  "Cookie Preferences": "Cookie 偏好",
  "Close Cookie Preferences": "关闭 Cookie 偏好",
  "Manage Preferences": "管理偏好",
  "Essential": "必要",
  "Required to enable basic website functionality. You may not disable essential cookies.": "用于启用基本网站功能。必要 Cookie 无法禁用。",
  "View Cookies": "查看 Cookie",
  "To learn more, view the following link:": "如需了解更多，请查看以下链接：",
  "Behold, Your Canvas!": "看，这就是你的画布！",
  "Strengthening & Weakening": "加强与削弱",
  "Image Generation Basics +1": "图像生成基础 +1",
  "Think of tags as the elements that make up images.": "把标签看作构成图像的各个元素。",
  "When you type the AI will suggest you ": "输入时，AI 会为你推荐 ",
  "Can’t think of anything to generate?": "想不出要生成什么？",
  "Return to the Quick Start Gallery by clicking the NovelAI Logo in the top left!": "点击左上角的 NovelAI 标志，返回快速入门画廊！",
  "Want to learn more basics of Image Generation?": "想了解更多图像生成基础知识？",
  "Get inspiration from our quick start gallery.": "从快速入门画廊获取灵感。",
  "We’ve got a handy starter Tutorial Video for you!": "我们为你准备了一个方便的入门教程视频！",
  "You can find these handy resources at any time under the Hamburger menu": "你随时可以在汉堡菜单下找到这些实用资源",
  "See the little circle next to each tag? This shows how well the AI": "看到每个标签旁边的小圆圈了吗？它表示 AI 对该标签的",
  "This works well for things like make-up that can sometimes turn out a little too extreme.": "对于妆容等有时会过于夸张的元素，这种方法很有效。",
  "Creating Consistent Characters": "创建一致的角色",
  "Official NovelAI Docs Page!": "NovelAI 官方文档页面！",
  "Happy creating!": "创作愉快！",
  "That’s it for now!": "暂时就到这里！",
  "Goose Tip:": "小贴士：",
  "natural language": "自然语言",
  "strengthen": "增强",
  "weaken": "削弱",
  "brighter": "更亮",
  "You can edit the ": "你可以编辑 ",
  "Brackets are used to ": "括号用于 ",
  "You can even combine ": "你甚至可以组合 ",
  "Make sure you use the same amount on both sides!": "请确保两侧使用相同数量的括号！",
  "lower-case": "小写",
  "comma and a space": "逗号和空格",
  "You can also ": "你还可以 ",
  "Later, you can use the ": "之后，你可以使用 ",
  "For example, you can add ": "例如，你可以添加 ",
  "Example:": "示例：",
  "YouTube video player": "YouTube 视频播放器",
  "Expires": "到期",
  "Expiration": "到期时间",
  "Renews": "续费",
  "Account Settings": "账户设置",
  "Account": "账户",
  "Subscription": "订阅",
  "Current Tier": "当前套餐",
  "Manage Account": "管理账户",
  "Account Status": "账户状态",
  "Payment Method": "支付方式",
  "Billing Information": "账单信息",
  "Billing Address": "账单地址",
  "Billing": "账单",
  "Next Payment": "下次付款",
  "Payment Due": "付款到期",
  "Credit Card": "信用卡",
  "Card Number": "卡号",
  "Expiry Date": "有效期",
  "CVV/CVC": "CVV/CVC",
  "First Name": "名",
  "Last Name": "姓",
  "Address Line 1": "地址第一行",
  "Address Line 2": "地址第二行",
  "City": "城市",
  "State": "州/省",
  "Country": "国家",
  "Zip/Postal Code": "邮编",
  "Email": "邮箱",
  "Tier Pricing": "套餐价格",
  "Checkout has been disable due to ongoing maintenance, please stay tuned for further updates.": "结账功能因维护暂时关闭，请留意后续更新。",
  "Subscriptions already purchased might take longer than expected to activate.": "已购买的订阅可能需要比预期更长的时间才能生效。",
  "Your payment was successful but processing it on our side is taking a bit longer... It can take up to 30+ minutes to process in some circumstances. If the issue continues for more than 24–48 hours, please contact us at support@novelai.net": "付款成功，但我们这边处理还需要一点时间……某些情况下最多可能需要 30 分钟以上。如果超过 24–48 小时仍未解决，请联系 support@novelai.net。",
  "Processing your gift key is taking longer than expected...": "礼品码处理时间比预期更长……",
  "Processing your request is taking longer than expected...": "请求处理时间比预期更长……",
  "Could not reactivate subscription.": "无法重新激活订阅。",
  "Cannot use a subscription gift key when already subscribed unless the current subscription came from a gift key.": "已经订阅时不能使用订阅礼品码，除非当前订阅也是通过礼品码获得的。",
  "Cannot use a subscription gift key when already subscribed.": "已经订阅时不能使用订阅礼品码。",
  "You need a subscription to do this!": "你需要订阅才能执行此操作！",
  "You are not subscribed!": "你还没有订阅！",
  "Upgrade your subscription?": "升级你的订阅？",
  "Take me there": "带我去",
  "No, take me back!": "不，返回",
  "You are subscribed to the [0] tier!": "你订阅的是 [0] 套餐！",
  "Your subscription renews around [0].": "你的订阅大约在 [0] 续费。",
  "Your subscription is currently classified as high risk by our payment provider, this can take up to a day to clear up.": "你的订阅目前被支付服务商标记为高风险，通常最多需要一天才能解除。",
  "Unsubscribe": "取消订阅",
  "Reactivate Subscription": "重新激活订阅",
  "Upgrade Subscription Tier": "升级订阅套餐",
  "Update Payment Method": "更新支付方式",
  "Replace Subscription": "更换订阅",
  "Activate a Gift Key": "激活礼品码",
  "Activate": "激活",
  "Success!": "成功！",
  "Ta-da! Your [0] subscription has been activated.": "太棒了！你的 [0] 订阅已激活。",
  "Ta-da! your [0] Anlas have been redeemed.": "太棒了！你的 [0] Anlas 已兑换。",
  "Ta-da! Your [0] subscription has been activated and [1] Anlas have been redeemed.": "太棒了！你的 [0] 订阅已激活，[1] Anlas 已兑换。",
  "Upgrade Subscription": "升级订阅",
  "Payment Method Required": "需要支付方式",
  "Add Payment Method": "添加支付方式",
  "Confirm Purchase": "确认购买",
  "Purchase failed.": "购买失败。",
  "Failed to load 3DS handler. Please ensure that your browser is not blocking scripts.": "无法加载 3DS 处理程序，请确认浏览器没有拦截脚本。",
  "No payment method exists. Please add a payment method to your account and try again.": "没有可用的支付方式，请先添加支付方式后重试。",
  "You need to update your billing information and add a payment method before you can purchase Anlas.": "购买 Anlas 前，你需要更新账单信息并添加支付方式。",
  "Your Subscription Anlas:": "订阅 Anlas：",
  "Your Paid Anlas:": "付费 Anlas：",
  "Anlas/USD": "Anlas/美元",
  "Purchase": "购买",
  "Do you really want to": "你确定要",
  "purchase the following?": "购买以下内容？",
  "Purchased Successful!\nIt may take up to 30+ minutes to for the Anlas to be credited to your account. If it takes longer than expected please contact us at support@novelai.net": "购买成功！\nAnlas 最多可能需要 30 分钟以上才会到账；如果超过预期时间，请联系 support@novelai.net。",
  "Here you can purchase additional Anlas for Image Generation.": "你可以在这里购买额外 Anlas 用于图像生成。",
  "Subscription Anlas will be refilled according to your subscription every month.": "订阅 Anlas 会按照你的订阅每月补充。",
  "*The discounted Anlas pricing does not apply to accounts with canceled or non-renewing subscriptions.": "*折扣 Anlas 价格不适用于已取消或不会续订的订阅账户。",
  "Your subscription transaction is marked as high-risk with our payment provider. You won't be able to purchase Anlas until this status is cleared, which usually happens within 24 hours.": "你的订阅交易被支付服务商标记为高风险；在该状态解除前无法购买 Anlas，通常会在 24 小时内解除。",
  "You're signed up to our newsletter.": "你已订阅我们的新闻邮件。",
  "You'll receive emails from us when we release new updates and other news.": "当我们发布新更新和其他消息时，你会收到邮件。",
  "Manage Cookie Preferences": "管理 Cookie 偏好",
  "Opus Tier": "Opus 套餐",
  "Scroll Tier": "Scroll 套餐",
  "Tablet Tier": "Tablet 套餐",
  "View Invoices": "查看发票",
  "Update Payment Details": "更新支付详情",
  "Your subscription renews around": "你的订阅续费时间：",
  "Your subscription renews on": "你的订阅续费时间：",
  "Your subscription will renew on": "你的订阅将于",
  "Your subscription renews in": "你的订阅续费时间：",
  "Your subscription ends on": "你的订阅到期时间：",
  "Your subscription expired on": "你的订阅过期时间：",
  "Renews on": "续费日期：",
  "Next payment": "下次付款：",
  "Next payment on": "下次付款：",
  "Payment due": "付款到期：",
  "Payment due on": "付款到期：",
  "Expires on": "到期时间：",
  "You are subscribed to the": "你订阅的是",
  "Stay Informed.": "保持关注。",
  "Stay informed.": "保持关注。",
  "Stay Informed": "保持关注",
  "Subscribe to our newsletter.": "订阅我们的新闻邮件。",
  "Subscribe to our newsletter": "订阅我们的新闻邮件",
  "Billing History": "账单历史",
  "Invoice": "发票",
  "Invoices": "发票",
  "Date": "日期",
  "Amount": "金额",
  "Download": "下载",
  "No invoices yet.": "暂无发票。",
  "Failed to load invoices.": "加载发票失败。",
  "Failed to download invoice.": "下载发票失败。",
  "Retry": "重试",
  "Previous": "上一页",
  "Next": "下一页",
  "Page [0] of [1]": "第 [0] / [1] 页",
  "Payment method updated.": "支付方式已更新。",
  "Payment method update not needed.": "无需更新支付方式。",
  "Update Billing Information": "更新账单信息",
  "Add Billing Address": "添加账单地址",
  "Saved Card Deleted": "已删除保存的银行卡",
  "Delete Saved Card": "删除保存的银行卡",
  "Are you sure you want to delete your saved card? You will need to enter your card details again the next time you make a purchase.": "确定要删除保存的银行卡吗？下次购买时需要重新输入卡信息。",
  "Your account has no associated billing address. Please add one.": "你的账户还没有关联账单地址，请添加一个。",
  "Your subscription renewal payment has failed. Please update your payment method to not lose access.": "订阅续费付款失败。请更新支付方式，以免失去访问权限。",
  "Your subscription is already paid for. You do not need to update your payment method, though you can do so through manage subscription.": "你的订阅已经支付，无需更新支付方式；仍可通过“管理订阅”修改。",
  "The AI": "AI",
  "Extra Goodies": "额外内容",
  "Best Value": "最超值",
  "For the Enthusiast": "适合爱好者",
  "Advanced AI": "高级 AI",
  "Unlimited": "无限",
  "Unlimited Text Generations": "无限文本生成",
  "Free Text Generations": "免费文本生成",
  "Unlimited** normal and small sized generations.": "无限**普通和小尺寸生成。",
  "Access to our advanced image generation models.": "可使用我们先进的图像生成模型。",
  "Access to new Experimental Features": "可使用新的实验性功能",
  "You’ll get access to the latest and coolest new stuff before everyone else.": "你会比其他用户更早体验最新、最酷的功能。",
  "Access to Clio, our smaller but fastest proof of concept AI Storyteller.": "可使用 Clio，我们更小但速度最快的概念验证 AI 故事生成器。",
  "Access to Kayra, our top of the line AI Storyteller.": "可使用 Kayra，我们顶级的 AI 故事生成器。",
  "Including all our other AI Storytellers": "包含我们所有其他 AI 故事生成器",
  "Bring your stories to life with the soothing sound of our generated Text-to-Speech voices.": "用生成的舒缓语音为你的故事赋予生命。",
  "100 Free TTS Generations": "100 次免费 TTS 生成",
  "TTS Generations": "TTS 生成",
  "Characters of Memory": "记忆字符数",
  "The number of characters the AI can remember. (~4 characters = 1 token)": "AI 可记住的字符数。（约 4 个字符 = 1 个 token）",
  "That’s about ~[0] characters that the AI can remember.": "大约相当于 AI 可记住的 ~[0] 个字符。",
  "Currency for Image Generations, refilled every month.": "用于图像生成的货币，每月补充。",
  "SOTA image model capable of generating Anime imagery": "可生成动漫图像的 SOTA 图像模型",
  "SOTA image model capable of generating Furry imagery": "可生成兽人图像的 SOTA 图像模型",
  "* For images of up to 1024x1024 pixels and up to 28 steps when generating a single image. Additional usage limits apply to NovelAI Diffusion V5": "* 单张图像最高 1024x1024 像素、最多 28 步。NovelAI Diffusion V5 还适用额外使用限制。",
  "† At the default resolution and settings.": "† 在默认分辨率和设置下。",
  "Please check again in a few minutes.": "请过几分钟再检查。",
  "You already purchased a subscription, but it is taking longer than expected to be processed.": "你已经购买了订阅，但处理时间比预期更长。",
  "[0] Tokens of Memory": "[0] 记忆 Token",
  "~[0] characters": "~[0] 个字符",
  "Pen Name": "笔名",
  "Email Unverified": "邮箱未验证",
  "Show Account ID": "显示账户 ID",
  "Delete Account": "删除账户",
  "Not possible while subscribed.": "订阅期间无法执行此操作。",
  "Password Required": "需要密码",
  "Password required": "需要密码",
  "You must enter your password to access this.": "你必须输入密码才能访问此内容。",
  "You must enter your password to access this": "你必须输入密码才能访问此内容",
  "You must enter your password to access your stories.": "你必须输入密码才能访问你的故事。",
  "You must enter your password to access your stories": "你必须输入密码才能访问你的故事",
  "Enter Password": "输入密码",
  "Enter your password": "输入你的密码",
  "Forgot Password": "忘记密码",
  "Password": "密码",
  "Incorrect password.": "密码错误。",
  "Wrong password.": "密码错误。",
  "This story is password protected.": "这个故事受密码保护。",
  "You must enter your password to access": "你必须输入密码才能访问",
  "this.": "此内容。",
  "We value your privacy and security.": "我们重视你的隐私和安全。",
  "Your stories, settings presets, and other remotely stored content is encrypted locally on your computer.": "你的故事、设置预设和其他远程存储内容都会在你自己的电脑上本地加密。",
  "In order to decrypt your content and maintain your privacy you must enter the password you set previously.": "为了解密你的内容并保护隐私，你必须输入之前设置的密码。",
  "We value your privacy and security. Your stories, settings presets, and other remotely stored content is encrypted locally on your computer. In order to decrypt your content and maintain your privacy you must enter the password you set previously.": "我们重视你的隐私和安全。你的故事、设置预设和其他远程存储内容都会在你自己的电脑上本地加密。为了解密你的内容并保护隐私，你必须输入之前设置的密码。",
  "Encoding required.": "需要编码。",
  "Encoding required. This will cost": "需要编码。下次生成将消耗",
  "This will cost": "将消耗",
  "on the next generation.": "。",
  "on the next generation": "。",
  "Anlas on the next generation.": "Anlas。",
  "Encoding required. This will cost [0] Anlas on the next generation.": "需要编码。下次生成将消耗 [0] Anlas。",
  "Encoding required. This will cost [0] on the next generation.": "需要编码。下次生成将消耗 [0]。",
});


(() => {
  'use strict';

  if (window.__NAI_ZH_CONTENT_LOADED__) return;
  window.__NAI_ZH_CONTENT_LOADED__ = true;

  const DICT = globalThis.NAI_ZH_DICT;
  if (!DICT || typeof DICT !== 'object') {
    console.warn('[NovelAI 汉化] 词典未加载，扩展可能不完整。');
    return;
  }

  const TEXT_NODE = 3;
  const ELEMENT_NODE = 1;
  const DOCUMENT_NODE = 9;
  const DOCUMENT_FRAGMENT_NODE = 11;

  const SKIP_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'NOSCRIPT',
    'TEMPLATE',
    'CANVAS',
    'SVG',
    'PATH',
    'CODE',
    'PRE',
    'KBD',
    'SAMP',
    'TITLE',
  ]);

  const PROTECTED_SELECTOR = [
    'textarea',
    'input',
    '[contenteditable="true"]',
    '[contenteditable=""]',
    '[contenteditable="plaintext-only"]',
    '[role="textbox"]',
    '.ProseMirror',
    '.cm-editor',
    '.monaco-editor',
    '[data-lexical-editor]',
    '.notranslate',
    '[translate="no"]',
    '[data-nai-zh-skip]',
    '.autocomplete-container',
    '.tag-context-menu',
    '.suggestion-item',
    '.suggestion-text',
  ].join(',');

  const PROTECTED_CLASS_RE =
    /(?:^|[\s_-])(?:tag[-_]?suggest(?:ion)?s?|tag[-_]?list|autocomplete|prompt[-_]?(?:text|value|display|content|body)|token[-_]?(?:editor|list)|prosemirror|monaco|cm[-_]editor)(?:$|[\s_-])/i;

  const ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt', 'data-placeholder', 'value'];
  const CJK_RE = /[\u3400-\u9fff]/;

  const normalize = (value) =>
    String(value)
      .replace(/[\u00a0\u200b]/g, ' ')
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

  const EXACT = new Map();
  for (const [english, chinese] of Object.entries(DICT)) {
    if (typeof chinese !== 'string' || !chinese || chinese === english) continue;
    const key = normalize(english);
    if (!key) continue;
    if (!EXACT.has(key)) EXACT.set(key, chinese);
  }

  const option = (word) => {
    const key = normalize(word);
    return EXACT.get(key) || word;
  };

  const RULES = [
    [
      /^Image Generation(.*?) - NovelAI$/i,
      (m) => `图像生成${m[1]} - NovelAI`,
    ],
    [
      /^Generating(.*?) - NovelAI$/i,
      (m) => `正在生成${m[1]} - NovelAI`,
    ],
    [
      /^Loading(.*?) - NovelAI$/i,
      (m) => `加载中${m[1]} - NovelAI`,
    ],
    [
      /^Generate (\d+) Images?$/i,
      (m) => `生成 ${m[1]} 张图像`,
    ],
    [
      /^(\d+) Images?$/i,
      (m) => `${m[1]} 张图像`,
    ],
    [
      /^(\d+) image \(([^)]+)\)$/i,
      (m) => `${m[1]} 张图像（${m[2]}）`,
    ],
    [
      /^([\d,]+) tokens? out of ([\d,]+) tokens? used$/i,
      (m) => `已使用 ${m[1]} / ${m[2]} 个 token`,
    ],
    [
      /^This prompt is using ([\d,]+) of the currently used ([\d,]+) tokens\. Max total tokens: ([\d,]+)$/i,
      (m) => `本提示词使用了当前 ${m[2]} 个 token 中的 ${m[1]} 个。最大 token 总数：${m[3]}`,
    ],
    [
      /^Character (\d+)$/i,
      (m) => `角色 ${m[1]}`,
    ],
    [
      /^Character (\d+) Prompt$/i,
      (m) => `角色 ${m[1]} 提示词`,
    ],
    [
      /^Character (\d+) UC$/i,
      (m) => `角色 ${m[1]} 负面提示词`,
    ],
    [
      /^Random Character (\d+)$/i,
      (m) => `随机角色 ${m[1]}`,
    ],
    [
      /^Set Character (\d+)['’]s Position$/i,
      (m) => `设置角色 ${m[1]} 的位置`,
    ],
    [
      /^(Model|Quality Tags|UC Preset|Undesired Content Preset|Quality Preset): (.+)$/i,
      (m) => {
        const labels = {
          model: '模型',
          'quality tags': '质量标签',
          'uc preset': '负面预设',
          'undesired content preset': '负面预设',
          'quality preset': '质量预设',
        };
        return `${labels[m[1].toLowerCase()] || m[1]}：${option(m[2])}`;
      },
    ],
    [
      /^Last Saved On: (.+)$/i,
      (m) => `上次保存：${m[1]}`,
    ],
    [
      /^Version (.+)$/i,
      (m) => `版本 ${m[1]}`,
    ],
    [
      /^([\d,]+)% of Opus Generations remaining(?:, \+([\d,]+)% Extra Usage)?$/i,
      (m) =>
        `Opus 生成额度剩余 ${m[1]}%${m[2] ? `，另有 +${m[2]}% 额外额度` : ''}`,
    ],
    [
      /^([\d,]+)% remaining(?:, \+([\d,]+)% Extra Usage)? \(~([\d,]+) images?\)$/i,
      (m) =>
        `剩余 ${m[1]}%${m[2] ? `，另有 +${m[2]}% 额外额度` : ''}（约 ${m[3]} 张图像）`,
    ],
    [
      /^Currently refills at ([\d.]+)% per day \(~([\d,]+) images?\)\.$/i,
      (m) => `目前每天恢复 ${m[1]}%（约 ${m[2]} 张图像）。`,
    ],
    [
      /^Imported ([\d,]+) Vibe Transfer reference image\(s\)\.$/i,
      (m) => `已导入 ${m[1]} 张氛围转移参考图。`,
    ],
    [
      /^Maximum characters is ([\d,]+)\. ([\d,]+) character\(s\) will be imported\.$/i,
      (m) => `最多允许 ${m[1]} 个字符，将导入 ${m[2]} 个字符。`,
    ],
    [
      /^Each Vibe Transfer reference image after the fourth costs an additional ([\d,.]+) \(currently ([\d,.]+)\)\.$/i,
      (m) => `第 4 张之后的每张氛围转移参考图会额外消耗 ${m[1]}（当前为 ${m[2]}）。`,
    ],
    [
      /^Image (\d+) failed with error: (.+)$/i,
      (m) => `第 ${m[1]} 张图像生成失败：${m[2]}`,
    ],
    [
      /^Grid would generate ([\d,]+) images \(maximum ([\d,]+)\)\.$/i,
      (m) => `网格将生成 ${m[1]} 张图像（上限 ${m[2]} 张）。`,
    ],
    [
      /^(\d+) selected generation\(s\)$/i,
      (m) => `已选择 ${m[1]} 次生成`,
    ],
    [
      /^Added to the beginning of the prompt: ?(.+)$/i,
      (m) => `已添加到提示词开头：${m[1]}`,
    ],
    [
      /^Added to the end of the prompt: ?(.+)$/i,
      (m) => `已添加到提示词末尾：${m[1]}`,
    ],
    [
      /^Added to the beginning of the UC: ?(.+)$/i,
      (m) => `已添加到负面提示词开头：${m[1]}`,
    ],
    [
      /^Device ([\d,]+) of ([\d,]+)$/i,
      (m) => `设备 ${m[1]} / ${m[2]}`,
    ],
    [
      /^Your subscription ends on (.+) and does not renew\.$/i,
      (m) => `你的订阅将于 ${m[1]} 到期，且不会自动续订。`,
    ],
    [
      /^Your subscription expired on (.+)\.$/i,
      (m) => `你的订阅已于 ${m[1]} 过期。`,
    ],
    [
      /^([\d,]+)\/([\d,]+) image generations? remaining\.$/i,
      (m) => `剩余 ${m[1]}/${m[2]} 次图像生成。`,
    ],
    [
      /^([\d,]+)\/([\d,]+) text generations? remaining\.$/i,
      (m) => `剩余 ${m[1]}/${m[2]} 次文本生成。`,
    ],
    [
      /^Expires (?:on )?(.+)$/i,
      (m) => `到期时间：${m[1]}`,
    ],
    [
      /^Your subscription renews around (.+)\.$/i,
      (m) => `你的订阅大约在 ${m[1]} 续费。`,
    ],
    [
      /^Your subscription renews on (.+)\.$/i,
      (m) => `你的订阅将于 ${m[1]} 续费。`,
    ],
    [
      /^Your subscription will renew on (.+)\.$/i,
      (m) => `你的订阅将于 ${m[1]} 续费。`,
    ],
    [
      /^Your subscription renews in (.+)\.$/i,
      (m) => `你的订阅将在 ${m[1]} 后续费。`,
    ],
    [
      /^Renews (?:on )?(.+)$/i,
      (m) => `续费日期：${m[1]}`,
    ],
    [
      /^Next payment(?: is| on)? (.+)$/i,
      (m) => `下次付款：${m[1]}`,
    ],
    [
      /^Payment due(?: on)? (.+)$/i,
      (m) => `付款到期：${m[1]}`,
    ],
    [
      /^You are subscribed to the (.+) tier!$/i,
      (m) => `你订阅的是 ${m[1]} 套餐！`,
    ],
    [
      /^Purchased ([\d,]+) Anlas!$/i,
      (m) => `已购买 ${m[1]} Anlas！`,
    ],
    [
      /^Page ([\d,]+) of ([\d,]+)$/i,
      (m) => `第 ${m[1]} / ${m[2]} 页`,
    ],
    [
      /^\$([\d.]+) USD$/i,
      (m) => `${m[1]} 美元`,
    ],
    [
      /^Adds ([\d.]+)% to your Opus Usage Limit\.$/i,
      (m) => `使 Opus 使用额度增加 ${m[1]}%。`,
    ],
    [
      /^This will add ([\d.]+)% to your Opus Usage Limit and cannot be undone\.$/i,
      (m) => `这会使 Opus 使用额度增加 ${m[1]}%，且无法撤销。`,
    ],
    [
      /^An Opus Usage Boost adds 100% your V5 Opus usage limit\. Boosts are kept in your inventory until you choose to use one, and you can hold up to ([\d,]+) at a time\.$/i,
      (m) => `Opus 额度加成会使你的 V5 Opus 使用额度增加 100%。加成会保存在物品栏中，直到你选择使用；最多可同时持有 ${m[1]} 个。`,
    ],
    [
      /^Your V5 Opus usage limit is used up\. A Usage Boost gives you an extra 100%\. Boosts are kept in your inventory until you choose to use one, and you can hold up to ([\d,]+) at a time\.$/i,
      (m) => `你的 V5 Opus 使用额度已用完。额度加成可额外增加 100% 额度。加成会保存在物品栏中，直到你选择使用；最多可同时持有 ${m[1]} 个。`,
    ],
    [
      /^You have too much usage from Opus Usage Boosts to use this\. The maximum is ([\d.]+)%\.$/i,
      (m) => `你通过 Opus 额度加成获得的使用量过多，无法使用此物品。上限为 ${m[1]}%。`,
    ],
    [
      /^Using the one that expires soonest, on (.+)\.$/i,
      (m) => `将使用最早到期的一个，作用于 ${m[1]}。`,
    ],
    [
      /^Obtained (.+)$/i,
      (m) => `获得于 ${m[1]}`,
    ],
    [
      /^Story deletion failed: (.+)$/i,
      (m) => `删除故事失败：${m[1]}`,
    ],
    [
      /^Story download failed: (.+)$/i,
      (m) => `下载故事失败：${m[1]}`,
    ],
    [
      /^Story clone failed: (.+)$/i,
      (m) => `克隆故事失败：${m[1]}`,
    ],
    [
      /^Story with id (.+) cloned\.$/i,
      (m) => `已克隆 ID 为 ${m[1]} 的故事。`,
    ],
    [
      /^Removing account scripts failed: (.+)$/i,
      (m) => `移除账户脚本失败：${m[1]}`,
    ],
    [
      /^Couldn't save settings: (.+)$/i,
      (m) => `无法保存设置：${m[1]}`,
    ],
    [
      /^Are you sure you want to delete the voice "(.+)"\?$/i,
      (m) => `确定要删除声音“${m[1]}”吗？`,
    ],
  ];

  const state = {
    enabled: false,
    started: false,
    observer: null,
    observerRoot: null,
    titleObserver: null,
    scanTimer: 0,
    originalLang: '',
    pendingRoots: new Set(),
    flushScheduled: false,
    records: new Map(),
    attrRecords: new Map(),
    titleRecord: null,
    lastChineseTitle: '',
    translatedCount: 0,
  };

  function isImagePage() {
    return location.pathname === '/image' || location.pathname.startsWith('/image/');
  }

  function isTextProtected(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest(PROTECTED_SELECTOR)) return true;

    for (let el = parent; el && el !== document.documentElement; el = el.parentElement) {
      if (SKIP_TAGS.has(el.tagName)) return true;
      const className = typeof el.className === 'string' ? el.className : '';
      if (className && PROTECTED_CLASS_RE.test(className)) return true;
      if (el.id && PROTECTED_CLASS_RE.test(el.id)) return true;
    }
    return false;
  }

  function isAttributeProtected(el) {
    return Boolean(el.closest('.notranslate, [translate="no"], [data-nai-zh-skip]'));
  }

  const markedTextContainers = new WeakSet();
  function markTranslatedText(node) {
    let el = node && node.parentElement;
    for (let i = 0; el && i < 2 && el !== document.body; i++, el = el.parentElement) {
      if (markedTextContainers.has(el)) continue;
      markedTextContainers.add(el);
      try { el.setAttribute('data-nai-zh-text', ''); } catch (_) { }
    }
  }

  const FORCED_LABELS = new Map([
    ['Enter Password', '输入密码'],
    ['Submit', '提交'],
    ['Create Password', '创建密码'],
    ['Reset Password', '重置密码'],
    ['Change Password', '修改密码'],
  ]);
  function forceKnownLabels(root) {
    const inputIsButton = (el) => el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type || '');
    const visit = (node) => {
      if (!node) return;
      if (node.nodeType === TEXT_NODE) {
        const raw = node.nodeValue;
        const key = raw && raw.trim();
        const chinese = key && FORCED_LABELS.get(key);
        if (!chinese) return;
        const parent = node.parentElement;
        if (parent && parent.closest('.ProseMirror, [contenteditable="true"], [role="textbox"]')) return;
        node.nodeValue = raw.replace(key, chinese);
        return;
      }
      if (node.nodeType === ELEMENT_NODE) {
        if (inputIsButton(node)) {
          const value = node.value || node.getAttribute('value') || '';
          const chinese = FORCED_LABELS.get(value.trim());
          if (chinese && value.trim() !== chinese) {
            node.value = chinese;
            node.setAttribute('value', chinese);
          }
        }
        const role = node.getAttribute && node.getAttribute('role');
        if ((node.tagName === 'BUTTON' || node.tagName === 'A' || role === 'button') && node.childElementCount === 0) {
          const raw = (node.textContent || '').trim();
          const chinese = FORCED_LABELS.get(raw);
          if (chinese) node.textContent = chinese;
        }
        if (node.shadowRoot) visit(node.shadowRoot);
      }
      if (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE) {
        for (let child = node.firstChild; child; child = child.nextSibling) visit(child);
      }
    };
    visit(root);
  }

  function lookup(text) {
    const key = normalize(text);
    if (!key || key.length > 3000 || CJK_RE.test(key)) return null;

    const direct = EXACT.get(key);
    if (direct) return direct;

    for (const [regex, build] of RULES) {
      const match = regex.exec(key);
      if (match) return build(match);
    }
    return null;
  }

  function keepWhitespace(raw, body) {
    const leading = (raw.match(/^\s*/) || [''])[0];
    const trailing = (raw.match(/\s*$/) || [''])[0];
    return leading + body + trailing;
  }

  function repairPasswordText(node) {
    if (!node || !node.parentElement) return false;
    let el = node.parentElement;
    for (let i = 0; el && i < 3 && el !== document.body; i++, el = el.parentElement) {
      const text = el.textContent || '';
      if (text.length <= 320 && /password/i.test(text) && translateCompositeText(el)) return true;
    }
    return false;
  }

  function translateTextNode(node) {
    if (!state.enabled || !node || node.nodeType !== TEXT_NODE) return false;
    const raw = node.nodeValue;
    if (!raw || !raw.trim() || raw.length > 6000) return false;
    if (isTextProtected(node)) return false;

    const record = state.records.get(node);
    if (record && raw === record.translated) return false;

    if (/password/i.test(raw) && repairPasswordText(node)) return true;

    const chinese = lookup(raw);
    if (!chinese) return false;

    const next = keepWhitespace(raw, chinese);
    if (next === raw) return false;

    state.records.set(node, { original: raw, translated: next });
    node.nodeValue = next;
    markTranslatedText(node);
    return true;
  }

  function translateAttribute(el, name) {
    if (!state.enabled || !el || el.nodeType !== ELEMENT_NODE) return false;
    if (isAttributeProtected(el)) return false;
    if (name === 'value') {
      const isButtonInput = el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type || '');
      if (!isButtonInput) return false;
    }

    let raw = el.getAttribute(name);
    if (!raw && name === 'value' && el.tagName === 'INPUT') raw = el.value;
    if (!raw || !raw.trim() || raw.length > 3000) return false;

    let byName = state.attrRecords.get(el);
    const record = byName && byName.get(name);
    if (record && raw === record.translated) return false;

    const chinese = lookup(raw);
    if (!chinese) return false;

    const next = keepWhitespace(raw, chinese);
    if (next === raw) return false;

    if (!byName) {
      byName = new Map();
      state.attrRecords.set(el, byName);
    }
    byName.set(name, { original: raw, translated: next });
    el.setAttribute(name, next);
    if (name === 'value' && el.tagName === 'INPUT') {
      try { el.value = next; } catch (_) { }
    }
    return true;
  }

  function translateElementAttributes(el) {
    for (const name of ATTRIBUTES) {
      if (el.hasAttribute(name)) translateAttribute(el, name);
    }
    if (el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type || '')) {
      translateAttribute(el, 'value');
    }
  }

  function translateCompositeText(el) {
    if (!el || el.nodeType !== ELEMENT_NODE || el.isContentEditable) return false;
    if (el === document.body || el === document.documentElement) return false;
    if (el.closest('.notranslate, [translate="no"], [data-nai-zh-skip]')) return false;
    const childCount = el.childElementCount;
    if (childCount < 1 || childCount > 6) return false;

    const textNodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    let current;
    while ((current = walker.nextNode())) {
      if (!current.nodeValue) continue;
      if (isTextProtected(current)) continue;
      const parent = current.parentElement;
      if (parent && parent.closest('button, svg, a, script, style')) continue;
      textNodes.push(current);
    }
    const nonEmpty = textNodes.filter((node) => node.nodeValue.trim());
    if (nonEmpty.length < 2) return false;
    const text = textNodes.map((node) => {
      const record = state.records.get(node);
      return record ? record.original : node.nodeValue;
    }).join('');
    if (!text || text.length > 500) return false;
    const chinese = lookup(text);
    if (!chinese) return false;

    const first = nonEmpty[0];
    const firstRaw = first.nodeValue;
    const firstNext = (firstRaw.match(/^\s*/) || [''])[0] + chinese;
    state.records.set(first, { original: firstRaw, translated: firstNext });
    first.nodeValue = firstNext;
    markTranslatedText(first);
    for (const node of textNodes) {
      if (node === first) continue;
      const raw = node.nodeValue;
      state.records.set(node, { original: raw, translated: '' });
      node.nodeValue = '';
    }
    return true;
  }

  function scanNode(node) {
    if (!state.enabled || !node) return;

    if (node.nodeType === TEXT_NODE) {
      translateTextNode(node);
      return;
    }

    if (
      node.nodeType !== ELEMENT_NODE &&
      node.nodeType !== DOCUMENT_NODE &&
      node.nodeType !== DOCUMENT_FRAGMENT_NODE
    ) {
      return;
    }

    if (node.nodeType === ELEMENT_NODE) {
      if (SKIP_TAGS.has(node.tagName)) return;
      translateElementAttributes(node);
    }

    if (node.shadowRoot) scanNode(node.shadowRoot);

    for (let child = node.firstChild; child; child = child.nextSibling) {
      scanNode(child);
    }
  }

  function translateTitleText(value) {
    const text = String(value || '');
    if (!text) return text;

    const leading = text.match(/^([^\p{L}\p{N}\s]+)(\s*)/u);
    const prefix = leading ? leading[1] + leading[2] : '';
    const body = prefix ? text.slice(prefix.length) : text;
    if (!body) return text;
    const withPrefix = (translated) => prefix + translated;

    const chinese = lookup(body);
    if (chinese) {
      const next = keepWhitespace(body, chinese);
      state.lastChineseTitle = next;
      return withPrefix(next);
    }
    if (/\bgenerating\b/i.test(body)) {
      const next = '正在生成图像 - NovelAI';
      state.lastChineseTitle = next;
      return withPrefix(next);
    }
    if (/\bloading\b|\bplease wait\b/i.test(body)) {
      const next = '加载中 - NovelAI';
      state.lastChineseTitle = next;
      return withPrefix(next);
    }
    if (/image generation/i.test(body)) {
      const next = '图像生成 - NovelAI';
      state.lastChineseTitle = next;
      return withPrefix(next);
    }
    if (/^NovelAI(\s*[-–—].*)?$/i.test(body)) {
      const next = 'NovelAI 图像生成';
      state.lastChineseTitle = next;
      return withPrefix(next);
    }
    if (isImagePage() && /[A-Za-z]/.test(body) && !/[\u3400-\u9fff]/.test(body)) {
      return withPrefix(state.lastChineseTitle || 'NovelAI 图像生成');
    }
    return text;
  }

  function syncTitle() {
    if (!state.enabled) return;
    const current = document.title;
    if (!current) return;
    if (state.titleRecord && current === state.titleRecord.translated) return;

    const next = translateTitleText(current);
    if (next === current) return;

    state.titleRecord = { original: current, translated: next };
    document.title = next;
  }

  function schedule(node) {
    if (!state.enabled || !node) return;
    state.pendingRoots.add(node);
    if (state.flushScheduled) return;
    state.flushScheduled = true;
    setTimeout(flush, 40);
  }

  function flush() {
    state.flushScheduled = false;
    if (!state.enabled) {
      state.pendingRoots.clear();
      return;
    }
    const roots = Array.from(state.pendingRoots);
    state.pendingRoots.clear();

    for (const root of roots) {
      if (root === document || root.isConnected) {
        try {
          scanNode(root);
          if (/password|submit/i.test(root.textContent || '')) forceKnownLabels(root);
        } catch (error) {
          console.debug('[NovelAI 汉化] 跳过异常节点', error);
        }
      }
    }
    syncTitle();
    updateCount();
  }

  function updateCount() {
    let count = 0;
    for (const node of state.records.keys()) {
      if (node.isConnected) count += 1;
    }
    for (const [el, attrs] of state.attrRecords) {
      if (el.isConnected) count += attrs.size;
    }
    state.translatedCount = count;
  }

  function onMutations(mutations) {
    if (!state.enabled) return;
    const titleNode = document.querySelector('title');
    for (const mutation of mutations) {
      if (titleNode && (mutation.target === titleNode || mutation.target.parentElement === titleNode)) {
        syncTitle();
      }
      if (mutation.type === 'characterData') {
        if (mutation.target && !isTextProtected(mutation.target)) {
          translateTextNode(mutation.target);
        }
      } else if (mutation.type === 'attributes') {
        translateAttribute(mutation.target, mutation.attributeName);
      } else {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === TEXT_NODE) {
            translateTextNode(node);
            continue;
          }
          const nodeText = node.textContent || '';
          const textLength = nodeText.length;
          if (textLength <= 10000 || /password/i.test(nodeText)) {
            try {
              scanNode(node);
              if (/password|submit/i.test(nodeText)) forceKnownLabels(node);
            } catch (error) {
              console.debug('[NovelAI 汉化] 跳过异常节点', error);
            }
          } else {
            schedule(node);
          }
        }
      }
    }
    syncTitle();
    if (!state.flushScheduled && mutations.length) {
      state.flushScheduled = true;
      setTimeout(flush, 40);
    }
  }

  function startObserver() {
    if (state.observer) state.observer.disconnect();
    state.observerRoot = document.documentElement || document;
    state.observer = new MutationObserver(onMutations);
    state.observer.observe(state.observerRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTES,
    });

    if (state.titleObserver) state.titleObserver.disconnect();
    const head = document.head || document.documentElement;
    if (head) {
      state.titleObserver = new MutationObserver(() => syncTitle());
      state.titleObserver.observe(head, { childList: true, subtree: true, characterData: true });
    }
  }

  function enable() {
    if (!state.started || state.enabled) return;
    state.enabled = true;

    const root = document.documentElement;
    if (root) {
      if (!state.originalLang) state.originalLang = root.lang || '';
      root.setAttribute('data-nai-zh', '');
      root.lang = 'zh-CN';
    }

    startObserver();
    scanNode(document.documentElement || document);
    forceKnownLabels(document.documentElement || document);
    syncTitle();
    setTimeout(() => {
      if (!state.enabled) return;
      scanNode(document.body || document.documentElement);
      syncTitle();
      updateCount();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        try {
          root.classList.remove('nai-zh-booting');
          document.dispatchEvent(new Event('nai-zh-revealed'));
        } catch (_) { }
      }));
    }, 900);

    clearInterval(state.scanTimer);
    const periodicScan = () => {
      if (!state.enabled || document.visibilityState !== 'visible') return;
      scanNode(document.body || document.documentElement);
      syncTitle();
      updateCount();
    };
    state.scanTimer = setInterval(() => {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(periodicScan, { timeout: 2000 });
      } else {
        periodicScan();
      }
    }, 30000);
  }

  function restoreAll() {
    for (const [node, record] of state.records) {
      if (node.isConnected && node.nodeValue === record.translated) {
        node.nodeValue = record.original;
      }
    }
    state.records.clear();

    for (const [el, attrs] of state.attrRecords) {
      for (const [name, record] of attrs) {
        if (el.isConnected && el.getAttribute(name) === record.translated) {
          el.setAttribute(name, record.original);
        }
      }
    }
    state.attrRecords.clear();

    if (
      state.titleRecord &&
      document.title === state.titleRecord.translated
    ) {
      document.title = state.titleRecord.original;
    }
    state.titleRecord = null;
  }

  function disable() {
    if (!state.enabled) return;
    state.enabled = false;
    state.pendingRoots.clear();
    clearInterval(state.scanTimer);
    state.scanTimer = 0;
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    if (state.titleObserver) {
      state.titleObserver.disconnect();
      state.titleObserver = null;
    }

    restoreAll();

    const root = document.documentElement;
    if (root) {
      root.removeAttribute('data-nai-zh');
      root.classList.remove('nai-zh-booting');
      if (state.originalLang) root.lang = state.originalLang;
    }
    state.translatedCount = 0;
  }

  function setEnabled(value) {
    if (value) enable();
    else disable();
  }

  function status() {
    updateCount();
    return {
      enabled: state.enabled,
      started: state.started,
      count: state.translatedCount,
      dictionarySize: EXACT.size,
      url: location.href,
    };
  }

  function rescan() {
    if (!state.enabled) return;
    scanNode(document.body || document.documentElement);
    syncTitle();
    updateCount();
  }

  function listenToStorage() {
    try {
      if (!chrome.storage || !chrome.storage.onChanged) return;
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local' || !changes.enabled) return;
        setEnabled(changes.enabled.newValue !== false);
      });
    } catch {
    }
  }

  function listenToMessages() {
    try {
      if (!chrome.runtime || !chrome.runtime.onMessage) return;
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (!message || typeof message.type !== 'string') return;
        if (message.type === 'NAI_ZH_STATUS') {
          sendResponse(status());
        } else if (message.type === 'NAI_ZH_SET_ENABLED') {
          setEnabled(message.enabled !== false);
          sendResponse(status());
        } else if (message.type === 'NAI_ZH_TOGGLE') {
          setEnabled(!state.enabled);
          sendResponse(status());
        } else if (message.type === 'NAI_ZH_RESCAN') {
          rescan();
          sendResponse(status());
        }
      });
    } catch {
    }
  }

  function readEnabled() {
    return new Promise((resolve) => {
      try {
        if (!chrome.storage || !chrome.storage.local) {
          resolve(true);
          return;
        }
        chrome.storage.local.get({ enabled: true }, (value) => {
          resolve(value && value.enabled !== false);
        });
      } catch {
        resolve(true);
      }
    });
  }

  function installTitleInterceptor() {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
      if (!descriptor || !descriptor.get || !descriptor.set) return;
      Object.defineProperty(document, 'title', {
        configurable: true,
        get() { return descriptor.get.call(document); },
        set(value) {
          let next = String(value);
          if (state.enabled) next = translateTitleText(next);
          descriptor.set.call(document, next);
        },
      });
    } catch (_) { }
  }

  function start() {
    if (state.started) return;
    state.started = true;
    installTitleInterceptor();
    listenToStorage();
    listenToMessages();
    const restoreTitle = () => {
      if (!state.enabled) return;
      syncTitle();
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') restoreTitle();
    });
    window.addEventListener('focus', restoreTitle);
    window.addEventListener('pageshow', restoreTitle);
    readEnabled().then((enabled) => {
      if (enabled) enable();
    });
  }

  if (isImagePage()) {
    if (document.readyState === 'loading') {
      document.addEventListener(
        'DOMContentLoaded',
        () => setTimeout(start, 180),
        { once: true }
      );
    } else {
      setTimeout(start, 180);
    }
  } else {
    const pathTimer = setInterval(() => {
      if (!isImagePage()) return;
      clearInterval(pathTimer);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(start, 180), {
          once: true,
        });
      } else {
        setTimeout(start, 180);
      }
    }, 1000);
  }

  const api = { status, enable, disable, rescan, setEnabled };
  try {
    Object.defineProperty(window, '__NAI_ZH__', {
      configurable: true,
      value: api,
    });
  } catch {
  }
  try {
    globalThis.__NAI_ZH_API__ = api;
  } catch {
  }
})();


(function () {
    'use strict';
    if (typeof window.__NAIWeightAdjusting !== 'boolean') {
        window.__NAIWeightAdjusting = false;
    }
    if (typeof window.__NAIWeightAdjustingUntil !== 'number') {
        window.__NAIWeightAdjustingUntil = 0;
    }
    const LOCALE_KEY = 'nai_prompt_helper_locale_v1';
    const AUTOFORMAT_KEY = 'nai_prompt_helper_autoformat_enabled_v1';
    const KEEP_SELECTION_KEY = 'nai_prompt_helper_keep_selection_v1';
    const FAVORITES_KEY = 'nai_prompt_helper_favorites_v1';
    const EXCLUDED_KEY = 'nai_prompt_helper_excluded_v1';
    const LOCALE_MESSAGES = {
        zh: {
            infoTitle: '标签联想',
            contextMenuFavorite: '收藏',
            contextMenuExclude: '排除',
            contextMenuRemoveFavorite: '取消收藏',
            contextMenuRemoveExclude: '取消排除',
        },
        en: {
            infoTitle: 'Tag suggestions',
            contextMenuFavorite: 'Favorite',
            contextMenuExclude: 'Exclude',
            contextMenuRemoveFavorite: 'Remove Favorite',
            contextMenuRemoveExclude: 'Remove Exclude',
        }
    };
    const SUPPORTED_LOCALES = Object.keys(LOCALE_MESSAGES);
    function detectInitialLocale() {
        try {
            if (typeof GM_getValue === 'function') {
                const stored = GM_getValue(LOCALE_KEY);
                if (stored && SUPPORTED_LOCALES.includes(stored)) {
                    return stored;
                }
            }
        } catch (error) { }
        const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (nav.startsWith('zh')) { return 'zh'; }
        return 'en';
    }
    let currentLocale = detectInitialLocale();
    let autoFormatEnabled = true;
    let keepSelectionAfterAdjustment = true;
    let favoriteTags = new Set();
    let excludedTags = new Set();
    try {
        if (typeof GM_getValue === 'function') {
            const storedValue = GM_getValue(AUTOFORMAT_KEY);
            if (typeof storedValue === 'boolean') {
                autoFormatEnabled = storedValue;
            } else {
                GM_setValue(AUTOFORMAT_KEY, true);
            }
            const storedKeepSelection = GM_getValue(KEEP_SELECTION_KEY);
            if (typeof storedKeepSelection === 'boolean') {
                keepSelectionAfterAdjustment = storedKeepSelection;
            } else {
                GM_setValue(KEEP_SELECTION_KEY, true);
            }
            const storedFavorites = GM_getValue(FAVORITES_KEY);
            if (Array.isArray(storedFavorites)) {
                favoriteTags = new Set(storedFavorites);
            }
            const storedExcluded = GM_getValue(EXCLUDED_KEY);
            if (Array.isArray(storedExcluded)) {
                excludedTags = new Set(storedExcluded);
            }
        }
    } catch (e) { }
    function saveFavorites() {
        try { if (typeof GM_setValue === 'function') GM_setValue(FAVORITES_KEY, Array.from(favoriteTags)); } catch (e) { }
    }
    function saveExcluded() {
        try { if (typeof GM_setValue === 'function') GM_setValue(EXCLUDED_KEY, Array.from(excludedTags)); } catch (e) { }
    }
    function toggleFavorite(tagName) {
        if (favoriteTags.has(tagName)) {
            favoriteTags.delete(tagName);
        } else {
            favoriteTags.add(tagName);
            excludedTags.delete(tagName);
            saveExcluded();
        }
        saveFavorites();
    }
    function toggleExcluded(tagName) {
        if (excludedTags.has(tagName)) {
            excludedTags.delete(tagName);
        } else {
            excludedTags.add(tagName);
            favoriteTags.delete(tagName);
            saveFavorites();
        }
        saveExcluded();
    }
    const isChineseLocale = currentLocale === 'zh';
    function t(key) {
        const bundle = LOCALE_MESSAGES[currentLocale] || LOCALE_MESSAGES.en;
        return bundle[key] ?? LOCALE_MESSAGES.en[key] ?? key;
    }
    function formatPromptText(text) {
        text = text.replace(/，/g, ',');
        const structure = WeightShortcuts.parsePromptStructure(text);
        WeightShortcuts.normalizeTree(structure);
        return WeightShortcuts.serializeTree(structure);
    }
    const TagAssist = (() => {
        const MAX_SUGGESTIONS = 36;
        const DEBOUNCE_DELAY = 50;
        const DEBOUNCE_DELAY_EMOTICON = 500;
        const GELBOORU_API_URL = 'https://gelbooru.com/index.php';
        const DANBOORU_API_URL = 'https://danbooru.donmai.us';
        const API_TIMEOUT_MS = 1200;
        const SUGGESTION_CACHE_TTL = 5 * 60 * 1000;
        const SUGGESTION_CACHE_LIMIT = 80;
        const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36';
        const CACHE_KEY = 'danbooru_translations_cache';
        const REMOTE_CACHE_KEY = 'danbooru_cloud_translations_v6';
        const REMOTE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
        const REMOTE_MIN_ENTRIES = 1000;
        const REMOTE_DICT_SOURCES = [
            {
                name: 'general',
                urls: [
                    'https://raw.githubusercontent.com/amenorira/danbooru-tags-data-zh/main/tags/general.csv',
                    'https://cdn.jsdelivr.net/gh/amenorira/danbooru-tags-data-zh@main/tags/general.csv',
                ],
            },
            {
                name: 'artist',
                urls: [
                    'https://raw.githubusercontent.com/amenorira/danbooru-tags-data-zh/main/tags/artist.csv',
                    'https://cdn.jsdelivr.net/gh/amenorira/danbooru-tags-data-zh@main/tags/artist.csv',
                ],
            },
            {
                name: 'character',
                urls: [
                    'https://raw.githubusercontent.com/amenorira/danbooru-tags-data-zh/main/tags/character.csv',
                    'https://cdn.jsdelivr.net/gh/amenorira/danbooru-tags-data-zh@main/tags/character.csv',
                ],
            },
            {
                name: 'copyright',
                urls: [
                    'https://raw.githubusercontent.com/amenorira/danbooru-tags-data-zh/main/tags/copyright.csv',
                    'https://cdn.jsdelivr.net/gh/amenorira/danbooru-tags-data-zh@main/tags/copyright.csv',
                ],
            },
            {
                name: 'meta',
                urls: [
                    'https://raw.githubusercontent.com/amenorira/danbooru-tags-data-zh/main/tags/meta.csv',
                    'https://cdn.jsdelivr.net/gh/amenorira/danbooru-tags-data-zh@main/tags/meta.csv',
                ],
            },
        ];
        const SHORT_QUERY_PREFIX_LENGTH = 2;
        const ALLOWED_CHARS_REGEX = /^[a-zA-Z\d_\-\s'\^=@()\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF]+$/;
        const BREAK_CHARS = ',{}[]:.';
        let popup = null;
        let selectedIndex = -1;
        let currentMatches = [];
        let popupManualPosition = null;
        let popupPositionLock = null;
        let popupFixedHeight = 0;
        let currentCountOrder = 'desc';
        let ignoreOutsideUntil = 0;
        let isPopupActive = false;
        let isKeyboardNavigation = false;
        let apiAbortController = null;
        let requestSequence = 0;
        let lastKnownRange = null;
        let translations = new Map();
        let translationMeta = new Map();
        let tagCatalog = new Map();
        let translationsLoading = false;
        let translationsError = null;
        let remoteTranslationsAt = 0;
        const suggestionCache = new Map();
        let contextMenu = null;
        let lastQuery = '';
        let lastInput = null;
        let activeView = 'suggest';
        let lastSuggestionMatches = [];
        let lastSuggestionQuery = '';
        let lastSuggestionHint = null;
        let lastSuggestionInput = null;
        const STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        const CROSS_SVG = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
        const NAI_TAG_ALIASES = {
            'v': 'peace sign',
            'double_v': 'double peace',
            '|_|': 'bar eyes',
            '\\||/': 'open \\m/',
            ':|': 'neutral face',
            ';|': 'neutral face',
            '<|>_<|>': 'neco-arc eyes',
            'eyepatch_bikini': 'square bikini',
            'tachi-e': 'character image',
            'vivian_banshee': 'vivian (zenless zone zero)'
        };
        const NAI_ALIAS_REVERSE = {};
        for (const [original, nai] of Object.entries(NAI_TAG_ALIASES)) {
            const naiKey = nai.toLowerCase().replace(/\s+/g, '_');
            if (!NAI_ALIAS_REVERSE[naiKey]) NAI_ALIAS_REVERSE[naiKey] = [];
            NAI_ALIAS_REVERSE[naiKey].push(original);
        }
        GM_addStyle(`                .autocomplete-container {
                    position: absolute;
                    z-index: 100000;
                    width: min(700px, calc(100vw - 28px));
                    min-width: min(520px, calc(100vw - 28px));
                    max-height: min(650px, calc(100vh - 40px));
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid var(--nai-popup-border, #3d3f5c);
                    border-radius: 14px;
                    background: var(--nai-popup-bg, rgba(25, 26, 46, 0.98));
                    box-shadow: var(--nai-popup-shadow, 0 18px 48px rgba(0, 0, 0, 0.55));
                    font-family: var(--nai-popup-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif);
                    color: var(--nai-popup-text, #e8e8f2);
                    opacity: 0;
                    pointer-events: none;
                }
                .autocomplete-container.is-open {
                    opacity: 1;
                    pointer-events: auto;
                }
                .autocomplete-container,
                .autocomplete-container *,
                .autocomplete-container *,
                .tag-context-menu,
                .tag-context-menu * {
                    font-family: var(--nai-popup-font, inherit) !important;
                }
                .suggestion-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 13px;
                    border-bottom: 1px solid var(--nai-popup-border-soft, #2b2d46);
                    background: var(--nai-popup-surface, rgba(255, 255, 255, 0.03));
                    cursor: grab;
                    user-select: none;
                    touch-action: none;
                }
                .suggestion-header:active { cursor: grabbing; }
                .suggestion-header button { cursor: pointer; }
                .suggestion-tabs {
                    display: flex;
                    gap: 2px;
                    padding: 2px;
                    border: 1px solid var(--nai-popup-border-soft, #2b2d46);
                    border-radius: 8px;
                    background: var(--nai-popup-hint, #141527);
                }
                .suggestion-tab {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 8px;
                    border: 1px solid transparent;
                    border-radius: 6px;
                    background: transparent;
                    color: var(--nai-popup-muted, #8f92ad);
                    font-family: inherit;
                    font-size: 11px;
                    line-height: 1.4;
                    white-space: nowrap;
                    cursor: pointer;
                }
                .suggestion-tab:hover {
                    background: var(--nai-popup-hover, #262946);
                    color: var(--nai-popup-text, #f1f1fa);
                }
                .suggestion-tab.active {
                    border-color: var(--nai-popup-accent-border, #424563);
                    background: var(--nai-popup-accent-soft, rgba(227, 204, 120, 0.07));
                    color: var(--nai-popup-accent, #e3cc78);
                    font-weight: 600;
                    box-shadow: inset 0 -2px var(--nai-popup-accent, #e3cc78), 0 2px 8px rgba(0, 0, 0, 0.12);
                }
                .suggestion-tab-count {
                    min-width: 16px;
                    height: 16px;
                    padding: 0 4px;
                    border-radius: 999px;
                    background: var(--nai-popup-surface, #20223a);
                    color: var(--nai-popup-muted, #8f92ad);
                    font-size: 9px;
                    line-height: 16px;
                    text-align: center;
                }
                .suggestion-tab.active .suggestion-tab-count {
                    background: var(--nai-popup-accent, #e3cc78);
                    color: var(--nai-popup-accent-text, #17182b);
                }
                .suggestion-empty {
                    padding: 22px 16px;
                    color: var(--nai-popup-muted, #8f92ad);
                    font-size: 12px;
                    line-height: 1.8;
                    text-align: center;
                }
                .suggestion-title {
                    flex: none;
                    font-size: 14px;
                    font-weight: 700;
                    letter-spacing: 0.2px;
                    color: var(--nai-popup-text, #f3f2ff);
                }
                .suggestion-query {
                    max-width: 150px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    padding: 2px 8px;
                    border: 1px solid var(--nai-popup-accent-border, #424563);
                    border-radius: 999px;
                    background: var(--nai-popup-accent-soft, rgba(227, 204, 120, 0.07));
                    color: var(--nai-popup-accent, #e3cc78);
                    font-size: 11px;
                }
                .suggestion-spacer { flex: 1; }
                .suggestion-close {
                    width: 24px;
                    height: 24px;
                    flex: none;
                    display: grid;
                    place-items: center;
                    padding: 0;
                    border: 1px solid transparent;
                    border-radius: 6px;
                    background: transparent;
                    color: var(--nai-popup-muted, #8e91ab);
                    font-size: 18px;
                    line-height: 1;
                    cursor: pointer;
                }
                .suggestion-close:hover {
                    border-color: var(--nai-popup-border, #424563);
                    background: var(--nai-popup-hover, #262946);
                    color: var(--nai-popup-text, #fff);
                }
                .suggestion-hint {
                    padding: 7px 14px;
                    border-bottom: 1px solid var(--nai-popup-border-soft, #23253b);
                    background: var(--nai-popup-hint, #141527);
                    color: var(--nai-popup-muted, #8f92ad);
                    font-size: 11px;
                    line-height: 1.5;
                }
                .suggestion-hint.error {
                    color: var(--nai-popup-danger, #ff9d9d);
                    background: var(--nai-popup-danger-soft, rgba(255, 107, 107, 0.06));
                }
                .suggestion-scroll-wrapper {
                    flex: 1 1 auto;
                    min-height: 0;
                    padding: 7px;
                    overflow-y: auto;
                    max-height: 500px;
                    scrollbar-width: thin;
                    scrollbar-color: var(--nai-popup-scroll, #424563) transparent;
                }
                .suggestion-scroll-wrapper::-webkit-scrollbar { width: 8px; }
                .suggestion-scroll-wrapper::-webkit-scrollbar-thumb {
                    background: var(--nai-popup-scroll, #333651);
                    border: 2px solid transparent;
                    background-clip: padding-box;
                    border-radius: 999px;
                }
                .suggestion-list {
                    display: flex;
                    flex-wrap: wrap;
                    align-content: flex-start;
                    justify-content: flex-start;
                    gap: 4px;
                }
                .suggestion-list.is-empty {
                    display: flex;
                    min-height: 100%;
                }
                .suggestion-list.is-empty .suggestion-empty {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .suggestion-list.reverse-x { direction: rtl; justify-content: flex-end; }
                .suggestion-list.reverse-x .suggestion-item { direction: ltr; }
                .suggestion-list.single-item { direction: ltr; justify-content: flex-start; }
                .suggestion-item {
                    display: grid;
                    grid-template-columns: 12px minmax(0, 1fr) 30px;
                    align-items: center;
                    gap: 4px;
                    flex: 1 1 200px;
                    max-width: 320px;
                    min-height: 50px;
                    padding: 4px 8px;
                    border: 1px solid var(--nai-popup-border-soft, #2b2d46);
                    border-radius: 6px;
                    background: var(--nai-popup-surface, rgba(255, 255, 255, 0.03));
                    cursor: pointer;
                    white-space: normal;
                }
                .suggestion-item:hover,
                .suggestion-item.selected {
                    border-color: var(--nai-popup-border, #50547d);
                    background: var(--nai-popup-hover, #262946);
                }
                .suggestion-item.selected {
                    border-color: var(--nai-popup-accent, #e3cc78);
                    background: var(--nai-popup-selected, #30345a);
                    box-shadow: inset 4px 0 var(--nai-popup-accent, #e3cc78), 0 0 0 1px var(--nai-popup-accent, #e3cc78);
                }
                .suggestion-icon {
                    width: 12px;
                    height: 12px;
                    flex: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .suggestion-icon svg { width: 11px; height: 11px; }
                .suggestion-icon.fav-icon svg { fill: var(--nai-popup-accent, #ffd76a); }
                .suggestion-icon.excl-icon svg { fill: var(--nai-popup-danger, #ff7b7b); }
                .suggestion-content {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0;
                    text-align: center;
                }
                .suggestion-title-line {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 3px;
                    min-width: 0;
                    width: 100%;
                }
                .suggestion-en {
                    flex: 0 1 auto;
                    min-width: 0;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: var(--nai-popup-text, #f1f1fa);
                    font-size: 14px;
                    font-weight: 600;
                    letter-spacing: 0.1px;
                }
                .suggestion-item[data-category="0"] { --nai-tag-color: #0075f8; }
                .suggestion-item[data-category="1"] { --nai-tag-color: #f90000; }
                .suggestion-item[data-category="3"] { --nai-tag-color: #a800ff; }
                .suggestion-item[data-category="4"] { --nai-tag-color: #00a800; }
                .suggestion-item[data-category="5"] { --nai-tag-color: #ffa500; }
                .suggestion-item[data-category] .suggestion-en {
                    color: var(--nai-tag-color, var(--nai-popup-text, #f1f1fa));
                }
                .suggestion-category {
                    flex: none;
                    display: inline-flex;
                    align-items: center;
                    padding: 0 4px;
                    border: 1px solid var(--nai-popup-border, #3a3d58);
                    border-radius: 3px;
                    background: var(--nai-popup-hint, #141527);
                    color: var(--nai-popup-muted, #9da0bb);
                    font-size: 10px;
                    font-weight: 600;
                    line-height: 15px;
                    white-space: nowrap;
                }
                .suggestion-item[data-category] .suggestion-category {
                    color: var(--nai-tag-color, var(--nai-popup-muted, #9da0bb));
                    border-color: var(--nai-tag-color, var(--nai-popup-border, #3a3d58));
                }
                .suggestion-item[data-category="0"] .suggestion-category { background: rgba(0, 117, 248, 0.16); }
                .suggestion-item[data-category="1"] .suggestion-category { background: rgba(249, 0, 0, 0.14); }
                .suggestion-item[data-category="3"] .suggestion-category { background: rgba(168, 0, 255, 0.16); }
                .suggestion-item[data-category="4"] .suggestion-category { background: rgba(0, 168, 0, 0.16); }
                .suggestion-item[data-category="5"] .suggestion-category { background: rgba(255, 165, 0, 0.16); }
                .suggestion-zh {
                    width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    text-align: center;
                    color: var(--nai-popup-muted, #bcbdd4);
                    font-size: 12.5px;
                    line-height: 1.3;
                }
                .suggestion-zh.missing {
                    color: var(--nai-popup-muted-soft, #70738c);
                    font-style: italic;
                }
                .suggestion-alias {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: var(--nai-popup-accent, #d9c47a);
                    font-size: 10px;
                    line-height: 1.45;
                }
                .suggestion-alias b { color: var(--nai-popup-accent-strong, #f0dda0); font-weight: 600; }
                .suggestion-count {
                    flex: none;
                    margin-left: 2px;
                    color: var(--nai-popup-muted, #7f829c);
                    font-size: 11px;
                    font-variant-numeric: tabular-nums;
                    text-align: right;
                }
                .suggestion-alias { display: none; }
                .suggestion-footer {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 6px 12px;
                    padding: 8px 12px;
                    border-top: 1px solid var(--nai-popup-border-soft, #2b2d46);
                    background: var(--nai-popup-hint, #141527);
                    color: var(--nai-popup-muted, #7f829c);
                    font-size: 10px;
                    line-height: 1.5;
                }
                .suggestion-footer span {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    white-space: nowrap;
                }
                .suggestion-footer kbd {
                    display: inline-block;
                    min-width: 16px;
                    padding: 0 4px;
                    border: 1px solid var(--nai-popup-border, #3e415d);
                    border-bottom-width: 2px;
                    border-radius: 4px;
                    background: var(--nai-popup-surface, #20223a);
                    color: var(--nai-popup-text, #c9cbe0);
                    font-family: ui-monospace, Consolas, monospace;
                    font-size: 9px;
                    line-height: 15px;
                    text-align: center;
                }
                .tag-context-menu {
                    position: fixed;
                    z-index: 100001;
                    min-width: 112px;
                    padding: 3px;
                    border: 1px solid var(--nai-popup-border, #3d3f5c);
                    border-radius: 9px;
                    background: var(--nai-popup-bg, #1a1c30);
                    box-shadow: var(--nai-popup-shadow, 0 10px 28px rgba(0, 0, 0, 0.5));
                    color: var(--nai-popup-text, #e8e8f2);
                    font-family: var(--nai-popup-font, sans-serif);
                    opacity: 0;
                    pointer-events: none;
                }
                .tag-context-menu.is-open {
                    opacity: 1;
                    pointer-events: auto;
                }
                .tag-context-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 9px;
                    border-radius: 6px;
                    color: var(--nai-popup-text, #e8e8f2);
                    font-size: 12px;
                    cursor: pointer;
                }
                .tag-context-menu-item:hover { background: var(--nai-popup-hover, #2b2e4b); }
                .tag-context-menu-item svg { width: 12px; height: 12px; flex: none; }
                .tag-context-menu-item.fav-item svg { fill: var(--nai-popup-accent, #ffd76a); }
                .tag-context-menu-item.excl-item svg { fill: var(--nai-popup-danger, #ff7b7b); }
                @media (prefers-reduced-motion: reduce) {
                    .autocomplete-container,
                    .suggestion-tab,
                    .suggestion-close,
                    .suggestion-item,
                    .tag-context-menu,
                    .tag-context-menu-item {
                        transition: none !important;
                        animation: none !important;
                    }
                }
                @media (max-width: 520px) {
                    .autocomplete-container {
                        width: calc(100vw - 20px);
                        min-width: 0;
                    }
                    .suggestion-scroll-wrapper { max-height: 300px; }
                }
        `);
        const normalizeQuery = (query) => query.trim().replace(/\s+/g, '_');
        function hideContextMenu(immediate = false) {
            const menu = contextMenu;
            contextMenu = null;
            if (!menu) return;
            menu.remove();
        }
        function restorePromptSelection() {
            const input = lastInput || getActiveInputElement();
            if (!input) return;
            try { input.focus({ preventScroll: true }); } catch (_) { try { input.focus(); } catch (__) { } }
            if (!lastKnownRange) return;
            try {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(lastKnownRange);
            } catch (_) { }
        }

        function refreshPopupAfterFavoriteChange() {
            const rect = popup && popup.style.display !== 'none' ? popup.getBoundingClientRect() : null;
            if (!rect || !rect.width || !rect.height) {
                if (activeView === 'favorites') {
                    updatePopup(lastInput, getFavoriteItems(), null, '', 'favorites', currentCountOrder);
                } else if (activeView === 'excluded') {
                    updatePopup(lastInput, getExcludedItems(), null, '', 'excluded', currentCountOrder);
                } else if (lastQuery && lastInput && currentMatches.length > 0) {
                    updatePopup(lastInput, currentMatches, null, lastQuery, 'suggest', currentCountOrder);
                }
                return;
            }
            popupFixedHeight = Math.round(rect.height);
            popupPositionLock = {
                left: rect.left + window.scrollX,
                top: rect.top + window.scrollY,
                placement: popup.dataset.naiPlacement || 'above',
                side: popup.dataset.naiPopupSide || 'right',
            };
            try {
                if (activeView === 'favorites') {
                    updatePopup(lastInput, getFavoriteItems(), null, '', 'favorites', currentCountOrder);
                } else if (activeView === 'excluded') {
                    updatePopup(lastInput, getExcludedItems(), null, '', 'excluded', currentCountOrder);
                } else if (lastQuery && lastInput && currentMatches.length > 0) {
                    updatePopup(lastInput, currentMatches, null, lastQuery, 'suggest', currentCountOrder);
                }
            } finally {
                popupPositionLock = null;
            }
        }

        function showContextMenu(tagName, x, y) {
            hideContextMenu(true);
            contextMenu = document.createElement('div');
            contextMenu.className = 'tag-context-menu';
            const isFavorite = favoriteTags.has(tagName);
            const isExcluded = excludedTags.has(tagName);
            const favItem = document.createElement('div');
            favItem.className = 'tag-context-menu-item fav-item';
            favItem.innerHTML = `${STAR_SVG}<span>${isFavorite ? t('contextMenuRemoveFavorite') : t('contextMenuFavorite')}</span>`;
            favItem.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                ignoreOutsideUntil = performance.now() + 300;
                restorePromptSelection();
                toggleFavorite(tagName);
                hideContextMenu();
                refreshPopupAfterFavoriteChange();
            });
            const exclItem = document.createElement('div');
            exclItem.className = 'tag-context-menu-item excl-item';
            exclItem.innerHTML = `${CROSS_SVG}<span>${isExcluded ? t('contextMenuRemoveExclude') : t('contextMenuExclude')}</span>`;
            exclItem.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                ignoreOutsideUntil = performance.now() + 300;
                restorePromptSelection();
                toggleExcluded(tagName);
                hideContextMenu();
                refreshPopupAfterFavoriteChange();
            });
            contextMenu.appendChild(favItem);
            contextMenu.appendChild(exclItem);
            contextMenu.style.left = `${x}px`;
            contextMenu.style.top = `${y}px`;
            document.body.appendChild(contextMenu);
            contextMenu.classList.add('is-open');
        }
        function sortMatchesByPriority(matches, query, countOrder = 'desc') {
            const normalizedQuery = normalizeQuery(query.toLowerCase());
            return matches.sort((a, b) => {
                const aFav = favoriteTags.has(a.en);
                const bFav = favoriteTags.has(b.en);
                const aExcl = excludedTags.has(a.en);
                const bExcl = excludedTags.has(b.en);
                if (aFav && !bFav) return -1;
                if (!aFav && bFav) return 1;
                if (aExcl && !bExcl) return 1;
                if (!aExcl && bExcl) return -1;
                if (aFav && bFav) {
                    const aStart = a.en.toLowerCase().startsWith(normalizedQuery);
                    const bStart = b.en.toLowerCase().startsWith(normalizedQuery);
                    if (aStart && !bStart) return -1;
                    if (!aStart && bStart) return 1;
                }
                const delta = (Number(a.count) || 0) - (Number(b.count) || 0);
                return countOrder === 'asc' ? delta : -delta;
            });
        }
        function mergeMatchedFavorites(matches, query) {
            if (!favoriteTags.size) return matches;
            const queryLower = normalizeQuery(query).toLowerCase();
            if (queryLower.length < 3) return matches;
            const querySpaced = query.toLowerCase().trim().replace(/\s+/g, ' ');
            const matchNames = new Set(matches.map(m => m.en));
            const additionalFavorites = [];
            for (const favName of favoriteTags) {
                if (matchNames.has(favName)) continue;
                const enLower = favName.toLowerCase();
                const enSpaced = enLower.replace(/_/g, ' ');
                if (enLower.startsWith(queryLower) || enSpaced.startsWith(querySpaced) ||
                    enLower.includes(queryLower) || enSpaced.includes(querySpaced)) {
                    additionalFavorites.push({ en: favName, count: undefined, category: null });
                }
            }
            return [...additionalFavorites, ...matches];
        }
        function findNaiAliasMatches(query) {
            const queryLower = query.toLowerCase().trim();
            const queryNorm = queryLower.replace(/\s+/g, '_');
            const results = [];
            for (const [naiKey, originals] of Object.entries(NAI_ALIAS_REVERSE)) {
                const naiSpaced = naiKey.replace(/_/g, ' ');
                if (naiKey.startsWith(queryNorm) || naiSpaced.startsWith(queryLower) ||
                    naiKey.includes(queryNorm) || naiSpaced.includes(queryLower)) {
                    for (const original of originals) {
                        results.push({ en: original, count: undefined, category: null, isAliasMatch: true });
                    }
                }
            }
            for (const [original, nai] of Object.entries(NAI_TAG_ALIASES)) {
                const origLower = original.toLowerCase();
                const origSpaced = origLower.replace(/_/g, ' ');
                if (origLower.startsWith(queryNorm) || origSpaced.startsWith(queryLower) ||
                    origLower.includes(queryNorm) || origSpaced.includes(queryLower)) {
                    if (!results.some(r => r.en === original)) {
                        results.push({ en: original, count: undefined, category: null, isAliasMatch: true });
                    }
                }
            }
            return results;
        }
        function mergeNaiAliasMatches(matches, query) {
            const aliasMatches = findNaiAliasMatches(query);
            if (!aliasMatches.length) return matches;
            const matchNames = new Set(matches.map(m => m.en));
            const additional = aliasMatches.filter(a => !matchNames.has(a.en));
            return [...additional, ...matches];
        }
        function shouldSkipWeightSuggestions(textBeforeCursor, delimiterIndex) {
            if (delimiterIndex < 0 || textBeforeCursor[delimiterIndex] !== ':') return false;
            if (textBeforeCursor.substring(delimiterIndex - 1, delimiterIndex + 1) === '::') { return false; }
            let i = delimiterIndex - 1;
            if (i >= 0 && textBeforeCursor[i] === ':') {
                i--;
                while (i >= 0 && /\s/.test(textBeforeCursor[i])) i--;
                if (i >= 0 && /[\d.]/.test(textBeforeCursor[i])) {
                    let end = i;
                    while (i >= 0 && /[\d.]/.test(textBeforeCursor[i])) i--;
                    const numericPart = textBeforeCursor.substring(i + 1, end + 1);
                    if (numericPart && /^\d+(?:\.\d+)?$/.test(numericPart)) {
                        const precedingChar = i >= 0 ? textBeforeCursor[i] : '';
                        if (i < 0 || BREAK_CHARS.includes(precedingChar) || /\s/.test(precedingChar)) { return true; }
                    }
                }
                return false;
            }
            while (i >= 0 && /\s/.test(textBeforeCursor[i])) i--;
            if (i < 0) return false;
            let end = i;
            while (i >= 0 && /[\d.]/.test(textBeforeCursor[i])) i--;
            const numericPart = textBeforeCursor.substring(i + 1, end + 1);
            if (!numericPart || !/^\d+(?:\.\d+)?$/.test(numericPart)) return false;
            const precedingChar = i >= 0 ? textBeforeCursor[i] : '';
            if (i >= 0 && !BREAK_CHARS.includes(precedingChar) && !/\s/.test(precedingChar)) return false;
            return true;
        }
        function getClonedSelectionRange() {
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return null;
            return selection.getRangeAt(0).cloneRange();
        }
        function applyTranslationPairs(pairs) {
            const merged = new Map(translations);
            for (const [en, zh, category, count] of pairs) {
                if (!en || !zh) continue;
                merged.set(en, zh);
                if (category !== null && category !== undefined) {
                    translationMeta.set(en, { category: Number(category), count: Number(count) || undefined });
                }
            }
            translations = merged;
        }
        function parseCsvLine(line) {
            const fields = [];
            let current = '';
            let quoted = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (quoted) {
                    if (ch === '"') {
                        if (line[i + 1] === '"') { current += '"'; i++; }
                        else quoted = false;
                    } else {
                        current += ch;
                    }
                } else if (ch === '"') {
                    quoted = true;
                } else if (ch === ',') {
                    fields.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
            fields.push(current);
            return fields;
        }
        function pickTranslationLabel(tag, aliases, zh) {
            const hasChinese = (value) => /[\u3400-\u9fff]/.test(value);
            if (hasChinese(zh)) return zh;
            const chineseAlias = aliases.find(hasChinese);
            if (chineseAlias) return chineseAlias;
            const fallbackAlias = aliases.find((alias) => alias.length > 1 && !alias.startsWith('/'));
            return fallbackAlias || aliases[0] || zh || tag;
        }
        function parseTranslationCsv(text) {
            const pairs = [];
            const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
            for (const line of lines) {
                if (!line || line.startsWith('tag,')) continue;
                const fields = parseCsvLine(line);
                if (fields.length < 4) continue;
                const en = fields[0].trim();
                const aliases = fields[2].split('|').map((alias) => alias.trim()).filter(Boolean);
                const zh = fields[3].trim();
                const category = Number(fields[1]);
                const count = Number(fields[4]);
                if (en) {
                    tagCatalog.set(en, {
                        category: Number.isFinite(category) ? category : null,
                        count: Number.isFinite(count) ? count : undefined,
                    });
                }
                const label = pickTranslationLabel(en, aliases, zh);
                if (en && label && label !== en) {
                    pairs.push([
                        en,
                        label,
                        Number.isFinite(category) ? category : null,
                        Number.isFinite(count) ? count : undefined,
                    ]);
                }
            }
            return pairs;
        }
        function loadTranslations() {
            translations = new Map();
            translationMeta = new Map();
            tagCatalog = new Map();
            if (Array.isArray(NAI_BUNDLED_TAG_TRANSLATIONS)) {
                for (const [en, zh] of NAI_BUNDLED_TAG_TRANSLATIONS) {
                    if (en && zh) translations.set(en, zh);
                }
            } else if (typeof NAI_BUNDLED_TAG_TRANSLATIONS === 'string') {
                for (const line of NAI_BUNDLED_TAG_TRANSLATIONS.split('\n')) {
                    if (!line) continue;
                    const tab = line.indexOf('\t');
                    if (tab <= 0) continue;
                    const en = line.slice(0, tab).trim();
                    const zh = line.slice(tab + 1).trim();
                    if (en && zh) translations.set(en, zh);
                }
            }

            try {
                const cachedData = GM_getValue(CACHE_KEY);
                if (cachedData && Array.isArray(cachedData.translations)) {
                    for (const [en, zh] of cachedData.translations) {
                        if (!translations.has(en) && en && zh) translations.set(en, zh);
                    }
                }
            } catch (error) { }

            try {
                const cloudCache = GM_getValue(REMOTE_CACHE_KEY);
                if (cloudCache && Array.isArray(cloudCache.translations)) {
                    for (const [en, zh, category, count] of cloudCache.translations) {
                        if (!en || !zh) continue;
                        if (!translations.has(en)) translations.set(en, zh);
                        if (category !== null && category !== undefined) {
                            translationMeta.set(en, { category: Number(category), count: Number(count) || undefined });
                        }
                        if (!tagCatalog.has(en)) {
                            tagCatalog.set(en, {
                                category: category !== null && category !== undefined ? Number(category) : null,
                                count: Number(count) || undefined,
                            });
                        }
                    }
                    if (Array.isArray(cloudCache.catalog)) {
                        for (const [en, category, count] of cloudCache.catalog) {
                            if (en) tagCatalog.set(en, { category, count: Number(count) || undefined });
                        }
                    }
                    remoteTranslationsAt = Number(cloudCache.updatedAt) || 0;
                }
            } catch (error) { }
        }
        function gmFetchText(url) {
            return new Promise((resolve, reject) => {
                if (typeof GM_xmlhttpRequest !== 'function') {
                    fetch(url, { credentials: 'omit' })
                        .then((response) => response.ok ? response.text() : Promise.reject(new Error(`HTTP ${response.status}`)))
                        .then(resolve, reject);
                    return;
                }
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    timeout: 20000,
                    headers: { Accept: 'text/csv,text/plain,*/*' },
                    onload: (response) => {
                        if (response.status >= 200 && response.status < 300 && response.responseText) {
                            resolve(response.responseText);
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    },
                    onerror: () => reject(new Error('网络错误')),
                    ontimeout: () => reject(new Error('请求超时')),
                });
            });
        }
        async function loadRemoteDictionarySource(source) {
            let lastError = null;
            for (const url of source.urls) {
                try {
                    const text = await gmFetchText(url);
                    const pairs = parseTranslationCsv(text);
                    if (!pairs.length) throw new Error(`${source.name} 词库为空`);
                    return pairs;
                } catch (error) {
                    lastError = error;
                }
            }
            throw lastError || new Error(`${source.name} 加载失败`);
        }

        async function loadRemoteTranslations(force = false) {
            if (translationsLoading) return;
            const cacheFresh = remoteTranslationsAt && (Date.now() - remoteTranslationsAt < REMOTE_CACHE_TTL);
            const catalogReady = tagCatalog.size >= REMOTE_MIN_ENTRIES;
            if (!force && cacheFresh && translations.size >= REMOTE_MIN_ENTRIES && catalogReady) return;
            translationsLoading = true;
            translationsError = null;
            refreshTranslationView();

            let lastError = null;
            let totalPairs = 0;
            const sources = REMOTE_DICT_SOURCES.slice();

            try {
                const generalPairs = await loadRemoteDictionarySource(sources.shift());
                applyTranslationPairs(generalPairs);
                totalPairs += generalPairs.length;
                refreshTranslationView();
            } catch (error) {
                lastError = error;
            }

            const restResults = await Promise.allSettled(sources.map(loadRemoteDictionarySource));
            let restPairs = [];
            for (const result of restResults) {
                if (result.status === 'fulfilled') {
                    restPairs = restPairs.concat(result.value);
                    totalPairs += result.value.length;
                } else {
                    lastError = result.reason;
                }
            }
            if (restPairs.length) applyTranslationPairs(restPairs);

            if (totalPairs >= REMOTE_MIN_ENTRIES) {
                remoteTranslationsAt = Date.now();
                const writeCache = () => {
                    try {
                        GM_setValue(REMOTE_CACHE_KEY, {
                            updatedAt: remoteTranslationsAt,
                            translations: Array.from(translations.entries()).map(([en, zh]) => {
                                const meta = translationMeta.get(en);
                                return meta ? [en, zh, meta.category, meta.count] : [en, zh];
                            }),
                            catalog: Array.from(tagCatalog.entries()).map(([en, meta]) => [en, meta.category, meta.count]),
                        });
                    } catch (_) { }
                };
                if (typeof requestIdleCallback === 'function') {
                    requestIdleCallback(writeCache, { timeout: 1500 });
                } else {
                    setTimeout(writeCache, 0);
                }
                translationsLoading = false;
                translationsError = null;
            } else {
                translationsLoading = false;
                translationsError = lastError ? (lastError.message || String(lastError)) : '未知错误';
            }
            refreshTranslationView();
        }
        function getTranslationHint() {
            if (translationsLoading) {
                return isChineseLocale ? '正在从云端加载 Danbooru 中文词库…' : 'Loading Danbooru Chinese dictionary…';
            }
            if (translationsError) {
                return isChineseLocale
                    ? '云端中文词库加载失败；标签联想仍可用，中文翻译暂缺'
                    : 'Cloud Chinese dictionary failed; suggestions still work without translations';
            }
            return isChineseLocale ? '中文/别名来自 Danbooru 云端词库' : 'Chinese names and aliases from the Danbooru cloud dictionary';
        }
        function refreshTranslationView() {
            try { globalThis.__NAI_REFRESH_PROMPT_COLORS__?.(); } catch (_) { }
            if (!isPopupActive || !lastInput) return;
            if (activeView === 'favorites') {
                updatePopup(lastInput, getFavoriteItems(), null, '', 'favorites');
            } else if (activeView === 'excluded') {
                updatePopup(lastInput, getExcludedItems(), null, '', 'excluded');
            } else if (lastQuery && /[\u4e00-\u9fa5]/.test(lastQuery)) {
                searchLocalSuggestions(lastQuery, lastInput);
            } else if (lastQuery && currentMatches.length > 0) {
                updatePopup(lastInput, currentMatches, null, lastQuery, 'suggest');
            }
        }
        function openWikiPage(tagName) { if (!tagName) return; GM_openInTab(`${DANBOORU_API_URL}/wiki_pages/show_or_new?title=${tagName}`, { active: true }); }
        function searchLocalSuggestions(query, input) {
            if (!translations.size) return;
            const queryLower = query.toLowerCase();
            const rankedItems = [];
            for (const [en, zh] of translations.entries()) {
                const zhLower = zh.toLowerCase();
                let score = 0;
                if (zhLower.startsWith(queryLower)) score = 1;
                else if (zhLower.includes(queryLower)) score = 2;
                if (score > 0) {
                    const meta = translationMeta.get(en);
                    rankedItems.push({
                        score: score,
                        data: {
                            en: en,
                            count: meta ? meta.count : undefined,
                            category: meta ? meta.category : null,
                        },
                    });
                }
            }
            let finalMatches = rankedItems.sort((a, b) => (
                a.score - b.score || (Number(b.data.count) || 0) - (Number(a.data.count) || 0)
            )).map(item => item.data).slice(0, MAX_SUGGESTIONS);
            finalMatches = mergeMatchedFavorites(finalMatches, query);
            finalMatches = mergeNaiAliasMatches(finalMatches, query);
            updatePopup(input, finalMatches, null, query);
        }
        function searchLocalEnglish(query, input) {
            if (!tagCatalog.size && !translations.size) return false;
            const queryLower = query.toLowerCase().trim();
            const queryNorm = normalizeQuery(queryLower);
            const querySpaced = queryLower.replace(/\s+/g, ' ');
            if (!queryNorm) return false;
            const rankedItems = [];
            for (const en of (tagCatalog.size ? tagCatalog.keys() : translations.keys())) {
                const enLower = en.toLowerCase();
                const enNorm = normalizeQuery(enLower);
                const enSpaced = enLower.replace(/_/g, ' ');
                let score = -1;
                if (enNorm === queryNorm || enSpaced === querySpaced) score = 0;
                else if (enNorm.startsWith(queryNorm) || enSpaced.startsWith(querySpaced)) score = 1;
                else if (enNorm.includes(queryNorm) || enSpaced.includes(querySpaced)) score = 2;
                if (score < 0) continue;
                const meta = tagCatalog.get(en) || translationMeta.get(en);
                rankedItems.push({
                    score,
                    data: {
                        en,
                        count: meta ? meta.count : undefined,
                        category: meta ? meta.category : null,
                    },
                });
            }
            if (!rankedItems.length) return false;
            let matches = rankedItems.sort((a, b) => (
                a.score - b.score
                || (Number(b.data.count) || 0) - (Number(a.data.count) || 0)
                || a.data.en.length - b.data.en.length
            )).map((item) => item.data).slice(0, MAX_SUGGESTIONS);
            matches = mergeMatchedFavorites(matches, query);
            matches = mergeNaiAliasMatches(matches, query);
            updatePopup(input, matches, null, query);
            return true;
        }
        function parseGelbooruResponse(text) {
            const data = JSON.parse(text);
            if (!Array.isArray(data)) return [];
            const categoryMap = { tag: 0, artist: 1, copyright: 3, character: 4, metadata: 5 };
            return data
                .map((item) => ({
                    en: item.value || item.label || '',
                    count: Number(item.post_count) || undefined,
                    category: categoryMap[item.category] ?? 0,
                }))
                .filter((tag) => tag.en);
        }

        function parseDanbooruResponse(text) {
            const data = JSON.parse(text);
            if (!Array.isArray(data)) return [];
            return data
                .map((tag) => ({
                    en: tag.name,
                    count: tag.post_count,
                    category: tag.category,
                }))
                .filter((tag) => tag.en);
        }

        function requestTagSuggestions(query, input, options) {
            const { prefixOnly = false, onSuccess, onFailure } = options;
            const normalizedQuery = normalizeQuery(query);
            if (!normalizedQuery) { hidePopup(); return; }

            const cacheKey = `${prefixOnly ? 'prefix' : 'search'}:${normalizedQuery}`;
            const cached = suggestionCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < SUGGESTION_CACHE_TTL) {
                onSuccess(cached.matches);
                return;
            }

            if (apiAbortController) apiAbortController.abort();
            apiAbortController = new AbortController();
            const sequence = ++requestSequence;

            const searchPattern = prefixOnly || normalizedQuery.length <= SHORT_QUERY_PREFIX_LENGTH
                ? `${normalizedQuery}*`
                : `*${normalizedQuery}*`;

            const providers = [
                {
                    name: 'Danbooru',
                    url: `${DANBOORU_API_URL}/tags.json?${new URLSearchParams({
                        'search[name_matches]': searchPattern,
                        'search[order]': 'count',
                        limit: String(MAX_SUGGESTIONS),
                        'search[hide_empty]': 'true',
                    }).toString()}`,
                    referer: 'https://danbooru.donmai.us/',
                    parse: parseDanbooruResponse,
                },
                {
                    name: 'Gelbooru',
                    url: `${GELBOORU_API_URL}?${new URLSearchParams({
                        page: 'autocomplete2',
                        type: 'tag_query',
                        term: searchPattern,
                        limit: String(MAX_SUGGESTIONS),
                    }).toString()}`,
                    referer: 'https://gelbooru.com/',
                    parse: parseGelbooruResponse,
                },
            ];

            let settled = false;
            let failed = 0;
            let hedgeTimer = 0;
            const started = [false, false];

            const finishFailure = (index, reason) => {
                if (settled || sequence !== requestSequence) return;
                failed += 1;
                console.warn(`[NAI Prompt Helper] ${providers[index].name} ${reason}`);
                if (failed >= providers.length) {
                    settled = true;
                    clearTimeout(hedgeTimer);
                    onFailure();
                } else if (!started[index + 1]) {
                    startProvider(index + 1);
                }
            };

            const startProvider = (index) => {
                if (settled || sequence !== requestSequence || index >= providers.length || started[index]) return;
                started[index] = true;
                const provider = providers[index];
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: provider.url,
                    timeout: API_TIMEOUT_MS,
                    headers: {
                        'User-Agent': BROWSER_USER_AGENT,
                        'Referer': provider.referer,
                    },
                    onload: function (response) {
                        if (settled || sequence !== requestSequence) return;
                        if (response.status === 200) {
                            try {
                                const matches = provider.parse(response.responseText);
                                if (matches.length) {
                                    settled = true;
                                    clearTimeout(hedgeTimer);
                                    suggestionCache.set(cacheKey, { matches, timestamp: Date.now() });
                                    if (suggestionCache.size > SUGGESTION_CACHE_LIMIT) {
                                        suggestionCache.delete(suggestionCache.keys().next().value);
                                    }
                                    onSuccess(matches, provider.name);
                                    return;
                                }
                            } catch (error) {
                                console.warn(`[NAI Prompt Helper] ${provider.name} 返回内容解析失败:`, error);
                            }
                        }
                        finishFailure(index, `返回 HTTP ${response.status} 或空结果`);
                    },
                    ontimeout: function () {
                        finishFailure(index, '请求超时');
                    },
                    onerror: function () {
                        finishFailure(index, '请求失败');
                    },
                });
            };

            startProvider(0);
            hedgeTimer = setTimeout(() => {
                if (!settled) startProvider(1);
            }, 220);
        }

        function fetchSuggestions(query, input) {
            requestTagSuggestions(query, input, {
                onSuccess: function (matches) {
                    let finalMatches = mergeMatchedFavorites(matches, query);
                    finalMatches = mergeNaiAliasMatches(finalMatches, query);
                    updatePopup(input, finalMatches, null, query);
                },
                onFailure: function () {
                    if (!isPopupActive || !currentMatches.length) hidePopup();
                },
            });
        }

        function fetchEmoticonSuggestions(query, input) {
            const aliasMatches = findNaiAliasMatches(query);
            const normalizedQuery = normalizeQuery(query);
            if (!normalizedQuery) {
                if (aliasMatches.length > 0) {
                    updatePopup(input, aliasMatches, null, query);
                } else {
                    hidePopup();
                }
                return;
            }

            requestTagSuggestions(query, input, {
                prefixOnly: true,
                onSuccess: function (matches) {
                    const matchNames = new Set(matches.map((m) => m.en));
                    const uniqueAliases = aliasMatches.filter((a) => !matchNames.has(a.en));
                    let finalMatches = [...uniqueAliases, ...matches];
                    finalMatches = mergeMatchedFavorites(finalMatches, query);
                    if (finalMatches.length > 0) {
                        updatePopup(input, finalMatches, null, query);
                    } else {
                        hidePopup();
                    }
                },
                onFailure: function () {
                    if (aliasMatches.length > 0) {
                        updatePopup(input, aliasMatches, null, query);
                    } else {
                        hidePopup();
                    }
                },
            });
        }

        function parseCssColor(value) {
            if (!value || value === 'transparent') return null;
            const rgb = String(value).match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/i);
            if (rgb) {
                return {
                    r: Number(rgb[1]),
                    g: Number(rgb[2]),
                    b: Number(rgb[3]),
                    a: rgb[4] === undefined ? 1 : Number(rgb[4]),
                };
            }
            const hex = String(value).trim().match(/^#([0-9a-f]{3,8})$/i);
            if (!hex) return null;
            let raw = hex[1];
            if (raw.length === 3 || raw.length === 4) raw = raw.split('').map((ch) => ch + ch).join('');
            if (raw.length !== 6 && raw.length !== 8) return null;
            return {
                r: parseInt(raw.slice(0, 2), 16),
                g: parseInt(raw.slice(2, 4), 16),
                b: parseInt(raw.slice(4, 6), 16),
                a: raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1,
            };
        }

        function cssColor(color, alpha = color.a) {
            return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${Number(alpha.toFixed(3))})`;
        }

        function mixColors(a, b, amount) {
            const t = Math.max(0, Math.min(1, amount));
            return {
                r: a.r * (1 - t) + b.r * t,
                g: a.g * (1 - t) + b.g * t,
                b: a.b * (1 - t) + b.b * t,
                a: a.a * (1 - t) + b.a * t,
            };
        }

        function compositeColor(fg, bg) {
            if (fg.a >= 1) return { ...fg, a: 1 };
            return {
                r: fg.r * fg.a + bg.r * (1 - fg.a),
                g: fg.g * fg.a + bg.g * (1 - fg.a),
                b: fg.b * fg.a + bg.b * (1 - fg.a),
                a: 1,
            };
        }

        function relativeLuminance(color) {
            const channel = (value) => {
                const v = value / 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
        }

        function contrastRatio(a, b) {
            const l1 = relativeLuminance(a);
            const l2 = relativeLuminance(b);
            const light = Math.max(l1, l2);
            const dark = Math.min(l1, l2);
            return (light + 0.05) / (dark + 0.05);
        }

        function findComputedColor(selectors, property) {
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    const color = parseCssColor(getComputedStyle(element)[property]);
                    if (color && (property !== 'backgroundColor' || color.a > 0.01)) return color;
                }
            }
            return null;
        }

        function applyNovelAiPopupTheme(popup, requireAccent = false) {
            const fallbackPage = { r: 19, g: 21, b: 44, a: 1 };
            const pageBg = findComputedColor(['.image-gen-page', 'body'], 'backgroundColor') || fallbackPage;
            let panelBg = findComputedColor([
                '.image-gen-panel',
                '.image-gen-navbar',
                '[data-layout-panel="true"]',
            ], 'backgroundColor') || pageBg;
            panelBg = compositeColor(panelBg, pageBg);

            let text = findComputedColor(['.image-gen-panel', '.image-gen-page', 'body'], 'color') || { r: 255, g: 255, b: 255, a: 1 };
            text = compositeColor(text, panelBg);
            const isLight = relativeLuminance(panelBg) > 0.55;
            if (contrastRatio(text, panelBg) < 4.5) {
                text = isLight ? { r: 17, g: 19, b: 27, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
            }

            let accent = findComputedColor(['.image-gen-generate-button'], 'backgroundColor');
            const foundAccent = Boolean(accent && accent.a >= 0.1);
            if (!foundAccent) accent = text;
            accent = compositeColor(accent, panelBg);
            const usableAccent = foundAccent && contrastRatio(accent, panelBg) >= 1.35;
            if (!usableAccent) accent = text;
            if (requireAccent && !usableAccent) return false;

            let accentText = findComputedColor(['.image-gen-generate-button'], 'color')
                || (relativeLuminance(accent) > 0.55 ? { r: 17, g: 19, b: 27, a: 1 } : { r: 255, g: 255, b: 255, a: 1 });
            accentText = compositeColor(accentText, accent);
            if (contrastRatio(accentText, accent) < 3) {
                accentText = relativeLuminance(accent) > 0.55
                    ? { r: 17, g: 19, b: 27, a: 1 }
                    : { r: 255, g: 255, b: 255, a: 1 };
            }

            let border = findComputedColor(['.image-gen-panel', '[data-layout-panel="true"]'], 'borderRightColor');
            if (!border || border.a < 0.05) border = mixColors(panelBg, text, 0.2);
            border = compositeColor(border, panelBg);

            const muted = mixColors(text, panelBg, 0.58);
            const mutedSoft = mixColors(text, panelBg, 0.38);
            const surface = mixColors(panelBg, text, isLight ? 0.035 : 0.055);
            const hint = mixColors(panelBg, text, isLight ? 0.02 : 0.025);
            const hover = mixColors(panelBg, text, isLight ? 0.07 : 0.1);
            const selected = mixColors(panelBg, accent, isLight ? 0.18 : 0.26);
            const accentSoft = mixColors(panelBg, accent, 0.12);
            const accentBorder = mixColors(accent, border, 0.45);
            const borderSoft = mixColors(border, panelBg, 0.45);
            const scroll = mixColors(panelBg, text, 0.24);
            const danger = isLight ? { r: 178, g: 40, b: 48, a: 1 } : { r: 255, g: 132, b: 132, a: 1 };
            const findComputedFont = (selectors) => {
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (!element) continue;
                    const value = getComputedStyle(element).fontFamily;
                    if (value) return value;
                }
                return '';
            };
            const panelFont = findComputedFont([
                '.image-gen-panel',
                '.image-gen-main',
                '.image-gen-navbar',
                '[data-layout-panel="true"]',
                '[role="dialog"]',
            ]);
            const pageFont = findComputedFont(['.image-gen-page', 'body']);
            const font = panelFont || pageFont || 'system-ui, sans-serif';

            const variables = {
                '--nai-popup-bg': cssColor(panelBg, 0.97),
                '--nai-popup-surface': cssColor(surface, 1),
                '--nai-popup-hint': cssColor(hint, 1),
                '--nai-popup-text': cssColor(text, 1),
                '--nai-popup-muted': cssColor(muted, 1),
                '--nai-popup-muted-soft': cssColor(mutedSoft, 1),
                '--nai-popup-border': cssColor(border, 1),
                '--nai-popup-border-soft': cssColor(borderSoft, 1),
                '--nai-popup-accent': cssColor(accent, 1),
                '--nai-popup-accent-text': cssColor(accentText, 1),
                '--nai-popup-accent-soft': cssColor(accentSoft, 1),
                '--nai-popup-accent-border': cssColor(accentBorder, 1),
                '--nai-popup-accent-strong': cssColor(mixColors(accent, text, 0.28), 1),
                '--nai-popup-hover': cssColor(hover, 1),
                '--nai-popup-selected': cssColor(selected, 1),
                '--nai-popup-scroll': cssColor(scroll, 1),
                '--nai-popup-danger': cssColor(danger, 1),
                '--nai-popup-danger-soft': cssColor(danger, 0.08),
                '--nai-popup-shadow': isLight
                    ? '0 18px 48px rgba(0, 0, 0, 0.18)'
                    : '0 18px 48px rgba(0, 0, 0, 0.55)',
                '--nai-popup-font': font,
            };
            for (const [name, value] of Object.entries(variables)) {
                popup.style.setProperty(name, value);
                document.documentElement.style.setProperty(name, value);
            }
            popup.dataset.naiTheme = isLight ? 'light' : 'dark';
            return true;
        }
        try { globalThis.__NAIApplyPopupTheme = applyNovelAiPopupTheme; } catch (_) { }

        function escapeSuggestionHtml(value) {
            return String(value).replace(/[&<>"']/g, (char) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            }[char]));
        }

        function suggestionCategoryLabel(category) {
            const categoryId = Number(category) || 0;
            const labelsZh = { 0: '通用', 1: '画师', 3: '作品', 4: '角色', 5: '元数据' };
            const labelsEn = { 0: 'General', 1: 'Artist', 3: 'Series', 4: 'Character', 5: 'Meta' };
            return (isChineseLocale ? labelsZh : labelsEn)[categoryId] || (isChineseLocale ? '通用' : 'General');
        }

        function formatSuggestionCount(count) {
            if (count === undefined || count === null || !Number.isFinite(Number(count))) return '';
            const numeric = Number(count);
            if (numeric >= 1000000) {
                return `${(numeric / 1000000).toFixed(numeric >= 10000000 ? 0 : 1).replace(/\.0$/, '')}M`;
            }
            if (numeric >= 1000) {
                return `${(numeric / 1000).toFixed(numeric >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
            }
            return String(numeric);
        }

        function canonicalTagKey(value) {
            return String(value || '')
                .normalize('NFKC')
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .replace(/\\/g, '')
                .trim()
                .toLowerCase()
                .replace(/[\s_]+/g, '_');
        }
        function lookupKnownCategory(tagName) {
            const raw = String(tagName || '').trim();
            if (!raw) return null;
            const canonical = canonicalTagKey(raw);
            const candidates = new Set([
                raw,
                raw.toLowerCase(),
                raw.replace(/_/g, ' '),
                raw.replace(/_/g, ' ').toLowerCase(),
                canonical,
                canonical.replace(/_/g, ' '),
            ]);
            for (const key of candidates) {
                const meta = tagCatalog.get(key) || translationMeta.get(key);
                if (!meta || meta.category === null || meta.category === undefined) continue;
                const category = Number(meta.category);
                if (Number.isFinite(category)) return category;
            }
            return null;
        }

        const PromptCategoryColors = (() => {
            const ROOT_SELECTOR = [
                '.prompt-input-box-prompt',
                '.prompt-input-box-base-prompt',
                '.prompt-input-box-negative-prompt',
                '.prompt-input-box-undesired-content',
                '[class*="character-prompt-input"]',
                '[class*="prompt-input"]',
            ].join(',');
            const EDITABLE_SELECTOR = '[contenteditable="true"], [contenteditable="plaintext-only"], .ProseMirror';
            const CATEGORY_COLORS = {
                0: '#0075f8',
                1: '#f90000',
                3: '#a800ff',
                4: '#00a800',
                5: '#ffa500',
            };
            const page = (typeof unsafeWindow !== 'undefined' && unsafeWindow)
                || document.defaultView
                || window;
            const registry = page.CSS && page.CSS.highlights;
            const HighlightCtor = page.Highlight;
            let refreshTimer = null;

            const CATEGORY_CACHE_KEY = 'nai_prompt_category_cache_v1';
            const CATEGORY_CACHE_LIMIT = 3000;
            const categoryCache = new Map();
            const pendingCategoryTags = new Map();
            const failedCategoryTags = new Set();
            let categoryCacheLoaded = false;
            let categoryLookupTimer = null;
            let categoryLookupBusy = false;
            let categorySaveTimer = null;

            function loadCategoryCache() {
                if (categoryCacheLoaded) return;
                categoryCacheLoaded = true;
                try {
                    if (typeof GM_getValue !== 'function') return;
                    const saved = GM_getValue(CATEGORY_CACHE_KEY, {});
                    if (!saved || typeof saved !== 'object') return;
                    Object.keys(saved).forEach((key) => {
                        const value = Number(saved[key]);
                        if (Number.isInteger(value) && value >= -1 && value <= 5) {
                            categoryCache.set(key, value);
                        }
                    });
                } catch (_) { }
            }

            function persistCategoryCache() {
                if (typeof GM_setValue !== 'function') return;
                clearTimeout(categorySaveTimer);
                categorySaveTimer = setTimeout(() => {
                    categorySaveTimer = null;
                    const data = {};
                    for (const [key, value] of categoryCache) data[key] = value;
                    try { GM_setValue(CATEGORY_CACHE_KEY, data); } catch (_) { }
                }, 400);
            }

            function rememberCategory(tag, category) {
                const key = canonicalTagKey(tag);
                if (!key || !Number.isInteger(category) || category < -1 || category > 5) return;
                if (!categoryCache.has(key) && categoryCache.size >= CATEGORY_CACHE_LIMIT) {
                    const oldest = categoryCache.keys().next().value;
                    if (oldest !== undefined) categoryCache.delete(oldest);
                }
                categoryCache.set(key, category);
                persistCategoryCache();
            }

            function lookupCachedCategory(tag) {
                loadCategoryCache();
                const key = canonicalTagKey(tag);
                if (!key || !categoryCache.has(key)) return null;
                const category = categoryCache.get(key);
                return category === -1 ? null : category;
            }

            function parseDanbooruCategoryResponse(text, tag) {
                const list = JSON.parse(text);
                const item = Array.isArray(list) ? list[0] : null;
                if (!item) return null;
                const name = String(item.name || '').replace(/_/g, ' ');
                if (canonicalTagKey(name) !== canonicalTagKey(tag)) return null;
                const category = Number(item.category);
                return Number.isInteger(category) && category >= 0 && category <= 5 ? category : null;
            }

            function fetchCategory(tag) {
                const searchName = String(tag || '').trim().replace(/_/g, ' ').replace(/ /g, '_');
                if (!searchName) return Promise.resolve(undefined);
                const url = `${DANBOORU_API_URL}/tags.json?${new URLSearchParams({
                    'search[name]': searchName,
                    limit: '1',
                }).toString()}`;
                return new Promise((resolve) => {
                    if (typeof GM_xmlhttpRequest !== 'function') {
                        fetch(url, { credentials: 'omit', headers: { Accept: 'application/json' } })
                            .then((response) => response.ok ? response.text() : Promise.reject(new Error(`HTTP ${response.status}`)))
                            .then((text) => resolve(parseDanbooruCategoryResponse(text, tag)))
                            .catch(() => resolve(undefined));
                        return;
                    }
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url,
                        timeout: 12000,
                        headers: {
                            Accept: 'application/json',
                            'User-Agent': BROWSER_USER_AGENT,
                            Referer: 'https://danbooru.donmai.us/',
                        },
                        onload: (response) => {
                            if (response.status !== 200) {
                                resolve(undefined);
                                return;
                            }
                            try {
                                resolve(parseDanbooruCategoryResponse(response.responseText, tag));
                            } catch (_) {
                                resolve(undefined);
                            }
                        },
                        onerror: () => resolve(undefined),
                        ontimeout: () => resolve(undefined),
                    });
                });
            }

            function queueCategoryLookup(tag) {
                const clean = String(tag || '').trim();
                const key = canonicalTagKey(clean);
                if (!key || key.length < 2 || !/^[\x20-\x7E]+$/.test(clean)) return;
                loadCategoryCache();
                if (categoryCache.has(key) || pendingCategoryTags.has(key) || failedCategoryTags.has(key)) return;
                if (pendingCategoryTags.size >= 20) return;
                pendingCategoryTags.set(key, clean);
                clearTimeout(categoryLookupTimer);
                categoryLookupTimer = setTimeout(runCategoryLookup, 320);
            }

            async function runCategoryLookup() {
                categoryLookupTimer = null;
                if (translationsLoading) {
                    categoryLookupTimer = setTimeout(runCategoryLookup, 400);
                    return;
                }
                if (categoryLookupBusy || !pendingCategoryTags.size) return;
                categoryLookupBusy = true;
                const batch = Array.from(pendingCategoryTags.entries()).slice(0, 6);
                batch.forEach(([key]) => pendingCategoryTags.delete(key));
                for (const [key, tag] of batch) {
                    const category = await fetchCategory(tag);
                    if (category === undefined) failedCategoryTags.add(key);
                    else rememberCategory(key, category === null ? -1 : category);
                    schedule(true);
                    await new Promise((resolve) => setTimeout(resolve, 160));
                }
                categoryLookupBusy = false;
                if (pendingCategoryTags.size) {
                    categoryLookupTimer = setTimeout(runCategoryLookup, 360);
                }
            }

            function getRoots() {
                const roots = new Set();
                const add = (element) => {
                    if (element && element.matches && element.matches(EDITABLE_SELECTOR)) roots.add(element);
                };
                document.querySelectorAll(ROOT_SELECTOR).forEach((container) => {
                    add(container);
                    container.querySelectorAll(EDITABLE_SELECTOR).forEach(add);
                });
                document.querySelectorAll(EDITABLE_SELECTOR).forEach((element) => {
                    if (element.closest(ROOT_SELECTOR)) roots.add(element);
                });
                const list = Array.from(roots);
                return list.filter((root) => !list.some((other) => other !== root && root.contains(other)));
            }

            const BLOCK_TAGS = /^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DIV|DL|DT|DD|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|PRE|SECTION|TABLE|TBODY|TD|TFOOT|TH|THEAD|TR|UL)$/;
            const blockCache = new WeakMap();
            function isBlockElement(element) {
                if (!element || element.nodeType !== 1) return false;
                if (BLOCK_TAGS.test(element.tagName)) return true;
                if (blockCache.has(element)) return blockCache.get(element);
                let block = false;
                try {
                    block = /^(block|flex|grid|list-item|table|flow-root)$/.test(getComputedStyle(element).display);
                } catch (_) { }
                blockCache.set(element, block);
                return block;
            }

            function getTextSegments(root) {
                const segments = [];
                let nodes = [];
                let text = '';
                const flush = () => {
                    if (nodes.length) segments.push({ text, nodes });
                    nodes = [];
                    text = '';
                };
                const walk = (node) => {
                    if (node.nodeType === 3) {
                        const value = node.nodeValue || '';
                        if (!value) return;
                        const start = text.length;
                        text += value;
                        nodes.push({ node, start, end: text.length });
                        return;
                    }
                    if (node.nodeType !== 1) return;
                    if (node.tagName === 'BR') {
                        flush();
                        return;
                    }
                    const block = isBlockElement(node);
                    if (block) flush();
                    for (const child of node.childNodes) walk(child);
                    if (block) flush();
                };
                walk(root);
                flush();
                return segments;
            }

            function makeRange(nodes, start, end) {
                let startIndex = -1;
                for (let i = 0; i < nodes.length; i += 1) {
                    const item = nodes[i];
                    if (start >= item.start && start < item.end) {
                        startIndex = i;
                        break;
                    }
                }
                if (startIndex < 0) return null;

                let endIndex = -1;
                for (let i = startIndex; i < nodes.length; i += 1) {
                    const item = nodes[i];
                    if (end > item.start && end <= item.end) {
                        endIndex = i;
                        break;
                    }
                }
                if (endIndex < 0) {
                    for (let i = nodes.length - 1; i >= startIndex; i -= 1) {
                        const item = nodes[i];
                        if (item.end === end && item.end > item.start) {
                            endIndex = i;
                            break;
                        }
                    }
                }
                if (endIndex < startIndex) return null;

                const startItem = nodes[startIndex];
                const endItem = nodes[endIndex];
                const startOffset = Math.max(0, Math.min(start - startItem.start, startItem.node.nodeValue.length));
                const endOffset = Math.max(0, Math.min(end - endItem.start, endItem.node.nodeValue.length));
                if (startItem.node === endItem.node && startOffset >= endOffset) return null;
                const range = page.document.createRange();
                range.setStart(startItem.node, startOffset);
                range.setEnd(endItem.node, endOffset);
                return range;
            }

            function normalizePromptTag(value) {
                return String(value || '')
                    .replace(/[\u200B-\u200D\uFEFF]/g, '')
                    .replace(/\\/g, '')
                    .trim();
            }

            function unwrapPromptTag(value) {
                const pairs = { '(': ')', '[': ']', '{': '}' };
                if (value.length < 2) return null;
                return pairs[value[0]] === value[value.length - 1]
                    ? value.slice(1, -1)
                    : null;
            }

            function resolvePromptTag(text, start, end) {
                const full = normalizePromptTag(text.slice(start, end));
                const fullCategory = lookupKnownCategory(full) ?? lookupCachedCategory(full);
                if (fullCategory !== null) return { start, end, category: fullCategory, candidate: full };

                let left = start;
                let right = end;
                let numericWeight = false;
                let colorStart = start;
                let colorEnd = end;
                const trimBounds = () => {
                    while (left < right && /\s/.test(text[left])) left += 1;
                    while (right > left && /\s/.test(text[right - 1])) right -= 1;
                };

                trimBounds();
                for (let guard = 0; guard < 8; guard += 1) {
                    trimBounds();
                    const body = text.slice(left, right);
                    const leadWeight = body.match(/^-?\d+(?:\.\d+)?::\s*/);
                    if (leadWeight) {
                        left += leadWeight[0].length;
                        numericWeight = true;
                        colorStart = left;
                        continue;
                    }
                    const tailWeight = body.match(/\s*::$/);
                    if (tailWeight) {
                        right -= 2;
                        numericWeight = true;
                        colorEnd = right;
                        continue;
                    }
                    break;
                }

                for (let guard = 0; guard < 8; guard += 1) {
                    trimBounds();

                    const body = text.slice(left, right);
                    const inner = unwrapPromptTag(body);
                    if (inner !== null) {
                        left += 1;
                        right -= 1;
                        continue;
                    }

                    const weighted = body.match(/^(.*?)(?::\s*-?\d+(?:\.\d+)?)$/);
                    if (weighted) {
                        right = left + weighted[1].length;
                        continue;
                    }

                    const pipe = body.indexOf('|');
                    if (pipe >= 0) {
                        right = left + pipe;
                        continue;
                    }
                    break;
                }

                trimBounds();

                let candidate = normalizePromptTag(text.slice(left, right));
                let lookupName = candidate;
                let prefixCategory = null;
                const categoryPrefix = candidate.match(/^((artist|copyright|character|meta)\s*:\s*)/i);
                if (categoryPrefix) {
                    lookupName = candidate.slice(categoryPrefix[1].length);
                    colorStart = left + categoryPrefix[1].length;
                    colorEnd = right;
                    prefixCategory = {
                        artist: 1,
                        copyright: 3,
                        character: 4,
                        meta: 5,
                    }[categoryPrefix[2].toLowerCase()] ?? null;
                } else if (!numericWeight) {
                    colorStart = start;
                    colorEnd = end;
                }

                const category = prefixCategory
                    ?? lookupKnownCategory(candidate)
                    ?? lookupCachedCategory(candidate)
                    ?? (lookupName !== candidate
                        ? (lookupKnownCategory(lookupName) ?? lookupCachedCategory(lookupName))
                        : null);
                return {
                    start: colorStart,
                    end: colorEnd,
                    category,
                    candidate: lookupName,
                };
            }

            function collectRanges() {
                const buckets = new Map();
                const unknownTags = [];
                for (const root of getRoots()) {
                    for (const { text, nodes } of getTextSegments(root)) {
                        if (!text || !nodes.length) continue;
                        let index = 0;
                        while (index < text.length) {
                            const separator = text.slice(index).search(/[,;\r\n]/);
                            const segmentEnd = separator === -1 ? text.length : index + separator;
                            const segment = text.slice(index, segmentEnd);
                            const start = index + (segment.match(/^\s*/)[0] || '').length;
                            const end = segmentEnd - (segment.match(/\s*$/)[0] || '').length;

                            if (end > start) {
                                const resolved = resolvePromptTag(text, start, end);
                                if (resolved && CATEGORY_COLORS[resolved.category]) {
                                    const range = makeRange(nodes, resolved.start, resolved.end);
                                    if (range) {
                                        if (!buckets.has(resolved.category)) buckets.set(resolved.category, []);
                                        buckets.get(resolved.category).push(range);
                                    }
                                } else if (resolved && resolved.candidate) {
                                    unknownTags.push(resolved.candidate);
                                }
                            }
                            index = separator === -1 ? text.length : segmentEnd + 1;
                        }
                    }
                }
                unknownTags.forEach(queueCategoryLookup);
                return buckets;
            }

            function apply() {
                if (!registry || typeof HighlightCtor !== 'function') return;
                let buckets;
                try {
                    buckets = collectRanges();
                } catch (_) {
                    return;
                }
                Object.keys(CATEGORY_COLORS).forEach((category) => {
                    const name = `nai-tag-${category}`;
                    const ranges = buckets.get(Number(category));
                    if (ranges && ranges.length) {
                        try {
                            registry.set(name, new HighlightCtor(...ranges));
                        } catch (_) { }
                    } else {
                        try { registry.delete(name); } catch (_) { }
                    }
                });
            }

            function schedule(immediate = false) {
                if (!registry || typeof HighlightCtor !== 'function') return;
                if (refreshTimer) {
                    clearTimeout(refreshTimer);
                    refreshTimer = null;
                }
                if (immediate) {
                    apply();
                    return;
                }
                refreshTimer = setTimeout(() => {
                    refreshTimer = null;
                    apply();
                }, 70);
            }

            function mutationTouchesPrompt(mutations) {
                for (const mutation of mutations) {
                    const target = mutation.target.nodeType === 1
                        ? mutation.target
                        : mutation.target.parentElement;
                    if (target && target.closest && target.closest(ROOT_SELECTOR)) return true;
                    if (mutation.type !== 'childList') continue;
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType !== 1) continue;
                        if (node.matches(ROOT_SELECTOR) || node.querySelector(ROOT_SELECTOR)) return true;
                    }
                }
                return false;
            }

            function init() {
                if (!registry || typeof HighlightCtor !== 'function') return;
                loadCategoryCache();
                const style = Object.entries(CATEGORY_COLORS)
                    .map(([category, color]) => `::highlight(nai-tag-${category}) { color: ${color}; -webkit-text-fill-color: ${color}; }`)
                    .join('\n');
                GM_addStyle(style);
                document.addEventListener('input', (event) => {
                    const target = event.target;
                    if (target && target.closest && target.closest(ROOT_SELECTOR)) schedule(true);
                }, true);
                document.addEventListener('focusin', (event) => {
                    const target = event.target;
                    if (target && target.closest && target.closest(ROOT_SELECTOR)) schedule(true);
                }, true);
                const observer = new MutationObserver((mutations) => {
                    if (mutationTouchesPrompt(mutations)) schedule(true);
                });
                observer.observe(document.body || document.documentElement, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
                globalThis.__NAI_REFRESH_PROMPT_COLORS__ = schedule;
                schedule();
            }

            return { init, schedule };
        })();

        function getFavoriteItems() {
            return Array.from(favoriteTags)
                .sort((a, b) => a.localeCompare(b, 'en'))
                .map((tag) => ({
                    en: tag,
                    insertName: NAI_TAG_ALIASES[tag] || tag,
                    category: lookupKnownCategory(tag),
                    count: undefined,
                }));
        }

        function getFavoriteHint() {
            return isChineseLocale
                ? '点击插入收藏 · 右键可取消收藏'
                : 'Click to insert · right-click to remove favorite';
        }

        function getExcludedItems() {
            return Array.from(excludedTags)
                .sort((a, b) => a.localeCompare(b, 'en'))
                .map((tag) => ({
                    en: tag,
                    insertName: NAI_TAG_ALIASES[tag] || tag,
                    category: lookupKnownCategory(tag),
                    count: undefined,
                }));
        }

        function getExcludedHint() {
            return isChineseLocale
                ? '点击恢复这个 Tag · 右键也可取消排除'
                : 'Click to restore this tag · right-click to un-exclude';
        }

        function updatePopup(input, matches, overrideHint = null, query = '', view = 'suggest', countOrder = 'desc') {
            createPopup();
            applyNovelAiPopupTheme(popup);
            hideContextMenu(true);
            lastInput = input;
            lastQuery = query;
            activeView = view;
            currentCountOrder = countOrder;

            if (view === 'suggest') {
                lastSuggestionMatches = matches.slice();
                lastSuggestionQuery = query;
                lastSuggestionHint = overrideHint;
                lastSuggestionInput = input;
                if (query) {
                    matches = sortMatchesByPriority([...matches], query, countOrder);
                }
            }

            const hintHTML = overrideHint
                ? `<div class="suggestion-hint error">${escapeSuggestionHtml(overrideHint)}</div>`
                : `<div class="suggestion-hint">${escapeSuggestionHtml(
                    view === 'favorites' ? getFavoriteHint()
                        : view === 'excluded' ? getExcludedHint()
                            : getTranslationHint()
                )}</div>`;
            const queryHTML = query
                ? `<span class="suggestion-query">${escapeSuggestionHtml(query)}</span>`
                : '';
            const footerInsert = isChineseLocale ? '插入' : 'Insert';
            const footerSelect = isChineseLocale ? '选择' : 'Select';
            const footerClose = isChineseLocale ? '关闭' : 'Close';
            const footerContext = view === 'favorites'
                ? (isChineseLocale ? '右键取消收藏' : 'Right-click to remove favorite')
                : view === 'excluded'
                    ? (isChineseLocale ? '点击恢复 / 右键取消排除' : 'Click to restore / right-click to un-exclude')
                    : (isChineseLocale ? '右键收藏 / 排除' : 'Right-click to favorite / exclude');
            const favoritesLabel = isChineseLocale ? '收藏' : 'Favorites';
            const excludedLabel = isChineseLocale ? '已排除' : 'Excluded';

            popup.innerHTML = `<div class="suggestion-header">
                <div class="suggestion-tabs">
                    <button class="suggestion-tab ${view === 'suggest' ? 'active' : ''}" type="button" data-view="suggest">${escapeSuggestionHtml(t('infoTitle'))}</button>
                    <button class="suggestion-tab ${view === 'favorites' ? 'active' : ''}" type="button" data-view="favorites">★ ${favoritesLabel}<span class="suggestion-tab-count">${favoriteTags.size}</span></button>
                    <button class="suggestion-tab ${view === 'excluded' ? 'active' : ''}" type="button" data-view="excluded">⊘ ${excludedLabel}<span class="suggestion-tab-count">${excludedTags.size}</span></button>
                </div>
                ${queryHTML}
                <span class="suggestion-spacer"></span>
                <button class="suggestion-close" type="button" aria-label="${footerClose}">×</button>
            </div>
            ${hintHTML}
            <div class="suggestion-scroll-wrapper"><div class="suggestion-list"></div></div>
            <div class="suggestion-footer">
                <span><kbd>Tab</kbd><kbd>Enter</kbd>${footerInsert}</span>
                <span><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd>${footerSelect}</span>
                <span><kbd>Esc</kbd>${footerClose}</span>
                <span>${footerContext}</span>
            </div>`;

            if (popupFixedHeight > 0) {
                popup.style.height = `${popupFixedHeight}px`;
            } else {
                popup.style.height = '';
            }

            const flexContainer = popup.querySelector('.suggestion-list');
            flexContainer.classList.remove('is-empty');
            flexContainer.classList.toggle('single-item', matches.length === 1);
            const closeButton = popup.querySelector('.suggestion-close');
            if (closeButton) {
                closeButton.addEventListener('mousedown', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    hidePopup();
                });
            }

            const dragHeader = popup.querySelector('.suggestion-header');
            if (dragHeader) {
                let drag = null;
                dragHeader.addEventListener('pointerdown', (event) => {
                    if (event.button !== 0 || event.target.closest('button, input, textarea, select')) return;
                    const rect = popup.getBoundingClientRect();
                    drag = {
                        dx: event.clientX - rect.left,
                        dy: event.clientY - rect.top,
                        pointerId: event.pointerId,
                    };
                    popupManualPosition = {
                        left: rect.left + window.scrollX,
                        top: rect.top + window.scrollY,
                    };
                    dragHeader.style.cursor = 'grabbing';
                    try { dragHeader.setPointerCapture(event.pointerId); } catch (_) { }
                    event.preventDefault();
                });
                dragHeader.addEventListener('pointermove', (event) => {
                    if (!drag || event.pointerId !== drag.pointerId) return;
                    const maxLeft = window.scrollX + innerWidth - 120;
                    const maxTop = window.scrollY + innerHeight - 60;
                    const left = Math.max(window.scrollX + 6, Math.min(maxLeft, event.clientX + window.scrollX - drag.dx));
                    const top = Math.max(window.scrollY + 6, Math.min(maxTop, event.clientY + window.scrollY - drag.dy));
                    popupManualPosition = { left, top };
                    popup.style.left = `${left}px`;
                    popup.style.top = `${top}px`;
                });
                const endDrag = (event) => {
                    if (!drag || (event && event.pointerId !== drag.pointerId)) return;
                    drag = null;
                    dragHeader.style.cursor = 'grab';
                    try { dragHeader.releasePointerCapture(event.pointerId); } catch (_) { }
                };
                dragHeader.addEventListener('pointerup', endDrag);
                dragHeader.addEventListener('pointercancel', endDrag);
            }

            popup.querySelectorAll('.suggestion-tab').forEach((tab) => {
                tab.addEventListener('mousedown', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (popup.offsetHeight) popupFixedHeight = popup.offsetHeight;
                    if (tab.dataset.view === 'favorites') {
                        updatePopup(input, getFavoriteItems(), null, '', 'favorites');
                    } else if (tab.dataset.view === 'excluded') {
                        updatePopup(input, getExcludedItems(), null, '', 'excluded');
                    } else if (lastSuggestionMatches.length || lastSuggestionQuery) {
                        updatePopup(lastSuggestionInput || input, lastSuggestionMatches, lastSuggestionHint, lastSuggestionQuery, 'suggest');
                    } else {
                        hidePopup();
                    }
                });
            });

            currentMatches = matches;
            if (matches.length === 0) {
                if (view === 'favorites') {
                    flexContainer.innerHTML = `<div class="suggestion-empty">${isChineseLocale ? '还没有收藏的 Tag。<br>在候选列表上右键即可收藏。' : 'No favorite tags yet.<br>Right-click a suggestion to favorite it.'}</div>`;
                    flexContainer.classList.add('is-empty');
                    showPopupAnimated();
                    positionPopup(input);
                    isPopupActive = true;
                    selectedIndex = -1;
                    return;
                }
                if (view === 'excluded') {
                    flexContainer.innerHTML = `<div class="suggestion-empty">${isChineseLocale ? '没有被排除的 Tag。<br>在候选列表上右键即可排除。' : 'No excluded tags.<br>Right-click a suggestion to exclude it.'}</div>`;
                    flexContainer.classList.add('is-empty');
                    showPopupAnimated();
                    positionPopup(input);
                    isPopupActive = true;
                    selectedIndex = -1;
                    return;
                }
                hidePopup();
                return;
            }

            matches.forEach((tag, index) => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                if (tag.category !== null && tag.category !== undefined && Number.isFinite(Number(tag.category))) {
                    item.dataset.category = String(Number(tag.category));
                }
                const naiAlias = NAI_TAG_ALIASES[tag.en];
                const enText = escapeSuggestionHtml(tag.en.replace(/_/g, ' '));
                const zhText = translations.get(tag.en);
                const zhDisplay = zhText
                    ? escapeSuggestionHtml(zhText)
                    : (isChineseLocale ? '暂无翻译' : 'No translation yet');
                tag.insertName = naiAlias || tag.en;
                const aliasLine = naiAlias
                    ? `<div class="suggestion-alias">${isChineseLocale ? '插入为' : 'Insert as'} <b>${escapeSuggestionHtml(naiAlias.replace(/_/g, ' '))}</b></div>`
                    : '';
                const countText = formatSuggestionCount(tag.count);
                const countHTML = countText ? `<span class="suggestion-count">${countText}</span>` : '';
                let iconHTML = '<span class="suggestion-icon"></span>';
                if (view === 'favorites' || favoriteTags.has(tag.en)) {
                    iconHTML = `<span class="suggestion-icon fav-icon">${STAR_SVG}</span>`;
                } else if (excludedTags.has(tag.en)) {
                    iconHTML = `<span class="suggestion-icon excl-icon">${CROSS_SVG}</span>`;
                }
                const categoryHTML = tag.category === null || tag.category === undefined
                    ? ''
                    : `<span class="suggestion-category">${escapeSuggestionHtml(suggestionCategoryLabel(tag.category))}</span>`;
                item.innerHTML = `${iconHTML}<div class="suggestion-content">
                    <div class="suggestion-title-line">
                        ${categoryHTML}
                        <span class="suggestion-en">${enText}</span>
                    </div>
                    <div class="suggestion-zh${zhText ? '' : ' missing'}">${zhDisplay}</div>
                    ${aliasLine}
                </div>${countHTML}`;
                item.title = `${tag.en}${zhText ? ` — ${zhText}` : ''}${naiAlias ? ` · ${isChineseLocale ? '插入为' : 'Insert as'} ${naiAlias.replace(/_/g, ' ')}` : ''}`;
                item.addEventListener('mouseover', () => {
                    isKeyboardNavigation = false;
                    if (selectedIndex !== index) { selectedIndex = index; updateSelectionUI(); }
                });
                item.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    e.stopPropagation();
                    selectedIndex = index;
                    updateSelectionUI();
                    const pressedItem = e.currentTarget;
                    if (view === 'excluded') {
                        pressSuggestionItem(pressedItem, () => {
                            ignoreOutsideUntil = performance.now() + 300;
                            requestAnimationFrame(() => {
                                toggleExcluded(tag.en);
                                updatePopup(lastInput || input, getExcludedItems(), null, '', 'excluded');
                            });
                        });
                    } else if (e.ctrlKey && view !== 'favorites') { openWikiPage(tag.en); }
                    else {
                        const currentInput = getActiveInputElement();
                        if (currentInput) {
                            const rangeToRestore = lastKnownRange ? lastKnownRange.cloneRange() : getClonedSelectionRange();
                            pressSuggestionItem(pressedItem, () => {
                                if (!popup || !popup.classList.contains('is-open')) return;
                                currentInput.focus();
                                requestAnimationFrame(() => insertTag(currentInput, tag.insertName, rangeToRestore));
                            });
                        }
                    }
                });
                item.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentInput = getActiveInputElement();
                    if (currentInput) {
                        const range = getClonedSelectionRange();
                        if (range && currentInput.contains(range.commonAncestorContainer)) {
                            lastKnownRange = range;
                        }
                    }
                    showContextMenu(tag.en, e.clientX, e.clientY);
                });
                flexContainer.appendChild(item);
            });
            showPopupAnimated();
            const placement = positionPopup(input);
            if (view === 'suggest' && query && placement) {
                const neededOrder = placement === 'above' ? 'asc' : 'desc';
                if (neededOrder !== countOrder) {
                    updatePopup(input, matches, overrideHint, query, view, neededOrder);
                    return;
                }
                const onRight = popup.dataset.naiPopupSide === 'right';
                const reverseX = placement === 'above' ? onRight : !onRight;
                flexContainer.classList.toggle('reverse-x', reverseX);
            }
            isPopupActive = true;
            selectedIndex = placement === 'above' ? Math.max(0, matches.length - 1) : 0;
            updateSelectionUI();
        }

        function findNodeAndOffsetFromGlobal(root, globalOffset) {
            const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
            let accumulatedLength = 0;
            let lastTextNode = null;
            let currentNode;
            while (currentNode = treeWalker.nextNode()) {
                lastTextNode = currentNode;
                const nodeLength = currentNode.textContent.length;
                if (accumulatedLength + nodeLength >= globalOffset) {
                    return { node: currentNode, offset: globalOffset - accumulatedLength };
                }
                accumulatedLength += nodeLength;
            }
            if (lastTextNode) {
                return { node: lastTextNode, offset: lastTextNode.textContent.length };
            }
            return { node: root, offset: 0 };
        }

        function insertTag(input, tag, rangeToRestore) {
            const cleanTag = tag.replace(/_/g, ' ');
            const workingRange = rangeToRestore ? rangeToRestore.cloneRange() : getClonedSelectionRange();
            if (!workingRange) return;

            const tempRange = document.createRange();
            tempRange.setStart(input, 0);
            tempRange.setEnd(workingRange.startContainer, workingRange.startOffset);
            const globalCursorPos = tempRange.toString().length;
            const fullText = input.textContent;

            if (autoFormatEnabled) {

                let start = globalCursorPos;
                while (start > 0 && !BREAK_CHARS.includes(fullText[start - 1])) { start--; }
                let end = globalCursorPos;
                while (end < fullText.length && !BREAK_CHARS.includes(fullText[end])) { end++; }

                let textBefore = fullText.substring(0, start);
                const textAfter = fullText.substring(end);

                if (cleanTag.length > 0 && BREAK_CHARS.includes(cleanTag[0])) {
                    for (let overlap = Math.min(textBefore.length, cleanTag.length); overlap > 0; overlap--) {
                        if (textBefore.endsWith(cleanTag.substring(0, overlap))) {
                            textBefore = textBefore.substring(0, textBefore.length - overlap);
                            break;
                        }
                    }
                }

                const newFullText = textBefore + cleanTag + textAfter;

                let formattedText = formatPromptText(newFullText);
                formattedText = formattedText.trim();

                if (formattedText.length > 0 && !formattedText.endsWith(',')) {
                    formattedText += ', ';
                } else if (formattedText.endsWith(',')) {
                    formattedText += ' ';
                }

                let countBefore = 0;
                let searchPos = 0;
                while ((searchPos = textBefore.indexOf(cleanTag, searchPos)) !== -1) {
                    const charBefore = searchPos > 0 ? textBefore[searchPos - 1] : ',';
                    const charAfter = searchPos + cleanTag.length < textBefore.length ? textBefore[searchPos + cleanTag.length] : ',';
                    if ((BREAK_CHARS.includes(charBefore) || /\s/.test(charBefore)) &&
                        (BREAK_CHARS.includes(charAfter) || /\s/.test(charAfter))) {
                        countBefore++;
                    }
                    searchPos += cleanTag.length;
                }

                let newCursorPos = -1;
                let foundIndex = -1;
                searchPos = 0;
                for (let i = 0; i <= countBefore; i++) {
                    foundIndex = formattedText.indexOf(cleanTag, searchPos);
                    if (foundIndex === -1) break;
                    searchPos = foundIndex + cleanTag.length;
                }

                if (foundIndex !== -1) {
                    newCursorPos = foundIndex + cleanTag.length + 2;
                } else {
                    newCursorPos = start + cleanTag.length + 2;
                }

                if (newCursorPos >= 2 && formattedText.substring(newCursorPos - 2, newCursorPos) === '::') {
                    newCursorPos -= 2;
                }

                newCursorPos = Math.min(newCursorPos, formattedText.length);
                WeightShortcuts.updateInputContent(input, formattedText, newCursorPos, newCursorPos);

            } else {
                try {
                    if (!input.contains(workingRange.startContainer)) return;

                    let start = globalCursorPos;
                    while (start > 0 && !BREAK_CHARS.includes(fullText[start - 1])) { start--; }
                    let end = globalCursorPos;
                    while (end < fullText.length && !BREAK_CHARS.includes(fullText[end])) { end++; }

                    const { node: startNode, offset: startOffset } = findNodeAndOffsetFromGlobal(input, start);
                    const { node: endNode, offset: endOffset } = findNodeAndOffsetFromGlobal(input, end);

                    const replacementRange = document.createRange();
                    replacementRange.setStart(startNode, startOffset);
                    replacementRange.setEnd(endNode, endOffset);

                    replacementRange.deleteContents();

                    let textToInsert = cleanTag;
                    const textBefore = fullText.substring(0, start).trimEnd();
                    let prefix = '';
                    if (textBefore.length > 0) {
                        if (textBefore.endsWith(',')) {
                            prefix = ' ';
                        } else {
                            prefix = ', ';
                        }
                    }
                    textToInsert = prefix + textToInsert + ', ';

                    const newTextNode = document.createTextNode(textToInsert);
                    replacementRange.insertNode(newTextNode);

                    replacementRange.setStartAfter(newTextNode);
                    replacementRange.collapse(true);

                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(replacementRange);

                    const inputEvent = new Event('input', { bubbles: true, composed: true });
                    input.dispatchEvent(inputEvent);
                } catch (error) {
                    console.error("[NAI Prompt Helper] An error occurred during surgical insertTag:", error);
                }
            }

            window.__NAIWeightAdjustingUntil = Date.now() + 500;
            hidePopup();
        }
        function createPopup() { if (!popup) { popup = document.createElement('div'); popup.className = 'autocomplete-container'; document.body.appendChild(popup); } }
        function pressSuggestionItem(item, after) {
            after();
        }
        function showPopupAnimated() {
            if (!popup) return;
            popup.classList.remove('is-closing');
            popup.style.pointerEvents = '';
            popup.classList.add('is-open');
            popup.style.display = 'flex';
        }
        function hidePopup(immediate = false) {
            requestSequence++;
            popupManualPosition = null;
            popupFixedHeight = 0;
            if (popup) {
                popup.classList.remove('is-open', 'is-closing');
                popup.style.display = 'none';
                popup.style.height = '';
                popup.style.pointerEvents = '';
            }
            hideContextMenu();
            if (apiAbortController) apiAbortController.abort();
            selectedIndex = -1;
            isPopupActive = false;
            currentMatches = [];
            isKeyboardNavigation = false;
        }
        let debounceTimeout = null;
        function cancelPendingSuggestions() { requestSequence++; if (debounceTimeout) { clearTimeout(debounceTimeout); debounceTimeout = null; } if (apiAbortController) apiAbortController.abort(); }
        function getActiveInputElement() {
            const selection = window.getSelection();
            if (!selection.rangeCount) return null;
            const node = selection.focusNode;
            const pElement = node.nodeType === 3
                ? node.parentElement.closest('p')
                : node.closest('p');
            if (pElement && (
                pElement.closest('[class*="prompt-input"]')
                || pElement.closest('[class*="character-prompt-input"]')
            )) {
                return pElement;
            }
            return null;
        }
        function getCaretAnchorRect(input) {
            const selection = window.getSelection();
            let range = null;
            if (selection && selection.rangeCount > 0) {
                const candidate = selection.getRangeAt(0);
                if (input.contains(candidate.commonAncestorContainer)) range = candidate.cloneRange();
            }
            if (!range && lastKnownRange && input.contains(lastKnownRange.commonAncestorContainer)) {
                range = lastKnownRange.cloneRange();
            }
            if (range) {
                if (range.collapsed) {
                    const tempSpan = document.createElement('span');
                    tempSpan.appendChild(document.createTextNode('\u200b'));
                    range.insertNode(tempSpan);
                    const rect = tempSpan.getBoundingClientRect();
                    tempSpan.remove();
                    if (rect && (rect.width || rect.height)) return rect;
                } else {
                    const rects = range.getClientRects();
                    const rect = rects[rects.length - 1] || range.getBoundingClientRect();
                    if (rect && (rect.width || rect.height)) return rect;
                }
            }
            return input.getBoundingClientRect();
        }
        function positionPopup(input) {
            if (popupManualPosition) {
                popup.style.left = `${popupManualPosition.left}px`;
                popup.style.top = `${popupManualPosition.top}px`;
                return null;
            }
            if (popupPositionLock) {
                const locked = popupPositionLock;
                popup.style.left = `${locked.left}px`;
                popup.style.top = `${locked.top}px`;
                popup.dataset.naiPopupSide = locked.side;
                popup.dataset.naiPlacement = locked.placement;
                return locked.placement;
            }
            const caret = getCaretAnchorRect(input);
            popup.style.maxHeight = '';
            const width = Math.min(popup.offsetWidth || 700, innerWidth - 16);
            const height = popup.offsetHeight || 430;
            const gap = 6;
            const viewLeft = window.scrollX + 8;
            const viewRight = window.scrollX + innerWidth - 8;
            const viewTop = window.scrollY + 8;
            const caretRight = caret.right + window.scrollX;
            const aboveTop = caret.top + window.scrollY - height - gap;
            const belowTop = caret.bottom + window.scrollY + gap;
            const spaceBelow = innerHeight - caret.bottom - gap - 8;
            let left = caretRight + gap;
            let top;
            let placement;
            if (left + width > viewRight) {
                left = caretRight - width;
            }
            if (aboveTop >= viewTop) {
                top = aboveTop;
                placement = 'above';
            } else if (spaceBelow >= 120) {
                top = belowTop;
                placement = 'below';
                popup.style.maxHeight = `${Math.max(120, spaceBelow)}px`;
            } else {
                top = caret.top + window.scrollY - gap;
                placement = 'side';
            }
            const fitHeight = placement === 'below'
                ? Math.min(height, Math.max(120, spaceBelow))
                : height;
            const maxTop = window.scrollY + innerHeight - fitHeight - 8;
            left = Math.max(viewLeft, Math.min(left, viewRight - width));
            top = Math.max(viewTop, Math.min(top, maxTop));
            popup.style.top = `${top}px`;
            popup.style.left = `${left}px`;
            popup.dataset.naiPopupSide = left >= caretRight - 1 ? 'right' : 'left';
            popup.dataset.naiPlacement = placement;
            return placement;
        }
        function updateSelectionUI() {
            const items = popup.querySelectorAll('.suggestion-item');
            items.forEach((item, index) => item.classList.toggle('selected', index === selectedIndex));
            const selectedEl = popup.querySelector('.selected');
            if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
        }
        function getSuggestionRows() {
            const items = popup ? [...popup.querySelectorAll('.suggestion-item')] : [];
            const rows = [];
            for (const item of items) {
                const top = item.offsetTop;
                let row = rows.find((entry) => Math.abs(entry.top - top) <= 1);
                if (!row) {
                    row = { top, items: [] };
                    rows.push(row);
                }
                row.items.push(item);
            }
            rows.sort((a, b) => a.top - b.top);
            for (const row of rows) row.items.sort((a, b) => a.offsetLeft - b.offsetLeft);
            return { items, rows };
        }

        function navigateSuggestion(key) {
            const { items, rows } = getSuggestionRows();
            if (!items.length) return;
            const index = Math.max(0, Math.min(selectedIndex, items.length - 1));
            const current = items[index];
            let rowIndex = -1;
            let colIndex = -1;
            for (let r = 0; r < rows.length; r += 1) {
                const c = rows[r].items.indexOf(current);
                if (c >= 0) { rowIndex = r; colIndex = c; break; }
            }
            if (rowIndex < 0) return;
            let target = null;
            const currentRow = rows[rowIndex].items;
            if (key === 'ArrowLeft') {
                target = colIndex > 0
                    ? currentRow[colIndex - 1]
                    : currentRow[currentRow.length - 1];
            } else if (key === 'ArrowRight') {
                target = colIndex < currentRow.length - 1
                    ? currentRow[colIndex + 1]
                    : currentRow[0];
            } else if (key === 'ArrowUp') {
                const row = rows[rowIndex > 0 ? rowIndex - 1 : rows.length - 1].items;
                target = row[Math.min(colIndex, row.length - 1)];
            } else if (key === 'ArrowDown') {
                const row = rows[rowIndex < rows.length - 1 ? rowIndex + 1 : 0].items;
                target = row[Math.min(colIndex, row.length - 1)];
            }
            if (!target) return;
            const targetIndex = items.indexOf(target);
            if (targetIndex < 0 || targetIndex === selectedIndex) return;
            selectedIndex = targetIndex;
            updateSelectionUI();
        }
        function saveSelection() {
            const selection = window.getSelection();
            const activeInput = getActiveInputElement();
            if (activeInput && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (activeInput.contains(range.commonAncestorContainer)) { lastKnownRange = range.cloneRange(); }
            }
        }
        function handleInput() {
            cancelPendingSuggestions();
            const input = getActiveInputElement(); if (!input) { hidePopup(); return; }
            const textBeforeCursor = (() => {
                const sel = window.getSelection();
                if (!sel.rangeCount) return '';
                const range = sel.getRangeAt(0).cloneRange();
                const parent = sel.focusNode.parentElement;
                if (!parent) return '';
                range.selectNodeContents(parent);
                range.setEnd(sel.focusNode, sel.focusOffset);
                return range.toString();
            })();
            if (textBeforeCursor.endsWith(',')) { hidePopup(); return; }

            const emoticonMatch = textBeforeCursor.match(/(?:^|[,\s\n\r{[\|])([;:][_<>\-\\\/;:]*?)$/);
            if (emoticonMatch) {
                const emoticonQuery = emoticonMatch[1];
                debounceTimeout = setTimeout(() => {
                    const now = Date.now();
                    if (window.__NAIWeightAdjusting || now < window.__NAIWeightAdjustingUntil) { hidePopup(); return; }
                    fetchEmoticonSuggestions(emoticonQuery, input);
                }, DEBOUNCE_DELAY_EMOTICON);
                return;
            }

            debounceTimeout = setTimeout(() => {
                const now = Date.now();
                if (window.__NAIWeightAdjusting || now < window.__NAIWeightAdjustingUntil) { hidePopup(); return; }
                const lastDelimiterIndex = Math.max(textBeforeCursor.lastIndexOf(','), textBeforeCursor.lastIndexOf(':'), textBeforeCursor.lastIndexOf('['), textBeforeCursor.lastIndexOf('{'), textBeforeCursor.lastIndexOf('|'));
                const currentQuery = textBeforeCursor.substring(lastDelimiterIndex + 1).trim();
                if (shouldSkipWeightSuggestions(textBeforeCursor, lastDelimiterIndex)) { hidePopup(); return; }
                if (currentQuery.length < 1) { hidePopup(); return; }
                if (!ALLOWED_CHARS_REGEX.test(currentQuery)) { hidePopup(); return; }
                if (/^\d*\.?\d*$/.test(currentQuery)) { hidePopup(); return; }
                if (/[\u4e00-\u9fa5]/.test(currentQuery)) {
                    searchLocalSuggestions(currentQuery, input);
                } else {
                    if (activeView !== 'suggest') hidePopup();
                    const localPreview = searchLocalEnglish(currentQuery, input);
                    if (!localPreview) {
                        if (currentMatches.length) {
                            const lowerQuery = currentQuery.toLowerCase();
                            const stale = currentMatches.filter((tag) => tag.en.toLowerCase().includes(lowerQuery));
                            if (stale.length) {
                                const quick = mergeNaiAliasMatches(mergeMatchedFavorites(stale, currentQuery), currentQuery);
                                updatePopup(input, quick, null, currentQuery);
                            } else {
                                hidePopup();
                            }
                        } else {
                            hidePopup();
                        }
                    }
                    fetchSuggestions(currentQuery, input);
                }
            }, DEBOUNCE_DELAY);
        }
        function handleKeydown(e) {
            if (e.ctrlKey) { return; }
            if (e.key === ',') { cancelPendingSuggestions(); hidePopup(); return; }
            const arrowKeys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
            if (arrowKeys.includes(e.key)) { cancelPendingSuggestions(); }
            if (!isPopupActive) return;
            if (!currentMatches.length) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    hidePopup();
                }
                return;
            }
            if (arrowKeys.includes(e.key)) {
                e.preventDefault();
                isKeyboardNavigation = true;
                navigateSuggestion(e.key);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault(); e.stopPropagation();
                if (selectedIndex >= 0 && currentMatches[selectedIndex]) {
                    if (activeView === 'excluded') {
                        const tag = currentMatches[selectedIndex];
                        toggleExcluded(tag.en);
                        const target = lastInput || getActiveInputElement();
                        if (target) updatePopup(target, getExcludedItems(), null, '', 'excluded');
                    } else {
                        const input = getActiveInputElement();
                        if (input) {
                            const rangeForInsert = getClonedSelectionRange();
                            insertTag(input, currentMatches[selectedIndex].insertName, rangeForInsert);
                        }
                    }
                } else { hidePopup(); }
            } else if (e.key === 'Escape') { e.preventDefault(); hidePopup(); }
            else { isKeyboardNavigation = false; }
        }
        function handleClickOutside(e) {
            if (performance.now() < ignoreOutsideUntil) return;
            if (contextMenu && !contextMenu.contains(e.target)) { hideContextMenu(); }
            const input = getActiveInputElement();
            const clickedInPopup = popup && popup.contains(e.target);
            const clickedInInput = input && input.contains(e.target);
            const clickedInContext = contextMenu && contextMenu.contains(e.target);
            if (!clickedInPopup && !clickedInInput && !clickedInContext) { cancelPendingSuggestions(); }
            if (isPopupActive && popup && !clickedInPopup && !clickedInInput && !clickedInContext) { hidePopup(); }
        }
        function init() {
            loadTranslations();
            loadRemoteTranslations();
            document.addEventListener('input', handleInput);
            document.addEventListener('keydown', handleKeydown, true);
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keyup', saveSelection);
            document.addEventListener('mouseup', saveSelection);
            document.addEventListener('selectionchange', saveSelection);
            try { PromptCategoryColors.init(); } catch (_) { }
        }
        function openFavorites() {
            const input = getActiveInputElement() || (lastInput && document.contains(lastInput) ? lastInput : null);
            if (!input) return false;
            lastInput = input;
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) {
                const range = document.createRange();
                range.selectNodeContents(input);
                range.collapse(false);
                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
            updatePopup(input, getFavoriteItems(), null, '', 'favorites');
            return true;
        }
        return { init, openFavorites };
    })();
    const WeightShortcuts = (() => {
        function getActiveInputElement() {
            const selection = window.getSelection();
            if (!selection.rangeCount) return null;
            const node = selection.focusNode;
            const element = node.nodeType === 3 ? node.parentElement : node;
            if (!element) return null;
            const container = element.closest([
                '.prompt-input-box-prompt',
                '.prompt-input-box-base-prompt',
                '.prompt-input-box-negative-prompt',
                '.prompt-input-box-undesired-content',
                '[class*="character-prompt-input"]',
            ].join(','));
            if (!container) return null;
            return element.closest('p, [contenteditable="true"], .ProseMirror')
                || container.querySelector('[contenteditable="true"], .ProseMirror')
                || container;
        }
        function getSelectedTagInfo(inputElement) {
            if (!inputElement) return null;
            const selection = window.getSelection();
            if (!selection.rangeCount) return null;
            const range = selection.getRangeAt(0);
            const fullText = inputElement.textContent || '';

            function computeGlobalOffset(node, offset) {
                let globalOffset = 0;
                if (node.nodeType === 3) {
                    const treeWalker = document.createTreeWalker(inputElement, NodeFilter.SHOW_TEXT);
                    let currentNode;
                    while ((currentNode = treeWalker.nextNode())) {
                        if (currentNode === node) break;
                        globalOffset += currentNode.length;
                    }
                    globalOffset += offset;
                } else if (node === inputElement || inputElement.contains(node)) {
                    const children = node.childNodes;
                    for (let i = 0; i < offset && i < children.length; i++) {
                        globalOffset += children[i].textContent?.length || 0;
                    }
                    if (node !== inputElement) {
                        const treeWalker = document.createTreeWalker(inputElement, NodeFilter.SHOW_ALL);
                        let currentNode;
                        let foundNode = false;
                        let textBeforeNode = 0;
                        while ((currentNode = treeWalker.nextNode())) {
                            if (currentNode === node) { foundNode = true; break; }
                            if (currentNode.nodeType === 3) { textBeforeNode += currentNode.length; }
                        }
                        if (foundNode) globalOffset += textBeforeNode;
                    }
                } else {
                    globalOffset = offset;
                }
                return Math.max(0, Math.min(globalOffset, fullText.length));
            }

            const globalStartOffset = computeGlobalOffset(range.startContainer, range.startOffset);
            const globalEndOffset = computeGlobalOffset(range.endContainer, range.endOffset);

            const globalOffset = Math.floor((globalStartOffset + globalEndOffset) / 2);

            const BOUNDARY_CHARS = new Set([',', '\n', '{', '}', '[', ']', '|']);

            let start = globalOffset;
            while (start > 0 && !BOUNDARY_CHARS.has(fullText[start - 1])) { start--; }
            let end = globalOffset;
            while (end < fullText.length && !BOUNDARY_CHARS.has(fullText[end])) { end++; }

            if (BOUNDARY_CHARS.has(fullText[start])) start++;
            if (end > 0 && BOUNDARY_CHARS.has(fullText[end - 1])) end--;

            const tagText = fullText.slice(start, end).trim();
            return tagText ? { tagText, start, end, fullText, cursorOffset: globalOffset } : null;
        }
        function updateInputContent(inputElement, newContent, selectionStart, selectionEnd, keepSelection = false) {
            window.__NAIWeightAdjusting = true;
            window.__NAIWeightAdjustingUntil = Date.now() + 500;
            try {
                if (inputElement.childNodes.length === 1 && inputElement.firstChild.nodeType === 3) {
                    inputElement.firstChild.textContent = newContent;
                } else {
                    const newTextNode = document.createTextNode(newContent);
                    inputElement.innerHTML = '';
                    inputElement.appendChild(newTextNode);
                }
                const newRange = document.createRange();
                const textLength = inputElement.firstChild.textContent.length;
                if (keepSelection) {
                    const safeStart = Math.max(0, Math.min(textLength, selectionStart));
                    const safeEnd = Math.max(0, Math.min(textLength, selectionEnd));
                    newRange.setStart(inputElement.firstChild, safeStart);
                    newRange.setEnd(inputElement.firstChild, safeEnd);
                } else {
                    const safeIndex = Math.max(0, Math.min(textLength, selectionEnd));
                    newRange.setStart(inputElement.firstChild, safeIndex);
                    newRange.setEnd(inputElement.firstChild, safeIndex);
                }
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(newRange);
                const inputEvent = new Event('input', { bubbles: true });
                inputElement.dispatchEvent(inputEvent);
            } finally { window.__NAIWeightAdjusting = false; }
        }
        function parsePromptStructure(text) {
            return parseSequence(text, 0, false, 0).items;
        }
        function parseSequence(text, startIndex, stopAtClose, depth = 0) {
            const MAX_DEPTH = 20;
            if (depth > MAX_DEPTH) {
                return { items: [], index: text.length };
            }
            const items = [];
            let i = startIndex;
            const readSeparator = (input, index, shouldStopAtClose) => {
                let cursor = index; let separator = '';
                while (cursor < input.length) {
                    if (shouldStopAtClose && input.startsWith('::', cursor)) { break; }
                    const ch = input[cursor];
                    if (ch === ',') { separator += ch; cursor++; while (cursor < input.length && input[cursor] === ' ') { separator += input[cursor]; cursor++; } }
                    else if (ch === '\n' || ch === '\r') { separator += ch; cursor++; }
                    else if (ch === ' ' || ch === '\t') { separator += ch; cursor++; }
                    else { break; }
                }
                return { separator, nextIndex: cursor };
            };
            while (i < text.length) {
                if (stopAtClose && text.startsWith('::', i)) { return { items, index: i + 2, closeStart: i, closeEnd: i + 2 }; }
                while (i < text.length && (text[i] === ' ' || text[i] === '\t')) { i++; }
                if (stopAtClose && text.startsWith('::', i)) { return { items, index: i + 2, closeStart: i, closeEnd: i + 2 }; }
                if (i >= text.length) { break; }

                if (text.startsWith('||', i)) {
                    const randomStart = i;
                    i += 2;
                    let randomEnd = i;
                    while (randomEnd < text.length && !text.startsWith('||', randomEnd)) {
                        randomEnd++;
                    }
                    if (randomEnd < text.length) {
                        const randomContent = text.slice(i, randomEnd);
                        const childResult = parseSequence(randomContent, 0, false, depth + 1);
                        const randomNode = { type: 'random', content: randomContent, start: randomStart, contentStart: i, contentEnd: randomEnd, end: randomEnd + 2, children: childResult.items };
                        i = randomEnd + 2;
                        const separatorInfo = readSeparator(text, i, stopAtClose);
                        i = separatorInfo.nextIndex;
                        items.push({ node: randomNode, separator: separatorInfo.separator });
                        continue;
                    }
                }

                if (text[i] === '{') {
                    const braceStart = i;
                    i += 1;
                    let braceDepth = 1;
                    let braceEnd = i;
                    while (braceEnd < text.length && braceDepth > 0) {
                        if (text[braceEnd] === '{') braceDepth++;
                        else if (text[braceEnd] === '}') braceDepth--;
                        if (braceDepth > 0) braceEnd++;
                    }
                    if (braceDepth === 0) {
                        const braceContent = text.slice(i, braceEnd);
                        const childResult = parseSequence(braceContent, 0, false, depth + 1);
                        const braceNode = { type: 'brace', content: braceContent, start: braceStart, contentStart: i, contentEnd: braceEnd, end: braceEnd + 1, children: childResult.items };
                        i = braceEnd + 1;
                        const separatorInfo = readSeparator(text, i, stopAtClose);
                        i = separatorInfo.nextIndex;
                        items.push({ node: braceNode, separator: separatorInfo.separator });
                        continue;
                    }
                }

                if (text[i] === '[') {
                    const bracketStart = i;
                    i += 1;
                    let bracketDepth = 1;
                    let bracketEnd = i;
                    while (bracketEnd < text.length && bracketDepth > 0) {
                        if (text[bracketEnd] === '[') bracketDepth++;
                        else if (text[bracketEnd] === ']') bracketDepth--;
                        if (bracketDepth > 0) bracketEnd++;
                    }
                    if (bracketDepth === 0) {
                        const bracketContent = text.slice(i, bracketEnd);
                        const childResult = parseSequence(bracketContent, 0, false, depth + 1);
                        const bracketNode = { type: 'bracket', content: bracketContent, start: bracketStart, contentStart: i, contentEnd: bracketEnd, end: bracketEnd + 1, children: childResult.items };
                        i = bracketEnd + 1;
                        const separatorInfo = readSeparator(text, i, stopAtClose);
                        i = separatorInfo.nextIndex;
                        items.push({ node: bracketNode, separator: separatorInfo.separator });
                        continue;
                    }
                }

                const doubleColonMatch = text.slice(i).match(/^(-?\d+(?:\.\d+)?)(::)(?!:)/);
                if (doubleColonMatch) {
                    const groupStart = i;
                    const weightString = doubleColonMatch[1];
                    const parsedWeight = parseFloat(weightString);
                    i += doubleColonMatch[0].length;
                    const childResult = parseSequence(text, i, true, depth + 1);
                    const groupNode = {
                        type: 'group',
                        weight: isNaN(parsedWeight) ? 1.0 : parsedWeight,
                        format: 'doubleColon',
                        start: groupStart,
                        weightStart: groupStart,
                        weightEnd: groupStart + weightString.length,
                        prefixEnd: i,
                        closeStart: childResult.closeStart ?? childResult.index,
                        closeEnd: childResult.closeEnd ?? childResult.index,
                        children: childResult.items,
                    };
                    i = childResult.index;
                    const separatorInfo = readSeparator(text, i, stopAtClose);
                    i = separatorInfo.nextIndex;
                    items.push({ node: groupNode, separator: separatorInfo.separator });
                    continue;
                }
                const groupMatch = text.slice(i).match(/^(-?\d+(?:\.\d+)?)(\s*):(?!:)/);
                if (groupMatch) {
                    const groupStart = i;
                    const weightString = groupMatch[1];
                    const parsedWeight = parseFloat(weightString);
                    i += groupMatch[0].length;
                    const childResult = parseSequence(text, i, true, depth + 1);
                    const groupNode = {
                        type: 'group',
                        weight: isNaN(parsedWeight) ? 1.0 : parsedWeight,
                        format: 'singleColon',
                        start: groupStart,
                        weightStart: groupStart,
                        weightEnd: groupStart + weightString.length,
                        prefixEnd: i,
                        closeStart: childResult.closeStart ?? childResult.index,
                        closeEnd: childResult.closeEnd ?? childResult.index,
                        children: childResult.items,
                    };
                    i = childResult.index;
                    const separatorInfo = readSeparator(text, i, stopAtClose);
                    i = separatorInfo.nextIndex;
                    items.push({ node: groupNode, separator: separatorInfo.separator });
                    continue;
                }
                const tagRawStart = i;
                while (i < text.length && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r' && text[i] !== '{' && text[i] !== '}' && text[i] !== '[' && text[i] !== ']' && text[i] !== '|') {
                    if (stopAtClose && text.startsWith('::', i)) { break; }
                    if (i === tagRawStart) {
                        const aheadMatch = text.slice(i).match(/^(-?\d+(?:\.\d+)?)(\s*):(?!:)/);
                        if (aheadMatch) { break; }
                    }
                    i++;
                }
                const rawSegment = text.slice(tagRawStart, i);
                if (rawSegment.trim()) {
                    let leadingSpaces = 0;
                    while (leadingSpaces < rawSegment.length && /\s/.test(rawSegment[leadingSpaces])) { leadingSpaces++; }
                    let trailingSpaces = 0;
                    while (trailingSpaces < rawSegment.length - leadingSpaces && /\s/.test(rawSegment[rawSegment.length - 1 - trailingSpaces])) { trailingSpaces++; }
                    const contentStart = tagRawStart + leadingSpaces;
                    const contentEnd = i - trailingSpaces;
                    const tagText = text.slice(contentStart, contentEnd);
                    const tagNode = { type: 'tag', text: tagText, start: contentStart, end: contentEnd };
                    const separatorInfo = readSeparator(text, i, stopAtClose);
                    i = separatorInfo.nextIndex;
                    items.push({ node: tagNode, separator: separatorInfo.separator });
                } else {
                    const separatorInfo = readSeparator(text, i, stopAtClose);
                    i = separatorInfo.nextIndex;
                    if (items.length) { items[items.length - 1].separator += separatorInfo.separator; }
                    if (i === tagRawStart && i < text.length) { i++; }
                }
            }
            return { items, index: i };
        }
        function normalizeSequence(sequence) {
            for (let i = 0; i < sequence.length; i++) {
                sequence[i].separator = i < sequence.length - 1 ? ', ' : '';
                if (sequence[i].node.type === 'group') { normalizeSequence(sequence[i].node.children); }
            }
        }
        function normalizeTree(sequence) { normalizeSequence(sequence); }
        function formatWeightValue(value) {
            const rounded = Math.round(value * 20) / 20;
            let str = rounded.toFixed(2);
            return str.replace(/\.?0+$/, '');
        }
        function serializeTree(sequence) {
            const state = { output: '', offset: 0 };
            serializeSequence(sequence, state);
            return state.output;
        }
        function serializeSequence(sequence, state) {
            for (let i = 0; i < sequence.length; i++) {
                serializeNode(sequence[i].node, state);
                const sep = sequence[i].separator || '';
                state.output += sep;
                state.offset += sep.length;
            }
        }
        function serializeNode(node, state) {
            if (node.type === 'tag') {
                node.serializeStart = state.offset;
                node.serializeEnd = state.offset + node.text.length;
                state.output += node.text;
                state.offset += node.text.length;
            } else if (node.type === 'brace') {
                node.serializeStart = state.offset;
                state.output += '{';
                state.offset += 1;
                state.output += node.content;
                state.offset += node.content.length;
                state.output += '}';
                state.offset += 1;
                node.serializeEnd = state.offset;
            } else if (node.type === 'bracket') {
                node.serializeStart = state.offset;
                state.output += '[';
                state.offset += 1;
                state.output += node.content;
                state.offset += node.content.length;
                state.output += ']';
                state.offset += 1;
                node.serializeEnd = state.offset;
            } else if (node.type === 'random') {
                node.serializeStart = state.offset;
                state.output += '||';
                state.offset += 2;
                state.output += node.content;
                state.offset += node.content.length;
                state.output += '||';
                state.offset += 2;
                node.serializeEnd = state.offset;
            } else if (node.type === 'group') {
                node.serializeStart = state.offset;
                const weightStr = formatWeightValue(node.weight);
                const format = node.format || 'singleColon';
                if (format === 'doubleColon') {
                    state.output += `${weightStr}::`;
                    state.offset += weightStr.length + 2;
                } else {
                    state.output += `${weightStr}:`;
                    state.offset += weightStr.length + 1;
                }
                const childrenStart = state.output.length;
                serializeSequence(node.children, state);
                const childrenContent = state.output.slice(childrenStart);
                if (/\d$/.test(childrenContent) && /[a-zA-Z_]/.test(childrenContent)) {
                    state.output += ',';
                    state.offset += 1;
                }
                state.output += '::';
                state.offset += 2;
                node.serializeEnd = state.offset;
            }
        }
        function findFirstTagInSequence(sequence, ancestors = [], depth = 0) {
            const MAX_DEPTH = 20;
            if (depth > MAX_DEPTH) return null;
            for (let i = 0; i < sequence.length; i++) {
                const item = sequence[i];
                const node = item.node;
                if (node.type === 'tag') {
                    return { item, sequence, index: i, ancestors };
                } else if (node.type === 'group') {
                    const result = findFirstTagInSequence(node.children,
                        ancestors.concat({ groupNode: node, entry: item, parentSequence: sequence, index: i }), depth + 1);
                    if (result) return result;
                } else if (node.type === 'brace') {
                    const result = findFirstTagInSequence(node.children,
                        ancestors.concat({ braceNode: node, entry: item, parentSequence: sequence, index: i }), depth + 1);
                    if (result) return result;
                } else if (node.type === 'bracket') {
                    const result = findFirstTagInSequence(node.children,
                        ancestors.concat({ bracketNode: node, entry: item, parentSequence: sequence, index: i }), depth + 1);
                    if (result) return result;
                } else if (node.type === 'random') {
                    const result = findFirstTagInSequence(node.children,
                        ancestors.concat({ randomNode: node, entry: item, parentSequence: sequence, index: i }), depth + 1);
                    if (result) return result;
                }
            }
            return null;
        }
        function findTagNodeByOffset(sequence, offset, ancestors = [], depth = 0) {
            const MAX_DEPTH = 20;
            if (depth > MAX_DEPTH) {
                return null;
            }
            for (let i = 0; i < sequence.length; i++) {
                const item = sequence[i];
                const node = item.node;
                if (node.type === 'tag') {
                    if (node.start <= offset && offset <= node.end) { return { item, sequence, index: i, ancestors }; }
                } else if (node.type === 'brace') {
                    if (node.start <= offset && offset <= node.end) {
                        const childOffset = offset - node.contentStart;
                        const result = findTagNodeByOffset(node.children, childOffset, ancestors.concat({ braceNode: node, entry: item, parentSequence: sequence, index: i }), depth + 1);
                        if (result) return result;
                    }
                } else if (node.type === 'bracket') {
                    if (node.start <= offset && offset <= node.end) {
                        const childOffset = offset - node.contentStart;
                        const result = findTagNodeByOffset(node.children, childOffset, ancestors.concat({ bracketNode: node, entry: item, parentSequence: sequence, index: i }), depth + 1);
                        if (result) return result;
                    }
                } else if (node.type === 'random') {
                    if (node.start <= offset && offset <= node.end) {
                        const childOffset = offset - node.contentStart;
                        const result = findTagNodeByOffset(node.children, childOffset, ancestors.concat({ randomNode: node, entry: item, parentSequence: sequence, index: i }), depth + 1);
                        if (result) return result;
                    }
                } else if (node.type === 'group') {
                    const groupEnd = node.closeEnd ?? node.closeStart ?? Infinity;
                    const newAncestors = ancestors.concat({ groupNode: node, entry: item, parentSequence: sequence, index: i });
                    const result = findTagNodeByOffset(node.children, offset, newAncestors, depth + 1);
                    if (result) { return result; }
                    if (node.start <= offset && offset <= groupEnd) {
                        const firstTag = findFirstTagInSequence(node.children, newAncestors, depth + 1);
                        if (firstTag) return firstTag;
                    }
                }
            }
            return null;
        }
        function removeGroupWrapper(groupInfo) {
            const { parentSequence, index, groupNode } = groupInfo;
            const children = groupNode.children;
            parentSequence.splice(index, 1, ...children);
        }
        function wrapTagWithGroup(target, newWeight) {
            const { sequence, index, item } = target;
            const tagNode = item.node, originalSeparator = item.separator || '';
            sequence.splice(index, 1);
            const groupNode = { type: 'group', weight: newWeight, format: 'doubleColon', children: [{ node: tagNode, separator: '' }] };
            sequence.splice(index, 0, { node: groupNode, separator: originalSeparator });
            return groupNode;
        }
        function adjustWeightForTag(target, direction) {
            const step = 0.05;
            const tagNode = target.item.node;
            const ancestors = target.ancestors;
            let groupAncestorIndex = -1;
            for (let i = ancestors.length - 1; i >= 0; i--) {
                if (ancestors[i].groupNode) {
                    groupAncestorIndex = i;
                    break;
                }
            }
            if (groupAncestorIndex >= 0) {
                const outerGroupInfo = ancestors[groupAncestorIndex];
                const groupNode = outerGroupInfo.groupNode;
                let newWeight = groupNode.weight + (direction * step);
                newWeight = Math.round(newWeight * 20) / 20;
                if (Math.abs(newWeight - 1.0) < 0.001) {
                    removeGroupWrapper(outerGroupInfo);
                    return { tagNode, wrapperNode: null };
                }
                else {
                    groupNode.weight = newWeight;
                    return { tagNode, wrapperNode: groupNode };
                }
            }
            let newWeight = 1.0 + (direction * step);
            newWeight = Math.round(newWeight * 20) / 20;
            if (Math.abs(newWeight - 1.0) < 0.001) { return { tagNode, wrapperNode: null }; }
            const newGroupNode = wrapTagWithGroup(target, newWeight);
            return { tagNode, wrapperNode: newGroupNode };
        }
        function resolveMovementContext(target) {
            let { sequence, index, item, ancestors } = target;
            let movedAsGroup = false;
            if (ancestors.length) {
                const immediate = ancestors[ancestors.length - 1];
                const immediateNode = immediate.groupNode || immediate.braceNode || immediate.bracketNode || immediate.randomNode;
                if (immediateNode && immediateNode.children && immediateNode.children.length === 1) {
                    movedAsGroup = true;
                    sequence = immediate.parentSequence;
                    index = immediate.index;
                    item = immediate.entry;
                    ancestors = ancestors.slice(0, -1);
                }
            }
            return { sequence, index, item, ancestors, movedAsGroup };
        }
        function moveTagWithinStructure(target, direction) {
            const context = resolveMovementContext(target);
            const { sequence, index, item, ancestors } = context;
            const isOriginalWeighted = target.ancestors.length > 0;
            if (direction === -1) {
                if (index > 0) {
                    const prevItem = sequence[index - 1];
                    if (!isOriginalWeighted && prevItem.node.type === 'group') {
                        sequence.splice(index, 1);
                        item.separator = '';
                        prevItem.node.children.push(item);
                        return true;
                    }
                    sequence[index - 1] = item;
                    sequence[index] = prevItem;
                    return true;
                }
                if (!ancestors.length) { return false; }
                const parentContext = ancestors[ancestors.length - 1];
                const { parentSequence, index: parentIndex } = parentContext;
                sequence.splice(index, 1);
                if (sequence.length === 0) {
                    parentSequence.splice(parentIndex, 1);
                    parentSequence.splice(parentIndex, 0, item);
                } else { parentSequence.splice(parentIndex, 0, item); }
                return true;
            }
            if (direction === 1) {
                if (index < sequence.length - 1) {
                    const nextItem = sequence[index + 1];
                    if (!isOriginalWeighted && nextItem.node.type === 'group') {
                        sequence.splice(index, 1);
                        item.separator = '';
                        nextItem.node.children.unshift(item);
                        return true;
                    }
                    sequence[index + 1] = item;
                    sequence[index] = nextItem;
                    return true;
                }
                if (!ancestors.length) { return false; }
                const parentContext = ancestors[ancestors.length - 1];
                const { parentSequence, index: parentIndex } = parentContext;
                sequence.splice(index, 1);
                if (sequence.length === 0) {
                    parentSequence.splice(parentIndex, 1);
                    parentSequence.splice(parentIndex, 0, item);
                } else { parentSequence.splice(parentIndex + 1, 0, item); }
                return true;
            }
            return false;
        }
        function moveTagByText(inputElement, direction) {
            const info = getSelectedTagInfo(inputElement);
            if (!info) return false;
            const parts = info.fullText.split(',');
            if (parts.length < 2) return false;
            let cursor = info.cursorOffset;
            let index = 0;
            let segmentStart = 0;
            for (let i = 0; i < parts.length; i++) {
                const segmentEnd = segmentStart + parts[i].length;
                if (cursor <= segmentEnd) { index = i; break; }
                segmentStart = segmentEnd + 1;
                index = i;
            }
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= parts.length) return false;
            const current = parts[index];
            parts[index] = parts[targetIndex];
            parts[targetIndex] = current;
            let caret = 0;
            for (let i = 0; i < targetIndex; i++) caret += parts[i].length + 1;
            caret += (parts[targetIndex].match(/^\s*/) || [''])[0].length;
            updateInputContent(inputElement, parts.join(','), caret, caret, false);
            return true;
        }
        function handleKeydown(event) {
            const inputElement = getActiveInputElement();
            if (!inputElement || !event.ctrlKey) return;
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault(); event.stopPropagation();
                const tagInfo = getSelectedTagInfo(inputElement); if (!tagInfo) return;
                const direction = (event.key === 'ArrowUp') ? 1 : -1;
                const leadingWhitespace = tagInfo.fullText.slice(tagInfo.start, tagInfo.end).match(/^\s*/)[0];
                const structure = parsePromptStructure(tagInfo.fullText);
                const offsetForSearch = tagInfo.cursorOffset ?? (tagInfo.start + leadingWhitespace.length);
                const target = findTagNodeByOffset(structure, offsetForSearch); if (!target) { return; }
                const { tagNode, wrapperNode } = adjustWeightForTag(target, direction);
                normalizeTree(structure);
                const serialized = serializeTree(structure);
                let selectionStart, selectionEnd;
                if (keepSelectionAfterAdjustment) {
                    if (wrapperNode) {
                        selectionStart = wrapperNode.serializeStart;
                        selectionEnd = wrapperNode.serializeEnd;
                    } else {
                        selectionStart = tagNode.serializeStart ?? (tagInfo.start + leadingWhitespace.length);
                        selectionEnd = tagNode.serializeEnd ?? (selectionStart + tagNode.text.length);
                    }
                } else {
                    selectionStart = tagNode.serializeEnd ?? (tagInfo.start + leadingWhitespace.length + tagNode.text.length);
                    selectionEnd = selectionStart;
                }
                updateInputContent(inputElement, serialized, selectionStart, selectionEnd, keepSelectionAfterAdjustment);
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault(); event.stopPropagation();
                const tagInfo = getSelectedTagInfo(inputElement); if (!tagInfo) return;
                const direction = (event.key === 'ArrowLeft') ? -1 : 1;
                const leadingWhitespace = tagInfo.fullText.slice(tagInfo.start, tagInfo.end).match(/^\s*/)[0];
                const structure = parsePromptStructure(tagInfo.fullText);
                const offsetForSearch = tagInfo.cursorOffset ?? (tagInfo.start + leadingWhitespace.length);
                const target = findTagNodeByOffset(structure, offsetForSearch);
                if (!target) { moveTagByText(inputElement, direction); return; }
                const tagNode = target.item.node;
                if (!moveTagWithinStructure(target, direction)) { moveTagByText(inputElement, direction); return; }
                normalizeTree(structure);
                const serialized = serializeTree(structure);
                if (serialized === tagInfo.fullText) { moveTagByText(inputElement, direction); return; }
                let selectionStart, selectionEnd;
                if (keepSelectionAfterAdjustment) {
                    selectionStart = tagNode.serializeStart ?? (tagInfo.start + leadingWhitespace.length);
                    selectionEnd = tagNode.serializeEnd ?? (selectionStart + tagNode.text.length);
                } else {
                    selectionStart = tagNode.serializeEnd ?? (tagInfo.start + leadingWhitespace.length + tagNode.text.length);
                    selectionEnd = selectionStart;
                }
                updateInputContent(inputElement, serialized, selectionStart, selectionEnd, keepSelectionAfterAdjustment);
            }
        }
        function init() {
            const checkInterval = setInterval(() => {
                const inputElement = getActiveInputElement();
                if (inputElement) { clearInterval(checkInterval); document.addEventListener('keydown', handleKeydown, true); }
            }, 500);
        }
        return { init, parsePromptStructure, normalizeTree, serializeTree, updateInputContent };
    })();
    window.__NAI_PROMPT_HELPER__ = TagAssist;

    function init() {
        TagAssist.init();
        WeightShortcuts.init();
    }
    if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); }
    else { init(); }
})();


let naiZhEnabled = naiZhReadEnabled();

function naiZhToast(message) {
  const root = document.documentElement;
  if (!root) return;

  const old = document.getElementById('nai-zh-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'nai-zh-toast';
  toast.textContent = message;
  toast.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:26px',
    'transform:translateX(-50%)',
    'z-index:2147483647',
    'max-width:calc(100vw - 40px)',
    'padding:9px 15px',
    'border:1px solid var(--nai-popup-accent-border, #7563e8)',
    'border-radius:10px',
    'background:var(--nai-popup-bg, #1b1c33)',
    'color:var(--nai-popup-text, #f1f2ff)',
    'font:13px/1.5 var(--nai-popup-font, "Microsoft YaHei", "PingFang SC", system-ui, sans-serif)',
    'box-shadow:var(--nai-popup-shadow, 0 8px 28px rgba(0,0,0,.42))',
    'pointer-events:none',
  ].join(';');
  root.appendChild(toast);
  try {
    if (typeof globalThis.__NAIApplyPopupTheme === 'function') {
      globalThis.__NAIApplyPopupTheme(toast);
    }
  } catch (_) { }
  setTimeout(() => toast.remove(), 1800);
}

function naiZhToggle() {
  naiZhEnabled = !naiZhReadEnabled();
  naiZhWriteEnabled(naiZhEnabled);

  const api = globalThis.__NAI_ZH_API__;
  if (api && typeof api.setEnabled === 'function') {
    api.setEnabled(naiZhEnabled);
  }
  naiZhToast(naiZhEnabled ? 'NovelAI 界面汉化已开启' : '已恢复英文界面');
}


addEventListener(
  'keydown',
  (event) => {
    if (!event.altKey || !event.shiftKey) return;
    if (event.code !== 'KeyC' && event.key.toLowerCase() !== 'c') return;
    event.preventDefault();
    event.stopPropagation();
    naiZhToggle();
  },
  true
);

})();

globalThis.SessionTool = (() => {
  const HIST_DB = 'generated-image-history';
  const IMG_DB = 'generated-images';

  const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const done = (tx) => new Promise((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error || new Error('事务已中止'));
  });

  async function openDb(name) {
    const dbs = await indexedDB.databases();
    if (!dbs.some((d) => d.name === name)) throw new Error(`未找到 IndexedDB "${name}"（请先打开一次 NovelAI 的图像生成页面）`);
    return req(indexedDB.open(name));
  }
  const prefixRange = (id) => IDBKeyRange.bound(id + ':', id + ':\uffff');

  function putRec(store, value, key) {
    if (store.keyPath) return store.put(value);
    return store.put(value, key);
  }

  async function listSessions() {
    const db = await openDb(HIST_DB);
    try {
      const metas = await req(db.transaction('history-meta').objectStore('history-meta').getAll());
      return metas
        .filter((m) => m && m.id)
        .sort((a, b) => new Date(b.lastSavedAt) - new Date(a.lastSavedAt));
    } finally { db.close(); }
  }

  async function readSession(id) {
    const hdb = await openDb(HIST_DB);
    let meta, groups, boards;
    try {
      const tx = hdb.transaction(['history-meta', 'history-groups', 'history-boards']);
      meta = await req(tx.objectStore('history-meta').get(id));
      const gs = tx.objectStore('history-groups');
      const gkeys = await req(gs.getAllKeys(prefixRange(id)));
      const gvals = await req(gs.getAll(prefixRange(id)));
      groups = gkeys.map((k, i) => [String(k).slice(id.length + 1), gvals[i]]);
      boards = await req(tx.objectStore('history-boards').get(id));
    } finally { hdb.close(); }
    if (!meta) throw new Error('未找到历史记录：' + id);
    const idb = await openDb(IMG_DB);
    let images;
    try {
      const st = idb.transaction('images').objectStore('images');
      const ikeys = await req(st.getAllKeys(prefixRange(id)));
      const ivals = await req(st.getAll(prefixRange(id)));
      images = ikeys.map((k, i) => [String(k).slice(id.length + 1), ivals[i]]);
    } finally { idb.close(); }
    for (const [iid, v] of images) if (!(v instanceof Blob)) throw new Error(`图像 ${iid} 不是 Blob 对象 (${Object.prototype.toString.call(v)})`);
    return { meta, groups, boards, images };
  }

  async function deleteSessionData(id) {
    const idb = await openDb(IMG_DB);
    try {
      const tx = idb.transaction('images', 'readwrite');
      tx.objectStore('images').delete(prefixRange(id));
      await done(tx);
    } finally { idb.close(); }
    const hdb = await openDb(HIST_DB);
    try {
      const tx = hdb.transaction(['history-meta', 'history-groups', 'history-boards'], 'readwrite');
      tx.objectStore('history-groups').delete(prefixRange(id));
      tx.objectStore('history-boards').delete(id);
      tx.objectStore('history-meta').delete(id);
      await done(tx);
    } finally { hdb.close(); }
  }

  async function writeSession(newId, data, name) {
    try {
      const idb = await openDb(IMG_DB);
      try {
        const tx = idb.transaction('images', 'readwrite');
        const st = tx.objectStore('images');
        for (const [iid, blob] of data.images) putRec(st, blob, `${newId}:${iid}`);
        await done(tx);
      } finally { idb.close(); }
      const hdb = await openDb(HIST_DB);
      try {
        const tx = hdb.transaction(['history-meta', 'history-groups', 'history-boards'], 'readwrite');
        const gs = tx.objectStore('history-groups');
        for (const [gid, v] of data.groups) putRec(gs, v, `${newId}:${gid}`);
        if (data.boards) {
          const bs = tx.objectStore('history-boards');
          putRec(bs, bs.keyPath ? { ...data.boards, [bs.keyPath]: newId } : data.boards, newId);
        }
        const ms = tx.objectStore('history-meta');
        putRec(ms, { ...data.meta, id: newId, name: name ?? data.meta.name }, newId);
        await done(tx);
      } finally { hdb.close(); }
    } catch (e) {
      try { await deleteSessionData(newId); } catch (_) { }
      throw e;
    }
    return newId;
  }

  const GB = 1e9;
  const QUOTA_KEY = 'nsm-quota-bytes';
  const fmtBytes = (b) => (b >= 1e9 ? (b / 1e9).toFixed(2) + ' GB' : (b / 1e6).toFixed(b >= 1e8 ? 0 : 1) + ' MB');

  async function imageUsage() {
    const db = await openDb(IMG_DB);
    try {
      const st = db.transaction('images').objectStore('images');
      const keys = await req(st.getAllKeys());
      const vals = await req(st.getAll());
      const bySession = new Map();
      let total = 0;
      keys.forEach((k, i) => {
        const sid = String(k).split(':')[0], n = (vals[i] && vals[i].size) || 0;
        bySession.set(sid, (bySession.get(sid) || 0) + n);
        total += n;
      });
      return { total, bySession, count: keys.length };
    } finally { db.close(); }
  }
  const readQuotaSetting = () => { try { const v = Number(localStorage.getItem(QUOTA_KEY)); return v > 0 ? v : null; } catch (_) { return null; } };
  function setQuotaBytes(bytes) {
    try { if (bytes == null) localStorage.removeItem(QUOTA_KEY); else localStorage.setItem(QUOTA_KEY, String(Math.round(bytes))); } catch (_) { }
  }

  async function quotaInfo() {
    const u = await imageUsage();
    const auto = 10 * GB;
    const set = readQuotaSetting();
    const quota = set ?? auto;
    return { used: u.total, count: u.count, bySession: u.bySession, quota, auto, custom: set != null, over: u.total > quota };
  }

  async function assertRoom(extra, what) {
    const q = await quotaInfo();
    if (q.used + extra > q.quota) {
      const e = new Error(`${what}失败：上限为 ${fmtBytes(q.quota)}，当前已用 ${fmtBytes(q.used)} ＋ 本次新增 ${fmtBytes(extra)} = ${fmtBytes(q.used + extra)}。请删除不需要的历史记录，或提高上限。`);
      e.code = 'QUOTA';
      throw e;
    }
    return q;
  }
  const sumBlobs = (images) => images.reduce((a, [, b]) => a + b.size, 0);

  async function duplicateSession(id) {
    const data = await readSession(id);
    await assertRoom(sumBlobs(data.images), '复制');
    const newId = crypto.randomUUID();
    await writeSession(newId, data, (data.meta.name || 'History') + ' (副本)');
    return newId;
  }

  const enc = (v) => {
    if (v instanceof Date) return { $date: v.toISOString() };
    if (Array.isArray(v)) return v.map(enc);
    if (v && typeof v === 'object') {
      if (v instanceof Blob || v instanceof ArrayBuffer) throw new Error('包含无法转换为 JSON 的值（Blob/ArrayBuffer）');
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)]));
    }
    return v;
  };
  const dec = (v) => {
    if (Array.isArray(v)) return v.map(dec);
    if (v && typeof v === 'object') {
      if (Object.keys(v).length === 1 && '$date' in v) return new Date(v.$date);
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]));
    }
    return v;
  };

  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  const crc32 = (u8) => { let c = -1; for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 255] ^ (c >>> 8); return (~c) >>> 0; };
  const utf8 = (s) => new TextEncoder().encode(s);

  function zipBuild(entries) {
    const parts = [], central = [];
    let offset = 0;
    for (const { name, data } of entries) {
      const nb = utf8(name), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, 0, true); lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, nb.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), nb, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true); ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, nb.length, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), nb);
      offset += 30 + nb.length + data.length;
    }
    const cdSize = central.reduce((a, p) => a + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
  }

  async function zipRead(buf) {
    const dv = new DataView(buf), u8 = new Uint8Array(buf);
    let e = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('无法作为 ZIP 文件读取');
    const count = dv.getUint16(e + 10, true);
    let p = dv.getUint32(e + 16, true);
    const out = new Map();
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('ZIP 的目录信息已损坏');
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
      const lo = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl));
      const start = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
      let data = u8.subarray(start, start + csize);
      if (method === 8) data = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      else if (method !== 0) throw new Error('不支持的压缩方式：' + method);
      out.set(name, data);
      p += 46 + nl + xl + cl;
    }
    return out;
  }

  const extOf = (type) => ({ 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[type] || 'bin');

  async function exportSessionZip(id) {
    const { meta, groups, boards, images } = await readSession(id);
    const entries = [];
    const imgList = [];
    for (const [iid, blob] of images) {
      const file = `images/${iid}.${extOf(blob.type)}`;
      entries.push({ name: file, data: new Uint8Array(await blob.arrayBuffer()) });
      imgList.push({ id: iid, file, type: blob.type });
    }
    const doc = { format: 'novelai-session-tool/1', exportedAt: new Date().toISOString(), meta: enc(meta), groups: groups.map(([g, v]) => [g, enc(v)]), boards: enc(boards), images: imgList };
    entries.unshift({ name: 'session.json', data: utf8(JSON.stringify(doc)) });
    const stamp = new Date(meta.lastSavedAt).toISOString().replace(/[-:]/g, '').slice(0, 15);
    return { blob: zipBuild(entries), filename: `novelai-session_${stamp}_${id.slice(0, 8)}.zip` };
  }

  async function importSessionZip(file) {
    const files = await zipRead(await file.arrayBuffer());
    const j = files.get('session.json');
    if (!j) throw new Error('未包含 session.json');
    const doc = JSON.parse(new TextDecoder().decode(j));
    if (doc.format !== 'novelai-session-tool/1') throw new Error('这不是本工具导出的 ZIP');
    const images = doc.images.map((m) => {
      const bytes = files.get(m.file);
      if (!bytes) throw new Error('缺少图像：' + m.file);
      return [m.id, new Blob([bytes], { type: m.type })];
    });
    const data = { meta: dec(doc.meta), groups: doc.groups.map(([g, v]) => [g, dec(v)]), boards: dec(doc.boards), images };
    await assertRoom(sumBlobs(images), '导入');
    const newId = crypto.randomUUID();
    await writeSession(newId, data, (data.meta.name || 'History') + ' (导入)');
    return newId;
  }

  return { listSessions, readSession, duplicateSession, exportSessionZip, importSessionZip, deleteSessionData, quotaInfo, setQuotaBytes, fmtBytes, GB, _zip: { zipBuild, zipRead, crc32 } };
})();



globalThis.SessionViewer = (() => {
  const CSS = `
:root{color-scheme:dark;--sz:220px}
*{box-sizing:border-box}
body{margin:0;background:#12131c;color:#e8e8f0;font:14px/1.5 system-ui,sans-serif}
header{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:10px 14px;background:#1a1c2a;border-bottom:1px solid #33365a}
header h1{font-size:15px;margin:0;flex:1 1 220px}
input,select,button{background:#262944;color:#e8e8f0;border:1px solid #444876;border-radius:6px;padding:4px 8px;font:inherit}
button{cursor:pointer} button:hover{border-color:#8fa5ff} input[type=range]{padding:0;width:120px}
#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--sz),1fr));gap:10px;padding:14px}
figure{margin:0;background:#1a1c2a;border-radius:8px;overflow:hidden;cursor:pointer;border:1px solid transparent}
figure:hover{border-color:#8fa5ff} figure[hidden]{display:none}
figure img,figure .ph{width:100%;aspect-ratio:1/1;object-fit:contain;background:#000;display:block}
figure .ph{display:flex;align-items:center;justify-content:center;color:#778;font-size:12px}
figcaption{padding:4px 8px;font-size:11px;color:#aab;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#lb{position:fixed;inset:0;z-index:10;background:#000e;display:grid;grid-template-columns:1fr minmax(280px,420px);opacity:0;visibility:hidden;pointer-events:none}
#lb.on{opacity:1;visibility:visible;pointer-events:auto}
#lb.closing{opacity:0;visibility:visible;pointer-events:none}
#lbimg{display:flex;align-items:center;justify-content:center;min-width:0;min-height:0;padding:10px;position:relative}
#lbimg img{max-width:100%;max-height:100vh;object-fit:contain}
#lbimg button.nav{position:absolute;top:50%;transform:translateY(-50%);font-size:22px;padding:8px 12px;opacity:.8}
#lbprev{left:8px} #lbnext{right:8px}
#info{overflow:auto;background:#1a1c2a;padding:12px;border-left:1px solid #33365a}
.sec{margin-bottom:10px} .sec b{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#8fa5ff;margin-bottom:2px}
.sec pre{margin:0;white-space:pre-wrap;word-break:break-word;background:#12131c;padding:6px 8px;border-radius:6px;font:12px/1.5 ui-monospace,monospace}
footer{padding:10px 14px;color:#778;font-size:12px}
@media (max-width:800px){#lb{grid-template-columns:1fr;grid-template-rows:55vh 1fr}}
@media (prefers-reduced-motion: reduce){button,figure,#lb{transition:none!important}#lbimg img{animation:none!important}}`;

  const dec = (u8) => new TextDecoder().decode(u8);
  const pad = (n) => String(n).padStart(2, '0');
  const first = (...xs) => xs.find((x) => x !== undefined && x !== null && x !== '' && x !== '<Undefined>');

  function toDate(v) {
    if (v instanceof Date) return v;
    if (typeof v !== 'string') return null;
    const d = new Date(/(Z|[+-]\d\d:?\d\d)$/.test(v) ? v : v + 'Z');
    return isNaN(d) ? null : d;
  }
  const fmtTime = (d) => d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` : '';

  async function pngComment(blob) {
    if (!blob) return null;
    const u8 = new Uint8Array(await blob.slice(0, 65536).arrayBuffer());
    if (u8[0] !== 0x89 || u8[1] !== 0x50) return null;
    const dv = new DataView(u8.buffer);
    let p = 8;
    while (p + 12 <= u8.length) {
      const n = dv.getUint32(p), t = String.fromCharCode(u8[p + 4], u8[p + 5], u8[p + 6], u8[p + 7]);
      if (t === 'IDAT' || t === 'IEND' || p + 12 + n > u8.length) break;
      if (t === 'tEXt') {
        const d = u8.subarray(p + 8, p + 8 + n), z = d.indexOf(0);
        if (z > 0 && dec(d.subarray(0, z)) === 'Comment') { try { return JSON.parse(dec(d.subarray(z + 1))); } catch (_) { return null; } }
      }
      p += 12 + n;
    }
    return null;
  }

  async function buildItems(data, urls) {
    const blobs = new Map(data.images);
    const byId = new Map(data.groups);
    const order = data.meta.groupOrder || [];
    const gids = [...order.filter((g) => byId.has(g)), ...data.groups.map(([g]) => g).filter((g) => !order.includes(g))];
    const items = [];
    for (const gid of gids) {
      for (const im of byId.get(gid).images || []) {
        const iid = im.data && im.data[0];
        const blob = blobs.get(iid) || null;
        const m = await pngComment(blob);
        const p = im.params || {}, pp = p.params || {};
        const chars = m && m.v4_prompt && m.v4_prompt.caption && m.v4_prompt.caption.char_captions
          ? m.v4_prompt.caption.char_captions.map((c) => c.char_caption)
          : (pp.characterPrompts || []).map((c) => c && c.prompt).filter(Boolean);
        let url = '';
        if (blob) { url = URL.createObjectURL(blob); urls.push(url); }
        items.push({
          iid, url, time: toDate(im.genDateTime),
          thumb: typeof im.thumbnail === 'string' && im.thumbnail.startsWith('data:image/') ? im.thumbnail : '',
          prompt: first(m && m.prompt, p.prompt) || '', negative: first(m && m.uc, p.negPrompt, pp.uc) || '', chars,
          seed: first(m && m.seed, p.seed) ?? '', model: first(p.model) || '',
          steps: first(m && m.steps, pp.steps) ?? '', scale: first(m && m.scale, pp.scale) ?? '',
          sampler: first(m && m.sampler, pp.sampler) || '', noise: first(m && m.noise_schedule, pp.noise_schedule) || '',
          width: first(im.width, m && m.width, pp.width) || '', height: first(im.height, m && m.height, pp.height) || '',
        });
      }
    }
    items.sort((a, b) => (a.time || 0) - (b.time || 0));
    items.forEach((it, i) => { it.no = i + 1; });
    return items;
  }

  async function open(w, data) {
    const d = w.document;
    const urls = [];
    const items = await buildItems(data, urls);
    const el = (tag, props = {}, ...kids) => {
      const e = d.createElement(tag);
      for (const [k, v] of Object.entries(props)) { if (k === 'text') e.textContent = v; else e[k] = v; }
      e.append(...kids);
      return e;
    };
    d.head.textContent = ''; d.body.textContent = '';
    d.head.append(el('meta', { charset: 'utf-8' }), el('style', { textContent: CSS }));
    d.title = `${data.meta.name || 'History'} 列表（${items.length} 张）`;

    const grid = el('div', { id: 'grid' });
    const search = el('input', { type: 'search', placeholder: '按提示词、种子筛选', size: 24 });
    const sizeIn = el('input', { type: 'range', min: 120, max: 520, value: 220, title: '缩略图大小' });
    const sort = el('select', {}, el('option', { value: 'asc', text: '由旧到新' }), el('option', { value: 'desc', text: '由新到旧' }));
    const count = el('span', { text: `${items.length} 张` });
    d.body.append(
      el('header', {}, el('h1', { text: `${data.meta.name || 'History'} — ${fmtTime(toDate(data.meta.lastSavedAt))}` }), search, sort, sizeIn, count),
      grid,
      el('footer', { text: '本标签页中的图像只有在原 NovelAI 标签页保持打开时才能显示。关闭或重新加载原标签页后，这些图像将无法显示。' }),
    );

    const cards = items.map((it, i) => {
      const cap = `#${it.no}  ${fmtTime(it.time)}  seed ${it.seed}`;
      const media = it.url || it.thumb
        ? el('img', { src: it.url || it.thumb, loading: 'lazy', decoding: 'async', alt: `#${it.no}` })
        : el('div', { className: 'ph', text: '无图像' });
      const fig = el('figure', { title: it.prompt }, media, el('figcaption', { text: it.url ? cap : cap + '（无原图）' }));
      fig.dataset.q = [it.prompt, it.negative, it.seed, it.model, ...it.chars].join('\n').toLowerCase();
      fig.addEventListener('click', () => show(i));
      return fig;
    });
    grid.append(...cards);

    const lbImg = el('img'); const nav = (id, t, dir) => { const b = el('button', { id, className: 'nav', text: t, title: dir < 0 ? '上一张 (←)' : '下一张 (→)' }); b.addEventListener('click', (e) => { e.stopPropagation(); step(dir); }); return b; };
    const lbWrap = el('div', { id: 'lbimg' }, nav('lbprev', '◀', -1), lbImg, nav('lbnext', '▶', 1));
    const info = el('div', { id: 'info' });
    const lb = el('div', { id: 'lb' }, lbWrap, info);
    d.body.append(lb);
    let cur = -1;
    function closeLightbox() {
      if (!lb.classList.contains('on')) return;
      lb.classList.remove('on', 'closing');
      cur = -1;
    }
    const visible = () => [...grid.children].map((c) => cards.indexOf(c)).filter((i) => i >= 0 && !cards[i].hidden);
    const copy = async (text) => {
      try { await w.navigator.clipboard.writeText(text); return; } catch (_) { }
      const t = el('textarea', { value: text }); d.body.append(t); t.select(); try { d.execCommand('copy'); } catch (_) { } t.remove();
    };
    const section = (label, text) => {
      const btn = el('button', { text: '复制' });
      btn.addEventListener('click', async () => { await copy(text); btn.textContent = '已复制'; setTimeout(() => { btn.textContent = '复制'; }, 800); });
      return el('div', { className: 'sec' }, el('b', {}, el('span', { text: label }), btn), el('pre', { text }));
    };
    function show(i) {
      cur = i; const it = items[i];
      lbImg.src = it.url || it.thumb || '';
      info.textContent = '';
      info.append(
        el('div', { className: 'sec' }, el('b', { text: `#${it.no} / ${items.length}` }),
          el('pre', { text: `${fmtTime(it.time)}\n${it.model}\n${it.width}×${it.height}  步数 ${it.steps}  缩放 ${it.scale}\n${it.sampler} ${it.noise}\nseed ${it.seed}\n${it.iid}${it.url ? '' : '\n（无原图：显示缩略图）'}` })),
        section('提示词', it.prompt),
        ...it.chars.map((c, k) => section(`角色${k + 1}`, c)),
        section('负面提示词', it.negative),
      );
      lb.classList.remove('closing');
      lb.classList.add('on');
    }
    function step(dir) {
      const v = visible(); if (!v.length) return;
      const pos = v.indexOf(cur); show(v[(pos < 0 ? 0 : (pos + dir + v.length) % v.length)]);
    }
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target === lbWrap) closeLightbox(); });
    d.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
    });

    search.addEventListener('input', () => {
      const q = search.value.toLowerCase(); let n = 0;
      for (const c of cards) { c.hidden = !!q && !c.dataset.q.includes(q); if (!c.hidden) n++; }
      count.textContent = `${n} 张`;
    });
    sizeIn.addEventListener('input', () => grid.style.setProperty('--sz', sizeIn.value + 'px'));
    sort.addEventListener('change', () => {
      const list = sort.value === 'desc' ? [...cards].reverse() : cards;
      grid.append(...list);
    });

    const timer = setInterval(() => {
      if (w.closed) { clearInterval(timer); urls.forEach((u) => URL.revokeObjectURL(u)); }
    }, 3000);
    return items.length;
  }

  return { open, _pngComment: pngComment };
})();


(() => {
  const start = () => {
(() => {
  if (window.top !== window || document.getElementById('nsm-host')) return;
  const T = globalThis.SessionTool;

  const host = document.createElement('div');
  host.id = 'nsm-host';
  host.style.cssText = 'position:fixed;z-index:2147483647;display:none;visibility:hidden;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host {
        --nsm-bg: var(--nai-popup-bg, rgba(22, 23, 38, 0.97));
        --nsm-surface: var(--nai-popup-surface, #20223a);
        --nsm-hint: var(--nai-popup-hint, #141527);
        --nsm-text: var(--nai-popup-text, #e8e8f2);
        --nsm-muted: var(--nai-popup-muted, #8f92ad);
        --nsm-border: var(--nai-popup-border, #3d3f5c);
        --nsm-border-soft: var(--nai-popup-border-soft, #2b2d46);
        --nsm-accent: var(--nai-popup-accent, #e3cc78);
        --nsm-accent-text: var(--nai-popup-accent-text, #17182b);
        --nsm-hover: var(--nai-popup-hover, #262946);
        --nsm-danger: var(--nai-popup-danger, #ff8484);
        --nsm-font: var(--nai-popup-font, system-ui, sans-serif);
        --nsm-shadow: var(--nai-popup-shadow, 0 18px 48px rgba(0, 0, 0, 0.55));
      }
      *{box-sizing:border-box;font-size:13px;line-height:1.4;font-family:var(--nsm-font)}
      button{cursor:pointer;border:1px solid var(--nsm-border);background:var(--nsm-surface);color:var(--nsm-text);border-radius:6px;padding:4px 9px;font-family:inherit}
      button:hover{background:var(--nsm-hover);border-color:var(--nsm-accent)}
      button:disabled{opacity:.5;cursor:default}
      input,select{font-family:inherit}
      #panel{display:block;overflow:auto;background:var(--nsm-bg);color:var(--nsm-text);border:1px solid var(--nsm-border);border-radius:10px;padding:10px;box-shadow:var(--nsm-shadow);scrollbar-color:var(--nai-popup-scroll, #4b4e6b) transparent;opacity:0;pointer-events:none}
      :host(.nsm-open) #panel{opacity:1;pointer-events:auto}
      :host(.nsm-closing) #panel{opacity:0;pointer-events:none}
      .row{display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--nsm-border-soft)}
      .thumb{position:relative;width:56px;height:56px;flex:none;border-radius:5px;overflow:hidden;background:var(--nsm-hint)}
      .row img{width:100%;height:100%;object-fit:contain;border-radius:5px;background:var(--nsm-hint);display:block}
      .info{flex:1;min-width:0} .id{color:var(--nsm-muted);font-size:11px;white-space:pre-wrap;word-break:break-all}
      .actions{display:flex;gap:4px;flex-direction:column}
      #msg{margin:6px 0;color:var(--nsm-accent);white-space:pre-wrap} #msg.err{color:var(--nsm-danger)}
      header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;cursor:grab;user-select:none;touch-action:none}
      header:active{cursor:grabbing}
      #qbanner{background:var(--nsm-danger);color:#fff;font-weight:600;padding:8px 10px;border-radius:8px;margin-bottom:6px;box-shadow:0 4px 16px rgba(0,0,0,.25)}
      #qbanner[hidden]{display:none}
      #quota{margin:4px 0 8px;font-size:12px;color:var(--nsm-muted)}
      #qbar{height:6px;background:var(--nai-popup-accent-soft, var(--nsm-border-soft));border-radius:3px;overflow:hidden;margin:4px 0}
      #qbar i{display:block;height:100%;width:0;background:var(--nsm-accent)} #qbar i.warn{background:#f59f00} #qbar i.over{background:var(--nsm-danger)}
      #qset{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
      #qin{width:64px;background:var(--nsm-hint);color:var(--nsm-text);border:1px solid var(--nsm-border);border-radius:6px;padding:2px 6px}
    </style>
    <div id="qbanner" hidden></div>
    <div id="panel">
      <header><b>🗂 历史管理</b><span><button id="imp">导入</button> <button id="rel">刷新</button></span></header>
      <div id="quota">
        <div id="qline"></div><div id="qbar"><i></i></div>
        <div id="qset">上限 <input id="qin" type="number" min="0.1" step="0.5"> GB <button id="qsave">设置</button> <button id="qauto">恢复默认值</button></div>
      </div>
      <div id="msg"></div>
      <button id="reload" hidden>重新加载页面</button>
      <div id="list"></div>
      <input id="file" type="file" accept=".zip" hidden>
    </div>`;
  document.documentElement.appendChild(host);

  let lastThemeAt = 0;
  let themeRevealTimer = 0;
  function showThemedHost() {
    host.classList.remove('nsm-open', 'nsm-closing');
    host.style.pointerEvents = '';
    host.style.display = 'block';
    host.style.visibility = 'hidden';
    applyPanelTheme(true);
    clearTimeout(themeRevealTimer);
    themeRevealTimer = setTimeout(() => {
      applyPanelTheme(true);
      requestAnimationFrame(() => {
        if (host.style.display === 'none' || host.classList.contains('nsm-closing')) return;
        host.style.visibility = 'visible';
        host.classList.add('nsm-open');
      });
    }, 220);
  }
  function hideThemedHost(immediate = false) {
    clearTimeout(themeRevealTimer);
    host.classList.remove('nsm-open', 'nsm-closing');
    host.style.display = 'none';
    host.style.visibility = 'hidden';
    host.style.pointerEvents = 'none';
  }
  function applyPanelTheme(force = false, requireAccent = false) {
    const now = Date.now();
    if (!force && now - lastThemeAt < 400) return false;
    lastThemeAt = now;
    try {
      if (typeof globalThis.__NAIApplyPopupTheme === 'function') {
        return globalThis.__NAIApplyPopupTheme(host, requireAccent) !== false;
      }
    } catch (_) { }
    return false;
  }

  const $ = (s) => root.querySelector(s);
  const panel = $('#panel');
  const panelHeader = panel.querySelector('header');
  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }
  function findDialogTitle() {
    return [...document.querySelectorAll('h1,h2,h3,h4,div,span')]
      .find((el) => {
        const text = (el.textContent || '').trim();
        return text.length < 80
          && /^(Load a previous session\?|加载之前的会话？)$/i.test(text)
          && isVisible(el);
      }) || null;
  }
  function commonAncestor(a, b) {
    const chain = new Set();
    for (let node = a; node; node = node.parentElement) chain.add(node);
    for (let node = b; node; node = node.parentElement) {
      if (chain.has(node)) return node;
    }
    return null;
  }
  function findDialog() {
    const title = findDialogTitle();
    const actionText = /^\s*(New Session|新会话)\s*$/i;
    const buttons = [...document.querySelectorAll('button, [role="button"], a')]
      .filter((el) => actionText.test(el.textContent || '') && isVisible(el));
    for (const button of buttons) {
      let node = button.parentElement;
      let candidate = null;
      while (node && node !== document.body) {
        if (/previous session|last saved|加载之前的会话|上次保存/i.test(node.textContent || '')) {
          candidate = node;
        }
        node = node.parentElement;
      }
      if (candidate) {
        const frame = title ? commonAncestor(title, button) : null;
        const element = frame && frame !== document.body
          ? frame
          : (candidate.closest('[role="dialog"]') || candidate);
        return {
          element: element.closest('[role="dialog"]') || element,
          title,
        };
      }
    }

    if (!title) return null;
    return {
      element: title.closest('[role="dialog"]') || title.parentElement?.parentElement || title,
      title,
    };
  }

  function positionPanel(dialog) {
    if (manualPosition) return;
    const rect = dialog.element.getBoundingClientRect();
    const titleRect = dialog.title ? dialog.title.getBoundingClientRect() : null;
    const anchorTop = titleRect && titleRect.height > 0
      ? Math.min(rect.top, titleRect.top)
      : rect.top;
    const GAP = 12;
    const EDGE = 8;
    const MAX_WIDTH = 420;
    const roomRight = innerWidth - rect.right - GAP * 2;
    const roomLeft = rect.left - GAP * 2;
    let left;
    let top;
    let width;
    if (roomRight >= 300) {
      width = Math.min(MAX_WIDTH, roomRight);
      left = rect.right + GAP;
      top = anchorTop;
    } else if (roomLeft >= 300) {
      width = Math.min(MAX_WIDTH, roomLeft);
      left = rect.left - GAP - width;
      top = anchorTop;
    } else {
      width = Math.min(MAX_WIDTH, innerWidth - EDGE * 2);
      left = clamp(rect.left, EDGE, innerWidth - width - EDGE);
      top = Math.max(rect.bottom, anchorTop) + GAP;
    }
    top = clamp(top, EDGE, Math.max(EDGE, innerHeight - 160));
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
    host.style.right = 'auto';
    host.style.bottom = 'auto';
    host.style.width = `${width}px`;
    panel.style.maxHeight = `${Math.max(160, innerHeight - top - 24)}px`;
  }

  let dragState = null;
  let manualPosition = false;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  panelHeader.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button, input, select, textarea, a')) return;
    const rect = host.getBoundingClientRect();
    dragState = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      pointerId: event.pointerId,
    };
    manualPosition = true;
    host.style.right = 'auto';
    host.style.bottom = 'auto';
    host.style.left = `${rect.left}px`;
    host.style.top = `${rect.top}px`;
    panelHeader.style.cursor = 'grabbing';
    try { panelHeader.setPointerCapture(event.pointerId); } catch (_) { }
    event.preventDefault();
  });
  panelHeader.addEventListener('pointermove', (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const left = clamp(event.clientX - dragState.dx, 8, innerWidth - 120);
    const top = clamp(event.clientY - dragState.dy, 8, innerHeight - 60);
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
  });
  const endDrag = (event) => {
    if (!dragState || (event && event.pointerId !== dragState.pointerId)) return;
    dragState = null;
    panelHeader.style.cursor = 'grab';
    try { panelHeader.releasePointerCapture(event.pointerId); } catch (_) { }
  };
  panelHeader.addEventListener('pointerup', endDrag);
  panelHeader.addEventListener('pointercancel', endDrag);
  const IDLE = '若在多个标签页中打开 NovelAI，内容可能被互相覆盖。请只在单个标签页中操作。';
  const msg = (t, err, needReload) => { $('#msg').textContent = t; $('#msg').className = err ? 'err' : ''; $('#reload').hidden = !needReload; };
  const fmt = (d) => new Date(d).toLocaleString('zh-CN');

  async function guarded(label, fn, btn) {
    if (btn) btn.disabled = true;
    msg(label + ' …');
    try { await fn(); } catch (e) { console.error(e); msg('失败：' + (e.message || e), true); }
    finally { if (btn) btn.disabled = btn.dataset.locked === '1'; }
  }

  function lock(btn, locked, why) { btn.dataset.locked = locked ? '1' : ''; btn.disabled = locked; btn.title = locked ? why : ''; }
  const fb = (b) => T.fmtBytes(b);

  function renderQuota(q) {
    const pct = q.quota ? q.used / q.quota : 0;
    const ban = $('#qbanner');
    ban.hidden = !q.over;
    ban.textContent = q.over ? `历史总配额已超出设定值（当前 ${fb(q.used)} / 设定 ${fb(q.quota)}）。无法复制或导入。` : '';
    $('#qline').textContent = `已用 ${fb(q.used)} / 上限 ${fb(q.quota)}（${q.custom ? '手动设置' : '默认值'}，共 ${q.count} 张图像）`;
    const bar = $('#qbar i');
    bar.style.width = Math.min(100, pct * 100) + '%';
    bar.className = q.over ? 'over' : pct >= 0.8 ? 'warn' : '';
    $('#qin').value = (q.quota / T.GB).toFixed(1);
    lock($('#imp'), q.over, '已超出配额，无法导入');
  }

  let renderToken = 0;
  async function render() {
    const token = ++renderToken;
    const list = $('#list');
    list.textContent = '';

    let sessions;
    try {
      sessions = await T.listSessions();
    } catch (e) {
      msg(e.message, true);
      return;
    }
    if (token !== renderToken) return;

    const rows = [];
    for (const s of sessions) {
      const row = document.createElement('div');
      row.className = 'row';
      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      if (typeof s.recentThumbnail === 'string' && s.recentThumbnail.startsWith('data:image/')) img.src = s.recentThumbnail;
      thumb.append(img);
      const info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = '<div></div><div class="id"></div>';
      info.firstChild.textContent = `${s.name || 'History'} / ${s.imageCount ?? '?'} 张 / 统计中…`;
      info.lastChild.textContent = `${fmt(s.lastSavedAt)}\n${s.id}`;
      const act = document.createElement('div');
      act.className = 'actions';
      const dup = document.createElement('button'); dup.textContent = '复制';
      const exp = document.createElement('button'); exp.textContent = '保存为 ZIP';
      const view = document.createElement('button'); view.textContent = '列表查看';
      view.onclick = async () => {
        const w = window.open('', '_blank');
        if (!w) { msg('弹出窗口被拦截。请允许本站弹出窗口。', true); return; }
        w.document.title = '加载中 …'; w.document.body.textContent = '加载中 …';
        await guarded('正在生成列表', async () => {
          try {
            const n = await SessionViewer.open(w, await T.readSession(s.id));
            msg(`已在新的标签页中显示 ${n} 张图像。请不要关闭原来的 NovelAI 标签页（否则图像将无法显示）。`);
          } catch (e) { w.close(); throw e; }
        }, view);
      };
      dup.onclick = () => guarded('正在复制', async () => {
        const id = await T.duplicateSession(s.id);
        msg(`已复制：${id}\n重新加载页面后，上方的历史列表会更新。`, false, true);
        await render();
      }, dup);
      exp.onclick = () => guarded('正在导出', async () => {
        const { blob, filename } = await T.exportSessionZip(s.id);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
        msg(`已保存：${filename} (${(blob.size / 1048576).toFixed(1)}MB)`);
      }, exp);
      act.append(view, dup, exp);
      row.append(thumb, info, act);
      list.append(row);
      rows.push({ session: s, info, dup });
    }
    if (!sessions.length) list.textContent = '暂无历史';

    const applyQuota = async () => {
      let q;
      try { q = await T.quotaInfo(); } catch (e) { if (token === renderToken) msg(e.message, true); return; }
      if (token !== renderToken) return;
      renderQuota(q);
      for (const { session, info, dup } of rows) {
        const size = q.bySession.get(session.id) || 0;
        info.firstChild.textContent = `${session.name || 'History'} / ${session.imageCount ?? '?'} 张 / ${fb(size)}`;
        const blocked = q.used + size > q.quota;
        lock(dup, blocked, `复制后将超出上限（当前 ${fb(q.used)} ＋ ${fb(size)} > 上限 ${fb(q.quota)}）`);
        if (blocked) dup.textContent = '不可复制';
      }
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(applyQuota, { timeout: 400 });
    } else {
      setTimeout(applyQuota, 30);
    }
  }

  $('#rel').onclick = render;
  $('#qsave').onclick = () => {
    const v = parseFloat($('#qin').value);
    if (!(v > 0)) { msg('上限必须是以 GB 为单位的正数。', true); return; }
    T.setQuotaBytes(v * T.GB); msg(`上限已设为 ${v} GB。`); render();
  };
  $('#qauto').onclick = () => { T.setQuotaBytes(null); msg('上限已恢复为默认值（10GB）。'); render(); };
  $('#reload').onclick = () => location.reload();
  $('#imp').onclick = () => $('#file').click();
  $('#file').onchange = (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    guarded('正在导入', async () => {
      const id = await T.importSessionZip(f);
      msg(`已导入：${id}\n重新加载页面后，上方的历史列表会更新。`, false, true);
      await render();
    }, $('#imp'));
  };

  let wasShown = false;
  function update() {
    const dialog = findDialog();
    if (!dialog) {
      if (host.style.display !== 'none' || wasShown) hideThemedHost();
      wasShown = false;
      manualPosition = false;
      return;
    }

    if (!wasShown) {
      wasShown = true;
      msg(IDLE);
      render();
      showThemedHost();
    } else if (host.style.display === 'none') {
      showThemedHost();
    }
    positionPanel(dialog);
  }
  let timer = 0;
  const schedule = () => {
    if (!timer) timer = setTimeout(() => { timer = 0; update(); }, 150);
  };
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  document.addEventListener('nai-zh-revealed', schedule);
  addEventListener('resize', schedule);
  msg(IDLE);
  schedule();
})();


  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();


/* ==========================================================================
 * 第三方代码许可声明
 * 本脚本包含以下 MIT License 代码；完整许可文本见 THIRD_PARTY_NOTICES.md。
 * - NovelAI Prompt Helper 1.2.3, Copyright (c) Takoro
 * - NovelAI 会话管理工具 0.4.1, Copyright (c) 2026 だくてん
 * - Danbooru 标签中文对照表, Copyright (c) 2026 amenorira
 * ========================================================================== */
