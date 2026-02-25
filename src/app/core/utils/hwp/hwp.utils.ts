export async function initHwp() {
  const init = (await import('../../../../assets/hwp/hwpjs.wasi-browser.js')).default;
  // 매번 새로운 독립적인 인스턴스를 생성하여 자원 충돌 방지
  return await init();
}
