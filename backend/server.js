import express from "express";
import mqtt from "mqtt";
import cors from "cors";

let messages = [];
let mqttClient = null;

export function connectMqtt(brokerUrl, options = {}) {
  const defaultOptions = {
    username: "Swajahome",
    password: "12345678",
    reconnectPeriod: 5000,
  };

  const mqttOptions = { ...defaultOptions, ...options };

  mqttClient = mqtt.connect(brokerUrl, mqttOptions);

  mqttClient.on("connect", () => {
    console.log(`Connected to MQTT Broker at ${brokerUrl}`);
  });

  mqttClient.on("error", (err) => {
    console.error("MQTT connection Error:", err);
  });

  mqttClient.on("message", (topic, message) => {
    const receivedMessage = { topic, text: message.toString(), type: "received" };
    messages.push(receivedMessage);
    console.log(`Message received from ${topic}: ${message.toString()}`);
  });

  return mqttClient;
}

export function startExpressServer(port = 5000) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.post("/publish", (req, res) => {
    const { topic, message } = req.body;
    if (!topic || !message) {
      return res.status(400).json({ error: "Topic and message are required" });
    }

    if (!mqttClient || !mqttClient.connected) {
      return res.status(500).json({ error: "MQTT client not connected" });
    }
    mqttClient.publish(topic, message, (err) => {
      if (err) {
        console.log("publish error");
        return res.status(500).json({ error: "Failed to publish message" });
      }
      console.log(`Published message: ${message} from topic: ${topic}`);
      messages.push({ topic, text: message, type: "sent" });
      res.json({ success: true });
    });
  });

  app.post("/subscribe", (req, res) => {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    if (!mqttClient || !mqttClient.connected) {
      return res.status(500).json({ error: "MQTT client not connected" });
    }
    mqttClient.subscribe(topic, (err) => {
      if (err) {
        return res.status(500).json({ error: "Subscription failed" });
      }
      console.log(`Subscribed to topic: ${topic}`);
      res.json({ success: true, topic });
    });
  });

  app.get("/messages", (req, res) => {
    res.json(messages);
  });

  app.get("/temperature-data", async(req, res) => {
    try {
      const {initializeDatabase, getSensorData} = await import("./database.js");
      initializeDatabase();
      const data = await getSensorData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching temperature data:", error);
      res.status(500).json({error: "failed to fetch temperature data"});
    }
  });

  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
  return { app, server };
}

export function publishMessage(topic, message) {
  return new Promise((resolve, reject) => {
    if (!mqttClient || !mqttClient.connected) {
      reject(new Error("MQTT client not connected"));
      return;
    }
    mqttClient.publish(topic, message, (err) => {
      if (err) {
        console.log("publish error", err);
        reject(err);
        return;
      }
      console.log(`Published message: ${message} from topic: ${topic}`);
      messages.push({ topic, text: message, type: "sent" });
      resolve({ success: true });
    });
  });
}

export function subscribeToTopic(topic) {
  return new Promise((resolve, reject) => {
    if (!mqttClient || !mqttClient.connected) {
      reject(new Error("MQTT client not connected"));
      return;
    }
    mqttClient.subscribe(topic, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(`Subscribed to topic: ${topic}`);
      resolve({ success: true, topic });
    });
  });
}

export function getMessages() {
  return messages;
}

export function cleanupMqtt() {
  if(mqttClient) {
    mqttClient.end();
  console.log("MQTT client disconnected");
  }
}
