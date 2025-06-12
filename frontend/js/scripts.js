// scripts.js

// --- IMPORTS DE FIREBASE ---
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  deleteField,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { db } from "../js/firebase.js";

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

// --- FUNCIÓN PARA ACTUALIZAR ULTIMA CONEXIÓN ---
async function actualizarUltimaConexion(usuarioId) {
  const usuarioRef = doc(db, "usuarios", usuarioId);
  const ultimaConexion = new Date();
  updateDoc(usuarioRef, {
    ultimaConexion: serverTimestamp(),
  });
  console.log(ultimaConexion);
}

// --- FUNCIÓN PARA CREAR AVISO DE NUEVOS PROYECTOS Y TAREAS QUE LLEGAN A SU FECHA LIMITE ---
function mostrarAviso(proyectos, tareasProximas) {
  const contenedor = document.createElement("div");
  contenedor.style.position = "fixed";
  contenedor.style.bottom = "20px";
  contenedor.style.right = "20px";
  contenedor.style.maxWidth = "300px";
  contenedor.style.padding = "15px";
  contenedor.style.backgroundColor = "#f0f8ff";
  contenedor.style.border = "1px solid #007bff";
  contenedor.style.borderRadius = "8px";
  contenedor.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
  contenedor.style.zIndex = "9999";

  const encabezado = document.createElement("strong");
  encabezado.textContent = "Desde tu última conexión:";
  contenedor.appendChild(encabezado);

  const lista = document.createElement("ul");
  lista.style.paddingLeft = "18px";

  proyectos.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `Añadido al proyecto "${p.nombre}" por ${p.creador}`;
    lista.appendChild(li);
  });

  contenedor.appendChild(lista);

  const botonCerrar = document.createElement("button");
  botonCerrar.textContent = "Cerrar";
  botonCerrar.className = "btn btn-sm btn-outline-primary mt-2";
  console.log("botonCerrar:", botonCerrar);
  botonCerrar.onclick = async () => {
    contenedor.remove();
    try {
      await actualizarUltimaConexion(usuarioActual.id);

      const actualizado = await getDoc(doc(db, "usuarios", usuarioActual.id));
      const nuevaFecha = actualizado.data().ultimaConexion;
      if (nuevaFecha) {
        usuarioActual.ultimaConexion = nuevaFecha.toDate();
        console.log(
          "Última conexión actualizada a:",
          usuarioActual.ultimaConexion
        );
      } else {
        console.warn(
          "No se ha podido obtener la nueva fecha de última conexión."
        );
      }
    } catch (err) {
      console.error("Error al actualizar la última conexión:", err);
    }
  };

  contenedor.appendChild(botonCerrar);

  document.body.appendChild(contenedor);
}

// --- FUNCIÓN PARA ACTUALIZAR ULTIMA MODIFICACIÓN ---
async function actualizarUltimaModificacion(idProyecto) {
  const ref = doc(db, "proyectos", idProyecto);
  await updateDoc(ref, {
    ultimaModificacion: serverTimestamp(),
  });
}

