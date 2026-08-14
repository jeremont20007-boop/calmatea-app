# Cómo generar los materiales para el equipo con NotebookLM

Hay dos documentos fuente en esta carpeta y cada uno da un material distinto:

| Documento | Sale de ahí | Para qué |
|---|---|---|
| `podcast-fuente-equipo.md` | Un audio de ~10 min | Que el equipo entienda la promo de los chorizos |
| `video-fuente-coca.md` | Un video narrado | Cómo acompañar al cliente en la promo de Coca |

El circuito es el mismo para los dos. Cambia sólo el botón del final.

---

## Antes de subir cualquiera de los dos

**Reemplazar todo lo que esté entre corchetes por los datos reales.** El audio y el
video leen literalmente lo que diga el archivo: si dejás `[fecha]`, lo van a decir
así.

Si el mínimo de compra terminó siendo distinto de $18.000, cambialo también: aparece
varias veces en el documento del podcast.

`video-fuente-coca.md` ya está completo con los dos combos que hay pegados hoy en el
local. **Si Coca-Cola cambia los afiches, hay que actualizar esa lista antes de
volver a generar el video**: los combos, los descuentos y cuáles son retornables
están escritos ahí y el video repite lo que diga el archivo.

## Los pasos

1. Entrar a [notebooklm.google.com](https://notebooklm.google.com) con la cuenta de
   Google. Es gratis.
2. Crear un cuaderno nuevo, uno por cada material. No mezclar las dos fuentes en el
   mismo cuaderno: si están las dos juntas, el resultado habla de las dos cosas y no
   sirve para ninguna.
3. Subir el archivo `.md` como fuente. Si el formato diera problemas, abrirlo,
   copiar todo el texto y pegarlo como fuente de texto: da exactamente igual.
4. Revisar que el **idioma de salida esté en español** en la configuración del
   cuaderno. Si queda en inglés, sale en inglés.
5. Elegir qué generar:
   - **Resumen en audio** (Audio Overview) para el podcast de los chorizos.
   - **Resumen en video** (Video Overview) para el instructivo de Coca.
   
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
> Es un instructivo, no una charla: que quede clarísimo el orden de los pasos y qué
> se dice en cada momento. Dediquen buena parte del video a los problemas que
> aparecen con los clientes y a cómo resolverlos, porque es lo que más les va a
> pasar. Recalquen lo que no hay que hacer, sobre todo no agarrarle el teléfono al
> cliente.
>
> Que sea corto y concreto: entre tres y cinco minutos. Nada de introducciones
> largas ni de hablar de estrategia comercial.

## Un detalle

Escuchalo o miralo entero antes de mandarlo. NotebookLM a veces se detiene en algo
menor, pronuncia raro un monto o inventa un énfasis donde no va. Si algo quedó
confuso, se corrige el texto del documento fuente y se genera de nuevo: el resultado
siempre sale de lo que diga el archivo.
