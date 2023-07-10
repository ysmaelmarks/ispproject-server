const express = require('express');
const cors = require('cors');
const csvtojson = require('csvtojson');
const cache = require('memory-cache');

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

// Função para buscar os dados do CSV e armazenar em cache
function getDataFromCSV() {
  const csvFilePath = './data/BaseFeminicidioEvolucaoMensalCisp.csv';

  return new Promise((resolve, reject) => {
    csvtojson({ delimiter: ';' })
      .fromFile(csvFilePath)
      .then((jsonObj) => resolve(jsonObj))
      .catch((err) => reject(new Error('Erro ao processar o arquivo CSV.')));
  });
}

// Endpoint para buscar todos os dados
app.get('/all', (req, res) => {
  const cacheKey = 'allData';
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    res.json(cachedData);
  } else {
    getDataFromCSV()
      .then((jsonObj) => {
        cache.put(cacheKey, jsonObj, 10 * 60 * 1000); // Armazena em cache por 10 minutos
        res.json(jsonObj);
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  }
});

// Endpoint para buscar dados de um ano específico
app.get('/ano/:ano', (req, res) => {
  const cacheKey = `anoData:${req.params.ano}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    res.json(cachedData);
  } else {
    getDataFromCSV()
      .then((jsonObj) => {
        const filteredData = jsonObj.filter((item) => item.ano === req.params.ano);
        cache.put(cacheKey, filteredData, 10 * 60 * 1000); // Armazena em cache por 10 minutos
        res.json(filteredData);
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
