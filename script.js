document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. WebGL Shader Animation (Hero Background)
    // ==========================================
    const canvas = document.getElementById('shader-canvas-ANIMATION_2');
    if (canvas) {
        // Sync the WebGL drawing-buffer size with the CSS-driven layout size.
        function syncSize() {
            const w = canvas.clientWidth || 1280;
            const h = canvas.clientHeight || 720;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
        }
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(syncSize).observe(canvas);
        }
        syncSize();

        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
            const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    
    // Create a subtle dark gradient background
    vec3 color1 = vec3(0.05, 0.05, 0.05); // Very dark gray
    vec3 color2 = vec3(0.08, 0.08, 0.08); // Slightly lighter
    
    vec3 bg = mix(color1, color2, uv.y + sin(u_time * 0.5) * 0.1);
    
    // Add golden light streaks
    float streak = smoothstep(0.45, 0.5, abs(uv.x - 0.5 + sin(u_time * 0.3 + uv.y * 2.0) * 0.2));
    vec3 gold = vec3(0.83, 0.68, 0.21); // #D4AF37
    
    float intensity = pow(1.0 - streak, 15.0) * 0.3;
    bg += gold * intensity * (0.5 + 0.5 * sin(u_time + uv.y * 5.0));
    
    // Add glowing particles
    float particles = 0.0;
    for(float i = 0.0; i < 20.0; i++) {
        vec2 pos = vec2(
            fract(sin(i * 143.2) * 4567.8),
            fract(cos(i * 98.1) * 1234.5 + u_time * 0.1)
        );
        float d = length(uv - pos);
        particles += (0.001 / d) * (0.5 + 0.5 * sin(u_time * 2.0 + i));
    }
    bg += gold * particles * 0.5;

    gl_FragColor = vec4(bg, 1.0);
}`;
            function cs(type, src) {
                const s = gl.createShader(type);
                gl.shaderSource(s, src);
                gl.compileShader(s);
                return s;
            }
            const prog = gl.createProgram();
            gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
            gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
            gl.linkProgram(prog);
            gl.useProgram(prog);
            
            const buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
            
            const pos = gl.getAttribLocation(prog, 'a_position');
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
            
            const uTime = gl.getUniformLocation(prog, 'u_time');
            const uRes = gl.getUniformLocation(prog, 'u_resolution');
            const uMouse = gl.getUniformLocation(prog, 'u_mouse');

            let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
            window.addEventListener('mousemove', (event) => {
                const rect = canvas.getBoundingClientRect();
                if (rect.width && rect.height) {
                    const nx = (event.clientX - rect.left) / rect.width;
                    const ny = 1.0 - (event.clientY - rect.top) / rect.height;
                    mouse.x = nx * canvas.width;
                    mouse.y = ny * canvas.height;
                }
            });

            function render(t) {
                if (typeof ResizeObserver === 'undefined') syncSize();
                gl.viewport(0, 0, canvas.width, canvas.height);
                if (uTime) gl.uniform1f(uTime, t * 0.001);
                if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
                if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                requestAnimationFrame(render);
            }
            render(0);
        }
    }

    // ==========================================
    // 2. Hero Credit Card Hover Tilt Animation
    // ==========================================
    const heroCard = document.getElementById('hero-card-image-container');
    if (heroCard) {
        const parent = heroCard.parentElement;
        parent.addEventListener('mousemove', (e) => {
            const rect = parent.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const tiltX = (y / (rect.height / 2)) * -15; 
            const tiltY = (x / (rect.width / 2)) * 15;
            
            heroCard.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.05) rotateZ(-10deg)`;
        });
        
        parent.addEventListener('mouseleave', () => {
            heroCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1) rotateZ(-10deg)';
        });
    }

    // ==========================================
    // 3. Scroll Reveal Animation
    // ==========================================
    const revealItems = document.querySelectorAll('.scroll-reveal');
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    revealItems.forEach(item => observer.observe(item));

    // ==========================================
    // 4. Counter Animation
    // ==========================================
    const counterItems = document.querySelectorAll('[data-counter]');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetText = entry.target.getAttribute('data-counter');
                const target = parseInt(targetText);
                let current = 0;
                const duration = 2000;
                const increment = target / (duration / 16);

                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        entry.target.innerText = Math.floor(current) + (targetText.includes('%') ? '%' : targetText.includes('k') ? 'k' : '');
                        requestAnimationFrame(updateCounter);
                    } else {
                        entry.target.innerText = targetText;
                    }
                };
                updateCounter();
                counterObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    counterItems.forEach(item => counterObserver.observe(item));

    // ==========================================
    // 5. Navigation Scroll Hide/Show
    // ==========================================
    let lastScroll = 0;
    const nav = document.querySelector('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            if (currentScroll > lastScroll && currentScroll > 100) {
                nav.style.transform = 'translateY(-100%)';
            } else {
                nav.style.transform = 'translateY(0)';
            }
            lastScroll = currentScroll;
        });
    }
});
