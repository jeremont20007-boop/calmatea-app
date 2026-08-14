# Cómo generar los materiales para el equipo con NotebookLM

Hay dos documentos fuente en esta carpeta y cada uno da un material distinto:

| Documento | Sale de ahí | Para qué |
|---|---|---|
| `video-fuente-coca.md` | Un video de 8-10 min | Cómo atender al cliente en la promo de Coca-Cola |
| `podcast-fuente-equipo.md` | Un audio de ~10 min | La promo de los chorizos |

El circuito es el mismo para los dos. Cambia sólo el botón del final.

---

## Antes de subir cualquiera de los dos

**Reemplazar todo lo que esté entre corchetes por los datos reales.** El audio y el
video leen literalmente lo que diga el archivo: si dejás `[fecha]`, lo van a decir
así.

Si el mínimo de compra terminó siendo distinto de $18.000, cambialo también: aparece
varias veces en el documento del podcast.

`video-fuente-coca.md` se sube tal cual, no tiene nada que completar. **No menciona
combos ni precios a propósito**: eso vive en la planilla de la caja, que se actualiza
cuando Coca renueva los afiches. Así el video se graba una vez y no queda viejo cada
dos meses.

## Los pasos

1. Entrar a [notebooklm.google.com](https://notebooklm.google.com) con la cuenta de
   Google. Es gratis.
2. Crear un cuaderno nuevo, **uno por cada material**. No mezclar dos fuentes en el
   mismo cuaderno: si están juntas, el resultado habla de las dos cosas y no sirve
   para ninguna.
3. Subir el archivo `.md` como fuente. Si el formato diera problemas, abrirlo,
   copiar todo el texto y pegarlo como fuente de texto: da exactamente igual.
4. Revisar que el **idioma de salida esté en español** en la configuración del
   cuaderno. Si queda en inglés, sale en inglés.
5. Elegir qué generar:
   - **Resumen en video** (Video Overview) para el abordaje y para los combos.
   - **Resumen en audio** (Audio Overview) para el podcast de los chorizos.

   Antes de darle a generar, abrir la opción de personalizar y pegar la instrucción
   que corresponda, de las de más abajo.
6. Tarda unos minutos. Cuando está listo, el reproductor tiene una opción para
   descargarlo. Ese archivo se manda al grupo.

> Si en tu cuenta sólo aparece la opción de audio, la de video puede no estar
> habilitada todavía. En ese caso: generá el audio con la misma fuente y mandalo
> junto con unas capturas de pantalla del recorrido real.

## Instrucción para el podcast de los chorizos

> Están hablando para el equipo que atiende un almacén de barrio en Neuquén,
> Argentina: gente que trabaja en el mostrador y en la caja, no gente de marketing.
> Hablen en español rioplatense, de vos, en tono cercano y relajado, como dos
> compañeros que le explican algo a un tercero mientras toman un café.
>
> Concéntrense en lo que el equipo tiene que hacer y por qué. Lo más importante de
> todo es la frase que hay que decir en la caja cuando al cliente le falta poco para
> llegar al mínimo: eso tiene que quedar clarísimo y repetirse. Dediquen también
> tiempo a las reglas que generan discusión en el mostrador y a las preguntas que
> hacen los clientes.
>
> Nada de jerga de marketing, nada de hablar de la rentabilidad del negocio como si
> fuera una presentación de directorio. Que se entienda que si esto sale bien, es
> por ellos. Apunten a unos diez minutos.

## Instrucción para el video de Coca

> Es un video de capacitación para el personal de un almacén de barrio en Neuquén,
> Argentina, que atiende el mostrador. Español rioplatense, de vos, tono directo y
> práctico, como un encargado explicándole el procedimiento a su equipo.
>
> Es un instructivo, no una charla. Lo más importante son los tres pasos y las frases
> textuales que hay que decir en cada uno: repetilas más de una vez a lo largo del
> video. Dejá bien clara la diferencia entre los dos códigos QR, que es lo que más se
> confunde: uno es el del almacén, en la caja, y otro es el de Coca-Cola, en la pared.
>
> Dedicá buena parte del video a los problemas que aparecen con los clientes y a cómo
> resolverlos, porque es lo que más les va a pasar. Y cerrá recalcando las dos reglas
> que no se rompen: no agarrarle el teléfono al cliente, y aplicar el descuento aunque
> no quiera dar su WhatsApp.
>
> Concreto y sin vueltas: entre ocho y diez minutos. Nada de introducciones largas ni
> de hablar de estrategia comercial.

## Un detalle

Escuchalo o miralo entero antes de mandarlo. NotebookLM a veces se detiene en algo
menor, pronuncia raro un monto o inventa un énfasis donde no va. Si algo quedó
confuso, se corrige el texto del documento fuente y se genera de nuevo: el resultado
siempre sale de lo que diga el archivo.
