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
        // Usuario y contraseña correctos
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
    const consulta = query(collection(db, "usuarios"), where("usuario", "==", usuario));
    const resultado = await getDocs(consulta);

    if (!resultado.empty) {
      alert("Ese nombre de usuario ya existe. Elige otro.");
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

      localStorage.setItem("usuario", usuario);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert("Error al registrarse. Inténtalo de nuevo.");
    }
  });
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
