const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Para evitar problemas de CORS
app.use(express.json());

// Endpoint que actúa como intermediario
app.post('/api/auth', async (req, res) => {
    try {
        const response = await axios.post('https://ad-auth.yes.com.sv/auth', req.body);
        res.json(response.data); // Envía la respuesta de la API externa
    } catch (error) {
        res.status(500).json({ error: 'Error al comunicarse con la API externa' });
    }
});

// Servir la aplicación de Vue
app.use(express.static('dist')); // Asegúrate de haber generado tu app de Vue (npm run build)

app.listen(port, () => {
    console.log(`Servidor Express corriendo en el puerto ${port}`);
});
