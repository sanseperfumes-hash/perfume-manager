# Guía de Despliegue - Perfume Manager

Para que tu aplicación sea pública y accesible desde cualquier lugar (celular, otra casa, etc.), la mejor opción es usar **Vercel**. Es gratuito para uso personal y se integra perfecto con Next.js.

## Paso 1: Instalar Git (Si no lo tienes)
Como intenté ejecutar `git` y falló, parece que no está instalado o configurado.
1.  Descarga Git desde: [git-scm.com](https://git-scm.com/downloads)
2.  Instálalo (Dale "Siguiente" a todo por defecto).
3.  Reinicia tu terminal (o VS Code) para que reconozca el comando.

## Paso 2: Subir el código a GitHub
Necesitas una cuenta en [GitHub.com](https://github.com).
1.  Crea un **Nuevo Repositorio** en GitHub (ponle `perfume-manager`, público o privado).
2.  En tu carpeta del proyecto, abre una terminal y ejecuta:
    ```bash
    git init
    git add .
    git commit -m "Primer commit: App completa"
    git branch -M main
    git remote add origin https://github.com/TU_USUARIO/perfume-manager.git
    git push -u origin main
    ```
    *(Reemplaza `TU_USUARIO` con tu usuario real de GitHub)*.

## Paso 3: Conectar con Vercel
1.  Crea una cuenta en [Vercel.com](https://vercel.com) (puedes entrar con tu cuenta de GitHub).
2.  Haz clic en **"Add New..."** > **"Project"**.
3.  Selecciona tu repositorio `perfume-manager` y dale a **Import**.

## Paso 4: Configurar Variables de Entorno (¡MUY IMPORTANTE!)
Antes de darle a "Deploy", busca la sección **Environment Variables**. Tienes que copiar las variables de tu archivo `.env` una por una.

| Nombre (Key) | Valor (Value) |
|--------------|---------------|
| `DATABASE_URL` | *Copia el valor de tu .env* |
| `DIRECT_URL` | *Copia el valor de tu .env* |
| `NEXT_PUBLIC_SUPABASE_URL` | *Copia el valor de tu .env* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Copia el valor de tu .env* |
| `JWT_SECRET` | `supersecretkey123` (o lo que tengas) |
| `SMTP_USER` | *Tu email de Gmail* |
| `SMTP_PASS` | *Tu contraseña de aplicación* |
| `NEXT_PUBLIC_APP_URL` | `https://tu-proyecto.vercel.app` (Esto lo actualizas después de desplegar) |

## Paso 5: Desplegar
1.  Dale clic a **Deploy**.
2.  Espera unos minutos... ¡y listo!
3.  Vercel te dará un link (ej: `perfume-manager.vercel.app`) que puedes compartir y abrir desde cualquier lado.

---
> [!NOTE]
> Si cambias algo en el código en el futuro, solo tienes que hacer `git push` y Vercel actualizará la página automáticamente.
