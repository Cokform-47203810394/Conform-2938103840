import fs from 'node:fs/promises';

const targetId = '1FC4E5FBE53D3193BF350903C2F01D72';
const socketUrl = `ws://127.0.0.1:9222/devtools/page/${targetId}`;
const ws = new WebSocket(socketUrl);
let nextId = 1;
const pending = new Map();

function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function evaluate(expression) {
  return send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    .then((result) => result.result?.value);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
});

ws.addEventListener('open', async () => {
  try {
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844,
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

    await evaluate(`(() => {
      const preview = [...document.querySelectorAll('button')].find((button) => button.getAttribute('title') === '미리보기');
      preview?.click();
      return Boolean(preview);
    })()`);
    await delay(900);

    const before = await evaluate(`(() => {
      const visible = (element) => Boolean(element && element.offsetParent);
      const selects = [...document.querySelectorAll('select')]
        .filter((select) => visible(select))
        .map((select) => ({ value: select.value, options: [...select.options].map((option) => option.value) }));
      return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        visibleTeamSelects: selects.filter((select) => select.options.includes('개발팀')),
      };
    })()`);

    const teamChanged = await evaluate(`(() => {
      const visible = (element) => Boolean(element && element.offsetParent);
      const select = [...document.querySelectorAll('select')]
        .find((element) => visible(element) && [...element.options].some((option) => option.value === '개발팀'));
      if (!select) return { found: false };
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(select, '개발팀');
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return { found: true, value: select.value };
    })()`);
    await delay(350);

    const after = await evaluate(`(() => {
      const visible = (element) => Boolean(element && element.offsetParent);
      const horizontalOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      const teamSelect = [...document.querySelectorAll('select')]
        .find((element) => visible(element) && [...element.options].some((option) => option.value === '개발팀'));
      const preview = teamSelect?.closest('[role="dialog"]') || document.body;
      const text = preview.innerText;
      const submit = [...preview.querySelectorAll('button')].find((button) => visible(button) && ['제출', '작성 흐름 확인'].includes(button.textContent.trim()));
      return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        horizontalOverflow,
        teamSelection: teamSelect?.value || null,
        developmentVisible: text.includes('만들어 본 프로젝트 또는 기능 한 가지를 소개해 주세요.'),
        managementVisible: text.includes('커뮤니티·서버·프로젝트를 운영하거나 관리해본 경험을 소개해 주세요.'),
        marketingVisible: text.includes('운영하거나 참여해본 채널·커뮤니티·캠페인 경험을 소개해 주세요.'),
        researchVisible: text.includes('조사하거나 깊게 파본 주제 한 가지와 그 결과를 소개해 주세요.'),
        submitVisible: Boolean(submit),
      };
    })()`);

    const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile('/home/ubuntu/Cokform-Conform-2938103840/docs/mobile-rofolder-form-check.png', Buffer.from(screenshot.data, 'base64'));
    await fs.writeFile('/home/ubuntu/Cokform-Conform-2938103840/docs/mobile-rofolder-form-check.json', JSON.stringify({ before, teamChanged, after }, null, 2));
    console.log(JSON.stringify({ before, teamChanged, after }, null, 2));
  } catch (error) {
    console.error(error.stack || String(error));
    process.exitCode = 1;
  } finally {
    ws.close();
  }
});

ws.addEventListener('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
