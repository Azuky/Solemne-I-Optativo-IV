## Marco Gutierrez Tolorza
## Solemne I - Optativo de Especialidad IV

### ¿Qué géneros o demografía genera mayor interés en la audiencia basado en el puntaje?

---

El siguiente proyecto tiene el fin de realizar un scraping a la página de https://myanimelist.net/ para extraer datos
los cuales posteriormente se usaran para un posible análisis de estos datos.

---

Para ejecutar el proyecto es necesario tener instalado nodejs instalado previamente.
Una vez instalado es necesario instalar los paquetes mediante el siguiente comando

```console
foo@bar:~$ npm install
```

Una vez instalados los paquetes se puede ejecutar para comenzar a realizar el scraping. Este se ejecuta mediante el 
siguiente comando

```console
foo@bar:~$ npm run dev
```

Una vez ya ejecutado comenzará a verse en la consola el número de anime el cual está scrapeando en ese momento.
En caso de algún error durante el scraping en alguna página en específico se procederá a saltarse hacía la próxima URL
sin necesidad de romper el código.

Los datos se van guardando en un archivo llamado `animes.json` dentro del directorio `out`.