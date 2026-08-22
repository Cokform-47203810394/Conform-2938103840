const targetId = '1FC4E5FBE53D3193BF350903C2F01D72';
const ws = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${targetId}`);
let nextId = 1;
const pending = new Map();

const send = (method, params = {}) => {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
};
const evaluate = (expression) => send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).then((result) => result.result?.value);

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const task = pending.get(message.id);
    pending.delete(message.id);
    message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
  }
});

ws.addEventListener('open', async () => {
  try {
    const result = await evaluate(`(async () => {
      const visible = (element) => Boolean(element && element.offsetParent);
      const select = [...document.querySelectorAll('select')].find((element) => visible(element) && [...element.options].some((option) => option.value === '개발팀'));
      if (!select) return { error: 'visible team select not found' };
      const preview = select.closest('[role="dialog"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      const labels = {
        '개발팀': '만들어 본 프로젝트 또는 기능 한 가지를 소개해 주세요.',
        '관리팀': '커뮤니티·서버·프로젝트를 운영하거나 관리해본 경험을 소개해 주세요.',
        '마케팅팀': '운영하거나 참여해본 채널·커뮤니티·캠페인 경험을 소개해 주세요.',
        '리서칭팀': '조사하거나 깊게 파본 주제 한 가지와 그 결과를 소개해 주세요.',
      };
      const results = {};
      for (const team of Object.keys(labels)) {
        setter.call(select, team);
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 180));
        const text = preview.innerText;
        results[team] = {
          selected: select.value,
          visibleTeams: Object.fromEntries(Object.entries(labels).map(([name, label]) => [name, text.includes(label)])),
        };
      }
      return {
        width: window.innerWidth,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        results,
      };
    })()`);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.stack || String(error));
    process.exitCode = 1;
  } finally {
    ws.close();
  }
});