// --- LOGIN ---
document.addEventListener("DOMContentLoaded", () => {
  const botonLogin = document.getElementById("boton-login");
  console.log("botonLogin:", botonLogin);
  if (botonLogin) {
    botonLogin.addEventListener("click", async (e) => {
      e.preventDefault();
      const usuario = document.getElementById("usuario").value.trim();
      const contrasena = document.getElementById("contrasena").value;

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
          datosUsuario.id = doc.id;

          localStorage.setItem("usuarioActual", JSON.stringify(datosUsuario));
          await actualizarUltimaConexion(doc.id);
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
  const formulario = document.getElementById("formulario-registro");
  if (formulario) {
    formulario.addEventListener("submit", async (e) => {
      e.preventDefault();

      const usuario = document.getElementById("usuario").value.trim();
      const contrasena = document.getElementById("contrasena").value;
      const nombre = document.getElementById("nombre").value;
      const apellido = document.getElementById("apellido").value;
      const correo = document.getElementById("correo").value;

      // Verificar si el usuario ya existe
      const consultaUsuario = query(
        collection(db, "usuarios"),
        where("usuario", "==", usuario)
      );
      const resultadoUsuario = await getDocs(consultaUsuario);
      if (!resultadoUsuario.empty) {
        alert("Ese nombre de usuario ya existe. Elige otro.");
        return;
      }

      // Verificar si ya existe un usuario con ese correo
      const consultaCorreo = query(
        collection(db, "usuarios"),
        where("correo", "==", correo)
      );
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
          correo,
        });

        const nuevoResultado = await getDocs(
          query(collection(db, "usuarios"), where("usuario", "==", usuario))
        );
        if (!nuevoResultado.empty) {
          const doc = nuevoResultado.docs[0];
          localStorage.setItem("usuarioActual", JSON.stringify(doc.data()));
          datosUsuario.id = doc.id;
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
document.getElementById(
  "nombre-usuario-nav"
).textContent = `${usuarioActual.nombre}`;
//actualizarUltimaConexion(usuarioActual.id);

// --- ACTUALIZAR ULTIMA CONEXIÓN ---

/*
if (usuarioActual?.id) {
  actualizarUltimaConexion(usuarioActual.id);
  console.log("usuarioActual:", usuarioActual.ultimaConexion);
}
*/

// --- LOGOUT ---
document.getElementById("logout")?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("usuarioActual");
  window.location.href = "login.html";
});

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    protegerRuta();
    if (usuarioActual && usuarioActual.usuario) {
      mostrarProyectos(usuarioActual.usuario);
    } else {
      window.location.href = "login.html";
    }
  });
}),
  2000;

document.addEventListener("DOMContentLoaded", async () => {
  if (document.title !== "Inicio") return;

  const usuario = usuarioActual.usuario;
  const usuariosSnap = await getDocs(
    query(collection(db, "usuarios"), where("usuario", "==", usuario))
  );
  if (usuariosSnap.empty) return;

  const usuarioDoc = usuariosSnap.docs[0];
  console.log("usuarioDoc:", usuariosSnap.docs[0].data());
  const ultimaConexion = usuarioDoc.data().ultimaConexion?.toDate?.() || null;
  console.log("ultimaConexion 1:", ultimaConexion);
  if (!ultimaConexion) return;

  const proyectosSnap = await getDocs(collection(db, "proyectos"));
  const nuevosProyectos = [];
  const nombresProyectos = new Map();

  const proyectosPermitidos = new Set();

  proyectosSnap.forEach((doc) => {
    const data = doc.data();
    const id = doc.id;

    nombresProyectos.set(id, data.nombre);

    if (
      data.creadoPor === usuario ||
      (data.colaboradores || []).includes(usuario)
    ) {
      proyectosPermitidos.add(id);
    }
  });

  proyectosSnap.forEach((doc) => {
    const data = doc.data();
    const colaboradoresInfo = data.colaboradoresInfo || {};

    if (colaboradoresInfo[usuario] && data.creadoPor !== usuario) {
      const fechaIncorporacion = colaboradoresInfo[usuario].toDate();
      if (fechaIncorporacion > ultimaConexion) {
        nuevosProyectos.push({
          nombre: data.nombre,
          creador: data.creadoPor,
        });
      }
    }
  });
  /*
  const ahora = new Date();
  const mañana = new Date();
  mañana.setDate(ahora.getDate() + 1);

  const tareasSnap = await getDocs(collection(db, "tareas"));
  const tareasProximas = [];

  tareasSnap.forEach((doc) => {
    const tarea = doc.data();
    const fechaLimite = new Date(tarea.fechaLimite);

    if (
      proyectosPermitidos.has(tarea.idProyecto) &&
      !tarea.completada &&
      fechaLimite > ahora &&
      fechaLimite <= mañana
    ) {
      tareasProximas.push({
        nombre: tarea.nombre,
        nombreProyecto:
          nombresProyectos.get(tarea.idProyecto) || "Proyecto desconocido",
      });
    }
  });
*/
  console.log(nuevosProyectos.length);
  if (nuevosProyectos.length > 0)
    //|| tareasProximas.length > 0) {
    mostrarAviso(nuevosProyectos);
});

// --- AGREGAR PROYECTO ---
document
  .getElementById("botonAñadirProyecto")
  ?.addEventListener("click", async () => {
    const nombreProyecto = document
      .getElementById("nombreProyecto")
      .value.trim();
    const descripcionProyecto = document.getElementById(
      "descripcionProyecto"
    )?.value;

    if (!nombreProyecto) {
      alert("El nombre del proyecto es obligatorio.");
      return;
    }

    try {
      await addDoc(collection(db, "proyectos"), {
        nombre: nombreProyecto,
        creadoPor: usuarioActual.usuario,
        descripcion: descripcionProyecto || "",
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
  const qColaborados = query(
    proyectosRef,
    where("colaboradores", "array-contains", usuario)
  );

  const proyectosMap = new Map();

  [
    ...(await getDocs(qCreados)).docs,
    ...(await getDocs(qColaborados)).docs,
  ].forEach((doc) => {
    const id = doc.id;
    if (!proyectosMap.has(id)) {
      proyectosMap.set(id, doc);
    }
  });

  // Ordenar por última modificación (más reciente primero)
  const proyectosOrdenados = [...proyectosMap.values()].sort((a, b) => {
    const fechaA = a.data().ultimaModificacion?.toDate?.() || new Date(0);
    const fechaB = b.data().ultimaModificacion?.toDate?.() || new Date(0);
    return fechaB - fechaA;
  });

  const contenedor = document.getElementById("lista-proyectos");
  //contenedor.innerHTML = "" ;
  const proyectosMostrados = new Set();

  const mostrarProyecto = async (docSnap, esCreador) => {
    const proyecto = docSnap.data();
    const idProyecto = docSnap.id;

    const tareasSnap = await getDocs(
      query(collection(db, "tareas"), where("idProyecto", "==", idProyecto))
    );
    const totalTareas = tareasSnap.size;
    const tareasCompletadas = tareasSnap.docs.filter(
      (doc) => doc.data().completada
    ).length;
    const progreso =
      totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;
    const esCompletado = totalTareas > 0 && tareasCompletadas === totalTareas;

    if (proyectosMostrados.has(idProyecto)) return;
    proyectosMostrados.add(idProyecto);

    const colaboradoresTexto = proyecto.colaboradores?.length
      ? proyecto.colaboradores.join(", ")
      : "Sin colaboradores";

    const privadoCompartido =
      proyecto.colaboradores?.length > 0 ? "Compartido" : "Privado";

    const iconoEstado =
      proyecto.colaboradores?.length > 0
        ? `<i class="fas fa-users text-primary" title="Proyecto compartido"></i>`
        : `<i class="fas fa-lock text-secondary" title="Proyecto privado"></i>`;

    const ultimaMod = proyecto.ultimaModificacion?.toDate
      ? proyecto.ultimaModificacion.toDate().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        proyecto.ultimaModificacion
          .toDate()
          .toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : "Sin cambios recientes";

    const barraProgresoHTML =
      totalTareas > 0
        ? `
        <div class="progress mb-2">
          <div class="progress-bar ${
            esCompletado ? "bg-success" : "bg-info"
          }" role="progressbar" style="width: ${progreso}%;">
            ${tareasCompletadas}/${totalTareas} tareas completadas
          </div>
        </div>
      `
        : `<p class="text-muted">Este proyecto aún no tiene tareas.</p>`;

    const etiquetaCompletado = esCompletado
      ? `<span class="badge bg-success">Completado</span>`
      : "";

    // Crear el HTML para mostrar el proyecto
    const html = `
      <div class="project mb-4">
        <h5>${proyecto.nombre}</h5>
        <p>${proyecto.descripcion || "Sin descripción."}</p>
        <p>Creado por: ${proyecto.creadoPor}</p>
        <p><strong>Colaboradores:</strong> ${colaboradoresTexto}</p>
        <p><strong>Estado:</strong> ${privadoCompartido} ${iconoEstado}</p>
        <p><strong>Última modificación:</strong> ${ultimaMod}</p>
        <p>${barraProgresoHTML}</p>
        <p>${etiquetaCompletado}</p>


        ${
          !esInicio && esCreador
            ? `
          <button class="btn btn-success btn-sm btn-colaboracion-proyecto" data-id="${idProyecto}">Colaboración</button>
          <button class="btn btn-warning btn-sm btn-editar-proyecto" data-id="${idProyecto}" data-nombre="${
                proyecto.nombre
              }" data-descripcion="${
                proyecto.descripcion || ""
              }">Editar Proyecto</button>
          <button class="btn btn-danger btn-sm btn-eliminar-proyecto" data-id="${idProyecto}">Eliminar Proyecto</button>
        `
            : ""
        }

        ${
          !esInicio
            ? `
        <button class="btn btn-secondary btn-sm " data-bs-toggle="collapse" data-bs-target="#form-${idProyecto}">Añadir Tarea</button>
        <button class="btn btn-info btn-sm btn-detalles-proyecto" data-id="${idProyecto}" data-nombre="${proyecto.nombre}">Consultar detalles</button>
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
        `
            : ""
        }
      </div>
    `;

    contenedor.insertAdjacentHTML("beforeend", html);
  };

  // Mostrar proyectos
  for (const doc of proyectosOrdenados) {
    const esCreador = doc.data().creadoPor === usuario;
    await mostrarProyecto(doc, esCreador);
  }

  // Si no es la vista de inicio, estamos en la vista de proyectos, activamos listeners de botones
  if (!document.title.includes("Inicio")) {
    document.querySelectorAll(".formulario-tarea").forEach((form) => {
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
          creadaPor: usuarioActual.usuario,
        };

        try {
          await addDoc(collection(db, "tareas"), tarea);
          await actualizarUltimaModificacion(tarea.idProyecto);
          alert("Tarea añadida correctamente.");
          window.location.reload();
        } catch (err) {
          console.error("Error al crear tarea:", err);
          alert("No se pudo guardar la tarea.");
        }
      });
    });

    document.querySelectorAll(".btn-detalles-proyecto").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const idProyecto = btn.getAttribute("data-id");
        const nombreProyecto = btn.getAttribute("data-nombre");

        // Obtener tareas del proyecto
        const tareasSnap = await getDocs(
          query(collection(db, "tareas"), where("idProyecto", "==", idProyecto))
        );
        const tareas = tareasSnap.docs.map((doc) => doc.data());

        // Crear contenido del modal
        const tareasHTML = tareas.length
          ? tareas
              .map(
                (t) => `
              <li>
                <strong>${t.nombre}</strong> (${
                  t.completada ? "✅ Completada" : "🕒 Pendiente"
                })<br>
                ${t.descripcion || "Sin descripción"}<br>
                <small>Fecha límite: ${new Date(
                  t.fechaLimite
                ).toLocaleDateString()}</small>
              </li>
            `
              )
              .join("")
          : "<p>Este proyecto no tiene tareas aún.</p>";

        const modal = document.createElement("div");
        modal.classList.add("modal", "fade");
        modal.setAttribute("tabindex", "-1");

        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Detalles del proyecto: ${nombreProyecto}</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  <h6>Tareas asociadas:</h6>
                  <ul>${tareasHTML}</ul>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
              </div>
            </div>
          `;

        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        modal.addEventListener("hidden.bs.modal", () => modal.remove());
      });
    });

    // Listener para eliminar proyecto
    document.querySelectorAll(".btn-eliminar-proyecto").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (!confirm("¿Estás seguro de que quieres eliminar este proyecto?"))
          return;
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
    document.querySelectorAll(".btn-editar-proyecto").forEach((btn) => {
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

        document
          .getElementById("form-editar-proyecto")
          .addEventListener("submit", async (e) => {
            e.preventDefault();
            const datos = new FormData(e.target);
            const nuevoNombre = datos.get("nombre");
            const nuevaDescripcion = datos.get("descripcion");

            try {
              await updateDoc(doc(db, "proyectos", idProyecto), {
                nombre: nuevoNombre,
                descripcion: nuevaDescripcion,
              });
              actualizarUltimaModificacion(idProyecto);
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
    document.querySelectorAll(".btn-colaboracion-proyecto").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const idProyecto = btn.getAttribute("data-id");
        const proyectoRef = doc(db, "proyectos", idProyecto);
        const proyectoSnap = await getDoc(proyectoRef);
        const proyectoData = proyectoSnap.data();

        const usuariosSnap = await getDocs(collection(db, "usuarios"));
        const disponibles = [];
        usuariosSnap.forEach((docu) => {
          const u = docu.data().usuario;
          if (
            u !== proyectoData.creadoPor &&
            !proyectoData.colaboradores?.includes(u)
          ) {
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
                  ${
                    proyectoData.colaboradores
                      ?.map(
                        (colab) => `
                    <li class="d-flex justify-content-between align-items-center">
                      ${colab}
                      <button class="btn btn-sm btn-danger btn-eliminar-colab" data-usuario="${colab}">Eliminar</button>
                    </li>
                  `
                      )
                      .join("") ||
                    "<li class='text-muted'>Sin colaboradores.</li>"
                  }
                </ul>
                <hr>
                <label for="select-nuevos">Añadir nuevos colaboradores:</label>
                <select id="select-nuevos" class="form-select" multiple>
                  ${disponibles
                    .map((u) => `<option value="${u}">${u}</option>`)
                    .join("")}
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

        modal
          .querySelector("#confirmar-colaboradores")
          .addEventListener("click", async () => {
            const seleccionados = Array.from(
              modal.querySelector("#select-nuevos").selectedOptions
            ).map((opt) => opt.value);
            if (seleccionados.length > 0) {
              try {
                const actualizaciones = {};
                seleccionados.forEach((colaborador) => {
                  actualizaciones[`colaboradoresInfo.${colaborador}`] =
                    serverTimestamp();
                });

                await updateDoc(proyectoRef, {
                  colaboradores: arrayUnion(...seleccionados),
                  ...actualizaciones,
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

        modal.querySelectorAll(".btn-eliminar-colab").forEach((b) => {
          b.addEventListener("click", async () => {
            const usuario = b.getAttribute("data-usuario");
            try {
              await updateDoc(proyectoRef, {
                colaboradores: arrayRemove(usuario),
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
  const params = new URLSearchParams(window.location.search);
  const idTareaDestacada = params.get("idTarea");
  console.log("idTareaDestacada desde URL:", idTareaDestacada);

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
        (Array.isArray(proyecto.colaboradores) &&
          proyecto.colaboradores.includes(usuarioActual.usuario))
      ) {
        tareasSnap.forEach((tareaDoc) => {
          const tarea = tareaDoc.data();
          if (tarea.idProyecto === idProyecto) {
            tareasAgrupadas.push({
              ...tarea,
              id: tareaDoc.id,
              nombreProyecto: proyecto.nombre,
              creadorProyecto: proyecto.creadoPor,
            });
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

    return tareas.filter((t) => {
      const fechaTarea = new Date(t.fechaLimite);
      let pasaFiltroPrioridad =
        filtroP === "todas" || mapaPrioridades[t.prioridad] === filtroP;
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
        pasaFiltroFecha =
          fechaTarea.getMonth() === ahora.getMonth() &&
          fechaTarea.getFullYear() === ahora.getFullYear();
      }
      return pasaFiltroPrioridad && pasaFiltroFecha;
    });
  };

  // Renderiza las tareas
  const renderizarTareas = async () => {
    const tareas = aplicarFiltros(await obtenerTareas());
    //console.log(tareas)
    // Ordenar por fecha
    tareas.sort((a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite));
    contenedorTareas.innerHTML = "";
    const tareaResaltada = localStorage.getItem("tareaResaltada");
    console.log(tareaResaltada);
    tareas.forEach(async (tarea) => {
      const fecha = new Date(tarea.fechaLimite);
      const fechaCompletado = tarea.fechaCompletado?.toDate?.();
      const infoExtra =
        tarea.completada && tarea.completadaPor && fechaCompletado
          ? `<div class="badge bg-success ms-2">Completada por ${
              tarea.completadaPor
            } el ${fechaCompletado.toLocaleString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</div>`
          : "";

      const fechaFormateada = fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const prioridadTexto =
        textoPrioridades[tarea.prioridad] || "Sin prioridad";
      const clases = ["fila-tarea"];
      if (tarea.completada) clases.push("completada");

      const ahora = new Date();
      const fechaLimite = new Date(tarea.fechaLimite);
      const diasRestantes = (fechaLimite - ahora) / (1000 * 60 * 60 * 24);

      if (!tarea.completada) {
        if (diasRestantes <= 0) {
          clases.push("vencida"); // rojo
        } else if (diasRestantes <= 2) {
          clases.push("por-vencer"); // amarillo
        }
      }

      const div = document.createElement("div");
      div.className = clases.join(" ");
      div.innerHTML = `
        <div class="d-flex align-items-center">
          <div class="flex-grow-1 contenido-tarea">
            <strong>${tarea.nombre}</strong>${infoExtra} <br>
            ${tarea.descripcion}
            ${
              !tarea.completada && diasRestantes <= 0
                ? '<span class="badge bg-danger ms-2">Vencida</span>'
                : ""
            }
            ${
              !tarea.completada && diasRestantes > 0 && diasRestantes <= 2
                ? '<span class="badge bg-warning text-dark ms-2">La fecha límite está cerca</span>'
                : ""
            }
            <br>
            <small>
              Prioridad: ${prioridadTexto} | Fecha límite: ${fechaFormateada}<br>
              <strong>Proyecto: ${tarea.nombreProyecto}</strong> (creado por ${
        tarea.creadorProyecto
      })
            </small>
          </div>
          <div>
            <button class="btn btn-success btn-sm btn-completar-tarea"><i class="fas fa-check"></i> ${
              tarea.completada ? "Desmarcar" : "Completar"
            }</button>
            <button class="btn btn-warning btn-sm btn-editar-tarea"><i class="fas fa-edit"></i> Editar</button>
            <button class="btn btn-danger btn-sm btn-eliminar-tarea"><i class="fas fa-trash"></i> Eliminar</button>
          </div>
        </div>
      `;

      // Chat de comentarios
      const chatDiv = document.createElement("div");
      chatDiv.className = "mt-2";

      // Obtener comentarios
      const comentariosSnap = await getDocs(
        query(collection(db, "comentarios"), where("idTarea", "==", tarea.id))
      );
      const comentarios = [];
      comentariosSnap.forEach((doc) => {
        const comentario = doc.data();
        comentario.fechaObj = comentario.fecha?.toDate?.();
        comentarios.push(comentario);
      });
      comentarios.sort((a, b) => a.fechaObj - b.fechaObj);

      // Mostrar solo el último comentario
      const ultimoComentario = comentarios[comentarios.length - 1];
      const ultimoComentarioTexto = ultimoComentario
        ? `<strong>${
            ultimoComentario.usuario
          }</strong> [${ultimoComentario.fechaObj?.toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}]: ${ultimoComentario.mensaje}`
        : "Sin comentarios aún.";

      const resumenComentario = document.createElement("div");
      resumenComentario.innerHTML = `
        <strong>Último comentario:</strong><br>
        <p>${ultimoComentarioTexto}</p>
      `;

      chatDiv.appendChild(resumenComentario);

      if (comentarios.length > 1) {
        const btnVerTodos = document.createElement("button");
        btnVerTodos.textContent = "Ver todos los comentarios";
        btnVerTodos.className =
          "btn btn-info btn-sm me-2 ver-todos-comentarios";

        // Inserta antes del botón de completar
        const btnCompletar = div.querySelector(".btn-completar-tarea");
        btnCompletar.parentNode.insertBefore(btnVerTodos, btnCompletar);

        btnVerTodos.addEventListener("click", () => {
          const modal = document.createElement("div");
          modal.classList.add("modal", "fade");
          modal.setAttribute("tabindex", "-1");

          modal.innerHTML = `
            <div class="modal-dialog modal-dialog-scrollable">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Comentarios de "${tarea.nombre}"</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="max-height: 300px; overflow-y: auto;">
                  ${comentarios
                    .map(
                      (c) =>
                        `<p><strong>${
                          c.usuario
                        }</strong> [${c.fechaObj.toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}]: ${c.mensaje}</p>`
                    )
                    .join("")}
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
              </div>
            </div>
          `;

          document.body.appendChild(modal);
          const bsModal = new bootstrap.Modal(modal);
          bsModal.show();

          modal.addEventListener("hidden.bs.modal", () => modal.remove());
        });
      }

      const formComentario = document.createElement("form");
      formComentario.innerHTML = `
        <div class="input-group mt-1">
          <input type="text" class="form-control form-control-sm" placeholder="Escribe un comentario..." required>
          <button class="btn btn-sm btn-primary" type="submit">Enviar</button>
        </div>
      `;

      formComentario.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = formComentario.querySelector("input");
        const mensaje = input.value.trim();
        if (!mensaje) return;

        await addDoc(collection(db, "comentarios"), {
          idTarea: tarea.id,
          usuario: usuarioActual.usuario,
          mensaje: mensaje,
          fecha: new Date(),
        });

        input.value = "";
        localStorage.setItem("tareaResaltada", tarea.id);
        await renderizarTareas();
      });

      chatDiv.appendChild(formComentario);
      div.appendChild(chatDiv);

      // Listener de completar tarea
      div
        .querySelector(".btn-completar-tarea")
        .addEventListener("click", async () => {
          const tareaRef = doc(db, "tareas", tarea.id);
          await updateDoc(tareaRef, {
            completada: !tarea.completada,
            completadaPor: !tarea.completada ? usuarioActual.usuario : null,
            fechaCompletado: !tarea.completada ? new Date() : null,
          });

          await actualizarUltimaModificacion(tarea.idProyecto);
          localStorage.setItem("tareaResaltada", tarea.id);
          await renderizarTareas();
        });

      // Listener de eliminar tarea
      div
        .querySelector(".btn-eliminar-tarea")
        .addEventListener("click", async () => {
          if (confirm("¿Seguro que deseas eliminar esta tarea?")) {
            const tareaRef = doc(db, "tareas", tarea.id);
            await deleteDoc(tareaRef);
            await actualizarUltimaModificacion(tarea.idProyecto);
            await renderizarTareas();
          }
        });

      // Listener de editar tarea
      div.querySelector(".btn-editar-tarea").addEventListener("click", () => {
        const contenedor = div.querySelector(".contenido-tarea");
        contenedor.innerHTML = `
            <form class="form-editar-tarea mt-2">
              <input type="text" name="nombre" class="form-control mb-2" value="${
                tarea.nombre
              }" required>
              <textarea name="descripcion" class="form-control mb-2">${
                tarea.descripcion || ""
              }</textarea>
              <input type="date" name="fechaLimite" class="form-control mb-2" value="${
                tarea.fechaLimite
              }">
              <select name="prioridad" class="form-select mb-2">
                <option value="0" ${
                  tarea.prioridad === 0 ? "selected" : ""
                }>Baja</option>
                <option value="1" ${
                  tarea.prioridad === 1 ? "selected" : ""
                }>Media</option>
                <option value="2" ${
                  tarea.prioridad === 2 ? "selected" : ""
                }>Alta</option>
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
          localStorage.setItem("tareaResaltada", tarea.id);
          await actualizarUltimaModificacion(tarea.idProyecto);
          await renderizarTareas();
        });

        contenedor
          .querySelector(".btn-cancelar")
          .addEventListener("click", () => {
            localStorage.setItem("tareaResaltada", tarea.id);
            renderizarTareas();
          });
      });

      if (tareaResaltada === tarea.id) {
        // Espera un pequeño tiempo para asegurar que el DOM lo haya procesado
        setTimeout(() => {
          div.classList.add("resaltada");
          div.scrollIntoView({ behavior: "smooth", block: "center" });

          setTimeout(() => {
            div.classList.remove("resaltada");
            localStorage.removeItem("tareaResaltada");
          }, 3000);
        }, 100);
      }
      contenedorTareas.appendChild(div);
    });
  };

  filtroPrioridad.addEventListener("change", renderizarTareas);
  filtroFecha.addEventListener("change", renderizarTareas);
  await renderizarTareas();
});

