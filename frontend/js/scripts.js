// scripts.js
import { collection, getDocs, query, where, addDoc} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { db } from '../js/firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const botonLogin = document.getElementById('boton-login');

  botonLogin.addEventListener('click', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const contrasena = document.getElementById('contrasena').value;  

    // Creamos una query para buscar directamente por usuario y contraseña
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

        // Guardamos los datos del usuario en localStorage
        localStorage.setItem("usuarioActual", JSON.stringify(datosUsuario));

        // Redirigimos
        window.location.href = "index.html";
      } else {
        alert("Usuario o contraseña incorrectos");
      }

    } catch (error) {
      console.error("Error en la autenticación:", error);
      alert("Ha ocurrido un error al iniciar sesión.");
    }
  });
});

//Registro
document.addEventListener("DOMContentLoaded", () => {
const formulario = document.getElementById('formulario-registro');

formulario.addEventListener('submit', async (e) => {
  e.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const correo = document.getElementById('correo').value;

    // Comprobar si ya existe ese usuario
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

    // Registrar nuevo usuario
    try {
      await addDoc(collection(db, "usuarios"), {
        usuario: usuario,
        contrasena: contrasena,
        nombre: nombre,
        apellido: apellido,
        correo: correo
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
});

//Guardamos el usuario actual en localStorage
const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
document.getElementById('nombre-usuario-nav').textContent = `${usuarioActual.nombre}`;

//Deteccion de logout
document.getElementById('logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem("usuarioActual");
  window.location.href = "login.html";
});

const nombreProyecto = document.getElementById("nombreProyecto").value;
console.log('Proyecto:', nombreProyecto);

//Agregar proyecto
document.getElementById("botonAñadirProyecto").addEventListener("click", async () => {
  const nombreProyecto = document.getElementById("nombreProyecto").value.trim();

  if (!nombreProyecto) {
    alert("El nombre del proyecto es obligatorio.");
    return;
  }

  try {
    await addDoc(collection(db, "proyectos"), {
      nombre: nombreProyecto,
      creadoPor: usuarioActual.usuario
    });

    alert("Proyecto añadido correctamente.");
    window.location.reload();
  } catch (error) {
    console.error("Error al añadir proyecto:", error);
    alert("Hubo un error al guardar el proyecto.");
  }
});

//Mostrar proyectos
async function mostrarProyectos(usuario) {
  const proyectosRef = collection(db, "proyectos");
  const q = query(proyectosRef, where("creadoPor", "==", usuario));
  const querySnapshot = await getDocs(q);

  const contenedor = document.getElementById("lista-proyectos");
  contenedor.innerHTML = "";

  querySnapshot.forEach((doc, index) => {
    const proyecto = doc.data();
    const html = `
      <div class="project">
        <h5>${proyecto.nombre}</h5>
        <p>Descripción: ${proyecto.descripcion || "Sin descripción."}</p>
        <ul>
          <!-- Aquí podrías cargar tareas asociadas -->
          <li class="text-muted">No hay tareas aún.</li>
        </ul>
        <button class="btn btn-secondary btn-sm" data-bs-toggle="collapse" data-bs-target="#taskForm${index}">
          Añadir Tarea
        </button>
        <div class="collapse" id="taskForm${index}">
          <form class="mt-2">
            <input type="text" class="form-control" placeholder="Nombre de la tarea" required>
            <button type="submit" class="btn btn-primary btn-sm mt-2">Crear Tarea</button>
          </form>
        </div>
      </div>
    `;
    contenedor.insertAdjacentHTML("beforeend", html);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (usuarioActual && usuarioActual.usuario) {
    mostrarProyectos(usuarioActual.usuario);
  } else {
    console.warn("No hay usuario actual. Redirigiendo a login...");
    window.location.href = "login.html";
  }
});

/*
document.getElementById('add-task-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-due-date').value;

    // Crear objeto tarea
    const newTask = {
        title: title,
        description: description,
        priority: priority,
        dueDate: dueDate
    };

    // Hacer solicitud a la API para crear una nueva tarea
    fetch('http://localhost:3000/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTask)
    })
    .then(response => response.json())
    .then(task => {
        // Agregar la nueva tarea a la lista
        const taskList = document.getElementById('tasks');
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.textContent = task.title; // Asegúrate de que 'task.title' es correcto
        taskList.appendChild(listItem);

        // Limpiar el formulario
        document.getElementById('add-task-form').reset();
    })
    .catch(error => console.error('Error al añadir tarea:', error));
});

*/
