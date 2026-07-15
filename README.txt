# Misión KSL-01

Juego HTML, CSS y JavaScript para KSL Arte y Diseño Gráfico S.A.S.

## Cambios versión 2
- Logo actualizado con fondo transparente.
- Vidas iniciales: 5.
- Límite máximo de monedas recolectadas: 30.

## Cambios versión 3
- Ahora el premio solo se desbloquea si el jugador llega a la meta con 30 monedas.
- Si llega con menos de 30 monedas, aparece un aviso y la nave vuelve un poco atrás para seguir jugando.

## Cambios versión 4
- En la pantalla de victoria ahora hay dos opciones:
  - Reclamar premio.
  - Jugar de nuevo.
- Se eliminó la redirección automática para que el usuario decida.

## Cambios versión 5 - ampliación del juego
- El recorrido fue ampliado de 8.400 px a 12.400 px para que la misión dure más.
- La meta ahora exige 80 monedas para desbloquear el premio.
- Se agregaron nuevos sectores de misión: Base, Nebulosa Azul, Cinturón KSL, Zona Roja, Ruta Dorada y Portal Premio.
- Se agregaron checkpoints que guardan el avance y entregan monedas extra.
- Se agregaron power-ups:
  - T: impulso turbo.
  - S: escudo protector.
- Se agregaron cajas de escudo y nuevas cajas KSL en el tramo final.
- Se agregaron más drones enemigos y centinelas orbitales.
- Se mejoró el HUD con escudo, sector actual y mensajes más claros.
- Se agregaron mensajes flotantes, récord local de monedas, tip inicial y pausa con la tecla P.
- Se ampliaron fondos, nebulosas y planetas para que el juego se sienta menos corto sin cambiar su idea central.

## Controles
- PC: flechas izquierda/derecha o A/D para moverte.
- Elevar nave: espacio, flecha arriba o W.
- Pausa: P.
- Celular: botones táctiles inferiores.


Actualización visual/diseño:
- Recorrido ampliado a 14.000px.
- Meta de monedas ajustada a 80.
- Cajas KSL rediseñadas como contenedores espaciales con brillo.
- Checkpoints rediseñados como portales/gates de guardado.
- Obstáculos superiores equilibrados: sin láseres, con asteroides ocasionales y centinelas más espaciados para evitar pasar todo por arriba sin volverlo imposible.
- Monedas redistribuidas en líneas más espaciadas y con rutas de riesgo/recompensa.


AJUSTE DE BALANCE v7
- Recorrido ajustado a 14.000px.
- Láseres eliminados.
- Asteroides superiores reducidos y más espaciados.
- Checkpoints rediseñados como balizas KSL de guardado.
- Se eliminó el empuje brusco de cámara al recoger cajas o recibir golpes.


AJUSTE v8 - Potenciador de vida
- Se agregó un único potenciador de vida en el recorrido.
- Al recogerlo recupera +1 vida, con límite máximo de 5 vidas.
- No se modificó la estructura, dificultad, recorrido ni comportamiento general del juego.


AJUSTE v9 - Vida extra y meta 80
- Se ajustaron los orbes de vida para que existan 3 durante la partida.
- El límite máximo se mantiene en 5 vidas.
- La meta de monedas se ajustó a 80.
- Se retiró el obstáculo superior del tramo final para suavizar el cierre de la misión.
- No se modificó el resto del recorrido.


============================================================
VERSIÓN 10 — EDICIÓN GALÁCTICA (mejora integral)
============================================================

## Recorrido y duración
- Recorrido ampliado de 14.000 px a 24.000 px (10 sectores).
- Nuevos sectores: Base KSL, Nebulosa Azul, Campo de Asteroides,
  Anillos Verdes, Estación Fantasma, Zona Roja, Corredor Magnético,
  Ruta Dorada, Tormenta Iónica y Portal Premio.
