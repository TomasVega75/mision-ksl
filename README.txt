# Misión KSL-01

Juego promocional listo para publicar en Netlify.

## Cómo probar
Abre `index.html` en tu navegador.

## Cómo publicar en Netlify
1. Descomprime este ZIP.
2. Entra a https://app.netlify.com/drop
3. Arrastra la carpeta completa `mision_ksl_netlify`.
4. Netlify generará un enlace público.

## Cambiar URL de loggeo
Abre `script.js` y cambia:

const paginaDeLoggeo = "https://ejemplo.com/login";

por tu URL real.


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
