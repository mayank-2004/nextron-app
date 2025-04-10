"use client";
import React, { createContext, useState, useEffect, useContext } from "react";

// Create context with default values to avoid destructuring errors
export const MqttContext = createContext({
  messages: [],
  connectMqtt: () => {},
  onPublish: () => {},
  sendTopic: ""
});

export const MqttProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [sendTopic, setSendTopic] = useState("");
  const [receiveTopic, setReceiveTopic] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Check if we're running on client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const connectMqtt = async (mqttConfig) => {
    // Only run on client-side
    if (!isClient) return;
    
    setSendTopic(mqttConfig.send);
    setReceiveTopic(mqttConfig.receive);

    try {
      await fetch("http://localhost:5000/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: mqttConfig.receive }),
      });
      console.log(`Subscribed to topic: ${mqttConfig.receive}`);
    } catch (error) {
      console.error("Subscription failed:", error);
    }
  };

  const onPublish = async (message) => {
    // Only run on client-side
    if (!isClient) return;
    
    if (!sendTopic) {
      console.error("Send topic is not set");
      return;
    }

    try {
      await fetch("http://localhost:5000/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: sendTopic, message }),
      });
      setMessages((prev) => [...prev, { text: message, type: "sent" }]);
      console.log(`Published message: ${message} from topic: ${sendTopic}`);
    } catch (error) {
      console.error("Error publishing message:", error);
    }
  };

  // Fetch messages from the server every 10 seconds
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch("http://localhost:5000/messages");
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isClient]);

  return (
    <MqttContext.Provider
      value={{ messages, connectMqtt, onPublish, sendTopic }}
    >
      {children}
    </MqttContext.Provider>
  );
};

export const useMqtt = () => useContext(MqttContext);