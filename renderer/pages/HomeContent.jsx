import React, { useContext, useState } from 'react';
import styles from "./homecontent.module.css";
import { MqttContext } from '../context/MqttContext';

const HomeContent = () => {
    // Use default values to prevent errors during static generation
    const { onPublish = () => {}, messages = [], sendTopic = '' } = 
        typeof window !== 'undefined' ? useContext(MqttContext) : {};
    
    const [sendMessage, setSendMessage] = useState('');

    const handlePublish = () => {
        if (sendMessage) {
            console.log("Sending message:", sendMessage, "to topic:", sendTopic);
            onPublish(sendMessage);
            setSendMessage('');
        }
    };

    return <>
        <h1 style={{ fontSize: "18px", color: "white" }}>Home Page</h1>
        <div className={styles['chat-container']}>
            <div className={styles['home-area']}>
                <h1 className={styles.msg}>Topic: {sendTopic || "Not Set"}</h1>
                <div className={styles['chat-box']}>
                    {messages && messages.length > 0 ? 
                    [...messages].reverse().map((msg, index) => (
                        <div key={index} className={`${styles['chat-message']} ${msg.type === 'sent' ? styles.sent : styles.received}`}>
                            {msg.text}
                        </div>
                    )) : <div>No messages yet</div>}
                </div>
            </div>

            {/* Publisher */}
            <div className={styles['home-container']}>
                <div className={styles['home-form']}>
                    <h3 className={styles['set-h3']}>Publisher</h3>
                    <input type="text" name="text" placeholder='enter text to send' value={sendMessage}
                        onChange={(e) => setSendMessage(e.target.value)} />
                    <button onClick={handlePublish} type='button' className={styles.btn}>send</button>
                </div>
            </div>
        </div>
    </>
}

export default HomeContent;