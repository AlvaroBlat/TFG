// scripts.js

import { collection, getDocs, query, where, doc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { db } from '../js/firebase.js';

// --- PROTECCION SESIÓN NO INICIADA ---
function protegerRuta() {
  const rutasPublicas = ["login.html", "registro.html"];
  const rutaActual = window.location.pathname.split("/").pop();

  if (rutasPublicas.includes(rutaActual)) return;

  const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
  if (!usuarioActual || !usuarioActual.usuario) {
    console.warn("No hay sesión activa. Redirigiendo a login...");
    window.location.href = "login.html";
  }
}

// --- LOGIN ---
document.addEventListener('DOMContentLoaded', () => {
  const botonLogin = document.getElementById('boton-login');

  if (botonLogin) {
    botonLogin.addEventListener('click', async (e) => {
      e.preventDefault();
      const usuario = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value;

      const q = query(
        collection(db, "usuarios"),
        where("usuario", "==", usuario),
        where("contrasena", "==", contrasena)
      );

      try {
        const resultado = await getDocs(q);
        if (!resultado.empty) {
          const doc = resultado.docs[0];
          const datosUsuario = doc.data();
          localStorage.setItem("usuarioActual", JSON.stringify(datosUsuario));
          window.location.href = "index.html";
        } else {
          alert("Usuario o contraseña incorrectos");
        }
      } catch (error) {
        console.error("Error en la autenticación:", error);
        alert("Ha ocurrido un error al iniciar sesión.");
      }
    });
  }
});

// --- REGISTRO ---
document.addEventListener("DOMContentLoaded", () => {
  protegerRuta();
  const formulario = document.getElementById('formulario-registro');
  if (formulario) {
    formulario.addEventListener('submit', async (e) => {
      e.preventDefault();

      const usuario = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value;
      const nombre = document.getElementById('nombre').value;
      const apellido = document.getElementById('apellido').value;
      const correo = document.getElementById('correo').value;

      const consultaUsuario = query(collection(db, "usuarios"), where("usuario", "==", usuario));
      const resultadoUsuario = await getDocs(consultaUsuario);
      if (!resultadoUsuario.empty) {
        alert("Ese nombre de usuario ya existe. Elige otro.");
        return;
      }

      const consultaCorreo = query(collection(db, "usuarios"), where("correo", "==", correo));
      const resultadoCorreo = await getDocs(consultaCorreo);
      if (!resultadoCorreo.empty) {
        alert("Ya existe un usuario con ese correo. Elige otro.");
        return;
      }

      try {
        await addDoc(collection(db, "usuarios"), {
          usuario,
          contrasena,
          nombre,
          apellido,
          correo
        });

        const nuevoResultado = await getDocs(query(collection(db, "usuarios"), where("usuario", "==", usuario)));
        if (!nuevoResultado.empty) {
          const doc = nuevoResultado.docs[0];
          localStorage.setItem("usuarioActual", JSON.stringify(doc.data()));
        }

        window.location.href = "index.html";
      } catch (error) {
        console.error("Error al registrar usuario:", error);
        alert("Error al registrarse. Inténtalo de nuevo.");
      }
    });
  }
});

// --- DATOS USUARIO ---
const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
document.getElementById('nombre-usuario-nav').textContent = `${usuarioActual.nombre}`;

// --- LOGOUT ---
document.getElementById('logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem("usuarioActual");
  window.location.href = "login.html";
});

// --- AGREGAR PROYECTO ---
document.getElementById("botonAñadirProyecto")?.addEventListener("click", async () => {
  const nombreProyecto = document.getElementById("nombreProyecto").value.trim();
  const descripcionProyecto = document.getElementById("descripcionProyecto")?.value;

  if (!nombreProyecto) {
    alert("El nombre del proyecto es obligatorio.");
    return;
  }

  try {
    await addDoc(collection(db, "proyectos"), {
      nombre: nombreProyecto,
      creadoPor: usuarioActual.usuario,
      descripcion: descripcionProyecto || ""
    });
    alert("Proyecto añadido correctamente.");
    window.location.reload();
  } catch (error) {
    console.error("Error al añadir proyecto:", error);
    alert("Hubo un error al guardar el proyecto.");
  }
});

