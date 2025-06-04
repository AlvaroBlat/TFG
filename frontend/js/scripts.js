// scripts.js

// --- IMPORTS DE FIREBASE ---
import { collection, getDocs, query, where, doc, addDoc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { db } from '../js/firebase.js';

// --- PROTECCION SESIÓN NO INICIADA ---
function protegerRuta() {
  const rutasPublicas = ["login.html", "registro.html"];
  const rutaActual = window.location.pathname.split("/").pop();

  if (rutasPublicas.includes(rutaActual)) return;

  const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
  // Verificar si el usuario ha iniciado sesión
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

      // Verificar si el usuario ya existe
      const consultaUsuario = query(collection(db, "usuarios"), where("usuario", "==", usuario));
      const resultadoUsuario = await getDocs(consultaUsuario);
      if (!resultadoUsuario.empty) {
        alert("Ese nombre de usuario ya existe. Elige otro.");
        return;
      }

      // Verificar si ya existe un usuario con ese correo
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

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  protegerRuta();
  if (usuarioActual && usuarioActual.usuario) {
    mostrarProyectos(usuarioActual.usuario);
  } else {
    window.location.href = "login.html";
  }
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

// --- MOSTRAR PROYECTOS ---
async function mostrarProyectos(usuario) {
  const esInicio = document.title === "Inicio"; 

  const proyectosRef = collection(db, "proyectos");
  const qCreados = query(proyectosRef, where("creadoPor", "==", usuario));
  const qColaborados = query(proyectosRef, where("colaboradores", "array-contains", usuario));

  const [snapCreados, snapColaborados] = await Promise.all([
    getDocs(qCreados),
    getDocs(qColaborados)
  ]);

  const contenedor = document.getElementById("lista-proyectos");
  contenedor.innerHTML = "";
  const proyectosMostrados = new Set();

  const mostrarProyecto = (docSnap, esCreador) => {
    const proyecto = docSnap.data();
    const idProyecto = docSnap.id;
    if (proyectosMostrados.has(idProyecto)) return;
    proyectosMostrados.add(idProyecto);

    const colaboradoresTexto = proyecto.colaboradores?.length
      ? proyecto.colaboradores.join(", ")
      : "Sin colaboradores";

    // Crear el HTML para mostrar el proyecto
    const html = `
      <div class="project mb-4">
        <h5>${proyecto.nombre}</h5>
        <p>Descripción: ${proyecto.descripcion || "Sin descripción."}</p>
        <p>Creado por: ${proyecto.creadoPor}</p>
        <p><strong>Colaboradores:</strong> ${colaboradoresTexto}</p>

        ${!esInicio && esCreador ? `
          <button class="btn btn-success btn-sm btn-colaboracion-proyecto" data-id="${idProyecto}">Colaboración</button>
          <button class="btn btn-warning btn-sm btn-editar-proyecto" data-id="${idProyecto}" data-nombre="${proyecto.nombre}" data-descripcion="${proyecto.descripcion || ''}">Editar Proyecto</button>
          <button class="btn btn-danger btn-sm btn-eliminar-proyecto" data-id="${idProyecto}">Eliminar Proyecto</button>
        ` : ""}

        ${!esInicio ? `
        <button class="btn btn-secondary btn-sm " data-bs-toggle="collapse" data-bs-target="#form-${idProyecto}">Añadir Tarea</button>
        <div class="collapse mt-2" id="form-${idProyecto}">
          <form class="formulario-tarea" data-id-proyecto="${idProyecto}">
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
        ` : ""}
      </div>
    `;

    contenedor.insertAdjacentHTML("beforeend", html);
  };

  // Mostrar proyectos
  snapCreados.forEach(doc => mostrarProyecto(doc, true));
  snapColaborados.forEach(doc => mostrarProyecto(doc, false));

  // Si no es la vista de inicio, estamos en la vista de proyectos, activamos listeners de botones
  if (!document.title.includes("Inicio")) {
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

    document.querySelectorAll(".btn-eliminar-proyecto").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (!confirm("¿Estás seguro de que quieres eliminar este proyecto?")) return;
        try {
          await deleteDoc(doc(db, "proyectos", id));
          alert("Proyecto eliminado.");
          window.location.reload();
        } catch (err) {
          console.error("Error al eliminar proyecto:", err);
        }
      });
    });

    // Listener para editar proyecto
    document.querySelectorAll(".btn-editar-proyecto").forEach(btn => {
    btn.addEventListener("click", () => {
      const idProyecto = btn.getAttribute("data-id");
      const nombreActual = btn.getAttribute("data-nombre");
      const descripcionActual = btn.getAttribute("data-descripcion");

      const modal = document.createElement("div");
      modal.classList.add("modal", "fade");
      modal.setAttribute("tabindex", "-1");

      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Editar Proyecto</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="form-editar-proyecto">
                <div class="mb-2">
                  <label>Nombre del proyecto</label>
                  <input type="text" class="form-control" name="nombre" value="${nombreActual}" required>
                </div>
                <div class="mb-2">
                  <label>Descripción</label>
                  <textarea class="form-control" name="descripcion">${descripcionActual}</textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="submit" form="form-editar-proyecto" class="btn btn-primary">Guardar cambios</button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();

    document.getElementById("form-editar-proyecto").addEventListener("submit", async (e) => {
      e.preventDefault();
      const datos = new FormData(e.target);
      const nuevoNombre = datos.get("nombre");
      const nuevaDescripcion = datos.get("descripcion");

      try {
        await updateDoc(doc(db, "proyectos", idProyecto), {
          nombre: nuevoNombre,
          descripcion: nuevaDescripcion
        });
        alert("Proyecto actualizado.");
        window.location.reload();
      } catch (err) {
        console.error("Error al actualizar proyecto:", err);
        alert("No se pudo actualizar el proyecto.");
      }
    });

    modal.addEventListener("hidden.bs.modal", () => modal.remove());
  });
});

    // Listener de botón de colaboración
    document.querySelectorAll(".btn-colaboracion-proyecto").forEach(btn => {
      btn.addEventListener("click", async () => {
        const idProyecto = btn.getAttribute("data-id");
        const proyectoRef = doc(db, "proyectos", idProyecto);
        const proyectoSnap = await getDoc(proyectoRef);
        const proyectoData = proyectoSnap.data();

        const usuariosSnap = await getDocs(collection(db, "usuarios"));
        const disponibles = [];
        usuariosSnap.forEach(docu => {
          const u = docu.data().usuario;
          if (u !== proyectoData.creadoPor && !proyectoData.colaboradores?.includes(u)) {
            disponibles.push(u);
          }
        });

        // Crear el HTML para mostrar el modal de colaboradores
        const modal = document.createElement("div");
        modal.classList.add("modal", "fade");
        modal.setAttribute("tabindex", "-1");
        modal.innerHTML = `
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Gestión de Colaboradores</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <h6>Colaboradores actuales:</h6>
                <ul id="lista-colaboradores">
                  ${proyectoData.colaboradores?.map(colab => `
                    <li class="d-flex justify-content-between align-items-center">
                      ${colab}
                      <button class="btn btn-sm btn-danger btn-eliminar-colab" data-usuario="${colab}">Eliminar</button>
                    </li>
                  `).join("") || "<li class='text-muted'>Sin colaboradores.</li>"}
                </ul>
                <hr>
                <label for="select-nuevos">Añadir nuevos colaboradores:</label>
                <select id="select-nuevos" class="form-select" multiple>
                  ${disponibles.map(u => `<option value="${u}">${u}</option>`).join("")}
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="confirmar-colaboradores">Guardar cambios</button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        modal.querySelector("#confirmar-colaboradores").addEventListener("click", async () => {
          const seleccionados = Array.from(modal.querySelector("#select-nuevos").selectedOptions).map(opt => opt.value);
          if (seleccionados.length > 0) {
            try {
              await updateDoc(proyectoRef, {
                colaboradores: arrayUnion(...seleccionados)
              });
              alert("Colaboradores añadidos.");
              window.location.reload();
            } catch (err) {
              console.error("Error al añadir colaboradores:", err);
            }
          } else {
            bsModal.hide();
          }
        });

        modal.querySelectorAll(".btn-eliminar-colab").forEach(b => {
          b.addEventListener("click", async () => {
            const usuario = b.getAttribute("data-usuario");
            try {
              await updateDoc(proyectoRef, {
                colaboradores: arrayRemove(usuario)
              });
              alert("Colaborador eliminado.");
              window.location.reload();
            } catch (err) {
              console.error("Error al eliminar colaborador:", err);
            }
          });
        });

        modal.addEventListener("hidden.bs.modal", () => modal.remove());
      });
    });
  }
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
    const proyectosSnap = await getDocs(proyectosRef);
    const tareasRef = collection(db, "tareas");
    const tareasSnap = await getDocs(tareasRef);

    const tareasAgrupadas = [];
    proyectosSnap.forEach((proyectoDoc) => {
      const proyecto = proyectoDoc.data();
      const idProyecto = proyectoDoc.id;

      if (
        proyecto.creadoPor === usuarioActual.usuario ||
        (Array.isArray(proyecto.colaboradores) && proyecto.colaboradores.includes(usuarioActual.usuario))
      ) {
        tareasSnap.forEach((tareaDoc) => {
          const tarea = tareaDoc.data();
          if (tarea.idProyecto === idProyecto) {
            tareasAgrupadas.push({ ...tarea, id: tareaDoc.id, nombreProyecto: proyecto.nombre });
          }
        });
      }
    });
    return tareasAgrupadas;
  };

  // Aplica los filtros de prioridad y fecha a las tareas
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

  // Renderiza las tareas
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
              Prioridad: ${prioridadTexto} | Fecha límite: ${fechaFormateada} | <strong>Proyecto: ${tarea.nombreProyecto}</strong><br>
              Creado por: ${tarea.creadaPor}
            </small>
          </div>
          <div>
            <button class="btn btn-success btn-sm btn-completar-tarea"><i class="fas fa-check"></i> ${tarea.completada ? "Desmarcar" : "Completar"}</button>
            <button class="btn btn-primary btn-sm btn-editar-tarea"><i class="fas fa-edit"></i> Editar</button>
            <button class="btn btn-danger btn-sm btn-eliminar-tarea"><i class="fas fa-trash"></i> Eliminar</button>
          </div>
        </div>
      `;

      // Evento de completar tarea
      div.querySelector(".btn-completar-tarea").addEventListener("click", async () => {
        const tareaRef = doc(db, "tareas", tarea.id);
        await updateDoc(tareaRef, { completada: !tarea.completada });
        await renderizarTareas();
      });

      // Evento de eliminar tarea
      div.querySelector(".btn-eliminar-tarea").addEventListener("click", async () => {
        if (confirm("¿Seguro que deseas eliminar esta tarea?")) {
          const tareaRef = doc(db, "tareas", tarea.id);
          await deleteDoc(tareaRef);
          await renderizarTareas();
        }
      });

      // Evento de editar tarea
      div.querySelector(".btn-editar-tarea").addEventListener("click", () => {
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

        // Evento de guardar cambios
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const datos = new FormData(form);
          const tareaActualizada = {
            nombre: datos.get("nombre"),
            descripcion: datos.get("descripcion"),
            fechaLimite: datos.get("fechaLimite"),
            prioridad: parseInt(datos.get("prioridad"))
          };
          const tareaRef = doc(db, "tareas", tarea.id);
          await updateDoc(tareaRef, tareaActualizada);
          await renderizarTareas();
        });

        // Evento de cancelar
        contenedor.querySelector(".btn-cancelar").addEventListener("click", renderizarTareas);
      });

      contenedorTareas.appendChild(div);
    });
  };

  filtroPrioridad.addEventListener("change", renderizarTareas);
  filtroFecha.addEventListener("change", renderizarTareas);
  await renderizarTareas();
});