- Meta ajustada a 120 monedas (hay ~354 disponibles en el mapa).
- 7 checkpoints (antes 4), cada uno entrega +5 monedas y guarda avance.
- La meta y las vidas son configurables en el objeto CONFIG al
  inicio de script.js.

## Contenido nuevo de juego
- Plataformas móviles (moradas) que patrullan y transportan la nave.
- Anillos de impulso: al cruzarlos dan un empujón hacia adelante.
- Gemas KSL (+5 monedas) en rutas altas de riesgo/recompensa.
- Power-up Imán (M): atrae monedas cercanas durante ~9 segundos.
- Minas espaciales estáticas que pulsan como advertencia.
- Lluvias de meteoritos en Zona Roja y Tormenta Iónica (con cola
  de fuego y frecuencia moderada para mantener el juego justo).
- El turbo y los anillos elevan temporalmente la velocidad máxima.

## Mejoras gráficas
- Parallax real de 3 capas: planetas lejanos, nebulosas y mundo.
- Estrellas con titileo y profundidad + estrellas fugaces.
- Planetas con cráteres y doble anillo; nebulosas que respiran.
- Monedas con giro 3D y destellos; cajas KSL que flotan.
- Nave con inclinación según el vuelo, estela luminosa y llama
  extendida en turbo; aura de imán y burbuja de escudo mejorada.
- Enemigos animados: ojo que escanea, propulsores, anillo orbital
  en centinelas; asteroides irregulares que rotan.
- Portal con partículas orbitando.
- Banner animado al entrar a cada sector.
- Tinte ambiental sutil por sector.
- Viñeta roja al recibir daño y pulso de alerta con 1 vida.
- Barra de progreso con marcas de checkpoints y marcador de nave.
- Culling de dibujo (solo se pinta lo visible) para buen rendimiento.

## Sonido
- Efectos sintetizados con WebAudio (sin archivos externos):
  monedas, gemas, cajas, checkpoints, daño, escudo, victoria, etc.
- Botón de sonido en el HUD y tecla M para silenciar.
- La preferencia de sonido se guarda en el dispositivo.

## Interfaz
- Tipografías espaciales (Orbitron + Exo 2) con respaldo a Arial.
- Fondo de página con estrellas y aurora animadas (CSS).
- Pantalla de inicio con estadísticas de la misión y tu récord.
- Pantalla de derrota muestra sector alcanzado y % de progreso.
- Pantalla de victoria muestra el tiempo de misión.
- Botón "Reclamar premio" con pulso destacado.
- Soporte de "prefers-reduced-motion" para accesibilidad.

## Sin cambios (lógica de negocio intacta)
- El premio solo se desbloquea llegando al portal con la meta
  de monedas; si faltan, aviso y retroceso suave (igual que antes).
- Enlaces de WhatsApp para reclamar premio y de Productos KSL.
- Controles: ← → o A/D, espacio/↑/W, P para pausa, táctil en móvil.
- Récord local de monedas en el dispositivo.
- Física de vuelo original (misma gravedad y empuje).


------------------------------------------------------------
v10.1 — Optimización de rendimiento (fluidez)
------------------------------------------------------------
- Se eliminó el "filter: blur(30px)" animado de la capa de aurora
  del fondo. Un desenfoque grande a pantalla completa animándose
  en bucle obligaba al navegador a re-rasterizar toda esa capa en
  cada frame y hundía los FPS de TODA la página (no solo del juego).
  Ahora la aurora usa gradientes muy suaves y solo anima opacidad,
  que el navegador compone en GPU sin repintar.
- Las capas de estrellas del fondo usan will-change: transform para
  animarse en GPU.
- En el canvas: el gradiente de fondo ahora se crea una sola vez
  (antes se recreaba 60 veces por segundo); se añadió culling a
  planetas y nebulosas (no se dibujan ni se calculan sus gradientes
  si están fuera de pantalla); y se redujeron los radios de "glow"
  (shadowBlur) de cajas, gemas, power-ups, checkpoints, minas y
  enemigos, que son costosos en la GPU. El aspecto se mantiene.
