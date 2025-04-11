import React, { useContext, useState } from 'react';
import styles from "./homecontent.module.css";
import { MqttContext } from '../context/MqttContext';

const HomeContent = () => {
    // Use default values to prevent errors during static generation
    const { onPublish = () => { }, messages = [], sendTopic = '' } =
        typeof window !== 'undefined' ? useContext(MqttContext) : {};

    const [sendMessage, setSendMessage] = useState('');

    const handlePublish = () => {
        if (sendMessage) {
            console.log("Sending message:", sendMessage, "from topic:", sendTopic);
            onPublish(sendMessage);
            setSendMessage('');
        }
    };

    return <>
        <div className={styles['home-section']}>
            <h1 style={{ color: "black", textAlign: "center", fontWeight: "800", fontFamily: "sans-serif", marginTop: "-20px" }}>Home Page</h1>
            <div className={styles['chat-container']}>
                <div className={styles['home-area']}>
                    <h1 className={styles.msg}>Topic: {sendTopic || "Not Set"}</h1>
                    <div className={styles['chat-box']}>
                        {messages && messages.length > 0 ?
                            [...messages].map((msg, index) => (
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
                        <button onClick={handlePublish} type='button' className={styles.btn}>Send</button>
                    </div>
                </div>
            </div>
        </div>
    </>
}

export default HomeContent;