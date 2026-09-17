# -*- coding: utf-8 -*-
"""
Agent 建站教程站 — 静态站点构建脚本 v2（重构版）
用法：python build.py
说明：把 src/ 下的正文片段套进统一页面外壳（吸顶导航 + 进度条 + 首屏 +
      上下章翻页），CSS/JS 直接内联进 HTML，输出零外部请求的单文件页面。
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
SITE_NAME = "Agent 建站指南"
CSS = (ROOT / "assets" / "style.css").read_text(encoding="utf-8")
JS = (ROOT / "assets" / "site.js").read_text(encoding="utf-8")

# 可点卡片右上角箭头（内联 SVG，14px，跟随文字颜色）
ARROW = ('<span class="card-arrow" aria-hidden="true">'
         '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" '
         'stroke-linecap="round" stroke-linejoin="round">'
         '<path d="M2.5 7h9M7.5 3.5 11 7l-3.5 3.5"/></svg></span>')


def plain(html: str) -> str:
    """去掉标签，供 meta description 使用。"""
    return re.sub(r"<[^>]+>", "", html)

# ---------------- 页面清单（顺序即导航顺序） ----------------
PAGES = [
    dict(
        slug="index", file="index.html", src="index.html", nav="首页", num="00",
        pill="写给完全新手 · 3 章 · 约 13 分钟",
        title="不会代码，也能让 Agent 帮你做出网站",
        sub='说清楚你想要什么，剩下的交给 <span class="term term--down" tabindex="0" data-tip="一个能听懂你说话、并代替你动手干活的 AI 员工">Agent</span> 做。',
        cta_text="开始第 1 章 →", cta_href="01-agent-tools.html",
        hero_center=True,    ),
    dict(
        slug="tools", file="01-agent-tools.html", src="01-agent-tools.html", nav="工具", num="01",
        pill="第 01 章 · 3 分钟",
        title="先认识 Agent 工具",
        sub="五类工具，各有分工。看完就知道该把任务交给谁。",
        cta_text="下一章：流程与提示词 →", cta_href="02-workflow.html",
    ),
    dict(
        slug="workflow", file="02-workflow.html", src="02-workflow.html", nav="流程", num="02",
        pill="第 02 章 · 3 分钟",
        title="五步流程，一句话需求",
        sub="先看清全貌再动手；三要素让你把需求一次讲清楚。",
        cta_text="下一章：动手做一个页面 →", cta_href="03-build.html",
    ),
    dict(
        slug="build", file="03-build.html", src="03-build.html", nav="实战", num="03",
        pill="第 03 章 · 7 分钟",
        title="三步做出一个网站",
        sub="从一句提示词到上线网址，都在这一章走完。",
        cta_text="开始第 1 步 ↓", cta_href="#make-steps",
    ),
]

NAV = [("index", "首页"), ("tools", "工具"), ("workflow", "流程"), ("build", "实战")]
BY_SLUG = {p["slug"]: p for p in PAGES}
CHAPTERS = [p for p in PAGES if p["slug"] != "index"]


def topbar(active_slug):
    items = "".join(
        f'<a href="{BY_SLUG[s]["file"]}"{" class=\"is-active\"" if s == active_slug else ""}>{t}</a>'
        for s, t in NAV
    )
    return f"""<div class="progress"><span id="progressBar"></span></div>
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="index.html" aria-label="{SITE_NAME} 首页">
      <span class="brand-mark" aria-hidden="true">A</span><span>{SITE_NAME}</span>
    </a>
    <nav class="topnav" aria-label="主导航">{items}</nav>
  </div>
</header>"""


def pager(active_slug):
    """章节页底部上一章 / 下一章：两卡居中等宽（≤320px）；末章只有上一章时单卡居中。"""
    idx = next(i for i, p in enumerate(PAGES) if p["slug"] == active_slug)
    seq = PAGES
    prev_p = seq[idx - 1] if idx > 0 else None
    next_p = seq[idx + 1] if idx < len(seq) - 1 else None

    def link(p, direction):
        if direction == "prev":
            inner = f'<span class="dir">← 上一章</span><span class="t">{p["nav"]}</span>'
        else:
            inner = f'<span class="dir">下一章 →</span><span class="t">{p["nav"]}</span>'
        return f'<a class="{direction}" href="{p["file"]}">{inner}{ARROW}</a>'

    if next_p is None:  # 末章：只有上一章，单卡居中，不留空位
        return f'<nav class="pager is-single" aria-label="章节翻页">{link(prev_p, "prev")}</nav>'
    return f'<nav class="pager" aria-label="章节翻页">{link(prev_p, "prev")}{link(next_p, "next")}</nav>'


def hero(page):
    center = ' style="text-align:center"' if page.get("hero_center") else ""
    sub_style = ' style="margin-inline:auto"' if page.get("hero_center") else ""
    cta = f'<div class="btn-row"><a class="btn btn-primary" href="{page["cta_href"]}">{page["cta_text"]}</a></div>'
    return f"""<section class="hero"{center}>
  <div class="wrap">
    <span class="pill">{page["pill"]}</span>
    <h1 class="hero-title"{sub_style}>{page["title"]}</h1>
    <p class="hero-sub"{sub_style}>{page["sub"]}</p>
    {cta}
  </div>
</section>"""


def render(page, body):
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{page["title"]} · {SITE_NAME}</title>
<meta name="description" content="{plain(page["sub"])}">
<meta name="theme-color" content="#FAFAF7">
<style>
{CSS}</style>
</head>
<body>
{topbar(page["slug"])}
<main>
{hero(page)}
{body.strip()}
{pager(page["slug"]) if page["slug"] != "index" else ""}
</main>
<footer class="sitefoot">
  <div class="wrap">
    <span>{SITE_NAME} · 写给完全新手的 Agent 建站入门教程</span>
    <span>本站由 WorkBuddy 制作</span>
  </div>
</footer>
<script>
{JS}</script>
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
        (ROOT / page["file"]).write_text(render(page, body), encoding="utf-8")
        print(f"  已生成 {page['file']}")
        built += 1
    print(f"\n完成：共生成 {built} 个页面（CSS/JS 已内联）-> {ROOT}")


if __name__ == "__main__":
    main()
