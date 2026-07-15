<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Misión KSL-01 · Edición Galáctica</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Exo+2:wght@400;600;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="space-bg" aria-hidden="true">
    <div class="bg-stars"></div>
    <div class="bg-stars layer2"></div>
    <div class="bg-aurora"></div>
  </div>

  <div id="app">
    <!-- ======= PANTALLA DE INICIO ======= -->
    <section id="startScreen" class="screen active">
      <div class="panel">
        <img class="logo" src="assets/logo-ksl.png" alt="KSL Arte y Diseño Gráfico S.A.S." />
        <h1>Misión KSL-01</h1>
        <h2>Edición Galáctica · KSL Arte y Diseño Gráfico S.A.S.</h2>
        <p>
          Pilota la nave KSL-01 a través de <strong>10 sectores espaciales</strong> en una ruta ampliada de
          <strong>24.000&nbsp;px</strong>. Recolecta <strong>120 monedas</strong>, activa contenedores KSL,
          atraviesa anillos de impulso, esquiva drones, centinelas, minas y lluvias de meteoritos
          para desbloquear tu premio en el Portal.
        </p>
        <div class="stat-strip">
          <div class="stat"><span class="stat-label">Recorrido</span><span class="stat-value">24.000 px</span></div>
          <div class="stat"><span class="stat-label">Sectores</span><span class="stat-value">10</span></div>
          <div class="stat"><span class="stat-label">Meta</span><span class="stat-value">120 monedas</span></div>
          <div class="stat"><span class="stat-label">Tu récord</span><span class="stat-value" id="menuBest">0</span></div>
        </div>
        <div class="menu-actions">
          <button id="startBtn">Iniciar misión</button>
          <a class="product-link" href="https://www.promocionalesenlinea.com/KSL_ARTEYDISENO_GRAFICO" target="_blank" rel="noopener noreferrer">Productos KSL</a>
        </div>
        <small>
          PC: ← → o A/D para moverte · espacio/↑/W para elevarte · P para pausar · M para silenciar.
          Celular: usa los controles táctiles.
        </small>
      </div>
    </section>

    <!-- ======= PANTALLA DE DERROTA ======= -->
    <section id="deathScreen" class="screen">
      <div class="panel danger">
        <img class="logo small" src="assets/logo-ksl.png" alt="KSL" />
        <h1>Misión fallida</h1>
        <p>La nave KSL-01 fue destruida antes de completar el recorrido.</p>
        <p class="score-line">Monedas obtenidas: <strong id="deathCoins">0</strong></p>
        <p class="score-line sub">Sector alcanzado: <strong id="deathSector">Base KSL</strong> · Progreso: <strong id="deathProgress">0%</strong></p>
        <div class="menu-actions">
          <button id="retryBtn">Reintentar</button>
          <a class="product-link" href="https://www.promocionalesenlinea.com/KSL_ARTEYDISENO_GRAFICO" target="_blank" rel="noopener noreferrer">Productos KSL</a>
        </div>
      </div>
    </section>

    <!-- ======= PANTALLA DE VICTORIA ======= -->
    <section id="winScreen" class="screen">
      <div class="panel success">
        <img class="logo small" src="assets/logo-ksl.png" alt="KSL" />
        <h1>¡Misión completada!</h1>
        <p>
          Has obtenido un premio por parte de
          <strong>KSL Arte y Diseño Gráfico S.A.S.</strong>
        </p>
        <p class="score-line">Monedas recolectadas: <strong id="winCoins">0</strong></p>
        <p class="score-line sub">Tiempo de misión: <strong id="winTime">0:00</strong></p>
        <p class="redirect">Puedes reclamar el premio ahora o jugar nuevamente.</p>
        <div class="win-actions">
          <a id="loginLink" href="https://wa.me/573142347047?text=Hola,%20soy%20ganador%20de%20la%20Misi%C3%B3n%20KSL-01.%20Quiero%20reclamar%20mi%20premio%20de%20KSL%20Arte%20y%20Dise%C3%B1o%20Gr%C3%A1fico%20S.A.S.">Reclamar premio</a>
          <a class="product-link" href="https://www.promocionalesenlinea.com/KSL_ARTEYDISENO_GRAFICO" target="_blank" rel="noopener noreferrer">Productos KSL</a>
          <button id="playAgainBtn">Jugar de nuevo</button>
        </div>
      </div>
    </section>

    <!-- ======= JUEGO ======= -->
    <main class="game-wrap">
      <header class="hud">
        <div class="brand">
          <img src="assets/logo-ksl.png" alt="KSL" />
          <span>KSL Arte y Diseño Gráfico S.A.S.</span>
        </div>
        <div class="hud-chip coin-chip">🪙 <strong id="coins">0/120</strong></div>
        <div class="hud-chip">❤️ <strong id="lives">5</strong></div>
        <div class="hud-chip">🛡️ <strong id="shield">0</strong></div>
        <div class="hud-chip sector-chip">📍 <strong id="sector">Base KSL</strong></div>
        <button id="soundBtn" class="hud-chip sound-btn" type="button" aria-label="Sonido">🔊</button>
        <div class="status-chip" aria-live="polite"><strong id="status">Listo</strong></div>
      </header>

      <canvas id="game" width="1280" height="720"></canvas>

      <nav class="touch-controls" aria-label="Controles táctiles">
        <button id="leftBtn" aria-label="Izquierda">◀</button>
        <button id="upBtn" aria-label="Elevar nave">▲</button>
        <button id="rightBtn" aria-label="Derecha">▶</button>
      </nav>

      <div id="pauseBadge" class="pause-badge" aria-live="polite">Pausa</div>
    </main>
  </div>

  <script src="script.js"></script>
</body>
</html>
