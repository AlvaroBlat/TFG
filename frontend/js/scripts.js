// scripts.js

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
        listItem.textContent = task.title;
        taskList.appendChild(listItem);

        // Limpiar el formulario
        document.getElementById('add-task-form').reset();
    })
    .catch(error => console.error('Error al añadir tarea:', error));
});