/*
// --- CARGAR PROYECTOS PROPIOS EN INICIO ---
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
          li.innerHTML = `${tarea.nombre} <strong>(Proyecto: ${tarea.nombreProyecto})</strong>`;
          resumenTareas.appendChild(li);
        });
      }
    }

    cargarResumenTareas();
  }
});

// --- CARGAR TAREAS Y COLABORACIONES EN INICIO ---
document.addEventListener('DOMContentLoaded', () => {
  if (document.title === "Inicio") {
    const resumenTareas = document.getElementById("resumen-tareas");
    const seccionColaboraciones = document.getElementById("colaboraciones");

    async function cargarResumenInicio() {
      const proyectosRef = collection(db, "proyectos");
      const tareasRef = collection(db, "tareas");

      const proyectosSnap = await getDocs(proyectosRef);
      const tareasSnap = await getDocs(tareasRef);

      const tareasPendientes = [];
      const colaboraciones = [];

      proyectosSnap.forEach((proyDoc) => {
        const proyecto = proyDoc.data();
        const idProyecto = proyDoc.id;

        tareasSnap.forEach((tareaDoc) => {
          const tarea = tareaDoc.data();
          if (tarea.idProyecto === idProyecto && !tarea.completada) {
            // Tareas propias
            if (tarea.creadaPor === usuarioActual.usuario) {
              tareasPendientes.push({
                ...tarea,
                nombreProyecto: proyecto.nombre
              });
            }
            // Tareas colaborativas
            if (Array.isArray(proyecto.colaboradores) && proyecto.colaboradores.includes(usuarioActual.usuario)) {
              colaboraciones.push({
                ...tarea,
                nombreProyecto: proyecto.nombre,
                creadorProyecto: proyecto.creadoPor
              });
            }
          }
        });
      });

      // Mostrar tareas propias
      if (tareasPendientes.length === 0) {
        resumenTareas.innerHTML = "<li class='text-muted'>No tienes tareas pendientes.</li>";
      } else {
        tareasPendientes.slice(0, 10).forEach((tarea) => {
          const li = document.createElement("li");
          li.innerHTML = `${tarea.nombre} <strong>(Proyecto: ${tarea.nombreProyecto})</strong>`;
          resumenTareas.appendChild(li);
        });
      }

      // Mostrar colaboraciones
      if (colaboraciones.length === 0) {
        seccionColaboraciones.innerHTML = "<li class='text-muted'>No colaboras en ningún proyecto por ahora.</li>";
      } else {
        colaboraciones.slice(0, 10).forEach((tarea) => {
          const li = document.createElement("li");
          li.innerHTML = `${tarea.nombre} <strong>(Proyecto: ${tarea.nombreProyecto})</strong> <span class="text-muted">[Creado por: ${tarea.creadorProyecto}]</span>`;
          seccionColaboraciones.appendChild(li);
        });
      }
    }

    cargarResumenInicio();
  }
});
*/