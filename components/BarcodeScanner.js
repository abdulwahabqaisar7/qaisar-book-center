"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import styles from "./BarcodeScanner.module.css";

export default function BarcodeScanner({ onScan, onClose }) {
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const regionId = "qr-reader-region";

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("rear") ||
            device.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setError("No cameras found. Please check permissions.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to get cameras: " + err.message);
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId) => {
    if (!cameraId) return;
    setError(null);
    setScanning(true);

    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5Qrcode = new Html5Qrcode(regionId);
      scannerRef.current = html5Qrcode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.777778,
      };

      await html5Qrcode.start(
        cameraId,
        config,
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {
          // ignore failures
        }
      );
    } catch (err) {
      console.error(err);
      setError("Failed to start scanner: " + err.message);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    if (selectedCameraId) {
      startScanner(selectedCameraId);
    }
  }, [selectedCameraId]);

  return (
    <div className={styles.scannerOverlay}>
      <div className={styles.scannerCard}>
        <div className={styles.scannerHeader}>
          <h2>📷 Barcode Camera Scanner</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div className={styles.scannerBody}>
          {error && <div className={styles.errorAlert}>{error}</div>}

          {cameras.length > 1 && (
            <div className={styles.cameraSelectGroup}>
              <label>Select Camera:</label>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className={styles.cameraSelect}
              >
                {cameras.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.label || `Camera ${device.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.viewfinderWrapper}>
            <div id={regionId} className={styles.viewfinder}></div>
            {scanning && <div className={styles.laserLine}></div>}
          </div>

          <p className={styles.instructionText}>
            Align the product barcode inside the scan box to scan.
          </p>
        </div>

        <div className={styles.scannerFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
