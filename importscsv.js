const fs = require('fs')
const mysql = require('mysql2')
const csv = require('csv-parser')

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'CampanaPlateada1902',
  database: 'covid_data'
})

db.connect(err => {
  if (err) throw err
  console.log('Conectado a MySQL')
})

const batchSize = 200
let batch = []
let totalRecords = 0

fs.createReadStream('datos.csv', { highWaterMark: 1024 * 1024 })
  .pipe(csv({ maxRowBytes: 1024 * 1024 }))
  .on('data', row => {
    if (row.Entity && row.Day && row['Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)']) {
      batch.push([
        row.Entity,
        row.Day,
        parseFloat(row['Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)']) || 0
      ])

      if (batch.length >= batchSize) {
        insertBatch(batch)
        totalRecords += batch.length
        batch = []
      }
    }
  })
  .on('end', () => {
    if (batch.length > 0) {
      insertBatch(batch)
      totalRecords += batch.length
    }
    console.log(`Importación completada: ${totalRecords} registros insertados.`)
    db.end()
  })
  .on('error', err => {
    console.error('Error al leer el archivo CSV:', err)
  })

function insertBatch (batch) {
  const query = 'INSERT INTO casos_covid (entity, day, daily_deaths) VALUES ?'
  db.query(query, [batch], (err, result) => {
    if (err) {
      console.error('Error insertando en MySQL:', err)
    }
  })
}
