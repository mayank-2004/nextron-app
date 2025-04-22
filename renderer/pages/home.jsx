"use client";
import { motion, AnimatePresence } from "framer-motion";
import { FaAlignJustify, FaHouseChimney } from "react-icons/fa6";
import { LiaTemperatureHighSolid } from "react-icons/lia";
import { IoSettings } from "react-icons/io5";
import { useState } from "react";
import { MqttProvider } from "../context/MqttContext";
import dynamic from 'next/dynamic';
import styles from "./home.module.css";

export default function Page() {
  const [activePage, setActivePage] = useState("");
  const [sideBar, setSideBar] = useState(false);

  const HomeContent = dynamic(() => import('./HomeContent'), { ssr: false });
  const SettingsContent = dynamic(() => import('./SettingsContent'), { ssr: false });
  const TemperatureContent = dynamic(() => import('./TemperatureContent'), {ssr: false});

  const handleNavigation = (page) => {
    setActivePage(page);
  };

  const handleSideBar = () => {
    setSideBar(!sideBar);
  }

  const sidebarVariants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: "easeInOut" } }
  }

  const pageVariants = {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.5, ease: "easeInOut" } },
    exit: { x: "-100%", opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  };

  return (
    <MqttProvider>
      <div className={styles["main-container"]}>
        <button className={`${styles.btn} ${styles['btn-sidebar']}`} onClick={handleSideBar}>
          <FaAlignJustify size={30} />
        </button>

        <AnimatePresence>
          {sideBar && (
            <motion.div
              className={styles.sidebar}
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <button className={`${styles.btn} ${styles["btn-homebar"]}`} onClick={() => handleNavigation("HomeContent")}>
                <FaHouseChimney size={30} />
              </button>
              <button className={`${styles.btn} ${styles["btn-settingbar"]}`} onClick={() => handleNavigation("SettingsContent")}>
                <IoSettings size={30} />
              </button>
              <button className={`${styles.btn} ${styles["btn-temperaturebar"]}`} onClick={() => handleNavigation("TemperatureContent")}>
              <LiaTemperatureHighSolid size={30} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles["content-container"]}>
          <AnimatePresence mode="wait">
            {activePage === "HomeContent" && (
              <motion.div key="HomeContent" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <HomeContent />
              </motion.div>
            )}
            {activePage === "SettingsContent" && (
              <motion.div key="SettingsContent" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <SettingsContent />
              </motion.div>
            )}
            {activePage === "TemperatureContent" && (
              <motion.div key="TemperatureContent" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <TemperatureContent />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MqttProvider>
  );
}
