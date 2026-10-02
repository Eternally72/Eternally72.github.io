import { projects } from './project-data.js';
import { sequenceDiagrams } from './project-diagrams.js';

// All templates use local editorial content; escape text before inserting markup.
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const link = (url, label) => `<a class="detail-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} <span aria-hidden="true">↗</span></a>`;
const list = (items) => `<ul>${items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>`;
const heading = (data) => `<div class="panel-heading"><h3>${escape(data.title)}</h3><p>${escape(data.intro)}</p></div>`;
const inspector = (node) => `<p class="inspector-label">组件说明</p><h4>${escape(node.title)}</h4><p>${escape(node.description)}</p>${list(node.points)}${link(node.source, '查看对应源码')}`;

function architecture(project) {
  const data = project.architecture;
  return `${heading(data)}<div class="architecture-detail"><figure class="architecture-figure"><figcaption>点击组件查看职责与源码<span class="diagram-scroll-hint">图表可左右滑动</span></figcaption><div class="diagram-scroll" tabindex="0" role="region" aria-label="可横向滚动的架构图"><div class="architecture-canvas"><img src="${data.image}" width="660" height="370" alt="" class="diagram-wires">${data.nodes.map((node) => `<button type="button" class="diagram-node" data-node="${node.id}" style="--node-x:${node.x}%;--node-y:${node.y}%" aria-pressed="${node.id === data.initial}" aria-controls="node-inspector"><strong>${escape(node.title)}</strong><span>${escape(node.label)}</span></button>`).join('')}</div></div><p class="diagram-note">${escape(data.note)}</p></figure><aside id="node-inspector" class="node-inspector" aria-live="polite" aria-atomic="true">${inspector(data.nodes.find((node) => node.id === data.initial))}</aside></div>`;
}

function sequence(project) {
  const data = project.sequence;
  return `${heading(data)}<figure class="sequence-figure"><figcaption>主要调用顺序<span class="diagram-scroll-hint">图表可左右滑动</span></figcaption><div class="diagram-scroll" tabindex="0" role="region" aria-label="可横向滚动的执行时序图">${sequenceDiagrams[data.diagram]}</div></figure><ol class="sequence-summary">${data.steps.map((step) => `<li>${escape(step)}</li>`).join('')}</ol><p class="detail-note">${escape(data.note)}</p><details class="failure-note"><summary>${escape(data.extraTitle)}</summary>${list(data.extra)}${link(data.source, data.sourceLabel)}</details>`;
}

function results(project) {
  const data = project.results;
  return `${heading(data)}<div class="result-metrics">${data.metrics.map((metric) => `<div><strong>${escape(metric.value)}</strong><h4>${escape(metric.label)}</h4><p>${escape(metric.note)}</p></div>`).join('')}</div>${data.comparison ? `<section class="throughput-comparison" aria-labelledby="throughput-title"><div><h4 id="throughput-title">同机单、双 Worker 对照</h4><p>并发 4，每个 Worker 1 个执行槽位；真实 LLM 短输出，每组 19 次请求。</p></div><div class="comparison-bars"><div><span>单 Worker</span><i style="--bar-width:54.23%" aria-hidden="true"></i><strong>1.764 <small>请求/秒</small></strong></div><div><span>双 Worker</span><i style="--bar-width:100%" aria-hidden="true"></i><strong>3.253 <small>请求/秒</small></strong></div></div><p class="comparison-caption">该组吞吐提升 84.4%；总耗时 P95 从 2.729 秒降至 1.683 秒。小样本对照不代表长对话、RAG / MCP 或生产容量上限。</p></section>` : ''}<dl class="evidence-list">${data.rows.map(([label, text]) => `<div><dt>${escape(label)}</dt><dd>${escape(text)}</dd></div>`).join('')}</dl><p class="detail-note">${escape(data.note)}</p><div class="detail-sources">${data.sources.map((source) => link(source.href, source.label)).join('')}</div>`;
}

export function createProjectDetails(dialog) {
  const panel = dialog.querySelector('#project-panel');
  const tabs = [...dialog.querySelectorAll('[role="tab"]')];
  const views = { architecture, sequence, results };
  let project;
  function select(view, focus = false) {
    const selected = tabs.find((tab) => tab.dataset.view === view);
    tabs.forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab === selected));
      tab.tabIndex = tab === selected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', selected.id);
    panel.innerHTML = views[view](project);
    panel.scrollTop = 0;
    if (focus) selected.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.view));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        select(tabs[next].dataset.view, true);
      }
    });
  });
  panel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-node]');
    if (!button) return;
    const node = project.architecture.nodes.find((item) => item.id === button.dataset.node);
    panel.querySelectorAll('[data-node]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    panel.querySelector('#node-inspector').innerHTML = inspector(node);
  });
  return {
    show(id, view) {
      project = projects[id];
      if (!project) throw new Error('Unknown project');
      dialog.dataset.project = id;
      dialog.querySelector('#project-dialog-title').textContent = project.title;
      dialog.querySelector('#project-dialog-subtitle').textContent = project.subtitle;
      dialog.querySelector('[data-project-source]').href = project.source;
      select(views[view] ? view : 'architecture');
    }
  };
}
