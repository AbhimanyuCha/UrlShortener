
const {createClient} = require("redis")
const CHANNEL = "news";

async function startSubscriber() {
  const subscriber = createClient({
    url: "redis://localhost:6379",
    socket: {
      reconnectStrategy: (retries) => {
        console.log(`🔁 Reconnecting to Redis... attempt #${retries}`);
        return Math.min(retries * 100, 3000); // backoff
      },
    },
  });

  subscriber.on("error", (err) => console.error("❌ Redis error:", err));
  subscriber.on("connect", () => console.log("✅ Connected to Redis"));
  subscriber.on("reconnecting", () => console.log("🔄 Reconnecting..."));

  await subscriber.connect();

  await subscriber.subscribe(CHANNEL, (message) => {
    console.log(`📩 Received message on "${CHANNEL}":`, message);
  });

  console.log(`🧭 Listening on channel "${CHANNEL}"...`);
}

startSubscriber().catch(console.error);
