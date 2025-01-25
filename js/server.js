const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'tu_clave_secreta'; // Cambia esto por una clave más segura

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simulación de base de datos en memoria
let users = []; // Para almacenar usuarios
let tasks = []; // Para almacenar tareas

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.send('API de Gestión de Tareas'); // Mensaje de bienvenida
});

// Rutas para autenticación de usuarios
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users.find(user => user.username === username)) {
        return res.status(400).json({ message: 'Usuario ya existe' });
    }
    users.push({ username, password });
    res.status(201).json({ message: 'Usuario registrado con éxito' });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username && user.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ username }, SECRET_KEY);
    res.json({ token });
});

// Rutas para gestión de tareas
app.post('/tasks', (req, res) => {
    const { title, description, priority, dueDate } = req.body;
    const newTask = { id: tasks.length + 1, title, description, priority, dueDate, completed: false };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.get('/tasks', (req, res) => {
    res.json(tasks);
});

app.put('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const { title, description, priority, dueDate, completed } = req.body;
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    task.title = title || task.title;
    task.description = description || task.description;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    task.completed = completed !== undefined ? completed : task.completed;
    res.json(task);
});

app.delete('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    tasks = tasks.filter(t => t.id !== taskId);
    res.status(204).send(); // No content
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
