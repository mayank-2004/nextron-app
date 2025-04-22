"use client";
import React, { useContext, useState } from 'react'
import styles from "./settings.module.css"
import { MqttContext } from '../context/MqttContext';

const SettingsContent = () => {
    const { connectMqtt = () => { } } =
        typeof window !== 'undefined' ? useContext(MqttContext) : {};

    const [user, setUser] = useState({
        mqttip: '192.168.1.200',
        port: '1883',
        username: 'Swajahome',
        password: '12345678',
        receive: 'indihood/meet1/out',
        send: 'indihood/meet1/in'
    });

    const InputChange = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        setUser({ ...user, [name]: value });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("submitting and transfering user details");
        connectMqtt(user);
    }

    return <>
        <div className={styles['settings-section']}>
            <h1 className={styles['set-head']}>Setting Page</h1>
            <form onSubmit={handleSubmit} className={styles.container}>
                <div className={styles.form}>
                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            MQTTIP:
                        </label>
                        <input onChange={InputChange} value={user.mqttip} type="decimal" name='mqttip' placeholder='enter your id' required />
                    </div>
                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            PORT:
                        </label>
                        <input onChange={InputChange} value={user.port} type="number" name='port' placeholder='enter port' required />
                    </div>
                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            username:
                        </label>
                        <input onChange={InputChange} value={user.username} type="text" name='username' placeholder='enter username' />
                    </div>
                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            password:
                        </label>
                        <input onChange={InputChange} value={user.password} type="password" name='password' placeholder='enter password' />
                    </div>
                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            Receive Topic:
                        </label>
                        <input onChange={InputChange} value={user.receive} type="text" name='receive' placeholder='enter received topic' required />
                    </div>
                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            Send Topic:
                        </label>
                        <input onChange={InputChange} value={user.send} type="text" name='send' placeholder='enter topic to send' required />
                    </div>
                    <div>
                        <button className={styles.btn} type='submit' name='button'>Save</button>
                    </div>
                </div>
            </form>
        </div>
    </>;
}

export default SettingsContent;