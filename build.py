# -*- coding: utf-8 -*-
"""
Agent 建站教程站 — 静态站点构建脚本
用法：python build.py
说明：把 src/ 下的章节正文片段（纯内容 HTML）套进统一的页面外壳，
      输出到项目根目录，生成带侧边栏导航与上下章翻页的多章节静态站点。
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
SITE_NAME = "Agent 建站指南"
SITE_TAG = "Beginner's Guide"

# ---------------- 页面清单（顺序即导航顺序） ----------------
PAGES = [
    dict(
        slug="index", file="index.html", src="index.html", num="00", nav="教程首页",
        title="让 Agent 替你把网站做出来",
        lede="一份写给完全新手的实用指南：从认识市面上的 Agent 工具，到亲手把一个网站发布上线，全程不用先学会写代码。",
        kind="home", minutes="3 分钟",
    ),
    dict(
        slug="tools", file="01-agent-tools.html", src="01-agent-tools.html", num="01", nav="先认识 Agent 工具",
        title="市面上有哪些 Agent 工具",
        lede="先把工具地图看一遍。知道每类工具擅长什么，你就不会拿着锤子找钉子。",
        minutes="8 分钟",
    ),
    dict(
        slug="workflow", file="02-workflow.html", src="02-workflow.html", num="02", nav="Agent 做网站的完整流程",
        title="Agent 是怎么把网站做出来的",
        lede="七个步骤，每一步谁负责、你该给什么、Agent 会产出什么——先看清全貌，再动手。",
        minutes="7 分钟",
    ),
    dict(
        slug="prompt", file="03-prompt.html", src="03-prompt.html", num="03", nav="把需求讲清楚",
        title="提示词：把需求讲清楚",
        lede="Agent 做得好不好，八成取决于你说得清不清楚。这一章给你一个能直接套用的需求模板。",
        minutes="9 分钟",
    ),
    dict(
        slug="design", file="04-design-system.html", src="04-design-system.html", num="04", nav="设计系统速成",
        title="不懂设计，也能让它高级",
        lede="色彩、字体、间距、圆角——四个变量决定了页面是「像样」还是「廉价」。新手也能掌握。",
        minutes="10 分钟",
    ),
    dict(
        slug="build", file="05-build.html", src="05-build.html", num="05", nav="动手做一个落地页",
        title="实战：从零做一个落地页",
        lede="跟着做一遍。从空文件到完整页面，六步走完，每一句提示词和关键代码都给你。",
        minutes="15 分钟",
    ),
    dict(
        slug="launch", file="06-launch.html", src="06-launch.html", num="06", nav="发布上线与迭代",
        title="把网站挂到互联网上",
        lede="本地看着好看不算数，能被别人打开才算完成。上线、分享、收集反馈、再改一版。",
        minutes="8 分钟",
    ),
    dict(
        slug="checklist", file="07-checklist.html", src="07-checklist.html", num="07", nav="检查清单与常见坑",
        title="上线前的检查清单",
        lede="十条清单过一遍，避开新手最常踩的六个坑。做完这章，你的页面就已经超过大多数人的第一版了。",
        minutes="6 分钟",
    ),
]

for p in PAGES:
    p["href"] = p["file"]

DOC_PAGES = [p for p in PAGES if p.get("kind") != "home"]


# ---------------- 页面外壳 ----------------
def topbar(active_slug, prefix=""):
    links = [("index", "首页"), ("tools", "工具地图"), ("workflow", "工作流"),
             ("build", "实战"), ("checklist", "检查清单")]
    by_slug = {p["slug"]: p for p in PAGES}
    items = "".join(
        f'<a href="{by_slug[s]["href"]}">{t}</a>' for s, t in links
    )
    return f"""<div class="progress-track"><span class="progress-bar" id="progressBar"></span></div>
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="index.html" aria-label="{SITE_NAME} 首页">
      <span class="brand-mark" aria-hidden="true">A</span>
      <span>{SITE_NAME}</span>
      <span class="brand-sub">{SITE_TAG}</span>
    </a>
    <nav class="topnav" aria-label="主导航">{items}</nav>
    <button class="nav-toggle" id="navToggle" aria-label="打开章节导航" aria-expanded="false">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</header>"""


def sidebar(active_slug):
    chapters = "".join(
        f'<li class="{"is-active" if p["slug"] == active_slug else ""}">'
        f'<a href="{p["href"]}"><span class="idx">{p["num"]}</span><span>{p["nav"]}</span></a></li>'
        for p in DOC_PAGES
    )
    home_active = "is-active" if active_slug == "index" else ""
    return f"""<aside class="sidebar" id="sidebar" aria-label="章节导航">
  <div class="sidebar-group">
    <div class="sidebar-title">{SITE_TAG}</div>
    <ul class="sidebar-list">
      <li class="{home_active}"><a href="index.html"><span class="idx">00</span><span>教程首页</span></a></li>
    </ul>
  </div>
  <div class="sidebar-group">
    <div class="sidebar-title">章节</div>
    <ul class="sidebar-list">{chapters}</ul>
  </div>
