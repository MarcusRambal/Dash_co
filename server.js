/* eslint-disable camelcase */
const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')
// const fs = require('fs')
// const path = require('path')

const app = express()
const PORT = 3000

app.use(cors())

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'CampanaPlateada1902',
  database: 'covid_data'
})

db.connect(err => {
  if (err) {
    console.error('Error conectando a MySQL:', err)
    return
  }
  console.log('Conectado a MySQL')
  // exportDataToFile()
})

app.use(express.static('src'))
app.use('/assets', express.static('assets'))
app.use('/public', express.static('public'))
app.use('/data', express.static('data'))

app.get('/countries', (req, res) => {
  const query = 'SELECT DISTINCT entity FROM casos_covid'
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err)
      return res.status(500).send('Error en la base de datos')
    }
    res.json(results.map(row => row.entity))
    console.log('Consulta de países exitosa')
  })
})

app.get('/data', (req, res) => {
  const selectedCountries = req.query.countries.split(',')

  const placeholders = selectedCountries.map(() => '?').join(',')

  const query = `select cc.entity, DATE_FORMAT(day, '%Y-%m-01') as month, SUM(cc.daily_deaths) as total_deaths
          from casos_covid cc
          WHERE 
            entity IN (${placeholders})
          GROUP BY entity, month
          ORDER BY entity, month`

  db.query(query, selectedCountries, (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err)
      return res.status(500).send('Error en la base de datos')
    }
    const grouped = {}

    results.forEach(row => {
      // eslint-disable-next-line camelcase
      const { entity, month, total_deaths } = row

      if (!grouped[entity]) {
        grouped[entity] = []
      }

      grouped[entity].push({
        day: month,
        daily_deaths: Number(total_deaths)
      })
    })

    const formatted = Object.entries(grouped).map(([country, data]) => ({
      country,
      data
    }))

    res.json(formatted)
    console.log('Consulta de datos exitosa')
  })
})

app.get('/dataYear', (req, res) => {
  const query = `
    SELECT entity AS country, YEAR(day) AS year, SUM(daily_deaths) AS total_deaths
    FROM casos_covid
    GROUP BY entity, year
    ORDER BY year, country
  `

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err)
      return res.status(500).send('Error en la base de datos')
    }

    const dataByYear = {}
    results.forEach(row => {
      const { country, year, total_deaths } = row

      if (!dataByYear[year]) {
        dataByYear[year] = {}
      }

      dataByYear[year][country] = total_deaths
    })

    res.json(dataByYear)
  })
})

/*
function exportDataToFile () {
  const query = `
    SELECT entity AS country, YEAR(day) AS year, SUM(daily_deaths) AS total_deaths
    FROM casos_covid
    GROUP BY country, year
    ORDER BY year, country
  `

  db.query(query, (err, results) => {
    if (err) return console.error('Error al exportar datos:', err)

    const dataByYear = {}

    results.forEach(({ country, year, total_deaths }) => {
      if (!dataByYear[year]) dataByYear[year] = {}
      dataByYear[year][country] = total_deaths
    })

    const jsonPath = path.join(__dirname, 'data', 'dataYear.json')
    fs.writeFileSync(jsonPath, JSON.stringify(dataByYear, null, 2))
    console.log('Archivo dataYear.json creado automáticamente')
  })
}

*/
/*
// Ruta /countries
db.query('SELECT DISTINCT entity FROM casos_covid', (err, results) => {
  if (!err) {
    const data = results.map(row => row.entity)
    fs.writeFileSync(path.join(__dirname, '/data/countries.json'), JSON.stringify(data, null, 2))
    console.log('Archivo countries.json generado')
  }
})

db.query('SELECT DISTINCT entity FROM casos_covid', (err, results) => {
  if (err) throw err

  const countries = results.map(row => row.entity)
  const exportDir = path.join(__dirname, '/data/countries')
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true })

  countries.forEach(country => {
    const query = `
      SELECT DATE_FORMAT(day, '%Y-%m-01') as month, SUM(daily_deaths) as total_deaths
      FROM casos_covid
      WHERE entity = ?
      GROUP BY month
      ORDER BY month
    `
    db.query(query, [country], (err, data) => {
      if (!err) {
        const formatted = {
          country,
          data: data.map(row => ({
            day: row.month,
            daily_deaths: Number(row.total_deaths)
          }))
        }
        fs.writeFileSync(
          path.join(exportDir, `${country}.json`),
          JSON.stringify(formatted, null, 2)
        )
        console.log(`Exportado: ${country}`)
      }
    })
  })
})

*/

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
