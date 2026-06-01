<style>
.dust-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 0; /* Just above the very back background, but behind everything else */
    overflow: hidden;
}

.dust-particle {
    position: absolute;
    background: rgba(251, 191, 36, 0.4); /* Amber/Gold tint */
    border-radius: 50%;
    filter: blur(1px);
    animation: floatUp infinite linear;
}

@keyframes floatUp {
    0% {
        transform: translateY(110vh) scale(0);
        opacity: 0;
    }
    10% {
        opacity: 0.8;
        transform: translateY(100vh) scale(1);
    }
    90% {
        opacity: 0.8;
    }
    100% {
        transform: translateY(-10vh) scale(0);
        opacity: 0;
    }
}
</style>

<div class="dust-container" id="dust-bg"></div>

<script>
    document.addEventListener("DOMContentLoaded", function() {
        const container = document.getElementById('dust-bg');
        if (!container) return;
        
        // Prevent duplicate generation if script runs twice (e.g. React/Turbolinks)
        if (container.children.length > 0) return;

        const particleCount = 45;
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < particleCount; i++) {
            let p = document.createElement('div');
            p.className = 'dust-particle';
            
            // Random horizontal position
            p.style.left = (Math.random() * 100) + 'vw';
            
            // Random duration between 15s and 35s for slow, relaxed floating
            p.style.animationDuration = (Math.random() * 20 + 15) + 's';
            
            // Random delay so they don't all start at once
            p.style.animationDelay = '-' + (Math.random() * 20) + 's';
            
            // Random size between 1px and 4px
            let size = (Math.random() * 3 + 1);
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            
            fragment.appendChild(p);
        }
        
        container.appendChild(fragment);
    });
</script>
