/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', async () => {
  async function loadDataPerYear () {
    try {
      const response = await fetch('../public/data/dataYear.json')
      if (!response.ok) throw new Error('Network response was not ok')
      return await response.json()
    } catch (error) {
      console.error('Error al cargar los datos de calor:', error)
      return {}
    }
  }

  const barData = await loadDataPerYear()
  const yearSelector = document.getElementById('barYearSelector')

  Object.keys(barData).forEach(year => {
    const option = document.createElement('option')
    option.value = year
    option.textContent = year
    yearSelector.appendChild(option)
  })

  const initialYear = Object.keys(barData)[0]
  renderBarChart(barData[initialYear])

  yearSelector.addEventListener('change', e => {
    const selectedYear = e.target.value
    renderBarChart(barData[selectedYear])
  })

  const showAllButton = document.getElementById('showMore')
  showAllButton.addEventListener('click', () => {
    showingAll = !showingAll
    const selectedYear = yearSelector.value
    renderBarChart(barData[selectedYear], showingAll)
    showAllButton.textContent = showingAll ? 'Mostrar menos' : 'Mostrar más'
  })
})

let showingAll = false

function renderBarChart (dataForYear, showAll = false) {
  const svg = d3.select('#barChart')
  svg.selectAll('*').remove()

  let data = Object.entries(dataForYear)
    .map(([country, deaths]) => ({ country, deaths }))
    .sort((a, b) => b.deaths - a.deaths)

  if (!showAll) {
    data = data.slice(0, 20)
  }

  const margin = { top: 20, right: 20, bottom: 20, left: 160 }
  const width = 1200
  const barHeight = 20
  const height = data.length * (barHeight + 5) + margin.top + margin.bottom

  svg.attr('width', width).attr('height', height)

  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.deaths)])
    .nice()
    .range([0, chartWidth])

  const y = d3.scaleBand()
    .domain(data.map(d => d.country))
    .range([0, chartHeight])
    .padding(0.1)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  g.selectAll('rect')
    .data(data)
    .enter().append('rect')
    .attr('y', d => y(d.country))
    .attr('x', 0)
    .attr('height', y.bandwidth())
    .attr('width', d => x(d.deaths))
    .attr('fill', 'rgb(255, 105, 180)')
    .on('mouseover', function (event, d) { // Mostrar tooltip
      d3.select(this).attr('fill', 'orange')
      const tooltip = d3.select('#tooltip')
        .style('opacity', 1)
        .html(`País: ${d.country}<br>Muertes: ${d.deaths}`)
        .style('left', `${event.pageX + 5}px`)
        .style('top', `${event.pageY - 28}px`)
    })
    .on('mouseout', function () { // Ocultar tooltip
      d3.select(this).attr('fill', 'rgb(141, 19, 80)')
      d3.select('#tooltip').style('opacity', 0)
    })

  // Eje Y (nombres de países)
  g.append('g')
    .call(d3.axisLeft(y))

  // Eje X (cantidad de muertes)
  g.append('g')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x))
}
