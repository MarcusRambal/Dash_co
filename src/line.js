/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', async () => {
  const updateChartButton = document.getElementById('update-chart')
  const searchInput = document.getElementById('country-search')
  const container = document.getElementById('country-list')

  // Cargar lista de países
  async function loadCountries () {
    try {
      const response = await fetch('../public/data/countries.json')
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const countries = await response.json()
      console.log(countries)

      container.innerHTML = ''

      countries.forEach(country => {
        const div = document.createElement('div')
        const checkbox = document.createElement('input')
        const label = document.createElement('label')

        checkbox.type = 'checkbox'
        checkbox.value = country
        checkbox.classList.add('country-checkbox')
        checkbox.id = `checkbox-${country}`

        label.htmlFor = `checkbox-${country}`
        label.textContent = country

        div.appendChild(checkbox)
        div.appendChild(label)
        container.appendChild(div)
      })
    } catch (error) {
      console.error('Error al cargar los países:', error)
    }
  }

  // Filtro de búsqueda
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase()
    const checkboxes = container.querySelectorAll('div')
    checkboxes.forEach(div => {
      const label = div.querySelector('label')
      const matches = label.textContent.toLowerCase().includes(searchTerm)
      div.style.display = matches ? '' : 'none'
    })
  })

  // Obtener países seleccionados
  async function getSelectedCountries () {
    const checkboxes = document.querySelectorAll('.country-checkbox:checked')
    return Array.from(checkboxes).map(checkbox => checkbox.value)
  }

  // Obtener datos
  async function fetchData (selectedCountries) {
    try {
      const data = await Promise.all(
        selectedCountries.map(async country => {
          const response = await fetch(`../public/data/countries/${country}.json`)
          if (!response.ok) throw new Error(`No se pudo cargar ${country}.json`)
          const countryData = await response.json()
          return {
            data: Array.isArray(countryData) ? countryData : countryData.data
          }
        })
      )
      return data
    } catch (error) {
      console.error('Error al obtener los datos:', error)
      return []
    }
  }

  // Dibujar gráfico
  async function drawLineChart (data) {
    d3.select('#LineChart').selectAll('*').remove()

    const margin = { top: 30, right: 80, bottom: 40, left: 50 }
    const width = 1000 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    const svg = d3.select('#LineChart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const allDates = new Set()

    data.forEach(country => {
      country.data.forEach(point => {
        allDates.add(point.day)
      })
    })

    const parseDate = d3.timeParse('%Y-%m-%d')
    const dates = Array.from(allDates).map(d => parseDate(d)).sort((a, b) => a - b)

    const xScale = d3.scaleTime()
      .domain(d3.extent(dates))
      .range([0, width])

    const yMax = d3.max(data.flatMap(c => c.data.map(p => p.daily_deaths)))
    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([height, 0])

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))

    svg.append('g')
      .call(d3.axisLeft(yScale))

    const line = d3.line()
      .x(d => xScale(parseDate(d.day)))
      .y(d => yScale(d.daily_deaths))

    const color = d3.scaleOrdinal(d3.schemeCategory10)

    data.forEach((country, index) => {
      svg.append('path')
        .datum(country.data)
        .attr('fill', 'none')
        .attr('stroke', color(index))
        .attr('stroke-width', 2)
        .attr('d', line)

      svg.append('text')
        .attr('transform', `translate(${width - 100},${20 + index * 20})`)
        .attr('fill', color(index))
        .text(country.country)
    })
  }

  // Botón de actualizar gráfico
  updateChartButton.addEventListener('click', async () => {
    const selectedCountries = await getSelectedCountries()
    if (selectedCountries.length === 0) {
      alert('Por favor, selecciona al menos un país.')
      return
    }

    try {
      const data = await fetchData(selectedCountries)
      drawLineChart(data)
    } catch (error) {
      console.error('Error al obtener los datos:', error)
    }
  })

  loadCountries()
})