// --- CALENDARIO PEQUEÑO EN index.html ---
document.addEventListener("DOMContentLoaded", async () => {
  if (document.title !== "Inicio") return;

  const contenedor = document.getElementById("calendario-pequeno");
  const spanNombreMes = document.getElementById("nombreMes");
  const btnAnterior = document.getElementById("btnMesAnterior");
  const btnSiguiente = document.getElementById("btnMesSiguiente");

  const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const nombresMes = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  let mesActual = new Date().getMonth();
  let anioActual = new Date().getFullYear();

  const tareasSnap = await getDocs(collection(db, "tareas"));
  const proyectosSnap = await getDocs(collection(db, "proyectos"));

  // Determinar proyectos del usuario, tanto propios como colaborativos
  const proyectosPermitidos = new Set();
  proyectosSnap.forEach((doc) => {
    const data = doc.data();
    const id = doc.id;
    if (
      data.creadoPor === usuarioActual.usuario ||
      (data.colaboradores || []).includes(usuarioActual.usuario)
    ) {
      proyectosPermitidos.add(id);
    }
  });

  // Guardar tareas por mes
  const tareasPorFecha = {};
  tareasSnap.forEach((doc) => {
    const tarea = doc.data();
    if (!proyectosPermitidos.has(tarea.idProyecto)) return;
    const fecha = new Date(tarea.fechaLimite);
    const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
    tareasPorFecha[key] = true;
  });

  // Renderizar calendario pequeño
  function renderizarCalendario(mes, anio) {
    spanNombreMes.textContent = `${nombresMes[mes]} ${anio}`;

    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    let html = '<div class="row">';
    for (let dia of diasSemana) {
      html += `<div class="col day day-name">${dia}</div>`;
    }
    html += "</div>";

    const primerColumna = (primerDia + 6) % 7;

    let celda = 0;
    html += '<div class="row">';

    for (let i = 0; i < primerColumna; i++) {
      html += '<div class="col day"></div>';
      celda++;
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const key = `${anio}-${mes}-${dia}`;
      const clase = tareasPorFecha[key] ? "day marked" : "day";
      html += `<div class="col ${clase}">${dia}</div>`;
      celda++;

      if (celda % 7 === 0 && dia !== diasEnMes) {
        html += '</div><div class="row">';
      }
    }

    if (celda % 7 !== 0) {
      const vacios = 7 - (celda % 7);
      for (let i = 0; i < vacios; i++) {
        html += '<div class="col day"></div>';
      }
    }

    html += "</div>";
    contenedor.innerHTML = html;
  }

  // Evento botón mes anterior
  btnAnterior.addEventListener("click", () => {
    mesActual--;
    if (mesActual < 0) {
      mesActual = 11;
      anioActual--;
    }
    renderizarCalendario(mesActual, anioActual);
  });

  // Evento botón mes siguiente
  btnSiguiente.addEventListener("click", () => {
    mesActual++;
    if (mesActual > 11) {
      mesActual = 0;
      anioActual++;
    }
    renderizarCalendario(mesActual, anioActual);
  });

  renderizarCalendario(mesActual, anioActual);
});

