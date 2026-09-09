const { inngest } = require("./inngestClient");
const { reports } = require("./store");

// Stage 1 — the very first function: sleep 5s, return a fixed string.
const sayHello = inngest.createFunction(
  { id: "say-hello" },
  { event: "test/hello" },
  async ({ step }) => {
    await step.sleep("wait-a-bit", "5s");
    return "Hello from the background!";
  }
);

// Stage 2, 3 & idempotency stretch — sleep (stand-in for slow work), then
// build the report. topic "fail" deliberately throws so retries are
// visible. onFailure marks the report "failed" once retries are exhausted,
// so the status endpoint reflects reality instead of hanging at "pending".
const makeReport = inngest.createFunction(
  {
    id: "make-report",
    retries: 2,
    onFailure: async ({ event }) => {
      const original = event.data.event.data;
      const existing = reports.get(original.id);
      if (existing) {
        reports.set(original.id, { ...existing, status: "failed" });
      }
    },
  },
  { event: "report/requested" },
  async ({ event, step }) => {
    const { id, topic } = event.data;

    await step.sleep("do-the-slow-work", "8s");

    const result = await step.run("build-report", async () => {
      // Idempotency: Inngest guarantees at-least-once delivery, not
      // exactly-once. If this event is ever redelivered for an id that's
      // already done, skip redoing the work.
      const existing = reports.get(id);
      if (existing?.status === "done") {
        return existing.result;
      }

      if (topic === "fail") {
        throw new Error("The report oven is broken!");
      }

      return `Report on "${topic}": generated at ${new Date().toISOString()}`;
    });

    reports.set(id, { id, topic, status: "done", result });
    return result;
  }
);

// Stage 4 — cron, no event, no request. Logs a one-line summary every minute.
const heartbeat = inngest.createFunction(
  { id: "heartbeat" },
  { cron: "* * * * *" },
  async () => {
    const all = Array.from(reports.values());
    const pending = all.filter((r) => r.status === "pending").length;
    const done = all.filter((r) => r.status === "done").length;
    const failed = all.filter((r) => r.status === "failed").length;
    const line = `heartbeat: pending=${pending} done=${done} failed=${failed}`;
    console.log(line);
    return line;
  }
);

module.exports = { sayHello, makeReport, heartbeat };
