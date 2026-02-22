(function() {
    if (document.getElementById('qr-selector-overlay')) return;

    let lastX = 0, lastY = 0;
    const trackMouse = e => { lastX = e.clientX; lastY = e.clientY; };
    window.addEventListener('mousemove', trackMouse, { passive: true });

    const overlay = document.createElement('canvas');
    overlay.id = 'qr-selector-overlay';
    const ctx = overlay.getContext('2d');
    const dpi = window.devicePixelRatio || 1;

    Object.assign(overlay.style, {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        zIndex: 2147483647, cursor: 'crosshair'
    });
    document.body.appendChild(overlay);

    overlay.width = window.innerWidth * dpi;
    overlay.height = window.innerHeight * dpi;
    ctx.scale(dpi, dpi);

    let startX, startY, isDrawing = false;

    overlay.addEventListener('mousedown', e => {
        startX = e.clientX; startY = e.clientY;
        isDrawing = true;
    });

    overlay.addEventListener('mousemove', e => {
        if (!isDrawing) return;
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(startX, startY, e.clientX - startX, e.clientY - startY);
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, e.clientX - startX, e.clientY - startY);
   });

    overlay.addEventListener('mouseup', async e => {
        isDrawing = false;
        const endX = e.clientX;
        const endY = e.clientY;
        overlay.remove();
        window.removeEventListener('mousemove', trackMouse);

        chrome.runtime.sendMessage({ action: "capture" }, async (response) => {
            if (!response || !response.img) return;
            const text = await decodeQR(response.img, startX, startY, endX, endY);
            if (text) {
                navigator.clipboard.writeText(text);
                showFeedback("✅ Copiado!", "#44ff44");
            } else {
                showFeedback("❌ Não encontrado", "#ff4444");
            }
        });
    });

    async function decodeQR(base64Img, x1, y1, x2, y2) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const sourceCanvas = document.createElement('canvas');
                const sourceCtx = sourceCanvas.getContext('2d');
                const workCanvas = document.createElement('canvas');
                const workCtx = workCanvas.getContext('2d');
                const sourceCanvas = document.createElement('canvas');
                const sourceCtx = sourceCanvas.getContext('2d');
                const workCanvas = document.createElement('canvas');
                const workCtx = workCanvas.getContext('2d');

                // Coordenadas com margem para recuperar a quiet zone que o usuário pode cortar.
                const rawLeft = Math.min(x1, x2);
                const rawTop = Math.min(y1, y2);
                const rawWidth = Math.abs(x1 - x2);
                const rawHeight = Math.abs(y1 - y2);
                const margin = Math.max(8, Math.round(Math.max(rawWidth, rawHeight) * 0.08));

                const sx = Math.max(0, Math.floor((rawLeft - margin) * dpi));
                const sy = Math.max(0, Math.floor((rawTop - margin) * dpi));
                const sMaxX = Math.min(img.width, Math.ceil((rawLeft + rawWidth + margin) * dpi));
                const sMaxY = Math.min(img.height, Math.ceil((rawTop + rawHeight + margin) * dpi));
                const sw = sMaxX - sx;
                const sh = sMaxY - sy;
                // Coordenadas com margem para recuperar a quiet zone que o usuário pode cortar.
                const rawLeft = Math.min(x1, x2);
                const rawTop = Math.min(y1, y2);
                const rawWidth = Math.abs(x1 - x2);
                const rawHeight = Math.abs(y1 - y2);
                const margin = Math.max(8, Math.round(Math.max(rawWidth, rawHeight) * 0.08));

                const sx = Math.max(0, Math.floor((rawLeft - margin) * dpi));
                const sy = Math.max(0, Math.floor((rawTop - margin) * dpi));
                const sMaxX = Math.min(img.width, Math.ceil((rawLeft + rawWidth + margin) * dpi));
                const sMaxY = Math.min(img.height, Math.ceil((rawTop + rawHeight + margin) * dpi));
                const sw = sMaxX - sx;
                const sh = sMaxY - sy;

                if (sw < 12 || sh < 12) return resolve(null);
                if (sw < 12 || sh < 12) return resolve(null);

                sourceCanvas.width = sw;
                sourceCanvas.height = sh;
                sourceCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

                const scanWithJsQR = () => {
                sourceCanvas.width = sw;
                sourceCanvas.height = sh;
                sourceCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

                const scanWithJsQR = () => {
                    try {
                        const imageData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
                        return jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: 'attemptBoth'
                        });
                    } catch (e) {
                        return null;
                    }
                        const imageData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
                        return jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: 'attemptBoth'
                        });
                    } catch (e) {
                        return null;
                    }
                };

                const drawBase = (scale = 1, smoothing = true) => {
                    workCanvas.width = Math.max(1, Math.floor(sw * scale));
                    workCanvas.height = Math.max(1, Math.floor(sh * scale));
                    workCtx.filter = 'none';
                    workCtx.imageSmoothingEnabled = smoothing;
                    workCtx.drawImage(sourceCanvas, 0, 0, sw, sh, 0, 0, workCanvas.width, workCanvas.height);
                };

                const boostContrast = (contrast = 1.6, threshold = null) => {
                    const imageData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
                        const adjusted = Math.max(0, Math.min(255, (gray - 128) * contrast + 128));
                        const value = threshold === null ? adjusted : (adjusted >= threshold ? 255 : 0);
                        data[i] = value;
                        data[i + 1] = value;
                        data[i + 2] = value;
                    }
                    workCtx.putImageData(imageData, 0, 0);
                };

                const runAttempt = (drawer) => {
                    drawer();
                    const result = scanWithJsQR();
                    return result ? result.data : null;
                };

                const attempts = [
                    () => drawBase(1, true),
                    () => {
                        drawBase(1, true);
                        boostContrast(1.8, null);
                    },
                    () => {
                        drawBase(1, true);
                        boostContrast(2.2, 150);
                    },
                    () => {
                        drawBase(2, false);
                        boostContrast(1.5, null);
                    },
                    () => {
                        drawBase(2, false);
                        boostContrast(2.0, 145);
                    }
                ];

                for (const attempt of attempts) {
                    const decoded = runAttempt(attempt);
                    if (decoded) return resolve(decoded);
                }


                for (let scale = 0.9; scale >= 0.15; scale -= 0.1) {
                    const safeScale = Number(scale.toFixed(1));

                    let decoded = runAttempt(() => drawBase(safeScale, true));
                    if (decoded) return resolve(decoded);

                    decoded = runAttempt(() => {
                        drawBase(safeScale, true);
                        boostContrast(1.9, null);
                    });
                    if (decoded) return resolve(decoded);
                }
                const drawBase = (scale = 1, smoothing = true) => {
                    workCanvas.width = Math.max(1, Math.floor(sw * scale));
                    workCanvas.height = Math.max(1, Math.floor(sh * scale));
                    workCtx.filter = 'none';
                    workCtx.imageSmoothingEnabled = smoothing;
                    workCtx.drawImage(sourceCanvas, 0, 0, sw, sh, 0, 0, workCanvas.width, workCanvas.height);
                };

                const boostContrast = (contrast = 1.6, threshold = null) => {
                    const imageData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
                        const adjusted = Math.max(0, Math.min(255, (gray - 128) * contrast + 128));
                        const value = threshold === null ? adjusted : (adjusted >= threshold ? 255 : 0);
                        data[i] = value;
                        data[i + 1] = value;
                        data[i + 2] = value;
                    }
                    workCtx.putImageData(imageData, 0, 0);
                };

                const runAttempt = (drawer) => {
                    drawer();
                    const result = scanWithJsQR();
                    return result ? result.data : null;
                };

                const attempts = [
                    () => drawBase(1, true),
                    () => {
                        drawBase(1, true);
                        boostContrast(1.8, null);
                    },
                    () => {
                        drawBase(1, true);
                        boostContrast(2.2, 150);
                    },
                    () => {
                        drawBase(2, false);
                        boostContrast(1.5, null);
                    },
                    () => {
                        drawBase(2, false);
                        boostContrast(2.0, 145);
                    }
                ];

                for (const attempt of attempts) {
                    const decoded = runAttempt(attempt);
                    if (decoded) return resolve(decoded);
                }

                resolve(null);
            };
            img.src = base64Img;
        });
    }

    function showFeedback(msg, color) {
        const el = document.createElement('div');
        el.textContent = msg;
        Object.assign(el.style, {
            position: 'fixed', left: (lastX + 10) + 'px', top: (lastY + 10) + 'px',
            padding: '6px 12px', background: color, color: 'white', borderRadius: '4px',
            fontSize: '13px', fontFamily: 'sans-serif', zIndex: '2147483647',
            pointerEvents: 'none', transition: 'all 0.3s ease', opacity: '1'
        });
        document.body.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(-20px)';
            setTimeout(() => el.remove(), 300);
        }, 1200);
    }
})();