// ---  CALENDARIO GRANDE EN calendario.html ---
document.addEventListener("DOMContentLoaded", async () => {
  if (document.title !== "Calendario") return;

  const contenedor = document.getElementById("contenedor-calendario");
  const tituloMes = document.getElementById("titulo-mes");
  const btnAnterior = document.getElementById("mes-anterior");
  const btnSiguiente = document.getElementById("mes-siguiente");

  const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const nombresMes = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  let mesActual = new Date().getMonth();
  let anioActual = new Date().getFullYear();

  const tareasSnap = await getDocs(collection(db, "tareas"));
  const proyectosSnap = await getDocs(collection(db, "proyectos"));

  // Proyectos permitidos
  const proyectosPermitidos = new Map(); // Map ID => nombre
  proyectosSnap.forEach((doc) => {
    const data = doc.data();
    if (
      data.creadoPor === usuarioActual.usuario ||
      (data.colaboradores || []).includes(usuarioActual.usuario)
    ) {
      proyectosPermitidos.set(doc.id, data.nombre);
    }
  });

  // Agrupar tareas por día
  const tareasPorDia = {};
  tareasSnap.forEach((doc) => {
    const tarea = doc.data();
    if (!proyectosPermitidos.has(tarea.idProyecto)) return;

    const fecha = new Date(tarea.fechaLimite);
    const y = fecha.getFullYear(),
      m = fecha.getMonth(),
      d = fecha.getDate();
    const clave = `${y}-${m}-${d}`;

    if (!tareasPorDia[clave]) tareasPorDia[clave] = [];
    const proyectoNombre = proyectosPermitidos.get(tarea.idProyecto);
    const proyectoDoc = proyectosSnap.docs.find(
      (d) => d.id === tarea.idProyecto
    );
    const creador = proyectoDoc?.data().creadoPor || "desconocido";

    tareasPorDia[clave].push({
      id: doc.id,
      nombre: tarea.nombre,
      proyecto: proyectoNombre,
      creador: creador === usuarioActual.usuario ? "ti" : creador,
    });
  });

  // Renderizar calendario grande
  function renderizarCalendarioGrande(mes, anio) {
    tituloMes.textContent = `${nombresMes[mes]} ${anio}`;
    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const primerColumna = (primerDia + 6) % 7;

    let html = '<div class="row">';
    for (let i = 0; i < primerColumna; i++) {
      html += '<div class="col day-grande"></div>';
    }

    let celda = primerColumna;

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const clave = `${anio}-${mes}-${dia}`;
      const tareas = tareasPorDia[clave] || [];
      let contenidoTareas = tareas
        .map(
          (t) => `
        <div class="task tarea-calendario" data-id-tarea="${t.id}">
          ${t.nombre}<br>
          <small><strong>Proyecto: ${t.proyecto}</small></strong><br>
          <small>Creado por ${t.creador}</small>
        </div>
      `
        )
        .join("");

      html += `<div class="col day-grande"><strong>${dia}</strong>${contenidoTareas}</div>`;
      celda++;

      if (celda % 7 === 0 && dia !== diasEnMes) {
        html += '</div><div class="row">';
      }
    }

    if (celda % 7 !== 0) {
      const vacios = 7 - (celda % 7);
      for (let i = 0; i < vacios; i++) {
        html += '<div class="col day-grande"></div>';
      }
    }

    html += "</div>";
    contenedor.innerHTML = html;
  }

  contenedor.addEventListener("click", (e) => {
    const tareaDiv = e.target.closest(".tarea-calendario");
    if (tareaDiv) {
      const idTarea = tareaDiv.getAttribute("data-id-tarea");
      if (idTarea) {
        window.location.href = `tareas.html?idTarea=${idTarea}`;
      }
    }
  });

  // Evento botón mes anterior
  btnAnterior.addEventListener("click", () => {
    mesActual--;
    if (mesActual < 0) {
      mesActual = 11;
      anioActual--;
    }
    renderizarCalendarioGrande(mesActual, anioActual);
  });

  // Evento botón mes siguiente
  btnSiguiente.addEventListener("click", () => {
    mesActual++;
    if (mesActual > 11) {
      mesActual = 0;
      anioActual++;
    }
    renderizarCalendarioGrande(mesActual, anioActual);
  });

  renderizarCalendarioGrande(mesActual, anioActual);
});

