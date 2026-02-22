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
                const canvas = document.createElement('canvas');
                const tCtx = canvas.getContext('2d');

                // 1. Coordenadas Inteiras para evitar erros de binarização
                const sx = Math.floor(Math.min(x1, x2) * dpi);
                const sy = Math.floor(Math.min(y1, y2) * dpi);
                const sw = Math.floor(Math.abs(x1 - x2) * dpi);
                const sh = Math.floor(Math.abs(y1 - y2) * dpi);

                if (sw < 5 || sh < 5) return resolve(null);

                canvas.width = sw;
                canvas.height = sh;

                // --- FUNÇÃO DE SCAN SEM ERROS ---
                const tryScan = () => {
                    try {
                        const imageData = tCtx.getImageData(0, 0, canvas.width, canvas.height);
                        return jsQR(imageData.data, imageData.width, imageData.height);
                    } catch (e) { return null; }
                };

                // TENTATIVA 1: Original (Para QR Codes normais)
                tCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                let result = tryScan();
                if (result) return resolve(result.data);

                // TENTATIVA 2: Grayscale + Contraste (Para QR Amarelo/Distorcido)
                tCtx.filter = 'contrast(1.5) grayscale(1)';
                tCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                result = tryScan();
                if (result) return resolve(result.data);

                // TENTATIVA 3: Upscaling Suave (Para o Dino/Pontos)
                // Aumentar a imagem costuma funcionar melhor que diminuir para o jsQR
                canvas.width = sw * 2;
                canvas.height = sh * 2;
                tCtx.filter = 'none';
                tCtx.imageSmoothingEnabled = false;
                tCtx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
                result = tryScan();
                if (result) return resolve(result.data);

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