// --- MOSTRAR PROYECTOS CON FORMULARIOS DINÁMICOS ---
async function mostrarProyectos(usuario) {
  const proyectosRef = collection(db, "proyectos");
  const qProyectos = query(proyectosRef, where("creadoPor", "==", usuario));
  const proyectosSnap = await getDocs(qProyectos);

  const tareasRef = collection(db, "tareas");
  const tareasSnap = await getDocs(tareasRef);

  const contenedor = document.getElementById("lista-proyectos");
  contenedor.innerHTML = "";

  proyectosSnap.forEach((docSnap) => {
    const proyecto = docSnap.data();
    const idProyecto = docSnap.id;

    // Filtrar tareas que pertenecen a este proyecto
    const tareasProyecto = [];
    tareasSnap.forEach((tareaDoc) => {
      const tarea = tareaDoc.data();
      if (tarea.idProyecto === idProyecto) {
        tareasProyecto.push(tarea);
      }
    });

    // Crear HTML para las tareas
    const htmlTareas = tareasProyecto.length > 0
      ? tareasProyecto.map(t => `<div>Tareas del proyecto: </div> <li>Nombre de la tarea: <strong>${t.nombre}</strong> | Descripción: ${t.descripcion} | Prioridad: ${["Baja", "Media", "Alta"][t.prioridad]} | Fecha Limite: ${t.fechaLimite}</li>`).join("")
      : `<li class="text-muted">No hay tareas aún.</li>`;

    // Insertar proyecto con tareas
    const html = `
      <div class="project mb-4">
        <h5>${proyecto.nombre}</h5>
        <p>Descripción: ${proyecto.descripcion || "Sin descripción."}</p>
        <p>Creado por: ${proyecto.creadoPor}</p>
        <ul>${htmlTareas}</ul>
        <button class="btn btn-secondary btn-sm" data-bs-toggle="collapse" data-bs-target="#form-${idProyecto}">Añadir Tarea</button>
        <button class="btn btn-danger btn-sm btn-eliminar-proyecto" data-id="${idProyecto}">Eliminar Proyecto</button>
        <div class="collapse" id="form-${idProyecto}">
          <form class="formulario-tarea mt-2" data-id-proyecto="${idProyecto}">
            <div class="mb-2">
              <label class="form-label">Nombre</label>
              <input type="text" class="form-control" name="nombre" required>
            </div>
            <div class="mb-2">
              <label class="form-label">Descripción</label>
              <textarea class="form-control" name="descripcion"></textarea>
            </div>
            <div class="mb-2">
              <label class="form-label">Fecha límite</label>
              <input type="date" class="form-control" name="fechaLimite" required>
            </div>
            <div class="mb-2">
              <label class="form-label">Prioridad</label>
              <select class="form-select" name="prioridad">
                <option value="0">Baja</option>
                <option value="1">Media</option>
                <option value="2">Alta</option>
              </select>
            </div>
            <button type="submit" class="btn btn-success btn-sm">Crear Tarea</button>
          </form>
        </div>
      </div>
    `;
    contenedor.insertAdjacentHTML("beforeend", html);
  });

  // Listeners para cada formulario de tarea
  document.querySelectorAll(".formulario-tarea").forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const datos = new FormData(form);

      const tarea = {
        nombre: datos.get("nombre"),
        descripcion: datos.get("descripcion"),
        fechaLimite: datos.get("fechaLimite"),
        prioridad: parseInt(datos.get("prioridad")),
        completada: false,
        idProyecto: form.getAttribute("data-id-proyecto"),
        creadaPor: usuarioActual.usuario
      };

      try {
        await addDoc(collection(db, "tareas"), tarea);
        alert("Tarea añadida correctamente.");
        window.location.reload();
      } catch (err) {
        console.error("Error al crear tarea:", err);
        alert("No se pudo guardar la tarea.");
      }
    });
  });

  // Lógica de eliminación de proyecto y sus tareas asociadas
  document.querySelectorAll(".btn-eliminar-proyecto").forEach(btn => {
  btn.addEventListener("click", async () => {
    const idProyecto = btn.getAttribute("data-id");
    const confirmar = confirm("¿Estás seguro de que quieres eliminar este proyecto y todas sus tareas?");
    if (!confirmar) return;

    try {
      // Eliminar tareas asociadas al proyecto
      const tareasRef = collection(db, "tareas");
      const q = query(tareasRef, where("idProyecto", "==", idProyecto));
      const tareasSnap = await getDocs(q);

      for (const tarea of tareasSnap.docs) {
        await deleteDoc(doc(db, "tareas", tarea.id));
      }

      // Eliminar el proyecto
      await deleteDoc(doc(db, "proyectos", idProyecto));

      alert("Proyecto y sus tareas eliminados correctamente.");
      await mostrarProyectos(usuarioActual.usuario);
    } catch (err) {
      console.error("Error al eliminar proyecto:", err);
      alert("No se pudo eliminar el proyecto.");
    }
  });
});
}