// Cargar tema desde localStorage
function aplicarTemaGuardado() {
  const modoOscuro = localStorage.getItem("modoOscuro") === "true";
  document.body.classList.toggle("modo-oscuro", modoOscuro);
  document.getElementById("icono-tema").className = modoOscuro
    ? "fas fa-sun"
    : "fas fa-moon";
}

// Cambiar tema
document.addEventListener("DOMContentLoaded", () => {
  aplicarTemaGuardado();

  const botonTema = document.getElementById("toggle-tema");
  if (botonTema) {
    botonTema.addEventListener("click", () => {
      const body = document.body;
      body.classList.toggle("modo-oscuro");
      const esOscuro = body.classList.contains("modo-oscuro");
      localStorage.setItem("modoOscuro", esOscuro);
      document.getElementById("icono-tema").className = esOscuro
        ? "fas fa-sun"
        : "fas fa-moon";
    });
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  if (!window.location.pathname.includes("perfil.html")) return;

  protegerRuta();
  const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
  if (!usuarioActual) return;

  // Mostrar nombre arriba
  document.getElementById("nombre-usuario-nav").textContent =
    usuarioActual.nombre;

  // Mostrar datos en el perfil
  // Rellenar información
  document.getElementById("perfil-usuario").textContent = usuarioActual.usuario;
  document.getElementById("perfil-correo").textContent = usuarioActual.correo;

  // Listar proyectos
  const proyectosSnap = await getDocs(collection(db, "proyectos"));
  const lista = document.getElementById("perfil-proyectos");

  proyectosSnap.forEach((doc) => {
    const p = doc.data();
    if (
      p.creadoPor === usuarioActual.usuario ||
      (Array.isArray(p.colaboradores) &&
        p.colaboradores.includes(usuarioActual.usuario))
    ) {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.innerHTML = `<strong>${p.nombre}</strong><br><small>${
        p.descripcion || "Sin descripción"
      }</small>`;
      lista.appendChild(li);
    }
  });

  // Actualizar contraseña
  const form = document.getElementById("form-actualizar-contrasena");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nueva = document.getElementById("nuevaContrasena").value.trim();
    const confirmar = document
      .getElementById("confirmarContrasena")
      .value.trim();
    const error = document.getElementById("mensaje-error");
    const ok = document.getElementById("mensaje-ok");

    error.classList.add("d-none");
    ok.classList.add("d-none");

    if (!nueva || !confirmar || nueva !== confirmar) {
      error.classList.remove("d-none");
      return;
    }

    const q = query(
      collection(db, "usuarios"),
      where("usuario", "==", usuarioActual.usuario)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const ref = doc(db, "usuarios", snap.docs[0].id);
      await updateDoc(ref, { contrasena: nueva });
      ok.classList.remove("d-none");
      window.location.href = "perfil.html";
      alert("Contraseña cambiada correctamente.");
    }
  });
});
