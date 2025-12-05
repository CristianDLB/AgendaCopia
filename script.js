// function para cargar los eventos al dom
async function loadEvents() {

    // fas fa-check-circle finalizado
    // fas fa-clock pronto
    // fas fa-circle en vivo

    const response = await fetch(`/agendas.json?nocache=${Date.now()}`); /* ACA SE CAMBIA REVISE SU CODIGO ORIGINAL /json/agenda123.json */
    const events = await response.json();

    events.forEach(event => {
        // Validar que tenga link
        if (!event.link || event.link.trim() === '') return;

        // Combinar fecha y hora
        const eventDateTimeISO = `${event.date}T${event.time}`;

        // Convertir a zona local
        const eventDateTime = luxon.DateTime.fromISO(eventDateTimeISO, { zone: "America/Lima" }).toLocal();
        const now = luxon.DateTime.local();

        // Guardar la hora formateada para mostrar
        event.time = eventDateTime.toFormat("HH:mm");
        event.timestamp = eventDateTime.toMillis();
        const minutesUntilEvent = eventDateTime.diff(now, 'minutes').values.minutes;

        // Determinar el estado
        if (minutesUntilEvent > -120 && eventDateTime < now) {
            event.status = 'en vivo';
        } else if (minutesUntilEvent <= -120) {
            event.status = 'finalizado';
        } else {
            event.status = 'pronto';
        }
    });


    // Estado
    events.sort((a, b) => {
        const order = { "en vivo": 0, "pronto": 1, "finalizado": 2 };
        return order[a.status] - order[b.status];
    });
    // Fecha y Hora dentro de cada Estado
    events.sort((a, b) => {
        if (a.status !== b.status) return 0; // ya fueron ordenados por estado
        return a.timestamp - b.timestamp; // fecha real ascendente
    });


    const eventsContainer = document.querySelector('.events-container');
    eventsContainer.innerHTML = '';

    events.forEach(event => {
        // Verifica si el link es vÃ¡lido (no null, undefined o cadena vacÃ­a)
        if (!event.link || event.link.trim() === '') return;

        let status_event = event.status.charAt(0).toUpperCase() + event.status.slice(1);

        const eventHtml = `
    <div class="event" data-category="${event.category}">
      <p class="event-name">${event.time} - ${event.title}</p>
      <div class="iframe-container">
  <input type="text" class="iframe-link" readonly value="${event.link}">

  <a href="${event.link}" class="open-link-icon" target="_blank" title="Abrir en nueva pestaÃ±a">
    <i class="fa fa-external-link-alt"></i>
  </a>
</div>
      <div class="buttons_container">

        <button class="copy-button" onclick="copiarEnlace('${event.link}', this)">Copiar</button>
        <button class="status-button status-${event.status === 'finalizado' ? 'finished' : event.status === 'pronto' ? 'next' : 'live'}">
          <i class="fas fa-${event.status === 'finalizado' ? 'check-circle' : event.status === 'pronto' ? 'clock' : 'circle'}"></i>
          ${status_event}
        </button>
      </div>
    </div>
  `;
        eventsContainer.innerHTML += eventHtml;
    });

}

function copiarEnlace(texto, button) {
    navigator.clipboard.writeText(texto).then(() => {
        // Obtener el botón que disparó el evento
        if (!button) {
            button = event.target;
        }

        const originalText = button.textContent;
        const originalBg = button.style.backgroundColor;

        // Cambiar a "Copiado" con color verde lima
        button.textContent = "¡Copiado!";
        button.style.backgroundColor = "#32CD32";

        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = originalBg;
        }, 1000);
    });
}

function mostrarNotificacion(mensaje) {
    const noti = document.getElementById("notification");
    noti.textContent = mensaje;
    noti.style.display = "block";
    noti.style.opacity = 1;
    noti.style.transform = "translateX(-50%) scale(1)";

    setTimeout(() => {
        noti.style.opacity = 0;
        noti.style.transform = "translateX(-50%) scale(0.95)";
        setTimeout(() => {
            noti.style.display = "none";
        }, 500);
    }, 2000);
}

// function para cargar las categorias
async function displayCategories(categorySelected = "Todos") {
    const response = await fetch(`/json/categories.json?nocache=${Date.now()}`);
    const categories = await response.json();

    var categoriesContainer = document.querySelector(".categories");
    var categoryHtml = "";
    categoriesContainer.innerHTML = '';

    categories.forEach((category, index) => {

        categoryHtml = `<button class="category ${categorySelected == category.name ? 'active' : ''}" onClick="filterByCategory('${category.name}')">${category.name}</button>`;

        categoriesContainer.innerHTML += categoryHtml;
    });

}

function filterByCategory(category) {

    const events = document.querySelectorAll('.event');

    displayCategories(category);

    events.forEach(event => {
        if (event.dataset.category === category || category === 'Todos') {
            event.style.display = 'flex';
        } else {
            event.style.display = 'none';
        }
    });
}



// function to convert utc to user timezone
function convertToUserTimeZone(utcHour) {
    const DateTime = luxon.DateTime;
    const utcDateTime = DateTime.fromISO(utcHour, { zone: "America/Lima" });
    const localDateTime = utcDateTime.toLocal();
    return localDateTime.toFormat("HH:mm");
}

// Initial load
document.addEventListener("DOMContentLoaded", function () {

    loadEvents();

    displayCategories();


    // Evento para copiar al portapapeles
    document.querySelectorAll(".iframe-link").forEach(button => {
        button.addEventListener("click", function () {
            copyToClipboard(this);
        });
    });

    // evento buscador por titulo del evento
    document.querySelector(".input-search").addEventListener("keyup", function () {

        const searchTerm = this.value.toLowerCase();
        const events = document.querySelectorAll('.event');
        let foundAny = false;

        events.forEach(event => {
            const title = event.querySelector('.event-name').textContent.toLowerCase();
            if (!title.includes(searchTerm)) {
                event.style.display = 'none';
            } else {
                event.style.display = 'flex';
                foundAny = true;
            }
        });

        // Si no encuentra nada, mostrar mensaje
        let noResultsMsg = document.getElementById('no-results-message');
        if (!foundAny && searchTerm !== '') {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.id = 'no-results-message';
                noResultsMsg.style.cssText = 'text-align: center; padding: 20px; color: #ff9800; font-size: 18px; font-weight: bold;';
                document.querySelector('.events-container').appendChild(noResultsMsg);
            }
            noResultsMsg.textContent = 'Evento deportivo no encontrado';
            noResultsMsg.style.display = 'block';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    });

    // Refrescar los eventos cada 1 minuto
    setInterval(() => {
        loadEvents();
    }, 60000); // 60000 milisegundos = 1 minuto

});