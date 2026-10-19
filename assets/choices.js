(() => {
  'use strict';

  const toolResult = document.querySelector('[data-tool-result]');
  const toolChoices = [...document.querySelectorAll('input[name="tool-level"]')];
  const tools = {
    nocode: { kind: '通用型工具', title: '从对话开始', description: 'WorkBuddy、TreaWork 等' },
    pro: { kind: '编程型工具', title: '直接修改项目', description: 'Codex、TraeCode、Claude Code 等' }
  };
  if (toolResult && toolChoices.length) {
    const updateTool = () => {
      const choice = toolChoices.find(input => input.checked);
      toolResult.hidden = !choice;
      if (!choice) return;
      const selected = tools[choice.value];
      toolResult.querySelector('[data-tool-kind]').textContent = selected.kind;
      toolResult.querySelector('[data-tool-title]').textContent = selected.title;
      toolResult.querySelector('[data-tool-description]').textContent = selected.description;
    };
    toolChoices.forEach(input => input.addEventListener('change', updateTool));
    updateTool();
  }

  function showSelectedPanel(groupName, panelAttribute) {
    const choices = [...document.querySelectorAll(`input[name="${groupName}"]`)];
    const panels = [...document.querySelectorAll(`[${panelAttribute}]`)];
    if (!choices.length || !panels.length) return;
    const update = () => {
      const selected = choices.find(input => input.checked)?.value;
      panels.forEach(panel => { panel.hidden = panel.getAttribute(panelAttribute) !== selected; });
    };
    choices.forEach(input => input.addEventListener('change', update));
    update();
  }

  showSelectedPanel('idea-route', 'data-idea-panel');
  showSelectedPanel('edit-path', 'data-edit-panel');

  const readyPanel = document.querySelector('#prompt-ready');
  const openPanel = document.querySelector('#prompt-open');
  const website = value => {
    const name = value.trim();
    return name ? (name.endsWith('网站') ? name : `${name}网站`) : '[网站类型]网站';
  };
  if (readyPanel) {
    const field = name => readyPanel.querySelector(`[data-prompt-field="${name}"]`).value.trim();
    const updatePrompt = () => {
      readyPanel.querySelector('[data-copy-text]').textContent =
        `请做一个${website(field('type'))}。目标是${field('goal') || '[希望访客做什么]'}，受众是${field('audience') || '[谁]'}，风格参考${field('style') || '[链接或描述]'}。请先列出页面结构，再生成第一版。`;
    };
    readyPanel.querySelectorAll('[data-prompt-field]').forEach(input => input.addEventListener('input', updatePrompt));
    updatePrompt();
  }
  if (openPanel) {
    const input = openPanel.querySelector('[data-prompt-field="open-type"]');
    const updatePrompt = () => {
      openPanel.querySelector('[data-copy-text]').textContent =
        `我想做一个${website(input.value)}，还没想清楚。请先问我几个问题，帮我明确目标、受众和风格。`;
    };
    input.addEventListener('input', updatePrompt);
    updatePrompt();
  }
})();
