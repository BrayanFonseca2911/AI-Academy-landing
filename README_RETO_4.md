# Campuslands AI Academy · Reto 4: Automatización y Seguimiento Administrativo

**Documento de entrega: enlaces a la demo, indicaciones de acceso al panel de prueba, guía del flujo de n8n y pasos de ejecución y verificación.**

---

## 1. Enlaces del Entregable

- **Enlace a la Demo (Landing con Formulario `#registro`)**: `[PEGAR_AQUI_TU_ENLACE_DE_LA_DEMO]/index.html#registro`
- **Enlace al Panel de Administración de prueba**: `[PEGAR_AQUI_TU_ENLACE_DE_LA_DEMO]/admin.html`
- **Flujo de n8n exportado en JSON**: [`n8n/flujo-telegram-leads.json`](n8n/flujo-telegram-leads.json)
- **Código del proyecto**: incluido en esta carpeta / repositorio (`index.html`, `admin.html`, `css/`, `js/`, `n8n/`).

---

## 2. Indicaciones de Acceso al Panel de Prueba (`admin.html`)

Para acceder al Panel de Administración, abre **`admin.html`**. En la pantalla de inicio de sesión puedes hacer clic directamente sobre cualquiera de los tres perfiles para autocompletar e ingresar en un clic, o escribir las credenciales de prueba manualmente:

| Administrador de prueba | Rol en el equipo | Correo de acceso | Clave de acceso |
| :--- | :--- | :--- | :---: |
| **Andrés Cristancho** | Coordinador & Community · AI Academy | `andres@campuslands.com` | `AI-2026` |
| **Mafe Góngora** | Líder Comercial · AI Academy | `mafe@campuslands.com` | `AI-2026` |
| **Santiago Laguado** | Trainer Líder · AI Academy | `santiago@campuslands.com` | `AI-2026` |

- **Cambio de administrador para continuar el seguimiento**: Dentro del panel (esquina superior derecha) se encuentra el selector **"Administrador activo"**. Permite alternar entre *Andrés*, *Mafe* y *Santiago* en cualquier momento para verificar que otro administrador puede entender el caso y continuar el seguimiento dejando su nombre y correo registrados en el historial.

---

## 3. Qué se construyó (Cumplimiento de Requerimientos)

### 01 · Formulario en la nueva landing (`index.html#registro`)
- Solicita **Nombre** (obligatorio), **Correo electrónico** (obligatorio, validado con formato de correo), **Programa de interés** (obligatorio: *Ignition, Booster, Liftoff, Odyssey o Nebula*) y **Teléfono** (opcional, validado si se ingresa).
- **Validación**: Si falta algún campo obligatorio o tiene formato inválido, bloquea el envío, señala el error en pantalla y **no genera ningún registro ni dispara aviso a Telegram**.
- **Persistencia y confirmación**: Al superar la validación, guarda el registro con **fecha exacta** y estado inicial **`Nuevo`**, y muestra en la misma landing una tarjeta de confirmación con el folio asignado (`AIA-...`), los datos guardados, el texto enviado a Telegram y un botón directo para abrir ese registro en el Panel de Administración.

### 02 · Notificación por Telegram con n8n (`n8n/flujo-telegram-leads.json`)
- Flujo exportado de **n8n** compuesto por:
  1. **`Webhook Landing AI Academy`** (`POST /lead-ai-academy`): recibe los datos del registro guardado.
  2. **`Validar Datos Obligatorios`** (nodo `IF`): comprueba que `nombre`, `correo` y `programa` sean válidos antes de continuar.
  3. **`Formatear Aviso Telegram`** (nodo `Set`): estructura el aviso con nombre, correo, programa, teléfono (o *"No proporcionado"* si se omitió), estado `Nuevo` y fecha.
  4. **`Enviar Aviso por Telegram`** (nodo `Telegram`): envía la notificación al chat privado de prueba.
  5. **`Responder 200 OK` / `Rechazar 400 Sin Aviso`**.
- **Credenciales fuera de los archivos compartidos**: ni el token del bot de Telegram ni el `chat_id` están expuestos en el código ni en el JSON exportado; se configuran dentro de las credenciales de n8n, y la URL del Webhook se configura desde la interfaz del Panel Admin (`localStorage`).

### 03 · Panel de Administración (`admin.html`)
- Permite consultar cada registro, filtrarlo por estado o buscarlo por nombre, correo, programa o folio.
- Permite cambiar el estado usando los cuatro estados requeridos: **`Nuevo`**, **`Contactado`**, **`En seguimiento`** y **`Cerrado`**.
- Permite **añadir notas** de seguimiento en cada solicitud.
- Registra y muestra el **Historial de cambios** completo indicando en cada evento **qué cambió**, **quién lo hizo** y **cuándo**.

---

## 4. Cómo Ejecutarlo

1. **Abrir la Landing y el Panel Admin**:
   - Abre **`index.html`** y **`admin.html`** en tu navegador (con doble clic o con la extensión **Live Server** de VS Code).
2. **Importar y activar el flujo en n8n**:
   - En **n8n**, selecciona **Import from File** y carga **`n8n/flujo-telegram-leads.json`**.
   - En el nodo **`Enviar Aviso por Telegram`**, selecciona tu credencial `Telegram API` en n8n y coloca el `Chat ID` de tu chat privado de prueba.
   - Activa el workflow y copia la URL del nodo **`Webhook Landing AI Academy`**.
3. **Vincular el Webhook en el Panel de Prueba**:
   - En **`admin.html`**, inicia sesión y pega la URL del Webhook en la barra superior **"Conexión Webhook n8n → Telegram"** → pulsa **Guardar Webhook**.

---

## 5. Cómo Verificarlo (Pasos de la Demostración)

1. **Validación de dato obligatorio inválido**:
   - En `index.html#registro`, intenta enviar el formulario con un correo inválido (ej. `correo-invalido`) o sin programa seleccionado.
   - **Resultado**: Se muestra el error de validación y no se crea registro en el panel ni se envía mensaje a Telegram.
2. **Registro de una persona ficticia desde la landing**:
   - Registra una persona ficticia (ej. *Nombre*: `Martín Rojas`, *Correo*: `martin.rojas@logistica-andina.co`, *Programa*: `Liftoff (12 horas)`, *Teléfono*: `310 555 0192`).
   - **Resultado**: Aparece la confirmación en la landing con fecha y estado **`Nuevo`**.
3. **Verificación del mensaje en Telegram**:
   - Comprueba en el chat privado de Telegram la recepción del aviso con el nombre, correo, programa y teléfono de la persona ficticia.
4. **Actualización a `Contactado` con nota en el Panel Admin**:
   - Entra a `admin.html`, localiza el registro de `Martín Rojas`, cambia su estado a **`Contactado`**, añade una nota de seguimiento y haz clic en **Guardar estado y nota en el historial**.
5. **Comprobación de persistencia e historial**:
   - Cambia a otro registro (o recarga la página) y vuelve a abrir el registro de `Martín Rojas`.
   - **Resultado**: Se conservan el estado **`Contactado`**, la nota guardada y el historial detallando **qué cambió** (`Estado cambiado: Nuevo → Contactado + Nota añadida`), **quién lo hizo** (`Andrés Cristancho`) y **cuándo**.
