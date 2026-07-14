# Zenta Webs — Página de presentación

Landing de una sola página para presentar el estudio (Zenta Webs) a clientes
potenciales: qué se puede construir, portfolio con las 4 demos publicadas,
proceso de trabajo, precios orientativos y FAQ. HTML, CSS y JS puro — sin
frameworks, sin build.

## Antes de mandarle el link a un cliente

- [ ] `js/config.js`: poné tu número real de WhatsApp (`whatsappNumber`) y tu email.
      Los 4 links de portfolio ya apuntan a las URLs publicadas
      (saboresreales.com.ar, dejarasalon.netlify.app, ag-valencia.netlify.app,
      ovidioristorante.netlify.app) — si alguna cambia de dominio, actualizala acá.
- [ ] Confirmá que tenés permiso para mostrar públicamente los sitios de
      Dejará, Ovidio y AG Valencia como portfolio (son demos/trabajos reales
      de otros negocios).
- [ ] Sección de precios (`#precios` en `index.html`): los montos están en
      `$XXX.XXX` a propósito — completá tus valores reales antes de publicar.
- [ ] `assets/portfolio/*.jpg`: son capturas reales tomadas de los sitios en
      producción. Si actualizás algún demo, volvé a capturar la imagen
      correspondiente para que no quede desactualizada.

## Estructura

```
index.html          → toda la página
css/styles.css       → paleta, tipografía, layout, animaciones
js/config.js         → único archivo con WhatsApp, email e links de demos
js/script.js         → menú, scroll reveal, acordeón FAQ, CTA sticky mobile
assets/portfolio/    → capturas de Sabores Reales, Dejará, Ovidio y AG Valencia
```

## Deploy

Igual que el resto del proyecto: arrastrar la carpeta a Netlify
("Deploy manually") o `vercel` desde la CLI. No hace falta build — y como
todos los links de portfolio ahora son URLs absolutas, `/propuesta` se puede
deployar sola, sin depender de `/demos`.