// --- RENDERIZAR TAREAS EN tareas.html ---
document.addEventListener("DOMContentLoaded", async () => {
  protegerRuta();
  const ruta = window.location.pathname;
  if (!ruta.includes("tareas.html")) return;

  const contenedorTareas = document.getElementById("listaTareas");
  const filtroPrioridad = document.getElementById("filtroPrioridad");
  const filtroFecha = document.getElementById("filtroFecha");
  const mapaPrioridades = ["baja", "media", "alta"];
  const textoPrioridades = ["Baja", "Media", "Alta"];

  const obtenerTareas = async () => {
    const proyectosRef = collection(db, "proyectos");
    const qProyectos = query(proyectosRef, where("creadoPor", "==", usuarioActual.usuario));
    const proyectosSnap = await getDocs(qProyectos);
    const tareasRef = collection(db, "tareas");
    const tareasSnap = await getDocs(tareasRef);

    const tareasAgrupadas = [];
    proyectosSnap.forEach((proyectoDoc) => {
      const proyecto = proyectoDoc.data();
      const idProyecto = proyectoDoc.id;
      tareasSnap.forEach((tareaDoc) => {
        const tarea = tareaDoc.data();
        if (tarea.idProyecto === idProyecto) {
          tareasAgrupadas.push({ ...tarea, id: tareaDoc.id, nombreProyecto: proyecto.nombre });
        }
      });
    });
    return tareasAgrupadas;
  };

  const aplicarFiltros = (tareas) => {
    const filtroP = filtroPrioridad.value;
    const filtroF = filtroFecha.value;
    const ahora = new Date();

    return tareas.filter(t => {
      const fechaTarea = new Date(t.fechaLimite);
      let pasaFiltroPrioridad = filtroP === "todas" || mapaPrioridades[t.prioridad] === filtroP;
      let pasaFiltroFecha = true;

      if (filtroF === "hoy") {
        const hoy = new Date();
        pasaFiltroFecha = fechaTarea.toDateString() === hoy.toDateString();
      } else if (filtroF === "estaSemana") {
        const inicioSemana = new Date();
        inicioSemana.setDate(ahora.getDate() - ahora.getDay());
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        pasaFiltroFecha = fechaTarea >= inicioSemana && fechaTarea <= finSemana;
      } else if (filtroF === "esteMes") {
        pasaFiltroFecha = fechaTarea.getMonth() === ahora.getMonth() && fechaTarea.getFullYear() === ahora.getFullYear();
      }
      return pasaFiltroPrioridad && pasaFiltroFecha;
    });
  };

  const renderizarTareas = async () => {
    const tareas = aplicarFiltros(await obtenerTareas());
    contenedorTareas.innerHTML = "";

    tareas.forEach((tarea) => {
  const fecha = new Date(tarea.fechaLimite);
  const fechaFormateada = fecha.toLocaleDateString();
  const prioridadTexto = textoPrioridades[tarea.prioridad] || "Sin prioridad";
  const clases = ["fila-tarea"];
  if (tarea.completada) clases.push("completada");

  const div = document.createElement("div");
  div.className = clases.join(" ");
  div.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="flex-grow-1 contenido-tarea">
        <strong>${tarea.nombre}:</strong> ${tarea.descripcion}<br>
        <small>
          Prioridad: ${prioridadTexto} | Fecha límite: ${fechaFormateada} | Proyecto: ${tarea.nombreProyecto}<br>
          Creado por: ${tarea.creadaPor}
        </small>
      </div>
      <div>
        <button class="btn btn-success btn-sm btn-completar"><i class="fas fa-check"></i> ${tarea.completada ? "Desmarcar" : "Completar"}</button>
        <button class="btn btn-primary btn-sm btn-editar"><i class="fas fa-edit"></i> Editar</button>
        <button class="btn btn-danger btn-sm btn-eliminar"><i class="fas fa-trash"></i> Eliminar</button>
      </div>
    </div>
  `;

  // Botón completar
  div.querySelector(".btn-completar").addEventListener("click", async () => {
    const tareaRef = doc(db, "tareas", tarea.id);
    await updateDoc(tareaRef, { completada: !tarea.completada });
    await renderizarTareas();
  });

  // Botón eliminar
  div.querySelector(".btn-eliminar").addEventListener("click", async () => {
    if (confirm("¿Seguro que deseas eliminar esta tarea?")) {
      const tareaRef = doc(db, "tareas", tarea.id);
      await deleteDoc(tareaRef);
      await renderizarTareas();
    }
  });

  // Botón editar
  div.querySelector(".btn-editar").addEventListener("click", () => {
    const contenedor = div.querySelector(".contenido-tarea");
    contenedor.innerHTML = `
      <form class="form-editar-tarea mt-2">
        <input type="text" name="nombre" class="form-control mb-2" value="${tarea.nombre}" required>
        <textarea name="descripcion" class="form-control mb-2">${tarea.descripcion || ""}</textarea>
        <input type="date" name="fechaLimite" class="form-control mb-2" value="${tarea.fechaLimite}">
        <select name="prioridad" class="form-select mb-2">
          <option value="0" ${tarea.prioridad === 0 ? "selected" : ""}>Baja</option>
          <option value="1" ${tarea.prioridad === 1 ? "selected" : ""}>Media</option>
          <option value="2" ${tarea.prioridad === 2 ? "selected" : ""}>Alta</option>
        </select>
        <button type="submit" class="btn btn-primary btn-sm">Guardar</button>
        <button type="button" class="btn btn-secondary btn-sm btn-cancelar">Cancelar</button>
      </form>
    `;

    const form = contenedor.querySelector(".form-editar-tarea");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const datos = new FormData(form);
      const tareaActualizada = {
        nombre: datos.get("nombre"),
        descripcion: datos.get("descripcion"),
        fechaLimite: datos.get("fechaLimite"),
        prioridad: parseInt(datos.get("prioridad")),
      };

      const tareaRef = doc(db, "tareas", tarea.id);
      await updateDoc(tareaRef, tareaActualizada);
      await renderizarTareas();
    });

    contenedor.querySelector(".btn-cancelar").addEventListener("click", renderizarTareas);
  });

  contenedorTareas.appendChild(div);
});
  };

  filtroPrioridad.addEventListener("change", renderizarTareas);
  filtroFecha.addEventListener("change", renderizarTareas);
  await renderizarTareas();
});

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  protegerRuta();
  if (usuarioActual && usuarioActual.usuario) {
    mostrarProyectos(usuarioActual.usuario);
  } else {
    window.location.href = "login.html";
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (document.title === "Inicio") {
    const resumenTareas = document.getElementById("resumen-tareas");

    async function cargarResumenTareas() {
      const proyectosRef = collection(db, "proyectos");
      const tareasRef = collection(db, "tareas");

      const qProyectos = query(proyectosRef, where("creadoPor", "==", usuarioActual.usuario));
      const proyectosSnap = await getDocs(qProyectos);
      const tareasSnap = await getDocs(tareasRef);

      const idNombreProyecto = {};
      proyectosSnap.forEach(proy => idNombreProyecto[proy.id] = proy.data().nombre);

      const tareasPendientes = [];
      tareasSnap.forEach(tareaDoc => {
        const tarea = tareaDoc.data();
        if (tarea.creadaPor === usuarioActual.usuario && !tarea.completada) {
          tareasPendientes.push({
            ...tarea,
            nombreProyecto: idNombreProyecto[tarea.idProyecto]
          });
        }
      });

      if (tareasPendientes.length === 0) {
        resumenTareas.innerHTML = "<li class='text-muted'>No tienes tareas pendientes.</li>";
      } else {
        tareasPendientes.slice(0, 10).forEach((tarea, i) => {
          const li = document.createElement("li");
          li.innerHTML = `Tarea ${i + 1}: ${tarea.nombre} <strong>(Proyecto: ${tarea.nombreProyecto})</strong>`;
          resumenTareas.appendChild(li);
        });
      }
    }

    cargarResumenTareas();
  }
});