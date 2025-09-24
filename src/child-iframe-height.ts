const PARENT_ORIGIN = "*"; // change to your actual parent site for security

function sendHeight() {
  const h = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight
  );
  window.parent.postMessage({ type: "CALC_HEIGHT", value: h }, PARENT_ORIGIN);
}

// Send on load
window.addEventListener("load", () => {
  sendHeight();
  // fonts can change layout
  // @ts-ignore
  document.fonts?.ready?.then(sendHeight).catch(() => {});
});

// Send when parent pings
window.addEventListener("message", (e) => {
  if (e.data?.type === "CALC_PLEASE_SEND_HEIGHT") sendHeight();
});

// Send on size/content changes
const ro = new ResizeObserver(() => requestAnimationFrame(sendHeight));
ro.observe(document.documentElement);
ro.observe(document.body);
