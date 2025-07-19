# Generate client HTML template
index_html = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>P&K Store - Mobile Legends Diamond Recharge</title>
    <meta name="description" content="Get Mobile Legends diamonds instantly with best prices and 24/7 support" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-backgroundDark min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>"""

# Generate main CSS file
main_css = """@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-backgroundDark text-white font-sans;
    font-family: 'Inter', sans-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Orbitron', monospace;
  }
}

@layer components {
  .btn-primary {
    @apply bg-accent hover:bg-accent/80 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-glow hover:shadow-glowStrong;
  }
  
  .btn-secondary {
    @apply bg-accent2 hover:bg-accent2/80 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-glowPink;
  }
  
  .input {
    @apply bg-primary/50 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all;
  }
  
  .card {
    @apply bg-secondary/60 backdrop-blur-sm rounded-xl p-6 border border-accent/20 hover:border-accent/40 hover:shadow-glow transition-all duration-300;
  }
  
  .glass {
    @apply bg-white/10 backdrop-blur-md border border-white/20;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #00a1ff;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #0080cc;
}

/* Gaming particles background */
.particles-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}"""

# Write client public files
with open(f"{base_dir}/client/index.html", "w") as f:
    f.write(index_html)

with open(f"{base_dir}/client/src/index.css", "w") as f:
    f.write(main_css)

print("Client HTML and CSS files created!")