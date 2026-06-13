import { c as create_ssr_component, d as add_attribute, f as each, e as escape } from "../../../../chunks/ssr.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils2.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
const css = {
  code: "h1.svelte-1n9jexv{font-size:1.75rem;font-weight:700;color:var(--text-primary);margin:0 0 1.5rem 0}.form-card.svelte-1n9jexv{background:var(--card-bg);border-radius:0.5rem;padding:2rem;box-shadow:0 1px 3px 0 rgba(0, 0, 0, 0.1);max-width:800px}.form-group.svelte-1n9jexv{margin-bottom:1.5rem}.form-row.svelte-1n9jexv{display:grid;grid-template-columns:repeat(2, 1fr);gap:1.5rem}.form-actions.svelte-1n9jexv{display:flex;justify-content:flex-end;gap:1rem;margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border-color)}a.svelte-1n9jexv{text-decoration:none}",
  map: '{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount } from \\"svelte\\";\\nimport { goto } from \\"$app/navigation\\";\\nlet users = [];\\nlet loading = false;\\nlet form = {\\n  title: \\"\\",\\n  type: \\"policy_dispute\\",\\n  severity: \\"medium\\",\\n  assignee_id: \\"\\",\\n  related_type: \\"consult\\",\\n  related_id: \\"\\",\\n  due_date: \\"\\"\\n};\\nonMount(async () => {\\n  try {\\n    const res = await fetch(\\"/api/auth/current-user\\");\\n    const data = await res.json();\\n    const usersRes = await fetch(\\"/api/risk-alerts\\");\\n    const alertsData = await usersRes.json();\\n  } catch (e) {\\n    console.error(e);\\n  }\\n});\\nasync function submit() {\\n  if (!form.title || !form.assignee_id) {\\n    alert(\\"\\\\u8BF7\\\\u586B\\\\u5199\\\\u6807\\\\u9898\\\\u548C\\\\u8D23\\\\u4EFB\\\\u4EBA\\");\\n    return;\\n  }\\n  loading = true;\\n  try {\\n    const res = await fetch(\\"/api/risk-alerts\\", {\\n      method: \\"POST\\",\\n      headers: { \\"Content-Type\\": \\"application/json\\" },\\n      body: JSON.stringify(form)\\n    });\\n    const data = await res.json();\\n    if (data.id) {\\n      goto(`/risk-alerts/${data.id}`);\\n    } else {\\n      alert(\\"\\\\u521B\\\\u5EFA\\\\u5931\\\\u8D25\\");\\n    }\\n  } catch (e) {\\n    alert(\\"\\\\u7F51\\\\u7EDC\\\\u9519\\\\u8BEF\\");\\n  }\\n  loading = false;\\n}\\nconst typeOptions = [\\n  { value: \\"policy_dispute\\", label: \\"\\\\u653F\\\\u7B56\\\\u9002\\\\u7528\\\\u4E89\\\\u8BAE\\" },\\n  { value: \\"draft_version_chaos\\", label: \\"\\\\u5E95\\\\u7A3F\\\\u7248\\\\u672C\\\\u6DF7\\\\u4E71\\" },\\n  { value: \\"response_unsigned\\", label: \\"\\\\u7B54\\\\u590D\\\\u672A\\\\u7B7E\\\\u6536\\" },\\n  { value: \\"missing_docs\\", label: \\"\\\\u8865\\\\u5145\\\\u8D44\\\\u6599\\\\u7F3A\\\\u5931\\" },\\n  { value: \\"deadline_risk\\", label: \\"\\\\u7533\\\\u62A5\\\\u671F\\\\u9650\\\\u98CE\\\\u9669\\" },\\n  { value: \\"system_error\\", label: \\"\\\\u7CFB\\\\u7EDF\\\\u64CD\\\\u4F5C\\\\u5F02\\\\u5E38\\" }\\n];\\nconst severityOptions = [\\n  { value: \\"high\\", label: \\"\\\\u9AD8\\\\u98CE\\\\u9669\\" },\\n  { value: \\"medium\\", label: \\"\\\\u4E2D\\\\u98CE\\\\u9669\\" },\\n  { value: \\"low\\", label: \\"\\\\u4F4E\\\\u98CE\\\\u9669\\" }\\n];\\nconst relatedTypeOptions = [\\n  { value: \\"consult\\", label: \\"\\\\u54A8\\\\u8BE2\\\\u5DE5\\\\u5355\\" },\\n  { value: \\"policy\\", label: \\"\\\\u653F\\\\u7B56\\\\u8D44\\\\u6599\\" },\\n  { value: \\"draft\\", label: \\"\\\\u7533\\\\u62A5\\\\u5E95\\\\u7A3F\\" }\\n];\\nconst assigneeOptions = [\\n  { value: \\"1\\", label: \\"\\\\u5F20\\\\u7A0E\\\\u52A1\\\\uFF08\\\\u7A0E\\\\u52A1\\\\u987E\\\\u95EE\\\\uFF09\\" },\\n  { value: \\"2\\", label: \\"\\\\u674E\\\\u7ECF\\\\u7406\\\\uFF08\\\\u9879\\\\u76EE\\\\u7ECF\\\\u7406\\\\uFF09\\" },\\n  { value: \\"3\\", label: \\"\\\\u738B\\\\u8D22\\\\u52A1\\\\uFF08\\\\u5BA2\\\\u6237\\\\u8D22\\\\u52A1\\\\uFF09\\" }\\n];\\n<\/script>\\n\\n<div class=\\"container\\">\\n\\t<h1>新建风险提示</h1>\\n\\n\\t<div class=\\"form-card\\">\\n\\t\\t<form on:submit|preventDefault={submit}>\\n\\t\\t\\t<div class=\\"form-group\\">\\n\\t\\t\\t\\t<label class=\\"label\\" for=\\"title\\">风险标题 *</label>\\n\\t\\t\\t\\t<input\\n\\t\\t\\t\\t\\tid=\\"title\\"\\n\\t\\t\\t\\t\\tclass=\\"input\\"\\n\\t\\t\\t\\t\\ttype=\\"text\\"\\n\\t\\t\\t\\t\\tplaceholder=\\"例如：股权激励个税计算政策适用争议\\"\\n\\t\\t\\t\\t\\tbind:value={form.title}\\n\\t\\t\\t\\t\\tdisabled={loading}\\n\\t\\t\\t\\t/>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<div class=\\"form-row\\">\\n\\t\\t\\t\\t<div class=\\"form-group\\">\\n\\t\\t\\t\\t\\t<label class=\\"label\\" for=\\"type\\">风险类型 *</label>\\n\\t\\t\\t\\t\\t<select id=\\"type\\" class=\\"input\\" bind:value={form.type} disabled={loading}>\\n\\t\\t\\t\\t\\t\\t{#each typeOptions as option}\\n\\t\\t\\t\\t\\t\\t\\t<option value={option.value}>{option.label}</option>\\n\\t\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t</select>\\n\\t\\t\\t\\t</div>\\n\\n\\t\\t\\t\\t<div class=\\"form-group\\">\\n\\t\\t\\t\\t\\t<label class=\\"label\\" for=\\"severity\\">紧急度 *</label>\\n\\t\\t\\t\\t\\t<select id=\\"severity\\" class=\\"input\\" bind:value={form.severity} disabled={loading}>\\n\\t\\t\\t\\t\\t\\t{#each severityOptions as option}\\n\\t\\t\\t\\t\\t\\t\\t<option value={option.value}>{option.label}</option>\\n\\t\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t</select>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<div class=\\"form-row\\">\\n\\t\\t\\t\\t<div class=\\"form-group\\">\\n\\t\\t\\t\\t\\t<label class=\\"label\\" for=\\"related_type\\">关联类型</label>\\n\\t\\t\\t\\t\\t<select id=\\"related_type\\" class=\\"input\\" bind:value={form.related_type} disabled={loading}>\\n\\t\\t\\t\\t\\t\\t{#each relatedTypeOptions as option}\\n\\t\\t\\t\\t\\t\\t\\t<option value={option.value}>{option.label}</option>\\n\\t\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t</select>\\n\\t\\t\\t\\t</div>\\n\\n\\t\\t\\t\\t<div class=\\"form-group\\">\\n\\t\\t\\t\\t\\t<label class=\\"label\\" for=\\"related_id\\">关联编号</label>\\n\\t\\t\\t\\t\\t<input\\n\\t\\t\\t\\t\\t\\tid=\\"related_id\\"\\n\\t\\t\\t\\t\\t\\tclass=\\"input\\"\\n\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\n\\t\\t\\t\\t\\t\\tplaceholder=\\"例如：2024-个税-001\\"\\n\\t\\t\\t\\t\\t\\tbind:value={form.related_id}\\n\\t\\t\\t\\t\\t\\tdisabled={loading}\\n\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<div class=\\"form-row\\">\\n\\t\\t\\t\\t<div class=\\"form-group\\">\\n\\t\\t\\t\\t\\t<label class=\\"label\\" for=\\"assignee_id\\">责任人 *</label>\\n\\t\\t\\t\\t\\t<select id=\\"assignee_id\\" class=\\"input\\" bind:value={form.assignee_id} disabled={loading}>\\n\\t\\t\\t\\t\\t\\t<option value=\\"\\">请选择责任人</option>\\n\\t\\t\\t\\t\\t\\t{#each assigneeOptions as option}\\n\\t\\t\\t\\t\\t\\t\\t<option value={option.value}>{option.label}</option>\\n\\t\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t</select>\\n\\t\\t\\t\\t</div>\\n\\n\\t\\t\\t\\t<div class=\\"form-group\\">\\n\\t\\t\\t\\t\\t<label class=\\"label\\" for=\\"due_date\\">截止时间</label>\\n\\t\\t\\t\\t\\t<input\\n\\t\\t\\t\\t\\t\\tid=\\"due_date\\"\\n\\t\\t\\t\\t\\t\\tclass=\\"input\\"\\n\\t\\t\\t\\t\\t\\ttype=\\"datetime-local\\"\\n\\t\\t\\t\\t\\t\\tbind:value={form.due_date}\\n\\t\\t\\t\\t\\t\\tdisabled={loading}\\n\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<div class=\\"form-actions\\">\\n\\t\\t\\t\\t<a href=\\"/risk-alerts\\" class=\\"btn btn-secondary\\">取消</a>\\n\\t\\t\\t\\t<button class=\\"btn btn-primary\\" type=\\"submit\\" disabled={loading}>\\n\\t\\t\\t\\t\\t{#if loading}\\n\\t\\t\\t\\t\\t\\t创建中...\\n\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t创建风险提示\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</button>\\n\\t\\t\\t</div>\\n\\t\\t</form>\\n\\t</div>\\n</div>\\n\\n<style>\\n\\th1 {\\n\\t\\tfont-size: 1.75rem;\\n\\t\\tfont-weight: 700;\\n\\t\\tcolor: var(--text-primary);\\n\\t\\tmargin: 0 0 1.5rem 0;\\n\\t}\\n\\n\\t.form-card {\\n\\t\\tbackground: var(--card-bg);\\n\\t\\tborder-radius: 0.5rem;\\n\\t\\tpadding: 2rem;\\n\\t\\tbox-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);\\n\\t\\tmax-width: 800px;\\n\\t}\\n\\n\\t.form-group {\\n\\t\\tmargin-bottom: 1.5rem;\\n\\t}\\n\\n\\t.form-row {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template-columns: repeat(2, 1fr);\\n\\t\\tgap: 1.5rem;\\n\\t}\\n\\n\\t.form-actions {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: flex-end;\\n\\t\\tgap: 1rem;\\n\\t\\tmargin-top: 2rem;\\n\\t\\tpadding-top: 1.5rem;\\n\\t\\tborder-top: 1px solid var(--border-color);\\n\\t}\\n\\n\\ta {\\n\\t\\ttext-decoration: none;\\n\\t}\\n</style>"],"names":[],"mappings":"AAyKC,iBAAG,CACF,SAAS,CAAE,OAAO,CAClB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,cAAc,CAAC,CAC1B,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,MAAM,CAAC,CACpB,CAEA,yBAAW,CACV,UAAU,CAAE,IAAI,SAAS,CAAC,CAC1B,aAAa,CAAE,MAAM,CACrB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAC1C,SAAS,CAAE,KACZ,CAEA,0BAAY,CACX,aAAa,CAAE,MAChB,CAEA,wBAAU,CACT,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,OAAO,CAAC,CAAC,CAAC,GAAG,CAAC,CACrC,GAAG,CAAE,MACN,CAEA,4BAAc,CACb,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,QAAQ,CACzB,GAAG,CAAE,IAAI,CACT,UAAU,CAAE,IAAI,CAChB,WAAW,CAAE,MAAM,CACnB,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,cAAc,CACzC,CAEA,gBAAE,CACD,eAAe,CAAE,IAClB"}'
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let form = {
    title: "",
    related_id: "",
    due_date: ""
  };
  const typeOptions = [
    {
      value: "policy_dispute",
      label: "政策适用争议"
    },
    {
      value: "draft_version_chaos",
      label: "底稿版本混乱"
    },
    {
      value: "response_unsigned",
      label: "答复未签收"
    },
    {
      value: "missing_docs",
      label: "补充资料缺失"
    },
    {
      value: "deadline_risk",
      label: "申报期限风险"
    },
    {
      value: "system_error",
      label: "系统操作异常"
    }
  ];
  const severityOptions = [
    {
      value: "high",
      label: "高风险"
    },
    {
      value: "medium",
      label: "中风险"
    },
    {
      value: "low",
      label: "低风险"
    }
  ];
  const relatedTypeOptions = [
    {
      value: "consult",
      label: "咨询工单"
    },
    {
      value: "policy",
      label: "政策资料"
    },
    {
      value: "draft",
      label: "申报底稿"
    }
  ];
  const assigneeOptions = [
    {
      value: "1",
      label: "张税务（税务顾问）"
    },
    {
      value: "2",
      label: "李经理（项目经理）"
    },
    {
      value: "3",
      label: "王财务（客户财务）"
    }
  ];
  $$result.css.add(css);
  return `<div class="container"><h1 class="svelte-1n9jexv" data-svelte-h="svelte-o8cl7t">新建风险提示</h1> <div class="form-card svelte-1n9jexv"><form><div class="form-group svelte-1n9jexv"><label class="label" for="title" data-svelte-h="svelte-y8e5pz">风险标题 *</label> <input id="title" class="input" type="text" placeholder="例如：股权激励个税计算政策适用争议" ${""}${add_attribute("value", form.title, 0)}></div> <div class="form-row svelte-1n9jexv"><div class="form-group svelte-1n9jexv"><label class="label" for="type" data-svelte-h="svelte-1em6v3k">风险类型 *</label> <select id="type" class="input" ${""}>${each(typeOptions, (option) => {
    return `<option${add_attribute("value", option.value, 0)}>${escape(option.label)}</option>`;
  })}</select></div> <div class="form-group svelte-1n9jexv"><label class="label" for="severity" data-svelte-h="svelte-brerrm">紧急度 *</label> <select id="severity" class="input" ${""}>${each(severityOptions, (option) => {
    return `<option${add_attribute("value", option.value, 0)}>${escape(option.label)}</option>`;
  })}</select></div></div> <div class="form-row svelte-1n9jexv"><div class="form-group svelte-1n9jexv"><label class="label" for="related_type" data-svelte-h="svelte-1k02sv0">关联类型</label> <select id="related_type" class="input" ${""}>${each(relatedTypeOptions, (option) => {
    return `<option${add_attribute("value", option.value, 0)}>${escape(option.label)}</option>`;
  })}</select></div> <div class="form-group svelte-1n9jexv"><label class="label" for="related_id" data-svelte-h="svelte-1bqaf8">关联编号</label> <input id="related_id" class="input" type="text" placeholder="例如：2024-个税-001" ${""}${add_attribute("value", form.related_id, 0)}></div></div> <div class="form-row svelte-1n9jexv"><div class="form-group svelte-1n9jexv"><label class="label" for="assignee_id" data-svelte-h="svelte-13r5dbc">责任人 *</label> <select id="assignee_id" class="input" ${""}><option value="" data-svelte-h="svelte-1wqy9jd">请选择责任人</option>${each(assigneeOptions, (option) => {
    return `<option${add_attribute("value", option.value, 0)}>${escape(option.label)}</option>`;
  })}</select></div> <div class="form-group svelte-1n9jexv"><label class="label" for="due_date" data-svelte-h="svelte-1nx2n68">截止时间</label> <input id="due_date" class="input" type="datetime-local" ${""}${add_attribute("value", form.due_date, 0)}></div></div> <div class="form-actions svelte-1n9jexv"><a href="/risk-alerts" class="btn btn-secondary svelte-1n9jexv" data-svelte-h="svelte-tla4p0">取消</a> <button class="btn btn-primary" type="submit" ${""}>${`创建风险提示`}</button></div></form></div> </div>`;
});
export {
  Page as default
};