</aside>
<div class="sidebar-scrim" id="sidebarScrim" aria-hidden="true"></div>"""


def pager(active_slug):
    idx = next(i for i, p in enumerate(DOC_PAGES) if p["slug"] == active_slug)
    prev_p = DOC_PAGES[idx - 1] if idx > 0 else None
    next_p = DOC_PAGES[idx + 1] if idx < len(DOC_PAGES) - 1 else None

    def link(p, direction):
        if p is None:
            label = "已是最前" if direction == "prev" else "已是最后"
            return f'<span class="pager-link {direction} empty"><span class="dir">{label}</span><span class="t">—</span></span>'
        arrow = "←" if direction == "prev" else "→"
        dir_text = f"{arrow} 上一章" if direction == "prev" else f"下一章 {arrow}"
        return (f'<a class="pager-link {direction}" href="{p["href"]}">'
                f'<span class="dir">{dir_text}</span><span class="t">{p["nav"]}</span></a>')

    return f'<nav class="pager" aria-label="章节翻页">{link(prev_p, "prev")}{link(next_p, "next")}</nav>'


def footer():
    return f"""<footer class="sitefoot">
  <div class="sitefoot-inner">
    <span class="small">{SITE_NAME} · 写给完全新手的 Agent 建站入门教程</span>
    <span class="mono-label">使用 ← → 方向键翻章</span>
  </div>
</footer>"""


def render(page, body):
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{page["title"]} · {SITE_NAME}</title>
<meta name="description" content="{page["lede"]}">
<meta name="theme-color" content="#FBFBF9">
<link rel="stylesheet" href="assets/style.css?v=20260915b">
</head>
<body class="page-docs">
{topbar(page["slug"])}
<div class="shell">
{sidebar(page["slug"])}
<main class="content">
<header class="chapter-head">
  <span class="eyebrow">第 {page["num"]} 章 · {SITE_TAG}</span>
  <h1 class="display">{page["title"]}</h1>
  <p class="lede">{page["lede"]}</p>
  <div class="chapter-meta">
    <span>预估阅读 {page["minutes"]}</span>
    <span>难度：新手友好</span>
  </div>
</header>
<article class="prose">
{body.strip()}
</article>
{pager(page["slug"])}
</main>
</div>
{footer()}
<script src="assets/site.js?v=20260915b"></script>
</body>
</html>
"""


def render_home(page, body):
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{page["title"]} · {SITE_NAME}</title>
<meta name="description" content="{page["lede"]}">
<meta name="theme-color" content="#FBFBF9">
<link rel="stylesheet" href="assets/style.css?v=20260915b">
</head>
<body class="page-home">
{topbar(page["slug"])}
<main>
{body.strip()}
</main>
{footer()}
<script src="assets/site.js?v=20260915b"></script>
</body>
</html>
"""


def main():
    built = 0
    for page in PAGES:
        partial = SRC / page["src"]
        if not partial.exists():
            print(f"  [跳过] 缺少正文片段 {partial.name}")
            continue
        body = partial.read_text(encoding="utf-8")
        html = render_home(page, body) if page.get("kind") == "home" else render(page, body)
        (ROOT / page["file"]).write_text(html, encoding="utf-8")
        print(f"  已生成 {page['file']}")
        built += 1

    # 兜底：如果用户直接打开源码目录，也放一份样式备份
    print(f"\n完成：共生成 {built} 个页面 -> {ROOT}")


if __name__ == "__main__":
    main()
